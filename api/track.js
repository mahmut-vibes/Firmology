// api/track.js
// Ziyaretçinin IP'sini alır, IPinfo ile firma bilgisini çeker, veritabanına kaydeder

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS - herhangi bir domain bu endpoint'i çağırabilir
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // IP'yi al (Vercel arkasında gerçek IP bu header'da gelir)
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      'unknown';

    // Localhost ve özel IP'leri geç
    if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1') {
      return res.status(200).json({ ok: true, skipped: 'local' });
    }

    const path = req.body?.path || '/';
    const timestamp = new Date().toISOString();

    // IPinfo API'ye sor
    let firmaBilgisi = { ip };
    try {
      const ipRes = await fetch(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`);
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        firmaBilgisi = {
          ip,
          org: cleanOrg(ipData.org),
          city: ipData.city,
          region: ipData.region,
          country: ipData.country,
          hostname: ipData.hostname,
        };
      }
    } catch (e) {
      // IPinfo çalışmazsa bile IP'yi kaydet
      console.error('IPinfo error:', e.message);
    }

    const record = {
      ...firmaBilgisi,
      path,
      timestamp,
    };

    // Vercel KV'ye kaydet (liste olarak)
    await kv.lpush('visits', JSON.stringify(record));
    // Maksimum 10.000 kayıt tut
    await kv.ltrim('visits', 0, 9999);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Track error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// IPinfo'dan gelen "AS12345 Turk Telekomunikasyon" gibi formatı temizler
function cleanOrg(org) {
  if (!org) return null;
  // "AS12345 " prefix'ini kaldır
  return org.replace(/^AS\d+\s+/i, '').trim();
}
