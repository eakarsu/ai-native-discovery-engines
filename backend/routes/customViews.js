// Custom Views — AI-native discovery engine features
// 4 synthesized endpoints supporting:
//   VIZ 1: query frequency chart  (GET  /query-frequency)
//   VIZ 2: relevance score heatmap (GET /relevance-heatmap)
//   NON-VIZ 1: index config PDF export (GET /index-config + printable text)
//   NON-VIZ 2: ranking rules editor (CRUD on /ranking-rules*)
// All data is synthesized deterministically; no DB writes required.

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

router.use(verifyToken);

// ---------- VIZ 1: Query Frequency Chart ----------
// Returns time-bucketed query frequency for the past N days,
// plus a leaderboard of the most frequent queries (for the chart legend).
router.get('/query-frequency', (req, res) => {
  const days = Math.min(parseInt(req.query.days || '30', 10) || 30, 120);
  const topQueries = [
    'graph neural networks',
    'multimodal retrieval',
    'agentic workflows',
    'vector indexing',
    'enterprise RAG',
    'semantic chunking',
    'reranking strategies',
    'long-context evaluation'
  ];
  const today = new Date();
  const series = topQueries.map((q, qi) => {
    const points = [];
    for (let d = days - 1; d >= 0; d--) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - d);
      const base = 20 + qi * 6;
      const wave = Math.round(Math.abs(Math.sin((d + qi) * 0.4)) * 25);
      const trend = Math.round((days - d) * (0.15 + qi * 0.03));
      points.push({
        date: date.toISOString().slice(0, 10),
        count: Math.max(1, base + wave + trend)
      });
    }
    return {
      query: q,
      total: points.reduce((s, p) => s + p.count, 0),
      points
    };
  });
  const totals = series.map(s => ({ query: s.query, total: s.total }))
    .sort((a, b) => b.total - a.total);
  const all_total = series.reduce((s, x) => s + x.total, 0);
  res.json({
    days,
    generated_at: new Date().toISOString(),
    series,
    leaderboard: totals,
    stats: {
      total_queries: all_total,
      unique_queries: series.length,
      avg_per_day: Math.round(all_total / days),
      top_query: totals[0].query
    }
  });
});

// ---------- VIZ 2: Relevance Score Heatmap (query x doc) ----------
// Returns a matrix of relevance scores between a set of queries and docs.
router.get('/relevance-heatmap', (req, res) => {
  const queries = [
    'graph neural networks',
    'multimodal retrieval',
    'agentic workflows',
    'vector indexing',
    'enterprise RAG',
    'semantic chunking',
    'reranking strategies',
    'long-context evaluation'
  ];
  const docs = [
    { id: 'd1', title: 'GraphRAG: A Retrieval Augmented Framework' },
    { id: 'd2', title: 'Multimodal Retrieval at Scale' },
    { id: 'd3', title: 'Agentic Orchestration Patterns' },
    { id: 'd4', title: 'HNSW vs IVF: Vector Index Tradeoffs' },
    { id: 'd5', title: 'Enterprise RAG Reference Architecture' },
    { id: 'd6', title: 'Semantic Chunking Survey 2026' },
    { id: 'd7', title: 'Cross-Encoder Reranking Benchmarks' },
    { id: 'd8', title: 'Long Context Eval Harness: Discover-2026' },
    { id: 'd9', title: 'Hybrid Search: BM25 + Dense' },
    { id: 'd10', title: 'Citation Tracking in Generative Answers' }
  ];
  // synthesize relevance — diagonal-heavy plus structured noise
  const matrix = queries.map((q, qi) => docs.map((d, di) => {
    const diag = qi === di ? 0.85 : qi + 1 === di ? 0.72 : 0;
    const noise = Math.abs(Math.sin((qi + 1) * (di + 1) * 0.6)) * 0.55;
    const score = Math.min(0.99, Math.max(0.05, diag + noise * 0.4));
    return Number(score.toFixed(3));
  }));
  // top match per query
  const top_matches = queries.map((q, qi) => {
    let bestIdx = 0, best = -1;
    matrix[qi].forEach((v, i) => { if (v > best) { best = v; bestIdx = i; } });
    return { query: q, doc_id: docs[bestIdx].id, doc_title: docs[bestIdx].title, score: best };
  });
  const flat = matrix.flat();
  res.json({
    generated_at: new Date().toISOString(),
    queries,
    docs,
    matrix,
    top_matches,
    stats: {
      mean: Number((flat.reduce((s, v) => s + v, 0) / flat.length).toFixed(3)),
      max: Number(Math.max(...flat).toFixed(3)),
      min: Number(Math.min(...flat).toFixed(3)),
      cells: flat.length
    },
    legend: [
      { threshold: 0.8, label: 'highly relevant', color: '#1d4ed8' },
      { threshold: 0.6, label: 'relevant', color: '#3b82f6' },
      { threshold: 0.4, label: 'partially relevant', color: '#93c5fd' },
      { threshold: 0.0, label: 'low relevance', color: '#dbeafe' }
    ]
  });
});

// ---------- NON-VIZ 1: Index Config (PDF-ready export) ----------
// Returns the current index configuration plus a printable text blob the
// client can use with window.print() to produce a PDF.
router.get('/index-config', (req, res) => {
  const config = {
    index_name: 'discover-corpus-v3',
    embedding_model: 'text-embed-large-2026',
    embedding_dim: 1536,
    vector_store: { engine: 'HNSW', m: 32, ef_construction: 200, ef_search: 64 },
    chunking: { strategy: 'semantic', target_tokens: 512, overlap_tokens: 64, min_tokens: 64 },
    hybrid: { bm25_weight: 0.35, dense_weight: 0.65, rerank_top_k: 50 },
    storage: { backend: 'pgvector', table: 'doc_chunks', shards: 4, replicas: 2 },
    refresh: { schedule_cron: '0 */6 * * *', last_refresh: '2026-05-18T03:00:00Z', docs_indexed: 66651 },
    filters: { min_year: 2020, languages: ['en'], deny_domains: ['example.com'] }
  };
  const printable_text = [
    'AI-NATIVE DISCOVERY ENGINE — INDEX CONFIGURATION',
    `Generated: ${new Date().toISOString()}`,
    '',
    `INDEX NAME: ${config.index_name}`,
    `EMBEDDING:  ${config.embedding_model}  (dim=${config.embedding_dim})`,
    '',
    'VECTOR STORE',
    `  engine=${config.vector_store.engine}  m=${config.vector_store.m}  ef_construction=${config.vector_store.ef_construction}  ef_search=${config.vector_store.ef_search}`,
    '',
    'CHUNKING',
    `  strategy=${config.chunking.strategy}  target=${config.chunking.target_tokens}  overlap=${config.chunking.overlap_tokens}  min=${config.chunking.min_tokens}`,
    '',
    'HYBRID RETRIEVAL',
    `  bm25_weight=${config.hybrid.bm25_weight}  dense_weight=${config.hybrid.dense_weight}  rerank_top_k=${config.hybrid.rerank_top_k}`,
    '',
    'STORAGE',
    `  backend=${config.storage.backend}  table=${config.storage.table}  shards=${config.storage.shards}  replicas=${config.storage.replicas}`,
    '',
    'REFRESH',
    `  cron=${config.refresh.schedule_cron}  last_refresh=${config.refresh.last_refresh}  docs_indexed=${config.refresh.docs_indexed}`,
    '',
    'FILTERS',
    `  min_year=${config.filters.min_year}  languages=${config.filters.languages.join(',')}  deny_domains=${config.filters.deny_domains.join(',')}`
  ].join('\n');
  res.json({
    config,
    title: `Index Config — ${config.index_name}`,
    generated_at: new Date().toISOString(),
    printable_text,
    page_count_estimate: 2,
    summary: {
      embedding_dim: config.embedding_dim,
      total_chunks: config.refresh.docs_indexed,
      hybrid_ratio: `${config.hybrid.bm25_weight} bm25 / ${config.hybrid.dense_weight} dense`
    }
  });
});

// ---------- NON-VIZ 2: Ranking Rules Editor (CRUD) ----------
// In-memory rules store (process-lifetime). CRUD: list/get/create/update/delete.
let _rules = [
  { id: 'r1', name: 'Boost recent papers',  field: 'pub_year',       op: 'gte', value: 2024, weight: 1.5,  enabled: true,  created_at: '2026-04-01T10:00:00Z' },
  { id: 'r2', name: 'Penalize blog posts',  field: 'source_type',    op: 'eq',  value: 'blog', weight: -1.0, enabled: true, created_at: '2026-04-05T10:00:00Z' },
  { id: 'r3', name: 'Boost peer-reviewed',  field: 'peer_reviewed',  op: 'eq',  value: true,  weight: 2.0,  enabled: true,  created_at: '2026-04-10T10:00:00Z' },
  { id: 'r4', name: 'Down-rank low cites',  field: 'citation_count', op: 'lt',  value: 5,     weight: -0.5, enabled: false, created_at: '2026-04-15T10:00:00Z' }
];
let _nextId = 5;

const VALID_OPS = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains'];
const VALID_FIELDS = ['pub_year', 'source_type', 'peer_reviewed', 'citation_count', 'language', 'domain', 'author_h_index'];

function validateRule(body) {
  const errors = [];
  if (!body || typeof body !== 'object') { errors.push('body required'); return errors; }
  if (!body.name || typeof body.name !== 'string') errors.push('name required (string)');
  if (!body.field || !VALID_FIELDS.includes(body.field)) errors.push(`field must be one of: ${VALID_FIELDS.join(', ')}`);
  if (!body.op || !VALID_OPS.includes(body.op)) errors.push(`op must be one of: ${VALID_OPS.join(', ')}`);
  if (typeof body.weight !== 'number' || isNaN(body.weight)) errors.push('weight must be a number');
  return errors;
}

router.get('/ranking-rules', (_req, res) => {
  res.json({
    rules: _rules,
    count: _rules.length,
    enabled_count: _rules.filter(r => r.enabled).length,
    valid_fields: VALID_FIELDS,
    valid_ops: VALID_OPS,
    generated_at: new Date().toISOString()
  });
});

router.get('/ranking-rules/:id', (req, res) => {
  const r = _rules.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Rule not found' });
  res.json(r);
});

router.post('/ranking-rules', (req, res) => {
  const body = req.body || {};
  const errors = validateRule(body);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  const rule = {
    id: `r${_nextId++}`,
    name: String(body.name).slice(0, 120),
    field: body.field,
    op: body.op,
    value: body.value,
    weight: Number(body.weight),
    enabled: body.enabled !== false,
    created_at: new Date().toISOString()
  };
  _rules.push(rule);
  res.status(201).json(rule);
});

router.put('/ranking-rules/:id', (req, res) => {
  const idx = _rules.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  const body = req.body || {};
  const merged = { ..._rules[idx], ...body, id: _rules[idx].id };
  if (body.field || body.op || body.weight !== undefined || body.name) {
    const errors = validateRule(merged);
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  merged.updated_at = new Date().toISOString();
  _rules[idx] = merged;
  res.json(merged);
});

router.delete('/ranking-rules/:id', (req, res) => {
  const idx = _rules.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  const [removed] = _rules.splice(idx, 1);
  res.json({ ok: true, deleted: removed });
});

module.exports = router;
