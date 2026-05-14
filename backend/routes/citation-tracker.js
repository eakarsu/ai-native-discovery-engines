// Citation Tracker — generate answers grounded in retrieved documents,
// extract claims, attach citations, and score groundedness/hallucination risk.
// Real systems use NLI models (e.g. AlignScore, TrueTeacher, FActScore). Here
// we use lexical overlap + LLM-judge fallback to score support per claim.
//
// Endpoints:
//   POST /api/citation-tracker/answer        — produce a cited answer
//   GET  /api/citation-tracker/answers       — recent answers
//   GET  /api/citation-tracker/answers/:id   — answer detail + citations
//   POST /api/citation-tracker/score-claim   — score a single claim vs evidence

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

function tok(text) {
  return new Set((text || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(t => t.length > 2));
}
function jaccard(a, b) {
  const setA = a instanceof Set ? a : tok(a);
  const setB = b instanceof Set ? b : tok(b);
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  return inter / (setA.size + setB.size - inter);
}

function splitClaims(text) {
  return (text || '')
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && /\b(is|are|was|were|shows?|achieves?|reduces?|increases?|demonstrates?|reports?|found|observed|measured)\b/i.test(s));
}

async function callAI(systemPrompt, userPrompt, opts = {}) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Citation Tracker'
      },
      body: JSON.stringify({
        model: opts.model || process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: opts.temperature ?? 0.2
      })
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) { return null; }
}

async function fetchSources(documentIds) {
  if (!documentIds || !documentIds.length) return [];
  const r = await pool.query(`
    SELECT id, title, abstract, authors, venue, year, url, doi FROM corpus_documents
    WHERE id = ANY($1::int[])
  `, [documentIds]);
  return r.rows;
}

router.post('/answer', async (req, res) => {
  try {
    const { question, query_id = null, document_ids = [], generator_model = null } = req.body || {};
    if (!question) return res.status(400).json({ error: 'question required' });

    let docIds = document_ids;
    if (query_id && (!docIds || !docIds.length)) {
      const r = await pool.query('SELECT document_id FROM retrieval_results WHERE query_id=$1 ORDER BY rank LIMIT 10', [query_id]);
      docIds = r.rows.map(x => x.document_id);
    }
    const sources = await fetchSources(docIds);
    if (!sources.length) return res.status(400).json({ error: 'No source documents resolved' });

    const ctx = sources.map((s, i) => `[${i + 1}] ${s.title} (${s.authors || 'unknown'}, ${s.year || 'n.d.'})\n${(s.abstract || '').slice(0, 700)}`).join('\n\n');
    const sys = 'You are an evidence-grounded scientific question answerer. Use ONLY the supplied source passages. After each factual claim, cite the source index in brackets like [1] or [2,3]. If the sources do not support a claim, say "evidence insufficient" rather than guess. Do not output a separate references section.';
    const usr = `Question: ${question}\n\nSources:\n${ctx}\n\nWrite a focused 2-4 paragraph answer.`;

    const model = generator_model || process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
    let answerText = await callAI(sys, usr, { model });
    if (!answerText) {
      answerText = `Evidence-grounded answer unavailable (no LLM key configured).\n\nBased on lexical overlap, the most relevant source is [1] ${sources[0].title}. Inspect the sources directly for details.`;
    }

    const claims = splitClaims(answerText);
    const citations = [];
    for (const claim of claims) {
      const claimToks = tok(claim);
      let best = { idx: 0, score: 0 };
      sources.forEach((s, i) => {
        const sc = jaccard(claimToks, tok(s.title + ' ' + (s.abstract || '')));
        if (sc > best.score) best = { idx: i, score: sc };
      });
      const refMatch = claim.match(/\[(\d+(?:\s*,\s*\d+)*)\]/);
      const explicitIdxs = refMatch ? refMatch[1].split(',').map(s => parseInt(s.trim()) - 1).filter(n => n >= 0 && n < sources.length) : [];
      const idxs = explicitIdxs.length ? explicitIdxs : [best.idx];
      for (const idx of idxs) {
        const doc = sources[idx];
        const support = explicitIdxs.length ? Math.max(0.4, jaccard(claimToks, tok(doc.title + ' ' + (doc.abstract || '')))) : best.score;
        citations.push({
          claim,
          document_id: doc.id,
          source_index: idx + 1,
          support_score: Number(support.toFixed(3)),
          contradicts: false
        });
      }
    }

    const totalClaims = claims.length || 1;
    const supported = citations.filter(c => c.support_score >= 0.12).length;
    const groundedness = Math.min(1, supported / totalClaims);
    const hallucinationRisk = Math.max(0, 1 - groundedness - 0.05);

    let answerId = null;
    try {
      const ins = await pool.query(`
        INSERT INTO answers (query_id, user_id, question, answer_text, generator_model, groundedness, hallucination_risk)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id
      `, [query_id, req.user?.id || null, question, answerText, model, Number(groundedness.toFixed(3)), Number(hallucinationRisk.toFixed(3))]);
      answerId = ins.rows[0].id;
      for (const cit of citations) {
        await pool.query(`
          INSERT INTO citations (answer_id, document_id, claim_text, support_score, contradicts)
          VALUES ($1,$2,$3,$4,$5)
        `, [answerId, cit.document_id, cit.claim, cit.support_score, cit.contradicts]);
      }
    } catch (e) { /* persist optional */ }

    res.json({
      answer_id: answerId,
      question,
      answer: answerText,
      generator_model: model,
      groundedness: Number(groundedness.toFixed(3)),
      hallucination_risk: Number(hallucinationRisk.toFixed(3)),
      num_claims: claims.length,
      num_citations: citations.length,
      sources: sources.map((s, i) => ({ index: i + 1, id: s.id, title: s.title, authors: s.authors, year: s.year, url: s.url, doi: s.doi })),
      citations
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/answers', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT a.id, a.question, a.groundedness, a.hallucination_risk, a.generator_model, a.created_at,
             COUNT(c.id) AS num_citations
      FROM answers a
      LEFT JOIN citations c ON c.answer_id = a.id
      GROUP BY a.id ORDER BY a.created_at DESC LIMIT 30
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/answers/:id', async (req, res) => {
  try {
    const a = await pool.query('SELECT * FROM answers WHERE id=$1', [req.params.id]);
    if (!a.rows[0]) return res.status(404).json({ error: 'Answer not found' });
    const c = await pool.query(`
      SELECT c.*, d.title AS document_title, d.url, d.doi, d.authors, d.year
      FROM citations c LEFT JOIN corpus_documents d ON d.id = c.document_id
      WHERE c.answer_id = $1
    `, [req.params.id]);
    res.json({ answer: a.rows[0], citations: c.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/score-claim', async (req, res) => {
  try {
    const { claim, document_id } = req.body || {};
    if (!claim || !document_id) return res.status(400).json({ error: 'claim and document_id required' });
    const r = await pool.query('SELECT title, abstract FROM corpus_documents WHERE id=$1', [document_id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Document not found' });
    const doc = r.rows[0];
    const lexical = jaccard(tok(claim), tok(doc.title + ' ' + (doc.abstract || '')));
    let llmVerdict = null;
    if (process.env.OPENROUTER_API_KEY) {
      llmVerdict = await callAI(
        'You judge whether a passage SUPPORTS, CONTRADICTS, or is UNRELATED to a claim. Output one word.',
        `Claim: ${claim}\n\nPassage: ${doc.title}. ${doc.abstract}\n\nVerdict:`
      );
    }
    res.json({ claim, document_id, lexical_overlap: Number(lexical.toFixed(3)), llm_verdict: llmVerdict?.trim() || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
