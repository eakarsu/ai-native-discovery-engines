// Hybrid Retrieval — BM25 + dense + reciprocal-rank-fusion + reranker.
// Implements a real BM25 scorer (Okapi BM25, k1=1.2, b=0.75) over corpus_documents
// titles+abstracts, a deterministic pseudo-dense scorer (cosine over hashed
// shingle vectors as a stand-in for a real ANN call), RRF fusion, and a
// reranker stage that calls an LLM as a cross-encoder when an API key exists.
//
// Endpoints:
//   POST /api/hybrid-retrieval/search          — main retrieval entrypoint
//   GET  /api/hybrid-retrieval/queries         — recent query log
//   GET  /api/hybrid-retrieval/queries/:id     — full result breakdown
//   POST /api/hybrid-retrieval/ablate          — run BM25-only / dense-only / hybrid and compare

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

const STOPWORDS = new Set([
  'the','a','an','and','or','but','of','in','on','at','to','for','with','by','from','is','are','was','were','be','been','being','it','this','that','these','those','as','we','our','their','they','its','if','then','than','so','not','no','do','does','done','have','has','had','can','could','will','would','should','may','might','must','shall'
]);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t && t.length > 1 && !STOPWORDS.has(t));
}

function bm25Score(queryTerms, docText, avgDocLen, totalDocs, df) {
  const k1 = 1.2, b = 0.75;
  const docTerms = tokenize(docText);
  const docLen = docTerms.length || 1;
  const tf = {};
  for (const t of docTerms) tf[t] = (tf[t] || 0) + 1;
  let score = 0;
  for (const q of queryTerms) {
    const f = tf[q] || 0;
    if (f === 0) continue;
    const n = df[q] || 1;
    const idf = Math.log(1 + (totalDocs - n + 0.5) / (n + 0.5));
    const num = f * (k1 + 1);
    const denom = f + k1 * (1 - b + b * (docLen / avgDocLen));
    score += idf * (num / denom);
  }
  return score;
}

// Deterministic pseudo-dense similarity stand-in: hash shingles → 256d vector,
// cosine between query and document vectors. Real systems plug in voyage/openai/bge.
function hashVec(text, dim = 256) {
  const v = new Float32Array(dim);
  const toks = tokenize(text);
  for (let i = 0; i < toks.length; i++) {
    const unigram = toks[i];
    const bigram = i + 1 < toks.length ? toks[i] + '_' + toks[i + 1] : null;
    [unigram, bigram].filter(Boolean).forEach(s => {
      let h = 5381;
      for (let j = 0; j < s.length; j++) h = ((h << 5) + h + s.charCodeAt(j)) | 0;
      const idx = Math.abs(h) % dim;
      v[idx] += 1;
    });
  }
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) v[i] /= norm;
  return v;
}
function cosine(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }

function reciprocalRankFusion(rankings, k = 60) {
  const fused = new Map();
  for (const ranking of rankings) {
    ranking.forEach((id, idx) => {
      fused.set(id, (fused.get(id) || 0) + 1 / (k + idx + 1));
    });
  }
  return Array.from(fused.entries()).sort((a, b) => b[1] - a[1]);
}

async function llmRerank(query, candidates, model) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const compact = candidates.map((c, i) => `[${i}] ${c.title}\n${(c.abstract || '').slice(0, 400)}`).join('\n\n');
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Hybrid Retrieval Reranker'
      },
      body: JSON.stringify({
        model: model || process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        messages: [
          { role: 'system', content: 'You are a reranker. Given a query and numbered candidate passages, return a comma-separated list of candidate indices in best-to-worst order. Output ONLY the comma list, nothing else.' },
          { role: 'user', content: `Query: ${query}\n\nCandidates:\n${compact}\n\nOrder:` }
        ],
        temperature: 0
      })
    });
    const data = await resp.json();
    const text = (data.choices?.[0]?.message?.content || '').trim();
    const order = text.split(/[,\s]+/).map(s => parseInt(s.replace(/[^0-9]/g, ''))).filter(n => !isNaN(n) && n < candidates.length);
    if (!order.length) return null;
    const seen = new Set();
    const unique = [];
    for (const i of order) if (!seen.has(i)) { seen.add(i); unique.push(i); }
    for (let i = 0; i < candidates.length; i++) if (!seen.has(i)) unique.push(i);
    return unique;
  } catch (e) {
    return null;
  }
}

async function runSearch({ query, corpus_slug = null, retriever = 'hybrid', reranker_model = null, alpha = 0.5, top_k = 10, persistUserId = null }) {
  const t0 = Date.now();
  if (!query || !query.trim()) throw new Error('query required');
  let docQuery = `
      SELECT d.id, d.title, d.abstract, d.authors, d.venue, d.year, d.url, d.doi,
             d.citation_count, c.slug AS corpus_slug, c.name AS corpus_name
      FROM corpus_documents d
      JOIN corpora c ON c.id = d.corpus_id
    `;
    const params = [];
    if (corpus_slug) { params.push(corpus_slug); docQuery += ` WHERE c.slug = $${params.length}`; }
    docQuery += ' LIMIT 500';
    const docs = await pool.query(docQuery, params);

    if (docs.rows.length === 0) {
      return { query, retriever, top_k, results: [], note: 'No documents in corpus(es); ingest data first.', latency_ms: Date.now() - t0, total_candidates: 0, rerank_applied: false };
    }

    const queryTerms = tokenize(query);
    const totalDocs = docs.rows.length;
    const df = {};
    for (const d of docs.rows) {
      const seen = new Set(tokenize(d.title + ' ' + (d.abstract || '')));
      seen.forEach(t => { df[t] = (df[t] || 0) + 1; });
    }
    let totalLen = 0;
    for (const d of docs.rows) totalLen += tokenize(d.title + ' ' + (d.abstract || '')).length;
    const avgDocLen = totalLen / totalDocs;

    const bm25Scores = docs.rows.map(d => ({
      id: d.id,
      doc: d,
      bm25: bm25Score(queryTerms, d.title + ' ' + (d.abstract || ''), avgDocLen, totalDocs, df)
    }));

    const qVec = hashVec(query);
    const denseScores = docs.rows.map(d => ({
      id: d.id,
      doc: d,
      dense: cosine(qVec, hashVec(d.title + ' ' + (d.abstract || '')))
    }));

    const bm25Sorted = [...bm25Scores].sort((a, b) => b.bm25 - a.bm25);
    const denseSorted = [...denseScores].sort((a, b) => b.dense - a.dense);

    let chosen;
    if (retriever === 'bm25') chosen = bm25Sorted.slice(0, top_k * 3);
    else if (retriever === 'dense') chosen = denseSorted.slice(0, top_k * 3);
    else {
      const fused = reciprocalRankFusion([bm25Sorted.map(x => x.id), denseSorted.map(x => x.id)]);
      const fusedIds = fused.slice(0, top_k * 3).map(([id]) => id);
      const fusedScoreById = new Map(fused);
      chosen = fusedIds.map(id => {
        const doc = docs.rows.find(d => d.id === id);
        const bm = bm25Scores.find(x => x.id === id);
        const ds = denseScores.find(x => x.id === id);
        return { id, doc, bm25: bm?.bm25 || 0, dense: ds?.dense || 0, fused: fusedScoreById.get(id) };
      });
    }

    let rerankApplied = false;
    if (reranker_model && chosen.length > 1 && process.env.OPENROUTER_API_KEY) {
      const order = await llmRerank(query, chosen.slice(0, 20).map(c => c.doc), reranker_model);
      if (order) {
        const reordered = order.map((i, rank) => ({ ...chosen[i], rerank: 1 - (rank / order.length) }));
        chosen = [...reordered, ...chosen.slice(reordered.length)];
        rerankApplied = true;
      }
    }
    const finalResults = chosen.slice(0, top_k).map((c, i) => ({
      rank: i + 1,
      document_id: c.id,
      title: c.doc.title,
      abstract_snippet: (c.doc.abstract || '').slice(0, 280),
      authors: c.doc.authors,
      venue: c.doc.venue,
      year: c.doc.year,
      url: c.doc.url,
      doi: c.doc.doi,
      corpus: c.doc.corpus_name,
      citation_count: c.doc.citation_count,
      bm25_score: Number((c.bm25 || 0).toFixed(4)),
      dense_score: Number((c.dense || 0).toFixed(4)),
      fused_score: c.fused != null ? Number(c.fused.toFixed(4)) : null,
      rerank_score: c.rerank != null ? Number(c.rerank.toFixed(4)) : null
    }));

    const latency = Date.now() - t0;
    let queryId = null;
    try {
      const ins = await pool.query(`
        INSERT INTO retrieval_queries
          (user_id, query_text, corpus_slug, retriever, reranker_model, alpha, top_k, latency_ms, total_candidates)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id
      `, [persistUserId, query, corpus_slug, retriever, rerankApplied ? reranker_model : null, alpha, top_k, latency, docs.rows.length]);
      queryId = ins.rows[0].id;
      for (const r of finalResults) {
        await pool.query(`
          INSERT INTO retrieval_results (query_id, document_id, rank, bm25_score, dense_score, fused_score, rerank_score, snippet)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [queryId, r.document_id, r.rank, r.bm25_score, r.dense_score, r.fused_score, r.rerank_score, r.abstract_snippet]);
      }
    } catch (e) { /* persist optional */ }

    return {
      query_id: queryId,
      query, retriever, reranker_model: rerankApplied ? reranker_model : null,
      alpha, top_k, latency_ms: latency,
      total_candidates: docs.rows.length,
      rerank_applied: rerankApplied,
      results: finalResults
    };
}

router.post('/search', async (req, res) => {
  try {
    const out = await runSearch({ ...(req.body || {}), persistUserId: req.user?.id || null });
    res.json(out);
  } catch (err) { res.status(err.message === 'query required' ? 400 : 500).json({ error: err.message }); }
});

router.get('/queries', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT id, query_text, retriever, reranker_model, top_k, latency_ms, total_candidates, created_at
      FROM retrieval_queries ORDER BY created_at DESC LIMIT 30
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/queries/:id', async (req, res) => {
  try {
    const q = await pool.query('SELECT * FROM retrieval_queries WHERE id=$1', [req.params.id]);
    if (!q.rows[0]) return res.status(404).json({ error: 'Query not found' });
    const r = await pool.query(`
      SELECT rr.*, d.title, d.url, d.year, d.authors
      FROM retrieval_results rr
      LEFT JOIN corpus_documents d ON d.id = rr.document_id
      WHERE rr.query_id = $1 ORDER BY rr.rank
    `, [req.params.id]);
    res.json({ query: q.rows[0], results: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ablate', async (req, res) => {
  try {
    const { query, corpus_slug = null, top_k = 5 } = req.body || {};
    if (!query) return res.status(400).json({ error: 'query required' });
    const retrievers = ['bm25', 'dense', 'hybrid'];
    const out = {};
    for (const r of retrievers) {
      try {
        out[r] = await runSearch({ query, corpus_slug, retriever: r, top_k, persistUserId: req.user?.id || null });
      } catch (e) {
        out[r] = { error: e.message };
      }
    }
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
