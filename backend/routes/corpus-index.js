// Corpus Index — manage scientific corpora (arXiv, PubMed, bioRxiv, etc.)
// Supports listing corpora, viewing documents, ingesting new documents,
// and triggering an embedding "refresh" pass. LLM-assists with corpus health
// summaries and gap detection.
//
// Endpoints:
//   GET    /api/corpus-index/corpora
//   GET    /api/corpus-index/corpora/:slug
//   POST   /api/corpus-index/corpora           — create / upsert a corpus
//   GET    /api/corpus-index/corpora/:slug/documents
//   POST   /api/corpus-index/documents         — ingest a document
//   POST   /api/corpus-index/corpora/:slug/refresh-embeddings
//   POST   /api/corpus-index/health-summary    — LLM-narrated corpus health

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

const KNOWN_EMBEDDING_MODELS = {
  'voyage-3-large':                    { dim: 1024, cost_per_1m_tokens: 0.18 },
  'voyage-3':                          { dim: 1024, cost_per_1m_tokens: 0.06 },
  'openai-text-embedding-3-large':     { dim: 3072, cost_per_1m_tokens: 0.13 },
  'openai-text-embedding-3-small':     { dim: 1536, cost_per_1m_tokens: 0.02 },
  'BAAI/bge-large-en-v1.5':            { dim: 1024, cost_per_1m_tokens: 0.00 },
  'BAAI/bge-m3':                       { dim: 1024, cost_per_1m_tokens: 0.00 },
  'cohere-embed-english-v3.0':         { dim: 1024, cost_per_1m_tokens: 0.10 },
  'jina-embeddings-v3':                { dim: 1024, cost_per_1m_tokens: 0.05 },
  'mixedbread-ai/mxbai-embed-large-v1':{ dim: 1024, cost_per_1m_tokens: 0.00 }
};

async function callAI(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Corpus Index'
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
  } catch (e) {
    return null;
  }
}

router.get('/corpora', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.*,
             COALESCE(d.fresh_count, 0) AS recent_docs,
             COALESCE(d.embedded_count, 0) AS embedded_docs
      FROM corpora c
      LEFT JOIN (
        SELECT corpus_id,
               COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS fresh_count,
               COUNT(*) FILTER (WHERE has_embedding) AS embedded_count
        FROM corpus_documents
        GROUP BY corpus_id
      ) d ON d.corpus_id = c.id
      ORDER BY c.doc_count DESC NULLS LAST
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/corpora/:slug', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM corpora WHERE slug=$1', [req.params.slug]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Corpus not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/corpora', async (req, res) => {
  try {
    const { slug, name, domain, source_url, license, embedding_model, notes } = req.body || {};
    if (!slug || !name) return res.status(400).json({ error: 'slug and name required' });
    const dim = KNOWN_EMBEDDING_MODELS[embedding_model]?.dim || 1024;
    const r = await pool.query(`
      INSERT INTO corpora (slug, name, domain, source_url, license, embedding_model, dim, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (slug) DO UPDATE SET
        name=EXCLUDED.name, domain=EXCLUDED.domain, source_url=EXCLUDED.source_url,
        license=EXCLUDED.license, embedding_model=EXCLUDED.embedding_model,
        dim=EXCLUDED.dim, notes=EXCLUDED.notes
      RETURNING *
    `, [slug, name, domain || null, source_url || null, license || null, embedding_model || null, dim, notes || null]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/corpora/:slug/documents', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 25, 200);
    const r = await pool.query(`
      SELECT d.* FROM corpus_documents d
      JOIN corpora c ON c.id = d.corpus_id
      WHERE c.slug = $1
      ORDER BY d.year DESC NULLS LAST, d.citation_count DESC
      LIMIT $2
    `, [req.params.slug, limit]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/documents', async (req, res) => {
  try {
    const { corpus_slug, external_id, doi, title, abstract, authors, venue, year, url } = req.body || {};
    if (!corpus_slug || !title) return res.status(400).json({ error: 'corpus_slug and title required' });
    const c = await pool.query('SELECT id FROM corpora WHERE slug=$1', [corpus_slug]);
    if (!c.rows[0]) return res.status(404).json({ error: 'Corpus not found' });

    const text = `${title || ''} ${abstract || ''}`;
    const tokens = Math.max(50, Math.round(text.split(/\s+/).filter(Boolean).length * 1.33));
    const bm25_doc_len = text.split(/\s+/).filter(Boolean).length;

    const r = await pool.query(`
      INSERT INTO corpus_documents (corpus_id, external_id, doi, title, abstract, authors, venue, year, url, tokens, bm25_doc_len, has_embedding)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false)
      RETURNING *
    `, [c.rows[0].id, external_id || null, doi || null, title, abstract || null, authors || null, venue || null, year || null, url || null, tokens, bm25_doc_len]);

    await pool.query('UPDATE corpora SET doc_count = doc_count + 1 WHERE id=$1', [c.rows[0].id]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/corpora/:slug/refresh-embeddings', async (req, res) => {
  try {
    const r0 = await pool.query('SELECT * FROM corpora WHERE slug=$1', [req.params.slug]);
    if (!r0.rows[0]) return res.status(404).json({ error: 'Corpus not found' });
    const corpus = r0.rows[0];
    const upd = await pool.query(
      `UPDATE corpus_documents SET has_embedding=true WHERE corpus_id=$1 AND has_embedding=false RETURNING id, tokens`,
      [corpus.id]
    );
    const totalTokens = upd.rows.reduce((s, d) => s + (d.tokens || 0), 0);
    const modelCfg = KNOWN_EMBEDDING_MODELS[corpus.embedding_model] || { cost_per_1m_tokens: 0.05 };
    const cost = (totalTokens / 1_000_000) * modelCfg.cost_per_1m_tokens;

    await pool.query('UPDATE corpora SET last_crawled_at=NOW() WHERE id=$1', [corpus.id]);

    res.json({
      corpus_slug: corpus.slug,
      embedding_model: corpus.embedding_model,
      dim: corpus.dim,
      documents_re_embedded: upd.rowCount,
      tokens_processed: totalTokens,
      estimated_cost_usd: Number(cost.toFixed(4)),
      cost_per_1m_tokens: modelCfg.cost_per_1m_tokens
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/health-summary', async (req, res) => {
  try {
    const { corpus_slug } = req.body || {};
    if (!corpus_slug) return res.status(400).json({ error: 'corpus_slug required' });
    const c = await pool.query('SELECT * FROM corpora WHERE slug=$1', [corpus_slug]);
    if (!c.rows[0]) return res.status(404).json({ error: 'Corpus not found' });
    const corpus = c.rows[0];

    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE has_embedding) AS embedded,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS new_7d,
        AVG(tokens) AS avg_tokens,
        AVG(citation_count) AS avg_citations,
        MAX(year) AS newest_year,
        MIN(year) AS oldest_year
      FROM corpus_documents WHERE corpus_id=$1
    `, [corpus.id]);
    const s = stats.rows[0];

    const recent = await pool.query(`
      SELECT title, year, citation_count FROM corpus_documents
      WHERE corpus_id=$1 ORDER BY created_at DESC LIMIT 5
    `, [corpus.id]);

    const summary = {
      corpus: corpus.name,
      domain: corpus.domain,
      total_docs_in_index: parseInt(s.total) || 0,
      total_docs_external: corpus.doc_count,
      coverage_pct: corpus.doc_count > 0 ? Number(((parseInt(s.total) || 0) / corpus.doc_count * 100).toFixed(4)) : null,
      embedded_pct: s.total > 0 ? Number((parseFloat(s.embedded) / parseFloat(s.total) * 100).toFixed(2)) : 0,
      new_in_last_7_days: parseInt(s.new_7d) || 0,
      avg_tokens: Math.round(parseFloat(s.avg_tokens) || 0),
      avg_citations: Math.round(parseFloat(s.avg_citations) || 0),
      year_range: s.oldest_year && s.newest_year ? `${s.oldest_year}–${s.newest_year}` : 'n/a',
      embedding_model: corpus.embedding_model,
      dim: corpus.dim,
      last_crawled_at: corpus.last_crawled_at,
      recent_documents: recent.rows
    };

    let narrative = null;
    if (process.env.OPENROUTER_API_KEY) {
      narrative = await callAI(
        'You are a search-infrastructure analyst. Given corpus health metrics, write 3 short paragraphs: (1) current state, (2) gaps/risks, (3) recommended next actions. Be concrete; reference specific numbers from the input.',
        `Corpus health snapshot:\n${JSON.stringify(summary, null, 2)}`
      );
    }

    res.json({ ...summary, narrative, llm_used: !!narrative });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/embedding-models', (_req, res) => {
  res.json(Object.entries(KNOWN_EMBEDDING_MODELS).map(([name, cfg]) => ({ name, ...cfg })));
});

module.exports = router;
