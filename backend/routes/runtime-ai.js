'use strict';
const express = require('express');
const verifyToken = require('../middleware/auth');
const pool = require('../db');
const router = express.Router();

router.post('/discovery-advice', verifyToken, async (req, res, next) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });
    const { OPENROUTER_API_KEY: key, OPENROUTER_MODEL: model, OPENROUTER_BASE_URL: base } = process.env;
    if (!key || !model || base !== 'https://openrouter.ai/api/v1') return res.status(503).json({ error: 'OpenRouter is not configured' });
    const response = await fetch(`${base}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'system', content: 'You are a scientific discovery operations advisor. Return substantive, concise guidance with evidence risks, validation steps, and measurable next actions.' }, { role: 'user', content: prompt }], temperature: 0.2 }) });
    if (!response.ok) throw new Error(`OpenRouter returned HTTP ${response.status}`);
    const body = await response.json();
    const content = String(body?.choices?.[0]?.message?.content || '').trim();
    if (!content) throw new Error('OpenRouter returned empty content');
    const stored = await pool.query('INSERT INTO runtime_ai_results(user_id,tenant_id,prompt,content,provider,model) VALUES($1,$2,$3,$4,\'openrouter\',$5) RETURNING id', [req.user.id, req.user.tenantId, prompt, content, model]);
    res.json({ content, provider: 'openrouter', model, persistedId: stored.rows[0].id });
  } catch (error) { next(error); }
});

module.exports = router;
