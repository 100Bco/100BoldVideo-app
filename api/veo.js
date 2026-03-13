// /api/veo.js — Vercel Serverless Function
// Proxies requests to Google Veo (Gemini API) for video generation
// Supports: submit (predictLongRunning), poll (operation status), download (video file)

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google API key not configured on server' });
  }

  const action = req.query.action || (req.method === 'POST' ? 'submit' : 'poll');

  try {
    // ── SUBMIT: start video generation ──
    if (action === 'submit' && req.method === 'POST') {
      const { model, prompt, image, aspectRatio, duration } = req.body;
      if (!model || !prompt) {
        return res.status(400).json({ error: 'Missing model or prompt' });
      }

      const instance = { prompt };
      if (image) {
        instance.image = { bytesBase64Encoded: image };
      }

      const body = {
        instances: [instance],
        parameters: {
          aspectRatio: aspectRatio || '16:9',
          sampleCount: 1,
          durationSeconds: duration || 8,
          personGeneration: 'allow_all',
          generateAudio: true,
          addWatermark: true,
        },
      };

      const url = `${BASE}/models/${model}:predictLongRunning?key=${apiKey}`;
      const upstream = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await upstream.json();
      if (!upstream.ok) {
        return res.status(upstream.status).json({ error: data?.error?.message || 'Veo API error' });
      }

      return res.status(200).json(data);
    }

    // ── POLL: check operation status ──
    if (action === 'poll') {
      const opName = req.query.operation;
      if (!opName) {
        return res.status(400).json({ error: 'Missing operation name' });
      }

      const url = `${BASE}/${opName}?key=${apiKey}`;
      const upstream = await fetch(url);
      const data = await upstream.json();

      if (!upstream.ok) {
        return res.status(upstream.status).json({ error: data?.error?.message || 'Poll error' });
      }

      // If done, extract video URL and proxy-sign it
      if (data.done && data.response?.generateVideoResponse?.generatedSamples) {
        const samples = data.response.generateVideoResponse.generatedSamples;
        const videos = samples.map(s => {
          let videoUri = s.video?.uri;
          // Append API key so client can fetch the video
          if (videoUri && !videoUri.includes('key=')) {
            videoUri += (videoUri.includes('?') ? '&' : '?') + `key=${apiKey}`;
          }
          return { url: videoUri };
        }).filter(v => v.url);
        return res.status(200).json({ done: true, videos });
      }

      return res.status(200).json({
        done: data.done || false,
        metadata: data.metadata || {},
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
