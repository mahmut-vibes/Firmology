// api/track.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      'unknown';

    if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1') {
      return res.status(200).json({ ok: true, skipped: 'local' });
    }

    const path = req.body?.path || '/';
    const timestamp = new Date().toISOString();

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
      console.error('IPinfo error:', e.message);
    }

    const record = JSON.stringify({ ...firmaBilgisi, path, timestamp });

    // Upstash Redis REST API
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    await fetch(`${url}/lpush/visits/${encodeURIComponent(record)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    await fetch(`${url}/ltrim/visits/0/9999`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Track error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function cleanOrg(org) {
  if (!org) return null;
  return org.replace(/^AS\d+\s+/i, '').trim();
}
