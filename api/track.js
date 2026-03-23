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
      // ipdata.co'dan veri çek
      const ipRes = await fetch(`https://api.ipdata.co/${ip}?api-key=${process.env.IPDATA_KEY}`);
      if (ipRes.ok) {
        const d = await ipRes.json();

        // ipdata.co bot/datacenter flag'i
        if (d.threat?.is_datacenter || d.threat?.is_bogon || d.threat?.is_tor) {
          return res.status(200).json({ ok: true, skipped: 'datacenter' });
        }

        const org = cleanOrg(d.asn?.name || d.organisation);

        // Bilinen bot listesi
        if (isKnownBot(org, '')) {
          return res.status(200).json({ ok: true, skipped: 'bot' });
        }

        // Rate limiting
        const kvUrl = process.env.KV_REST_API_URL;
        const kvToken = process.env.KV_REST_API_TOKEN;

        const rateKey = `rate:${ip}`;
        const rateRes = await fetch(`${kvUrl}/get/${rateKey}`, {
          headers: { Authorization: `Bearer ${kvToken}` },
        });
        const rateData = await rateRes.json();
        const count = parseInt(rateData.result || '0');

        if (count > 30) {
          return res.status(200).json({ ok: true, skipped: 'rate_limit' });
        }

        await fetch(`${kvUrl}/incr/${rateKey}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}` },
        });
        await fetch(`${kvUrl}/expire/${rateKey}/600`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${kvToken}` },
        });

        firmaBilgisi = {
          ip,
          org,
          city: d.city,
          region: d.region,
          country: d.country_name,
          industry: d.company?.type || null,
        };
      }
    } catch (e) {
      console.error('ipdata error:', e.message);
    }

    const record = JSON.stringify({ ...firmaBilgisi, path, timestamp });

    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    await fetch(`${kvUrl}/lpush/visits/${encodeURIComponent(record)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kvToken}` },
    });

    await fetch(`${kvUrl}/ltrim/visits/0/9999`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${kvToken}` },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Track error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function isKnownBot(org) {
  const botKeywords = [
    'google', 'googlebot', 'bing', 'yahoo', 'baidu', 'yandex',
    'amazon', 'amazonaws', 'aws', 'microsoft', 'azure', 'digitalocean',
    'linode', 'akamai', 'vultr', 'ovh', 'hetzner', 'cloudflare',
    'fastly', 'cdn77', 'leaseweb', 'choopa', 'datacamp',
    'psychz', 'servers.com', 'datapacket', 'arvid', 'm247', 'contabo',
    'cox communications', 'limestone', 'lumen', 'cogent',
    'hurricane electric', 'level 3', 'zayo', 'internap',
    'syn ltd', 'neterra', 'combahton', 'semrush', 'ahrefs',
    'shodan', 'censys', 'rapid7',
  ];
  const orgLower = (org || '').toLowerCase();
  return botKeywords.some(k => orgLower.includes(k));
}

function cleanOrg(org) {
  if (!org) return null;
  return org.replace(/^AS\d+\s+/i, '').trim();
}
