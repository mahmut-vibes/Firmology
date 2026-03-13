// api/visits.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;

    const response = await fetch(`${url}/lrange/visits/0/999`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    const visits = (data.result || []).map(item => {
      try { return JSON.parse(item); }
      catch { return null; }
    }).filter(Boolean);

    return res.status(200).json({ visits });
  } catch (err) {
    console.error('Visits error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
