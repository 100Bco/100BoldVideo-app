// /api/kling.js — Vercel Serverless Function
// Proxies requests to Kling AI API (browser cannot call directly due to CORS)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { jwt, endpoint, body: reqBody } = req.method === 'POST' ? req.body : {};

  // GET = polling (jwt + endpoint passed as query params)
  const jwtToken = jwt || req.query.jwt;
  const klingUrl = endpoint || req.query.endpoint;

  if (!jwtToken || !klingUrl) {
    return res.status(400).json({ error: 'Missing jwt or endpoint' });
  }

  try {
    const fetchOpts = {
      method: req.method === 'POST' && reqBody ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
    };
    if (fetchOpts.method === 'POST' && reqBody) {
      fetchOpts.body = JSON.stringify(reqBody);
    }

    const upstream = await fetch(klingUrl, fetchOpts);
    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data?.message || data?.error?.message || 'Kling API error' });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
