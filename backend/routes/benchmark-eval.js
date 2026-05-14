// Benchmark Evaluation — run retrieval configurations against BEIR / MTEB /
// SciDocs / LoTTE benchmarks, store nDCG@10 / Recall@100 / MRR / MAP and
// latency + cost numbers, then compare runs with an LLM-narrated tradeoff
// analysis.
//
// Endpoints:
//   GET   /api/benchmark-eval/benchmarks
//   GET   /api/benchmark-eval/runs
//   GET   /api/benchmark-eval/runs/:id
//   POST  /api/benchmark-eval/run            — simulate a new benchmark run
//   POST  /api/benchmark-eval/compare        — LLM analysis of selected runs
//   GET   /api/benchmark-eval/leaderboard/:slug

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

// Realistic published baselines per (benchmark, retriever, embedding_model).
// Used to simulate "ran the benchmark" outputs deterministically.
const PRIORS = {
  BM25: { ndcg: 0.30, recall: 0.55, mrr: 0.42, map: 0.22, lat_p50: 25, lat_p95: 60, cost: 0.0 },
  dense: { ndcg: 0.45, recall: 0.75, mrr: 0.55, map: 0.35, lat_p50: 45, lat_p95: 110, cost: 0.003 },
  'hybrid-rrf': { ndcg: 0.55, recall: 0.82, mrr: 0.65, map: 0.45, lat_p50: 160, lat_p95: 320, cost: 0.05 },
  'colbert-late-interaction': { ndcg: 0.58, recall: 0.84, mrr: 0.68, map: 0.48, lat_p50: 110, lat_p95: 230, cost: 0.02 },
  'splade-v3': { ndcg: 0.52, recall: 0.80, mrr: 0.62, map: 0.42, lat_p50: 70, lat_p95: 150, cost: 0.01 }
};

const EMBEDDING_BOOST = {
  'voyage-3-large': 0.08,
  'voyage-3': 0.05,
  'openai-text-embedding-3-large': 0.06,
  'openai-text-embedding-3-small': 0.03,
  'BAAI/bge-large-en-v1.5': 0.04,
  'BAAI/bge-m3': 0.05,
  'cohere-embed-english-v3.0': 0.05,
  'jina-embeddings-v3': 0.03,
  'mixedbread-ai/mxbai-embed-large-v1': 0.03,
  'nvidia/nv-embed-v2': 0.07
};

const RERANKER_BOOST = {
  'cohere-rerank-3': 0.06,
  'cohere-rerank-3-multilingual': 0.05,
  'voyage-rerank-2': 0.07,
  'BAAI/bge-reranker-v2-m3': 0.04,
  'jina-reranker-v2': 0.03,
  'mixedbread-ai/mxbai-rerank-large-v1': 0.03,
  'monoT5-3b': 0.05
};

function clamp(x, lo = 0.0001, hi = 0.9999) { return Math.max(lo, Math.min(hi, x)); }

async function callAI(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Benchmark Eval'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      })
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) { return null; }
}

router.get('/benchmarks', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT b.*,
             COUNT(br.id) AS run_count,
             MAX(br.ndcg_at_10) AS best_ndcg
      FROM benchmarks b
      LEFT JOIN benchmark_runs br ON br.benchmark_id = b.id
      GROUP BY b.id ORDER BY b.suite, b.slug
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/runs', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT br.*, b.slug AS benchmark_slug, b.name AS benchmark_name, b.primary_metric
      FROM benchmark_runs br
      JOIN benchmarks b ON b.id = br.benchmark_id
      ORDER BY br.ran_at DESC LIMIT 100
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/runs/:id', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT br.*, b.slug AS benchmark_slug, b.name AS benchmark_name, b.description
      FROM benchmark_runs br JOIN benchmarks b ON b.id = br.benchmark_id
      WHERE br.id = $1
    `, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Run not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/leaderboard/:slug', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT br.*, b.name AS benchmark_name
      FROM benchmark_runs br JOIN benchmarks b ON b.id = br.benchmark_id
      WHERE b.slug = $1 ORDER BY br.ndcg_at_10 DESC NULLS LAST LIMIT 20
    `, [req.params.slug]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/run', async (req, res) => {
  try {
    const {
      benchmark_slug,
      retriever = 'hybrid-rrf',
      embedding_model = null,
      reranker_model = null,
      alpha = 0.5,
      notes = null
    } = req.body || {};
    if (!benchmark_slug) return res.status(400).json({ error: 'benchmark_slug required' });

    const b = await pool.query('SELECT * FROM benchmarks WHERE slug=$1', [benchmark_slug]);
    if (!b.rows[0]) return res.status(404).json({ error: 'Benchmark not found' });
    const bench = b.rows[0];

    const prior = PRIORS[retriever] || PRIORS['hybrid-rrf'];
    const embBoost = EMBEDDING_BOOST[embedding_model] || 0;
    const rerBoost = RERANKER_BOOST[reranker_model] || 0;

    // domain-specific drift to make scores realistic per benchmark
    const domainDrift = {
      'beir-nfcorpus': -0.05, 'beir-scifact': 0.18, 'beir-trec-covid': 0.22,
      'beir-bioasq': -0.02, 'beir-fiqa': -0.05, 'beir-nq': -0.02,
      'beir-hotpotqa': 0.08, 'mteb-arguana': 0.12, 'mteb-touche2020': -0.10,
      'mteb-quora': 0.20, 'mteb-msmarco': -0.10, 'scidocs': -0.20, 'lotte-science': 0.10
    }[benchmark_slug] || 0;

    const seed = (retriever + embedding_model + reranker_model + benchmark_slug).length % 7;
    const noise = (seed - 3) * 0.005;

    const ndcg = clamp(prior.ndcg + embBoost + rerBoost + domainDrift + noise);
    const recall = clamp(prior.recall + embBoost * 0.5 + rerBoost * 0.3 + domainDrift * 0.5);
    const mrr = clamp(prior.mrr + embBoost + rerBoost + domainDrift * 0.7);
    const map = clamp(prior.map + embBoost * 0.9 + rerBoost * 0.8 + domainDrift);

    const latP50 = prior.lat_p50 + (rerBoost ? 80 : 0) + (embedding_model?.includes('large') ? 15 : 0);
    const latP95 = prior.lat_p95 + (rerBoost ? 160 : 0) + (embedding_model?.includes('large') ? 35 : 0);
    const cost = prior.cost
      + (embedding_model?.includes('openai') ? 0.013 : 0)
      + (embedding_model?.includes('voyage-3-large') ? 0.018 : 0)
      + (embedding_model?.includes('cohere') ? 0.010 : 0)
      + (reranker_model?.includes('cohere-rerank') ? 0.020 : 0)
      + (reranker_model?.includes('voyage-rerank') ? 0.022 : 0);

    const ins = await pool.query(`
      INSERT INTO benchmark_runs
        (benchmark_id, retriever, embedding_model, reranker_model, alpha,
         ndcg_at_10, recall_at_100, mrr, map_score,
         latency_p50_ms, latency_p95_ms, cost_per_1k_usd, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [
      bench.id, retriever, embedding_model, reranker_model, alpha,
      Number(ndcg.toFixed(4)), Number(recall.toFixed(4)), Number(mrr.toFixed(4)), Number(map.toFixed(4)),
      latP50, latP95, Number(cost.toFixed(4)),
      notes || `Simulated run — retriever=${retriever}, emb=${embedding_model || 'n/a'}, rerank=${reranker_model || 'n/a'}`
    ]);

    res.json({
      run: ins.rows[0],
      benchmark: bench,
      computation: {
        prior_ndcg: prior.ndcg,
        embedding_boost: embBoost,
        reranker_boost: rerBoost,
        domain_drift: domainDrift,
        noise
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/compare', async (req, res) => {
  try {
    const { run_ids = [] } = req.body || {};
    if (!Array.isArray(run_ids) || run_ids.length < 2) return res.status(400).json({ error: 'Provide at least 2 run_ids' });
    const r = await pool.query(`
      SELECT br.*, b.slug AS benchmark_slug, b.name AS benchmark_name
      FROM benchmark_runs br JOIN benchmarks b ON b.id = br.benchmark_id
      WHERE br.id = ANY($1::int[]) ORDER BY br.ndcg_at_10 DESC
    `, [run_ids]);

    const runs = r.rows;
    if (runs.length === 0) return res.status(404).json({ error: 'No runs found' });

    const best = runs[0];
    const worst = runs[runs.length - 1];
    const stats = {
      best_run: { id: best.id, retriever: best.retriever, embedding: best.embedding_model, reranker: best.reranker_model, ndcg: best.ndcg_at_10 },
      worst_run: { id: worst.id, retriever: worst.retriever, ndcg: worst.ndcg_at_10 },
      ndcg_spread: Number((best.ndcg_at_10 - worst.ndcg_at_10).toFixed(4)),
      avg_latency_p95: Math.round(runs.reduce((s, r) => s + (r.latency_p95_ms || 0), 0) / runs.length),
      avg_cost: Number((runs.reduce((s, r) => s + (parseFloat(r.cost_per_1k_usd) || 0), 0) / runs.length).toFixed(4))
    };

    let narrative = null;
    if (process.env.OPENROUTER_API_KEY) {
      narrative = await callAI(
        'You are a retrieval-systems engineer. Given benchmark runs, write a 2-3 paragraph tradeoff analysis: which config wins on nDCG, which is best $/quality, latency callouts, and when to pick each. Be specific.',
        `Runs:\n${JSON.stringify(runs.map(r => ({
          benchmark: r.benchmark_name, retriever: r.retriever, emb: r.embedding_model, rerank: r.reranker_model,
          ndcg: r.ndcg_at_10, recall: r.recall_at_100, mrr: r.mrr, p95: r.latency_p95_ms, cost: r.cost_per_1k_usd
        })), null, 2)}`
      );
    }
    res.json({ runs, stats, narrative, llm_used: !!narrative });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
