// /api/kling.js — Vercel Serverless Function
// Proxies requests to Kling AI API with server-side JWT generation

import crypto from 'crypto';

function generateJWT(accessKey, secretKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { iss: accessKey, exp: now + 1800, nbf: now - 5 };

  const b64url = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signingInput = `${b64url(header)}.${b64url(payload)}`;

  const sig = crypto
    .createHmac('sha256', secretKey)
    .update(signingInput)
    .digest('base64url');

  return `${signingInput}.${sig}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;

  if (!accessKey || !secretKey) {
    return res.status(500).json({ error: 'Kling API keys not configured on server' });
  }

  // POST: { endpoint, body } — submit task
  // GET:  ?endpoint=... — poll task
  const { endpoint, body: reqBody } = req.method === 'POST' ? req.body : {};
  const klingUrl = endpoint || req.query.endpoint;

  if (!klingUrl) {
    return res.status(400).json({ error: 'Missing endpoint' });
  }

  try {
    const jwt = generateJWT(accessKey, secretKey);
    const fetchOpts = {
      method: req.method === 'POST' && reqBody ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
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
