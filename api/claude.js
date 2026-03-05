// /api/claude.js — Vercel Serverless Function
// Proxies requests to Anthropic Claude API (browser cannot call directly due to CORS)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { model, max_tokens, system, messages } = req.body;
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'CLAUDE_API_KEY not configured on server' });
  if (!messages) return res.status(400).json({ error: 'Missing messages' });

  try {
    const body = { model: model || 'claude-sonnet-4-20250514', max_tokens: max_tokens || 4096, messages };
    if (system) body.system = system;

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data?.error?.message || 'Claude API error' });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
