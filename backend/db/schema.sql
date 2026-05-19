DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS publications CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS experiments CASCADE;
DROP TABLE IF EXISTS hypotheses CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS researchers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(100),
  goal TEXT,
  status VARCHAR(20) DEFAULT 'active',
  lead_researcher VARCHAR(255),
  start_date DATE,
  iteration_count INTEGER DEFAULT 0,
  breakthrough_count INTEGER DEFAULT 0
);

CREATE TABLE hypotheses (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  confidence_score DECIMAL(4,3),
  status VARCHAR(20) DEFAULT 'proposed',
  supporting_evidence TEXT,
  contradicting_evidence TEXT,
  generated_by VARCHAR(20) DEFAULT 'human',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE experiments (
  id SERIAL PRIMARY KEY,
  hypothesis_id INTEGER REFERENCES hypotheses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  design TEXT,
  methodology TEXT,
  status VARCHAR(20) DEFAULT 'designed',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  result_summary TEXT
);

CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
  outcome VARCHAR(20),
  significance_pct DECIMAL(5,2),
  breakthrough BOOLEAN DEFAULT FALSE,
  data_summary TEXT,
  conclusion TEXT,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP
);

CREATE TABLE researchers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  institution VARCHAR(255),
  specialization VARCHAR(255),
  h_index INTEGER DEFAULT 0,
  email VARCHAR(255),
  active_projects INTEGER DEFAULT 0,
  publications_count INTEGER DEFAULT 0,
  joined_date DATE
);

CREATE TABLE publications (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  journal VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',
  impact_factor DECIMAL(6,3),
  submitted_at DATE,
  accepted_at DATE,
  authors TEXT
);

CREATE TABLE activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- ============================================================================
-- AI-NATIVE DISCOVERY ENGINES — RETRIEVAL / SEARCH-ENGINE LAYER
-- Audit-implementation deep-pass: 2026-05-14
-- ============================================================================

-- Scientific corpora the engine indexes (arXiv, PubMed, bioRxiv, ChemRxiv, etc.)
CREATE TABLE IF NOT EXISTS corpora (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(100),
  source_url VARCHAR(500),
  license VARCHAR(100),
  doc_count BIGINT DEFAULT 0,
  last_crawled_at TIMESTAMP,
  embedding_model VARCHAR(100),
  dim INTEGER DEFAULT 1024,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_corpora_domain ON corpora(domain);

-- Individual documents within a corpus. Real-world: arXiv paper, PubMed abstract.
CREATE TABLE IF NOT EXISTS corpus_documents (
  id SERIAL PRIMARY KEY,
  corpus_id INTEGER REFERENCES corpora(id) ON DELETE CASCADE,
  external_id VARCHAR(128),
  doi VARCHAR(128),
  title TEXT NOT NULL,
  abstract TEXT,
  authors TEXT,
  venue VARCHAR(255),
  year INTEGER,
  url VARCHAR(500),
  tokens INTEGER DEFAULT 0,
  citation_count INTEGER DEFAULT 0,
  has_embedding BOOLEAN DEFAULT FALSE,
  bm25_doc_len INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_corpus_documents_corpus ON corpus_documents(corpus_id);
CREATE INDEX IF NOT EXISTS idx_corpus_documents_year ON corpus_documents(year DESC);
CREATE INDEX IF NOT EXISTS idx_corpus_documents_doi ON corpus_documents(doi);

-- ============================================================================
-- Hybrid retrieval — queries, candidate sets, fused rankings
-- ============================================================================
CREATE TABLE IF NOT EXISTS retrieval_queries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  corpus_slug VARCHAR(64),
  retriever VARCHAR(50),
  reranker_model VARCHAR(100),
  alpha DECIMAL(3,2) DEFAULT 0.5,
  top_k INTEGER DEFAULT 10,
  latency_ms INTEGER,
  total_candidates INTEGER,
  ndcg_at_10 DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_retrieval_queries_user ON retrieval_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_retrieval_queries_created ON retrieval_queries(created_at DESC);

CREATE TABLE IF NOT EXISTS retrieval_results (
  id SERIAL PRIMARY KEY,
  query_id INTEGER REFERENCES retrieval_queries(id) ON DELETE CASCADE,
  document_id INTEGER REFERENCES corpus_documents(id) ON DELETE CASCADE,
  rank INTEGER,
  bm25_score DECIMAL(8,4),
  dense_score DECIMAL(8,4),
  fused_score DECIMAL(8,4),
  rerank_score DECIMAL(8,4),
  snippet TEXT
);
CREATE INDEX IF NOT EXISTS idx_retrieval_results_query ON retrieval_results(query_id);

-- ============================================================================
-- Citation / provenance graph — every claim in an LLM answer maps back to docs
-- ============================================================================
CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  query_id INTEGER REFERENCES retrieval_queries(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  question TEXT,
  answer_text TEXT,
  generator_model VARCHAR(100),
  groundedness DECIMAL(4,3),
  hallucination_risk DECIMAL(4,3),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_answers_query ON answers(query_id);

CREATE TABLE IF NOT EXISTS citations (
  id SERIAL PRIMARY KEY,
  answer_id INTEGER REFERENCES answers(id) ON DELETE CASCADE,
  document_id INTEGER REFERENCES corpus_documents(id) ON DELETE CASCADE,
  claim_text TEXT,
  span_start INTEGER,
  span_end INTEGER,
  support_score DECIMAL(4,3),
  contradicts BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_citations_answer ON citations(answer_id);
CREATE INDEX IF NOT EXISTS idx_citations_document ON citations(document_id);

-- ============================================================================
-- Live web crawl — Tavily / Exa / Brave / You.com ingestion
-- ============================================================================
CREATE TABLE IF NOT EXISTS web_crawls (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  provider VARCHAR(40),
  query TEXT NOT NULL,
  freshness_days INTEGER,
  domain_filter TEXT,
  results_count INTEGER DEFAULT 0,
  cost_usd DECIMAL(8,5),
  latency_ms INTEGER,
  ingested_to_corpus_id INTEGER REFERENCES corpora(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_web_crawls_provider ON web_crawls(provider);
CREATE INDEX IF NOT EXISTS idx_web_crawls_created ON web_crawls(created_at DESC);

CREATE TABLE IF NOT EXISTS web_crawl_results (
  id SERIAL PRIMARY KEY,
  crawl_id INTEGER REFERENCES web_crawls(id) ON DELETE CASCADE,
  rank INTEGER,
  url VARCHAR(700) NOT NULL,
  title TEXT,
  snippet TEXT,
  published_date DATE,
  score DECIMAL(5,4),
  raw_content_tokens INTEGER,
  imported_doc_id INTEGER REFERENCES corpus_documents(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_web_crawl_results_crawl ON web_crawl_results(crawl_id);

-- ============================================================================
-- BEIR / MTEB / SciFact / NFCorpus benchmark runs against the retrieval stack
-- ============================================================================
CREATE TABLE IF NOT EXISTS benchmarks (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  suite VARCHAR(50),
  domain VARCHAR(80),
  task_type VARCHAR(40),
  num_queries INTEGER,
  num_docs INTEGER,
  primary_metric VARCHAR(30) DEFAULT 'ndcg@10',
  description TEXT
);

CREATE TABLE IF NOT EXISTS benchmark_runs (
  id SERIAL PRIMARY KEY,
  benchmark_id INTEGER REFERENCES benchmarks(id) ON DELETE CASCADE,
  retriever VARCHAR(100),
  embedding_model VARCHAR(100),
  reranker_model VARCHAR(100),
  alpha DECIMAL(3,2),
  ndcg_at_10 DECIMAL(5,4),
  recall_at_100 DECIMAL(5,4),
  mrr DECIMAL(5,4),
  map_score DECIMAL(5,4),
  latency_p50_ms INTEGER,
  latency_p95_ms INTEGER,
  cost_per_1k_usd DECIMAL(7,4),
  ran_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_benchmark ON benchmark_runs(benchmark_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_ndcg ON benchmark_runs(ndcg_at_10 DESC);

-- ============================================================================
-- Closed-loop discovery agent — retrieves, proposes hypothesis, cycles
-- ============================================================================
CREATE TABLE IF NOT EXISTS discovery_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  goal TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'running',
  iterations_planned INTEGER DEFAULT 3,
  iterations_done INTEGER DEFAULT 0,
  proposed_hypothesis TEXT,
  novelty_score DECIMAL(4,3),
  groundedness_score DECIMAL(4,3),
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(8,5),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_user ON discovery_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_discovery_sessions_project ON discovery_sessions(project_id);

CREATE TABLE IF NOT EXISTS discovery_steps (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES discovery_sessions(id) ON DELETE CASCADE,
  step_number INTEGER,
  step_type VARCHAR(40),
  input TEXT,
  output TEXT,
  retriever_query_id INTEGER REFERENCES retrieval_queries(id) ON DELETE SET NULL,
  answer_id INTEGER REFERENCES answers(id) ON DELETE SET NULL,
  tokens_used INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_discovery_steps_session ON discovery_steps(session_id);

