// api/visits.js
// Dashboard'a ziyaret listesini döndürür

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Son 1000 kaydı çek
    const raw = await kv.lrange('visits', 0, 999);
    const visits = raw.map(item => {
      try { return JSON.parse(item); }
      catch { return null; }
    }).filter(Boolean);

    return res.status(200).json({ visits });
  } catch (err) {
    console.error('Visits error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
