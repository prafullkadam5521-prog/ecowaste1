// ─────────────────────────────────────────────────────────────────────────────
// routes/chat.js  — EcoBot backend proxy using OpenAI API
//
// SETUP:
//   1. Add to your .env:    OPENAI_API_KEY=your_key_here
//   2. Add to server.js:    app.use('/api/chat', require('./routes/chat'));
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL   = 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are EcoBot, a friendly e-waste recycling assistant for EcoWasteFinder.
Help users understand:
- How to recycle specific e-waste items (mobiles, laptops, batteries, TVs, refrigerators, printers, etc.)
- Why e-waste recycling is important and its environmental impact
- What materials/metals are recovered from old electronics
- How to prepare devices before recycling (data wiping, removing batteries, etc.)
- Best practices for responsible e-waste disposal
- What certifications to look for in a recycling facility
Keep answers concise, friendly and practical. Use bullet points where helpful.
Always encourage using certified e-waste facilities.
If asked anything unrelated to e-waste or recycling, politely redirect.`;

// ── Simple per-IP rate limiter (10 req / min) ─────────────────────────────
const requestLog = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(t => now - t < 60_000);
  if (timestamps.length >= 10) return true;
  requestLog.set(ip, [...timestamps, now]);
  return false;
}

// ── Route ─────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'rate_limited' });
  }

  const { history = [], message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured in .env' });
  }

  // Convert history to OpenAI format
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({
      role:    m.role === 'user' ? 'user' : 'assistant',
      content: m.parts?.[0]?.text || m.content || '',
    })),
    { role: 'user', content: message },
  ];

  try {
    const openaiRes = await fetch(OPENAI_API_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       OPENAI_MODEL,
        messages,
        max_tokens:  512,
        temperature: 0.7,
      }),
    });

    if (openaiRes.status === 429) {
      console.warn('[chat] OpenAI rate limited');
      return res.status(429).json({ error: 'rate_limited' });
    }

    if (!openaiRes.ok) {
      const errBody = await openaiRes.json().catch(() => ({}));
      const errMsg = errBody?.error?.message || `HTTP ${openaiRes.status}`;
      console.warn('[chat] OpenAI error:', errMsg);
      return res.status(502).json({ error: errMsg });
    }

    const data  = await openaiRes.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({ error: 'Empty response from OpenAI' });
    }

    console.log(`[chat] ✓ Answered by ${OPENAI_MODEL}`);
    return res.json({ reply });

  } catch (err) {
    console.error('[chat] Error:', err.message);
    return res.status(502).json({ error: err.message });
  }
});

module.exports = router;