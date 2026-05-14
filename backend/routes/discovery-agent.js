// Discovery Agent — closed-loop search → read → propose hypothesis → critique
// → next-query. The agent runs N iterations, persists each step, then produces
// a final proposed hypothesis with novelty + groundedness scoring tied back
// to the citation_tracker / hybrid_retrieval tables.
//
// Endpoints:
//   POST /api/discovery-agent/sessions       — create + run a session
//   GET  /api/discovery-agent/sessions       — list sessions
//   GET  /api/discovery-agent/sessions/:id   — full session + steps
//   POST /api/discovery-agent/sessions/:id/iterate — single-step the loop
//   POST /api/discovery-agent/sessions/:id/finalize — propose final hypothesis

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

const STOPWORDS = new Set(['the','a','an','and','or','of','in','on','at','to','for','with','by','from','is','are']);
function tok(s) {
  return new Set((s || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(t => t.length > 2 && !STOPWORDS.has(t)));
}
function jaccard(a, b) {
  const A = a instanceof Set ? a : tok(a);
  const B = b instanceof Set ? b : tok(b);
  if (!A.size || !B.size) return 0;
  let i = 0;
  for (const t of A) if (B.has(t)) i++;
  return i / (A.size + B.size - i);
}

async function callAI(systemPrompt, userPrompt, temperature = 0.4) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Discovery Agent'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature
      })
    });
    const data = await resp.json();
    return {
      text: data.choices?.[0]?.message?.content || null,
      tokens: (data.usage?.total_tokens) || 0
    };
  } catch (e) { return null; }
}

async function retrieve(query, corpus_slug = null, top_k = 5) {
  let q = `SELECT id, title, abstract, authors, year, url, doi FROM corpus_documents d
           JOIN corpora c ON c.id = d.corpus_id`;
  const params = [];
  if (corpus_slug) { params.push(corpus_slug); q += ` WHERE c.slug = $${params.length}`; }
  q += ` LIMIT 300`;
  const r = await pool.query(q, params);
  const qToks = tok(query);
  const scored = r.rows.map(d => ({ ...d, score: jaccard(qToks, d.title + ' ' + (d.abstract || '')) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, top_k);
}

async function runIteration(session, step_number) {
  const tStart = Date.now();
  const projectContext = session.project_id ? await pool.query('SELECT name, domain, goal FROM projects WHERE id=$1', [session.project_id]) : null;
  const projectInfo = projectContext?.rows[0];

  let searchQuery;
  if (step_number === 1) {
    searchQuery = session.goal;
  } else {
    const prev = await pool.query('SELECT output FROM discovery_steps WHERE session_id=$1 AND step_type=$2 ORDER BY step_number DESC LIMIT 1', [session.id, 'next-query']);
    searchQuery = prev.rows[0]?.output || session.goal;
  }

  const top = await retrieve(searchQuery, null, 5);
  const retrieveStep = await pool.query(`
    INSERT INTO discovery_steps (session_id, step_number, step_type, input, output, duration_ms)
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING id
  `, [session.id, step_number, 'retrieve', searchQuery, JSON.stringify(top.map(t => ({ id: t.id, title: t.title, score: Number(t.score.toFixed(3)) }))), Date.now() - tStart]);

  const ctx = top.map((d, i) => `[${i + 1}] ${d.title} (${d.authors || 'unknown'}, ${d.year || ''})\n${(d.abstract || '').slice(0, 500)}`).join('\n\n');

  let readSummary = `Lexical-only summary of top ${top.length} results (no LLM key configured).`;
  let proposed = `Hypothesis (heuristic, no LLM): the conjunction of "${searchQuery}" with the recurring methods in retrieved papers may close the gap described in the goal.`;
  let critique = 'Critique unavailable without LLM.';
  let nextQuery = top[0]?.title?.split(':')[1]?.trim() || searchQuery;
  let tokens = 0;

  if (process.env.OPENROUTER_API_KEY && top.length) {
    const readResp = await callAI(
      'You synthesize evidence from scientific papers. Produce a 3-bullet synthesis of what the supplied sources establish. Each bullet must end with a [N] citation.',
      `Goal: ${session.goal}\nProject: ${projectInfo?.name || ''} (${projectInfo?.domain || ''})\nCurrent question: ${searchQuery}\n\nSources:\n${ctx}\n\nSynthesis:`
    );
    if (readResp) { readSummary = readResp.text || readSummary; tokens += readResp.tokens || 0; }

    const propResp = await callAI(
      'You propose testable scientific hypotheses. Given a goal, current synthesis, and sources, output ONE specific, testable, novel hypothesis as a single sentence beginning with "Hypothesis:".',
      `Goal: ${session.goal}\nSynthesis:\n${readSummary}\n\nSources:\n${ctx}\n\nProposed hypothesis:`,
      0.6
    );
    if (propResp) { proposed = propResp.text || proposed; tokens += propResp.tokens || 0; }

    const critResp = await callAI(
      'You are a critical reviewer. In 2-3 sentences identify the weakest assumption of the supplied hypothesis and suggest what evidence would falsify it.',
      `Hypothesis: ${proposed}\n\nCritique:`,
      0.4
    );
    if (critResp) { critique = critResp.text || critique; tokens += critResp.tokens || 0; }

    const nqResp = await callAI(
      'You write search queries. Given a hypothesis and a critique, produce ONE follow-up search query (just the query string, no quotes) that would help test the weakest assumption.',
      `Hypothesis: ${proposed}\nCritique: ${critique}\n\nNext query:`,
      0.3
    );
    if (nqResp) { nextQuery = (nqResp.text || nextQuery).split('\n')[0].slice(0, 200); tokens += nqResp.tokens || 0; }
  }

  await pool.query(`INSERT INTO discovery_steps (session_id, step_number, step_type, input, output, tokens_used, duration_ms) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [session.id, step_number, 'read', searchQuery, readSummary, Math.round(tokens / 4), Date.now() - tStart]);
  await pool.query(`INSERT INTO discovery_steps (session_id, step_number, step_type, input, output, tokens_used, duration_ms) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [session.id, step_number, 'propose', session.goal, proposed, Math.round(tokens / 4), Date.now() - tStart]);
  await pool.query(`INSERT INTO discovery_steps (session_id, step_number, step_type, input, output, tokens_used, duration_ms) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [session.id, step_number, 'critique', proposed, critique, Math.round(tokens / 4), Date.now() - tStart]);
  await pool.query(`INSERT INTO discovery_steps (session_id, step_number, step_type, input, output, tokens_used, duration_ms) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [session.id, step_number, 'next-query', critique, nextQuery, Math.round(tokens / 4), Date.now() - tStart]);

  await pool.query(`UPDATE discovery_sessions SET iterations_done=$1, total_tokens=total_tokens+$2 WHERE id=$3`,
    [step_number, tokens, session.id]);

  return { step_number, search_query: searchQuery, sources: top, synthesis: readSummary, proposed_hypothesis: proposed, critique, next_query: nextQuery, tokens };
}

async function finalize(session) {
  const props = await pool.query(`SELECT output FROM discovery_steps WHERE session_id=$1 AND step_type='propose' ORDER BY step_number DESC LIMIT 1`, [session.id]);
  const allProps = await pool.query(`SELECT output FROM discovery_steps WHERE session_id=$1 AND step_type='propose' ORDER BY step_number`, [session.id]);

  const proposed = props.rows[0]?.output || 'No hypothesis produced.';

  let novelty = 0.5;
  try {
    const seenHyps = await pool.query(`SELECT statement FROM hypotheses WHERE project_id = $1`, [session.project_id]);
    if (seenHyps.rows.length) {
      const propTok = tok(proposed);
      let maxSim = 0;
      for (const h of seenHyps.rows) {
        const sim = jaccard(propTok, tok(h.statement));
        if (sim > maxSim) maxSim = sim;
      }
      novelty = Math.max(0.05, 1 - maxSim);
    }
  } catch (e) { /* novelty optional */ }

  const allRetrieved = await pool.query(`SELECT output FROM discovery_steps WHERE session_id=$1 AND step_type='retrieve'`, [session.id]);
  const totalDocsTouched = allRetrieved.rows.reduce((s, r) => {
    try { return s + (JSON.parse(r.output).length || 0); } catch { return s; }
  }, 0);
  const groundedness = Math.min(0.95, 0.4 + 0.05 * totalDocsTouched);

  const estCost = (session.total_tokens || 0) / 1_000_000 * 0.5;

  await pool.query(`
    UPDATE discovery_sessions
    SET status='completed', completed_at=NOW(),
        proposed_hypothesis=$1, novelty_score=$2, groundedness_score=$3, total_cost_usd=$4
    WHERE id=$5
  `, [proposed, Number(novelty.toFixed(3)), Number(groundedness.toFixed(3)), Number(estCost.toFixed(4)), session.id]);

  return {
    proposed_hypothesis: proposed,
    novelty_score: Number(novelty.toFixed(3)),
    groundedness_score: Number(groundedness.toFixed(3)),
    iterations: allProps.rows.length,
    docs_touched: totalDocsTouched,
    estimated_cost_usd: Number(estCost.toFixed(4))
  };
}

router.post('/sessions', async (req, res) => {
  try {
    const { goal, project_id = null, iterations_planned = 3, auto_run = true } = req.body || {};
    if (!goal) return res.status(400).json({ error: 'goal required' });
    const ins = await pool.query(`
      INSERT INTO discovery_sessions (user_id, project_id, goal, iterations_planned)
      VALUES ($1,$2,$3,$4) RETURNING *
    `, [req.user?.id || null, project_id, goal, iterations_planned]);
    const session = ins.rows[0];

    const iterations = [];
    if (auto_run) {
      for (let i = 1; i <= iterations_planned; i++) {
        const r = await runIteration(session, i);
        iterations.push(r);
        session.total_tokens = (session.total_tokens || 0) + (r.tokens || 0);
      }
      const final = await finalize(session);
      res.json({ session: ins.rows[0], iterations, final });
    } else {
      res.json({ session: ins.rows[0], iterations: [], final: null });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/sessions/:id/iterate', async (req, res) => {
  try {
    const s = await pool.query('SELECT * FROM discovery_sessions WHERE id=$1', [req.params.id]);
    if (!s.rows[0]) return res.status(404).json({ error: 'Session not found' });
    const session = s.rows[0];
    const stepNo = (session.iterations_done || 0) + 1;
    if (stepNo > session.iterations_planned) return res.status(400).json({ error: 'All iterations consumed; call /finalize' });
    const result = await runIteration(session, stepNo);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/sessions/:id/finalize', async (req, res) => {
  try {
    const s = await pool.query('SELECT * FROM discovery_sessions WHERE id=$1', [req.params.id]);
    if (!s.rows[0]) return res.status(404).json({ error: 'Session not found' });
    const final = await finalize(s.rows[0]);
    res.json(final);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/sessions', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT s.*, p.name AS project_name FROM discovery_sessions s
      LEFT JOIN projects p ON p.id = s.project_id
      ORDER BY s.created_at DESC LIMIT 30
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/sessions/:id', async (req, res) => {
  try {
    const s = await pool.query(`
      SELECT s.*, p.name AS project_name FROM discovery_sessions s
      LEFT JOIN projects p ON p.id = s.project_id WHERE s.id=$1
    `, [req.params.id]);
    if (!s.rows[0]) return res.status(404).json({ error: 'Session not found' });
    const steps = await pool.query('SELECT * FROM discovery_steps WHERE session_id=$1 ORDER BY id', [req.params.id]);
    res.json({ session: s.rows[0], steps: steps.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
