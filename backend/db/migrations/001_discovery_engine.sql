BEGIN;
CREATE TABLE IF NOT EXISTS discovery_sources (
  id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, source_key TEXT NOT NULL, source_type TEXT NOT NULL,
  checkpoint TEXT, enabled BOOLEAN NOT NULL DEFAULT TRUE, capacity_document_limit BIGINT NOT NULL, capacity_byte_limit BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(tenant_id,source_key)
);
ALTER TABLE discovery_sources ADD COLUMN IF NOT EXISTS collection_key TEXT NOT NULL DEFAULT 'default';
ALTER TABLE discovery_sources ADD COLUMN IF NOT EXISTS connector_config_ref TEXT;
ALTER TABLE discovery_sources ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMPTZ;
ALTER TABLE discovery_sources ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, source_id UUID NOT NULL REFERENCES discovery_sources(id), idempotency_key TEXT NOT NULL,
  request_digest TEXT NOT NULL, checkpoint_from TEXT, checkpoint_to TEXT, state TEXT NOT NULL DEFAULT 'pending', attempt INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), lease_until TIMESTAMPTZ, error_code TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(source_id,idempotency_key)
);
ALTER TABLE ingestion_jobs ADD COLUMN IF NOT EXISTS target_version TEXT;
ALTER TABLE ingestion_jobs ADD COLUMN IF NOT EXISTS request_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE ingestion_jobs ADD COLUMN IF NOT EXISTS stats JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE ingestion_jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE ingestion_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE TABLE IF NOT EXISTS indexed_documents (
  id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, source_id UUID NOT NULL REFERENCES discovery_sources(id), external_id TEXT NOT NULL,
  uri TEXT NOT NULL, title TEXT, content_digest TEXT NOT NULL, acl_digest TEXT NOT NULL, allowed_principals JSONB NOT NULL,
  source_updated_at TIMESTAMPTZ NOT NULL, indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), deleted_at TIMESTAMPTZ,
  index_version TEXT NOT NULL, byte_size BIGINT NOT NULL DEFAULT 0, UNIQUE(source_id,external_id,index_version)
);
ALTER TABLE indexed_documents ADD COLUMN IF NOT EXISTS body TEXT NOT NULL DEFAULT '';
ALTER TABLE indexed_documents ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'und';
ALTER TABLE indexed_documents ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE indexed_documents ADD COLUMN IF NOT EXISTS search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(body,''))) STORED;
CREATE TABLE IF NOT EXISTS index_versions (
  tenant_id TEXT NOT NULL, collection_key TEXT NOT NULL, version TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN('building','ready','active','retired','failed')),
  document_count BIGINT NOT NULL DEFAULT 0, byte_size BIGINT NOT NULL DEFAULT 0, benchmark_report JSONB, built_at TIMESTAMPTZ, PRIMARY KEY(tenant_id,collection_key,version)
);
ALTER TABLE index_versions ADD COLUMN IF NOT EXISTS schema_digest TEXT;
ALTER TABLE index_versions ADD COLUMN IF NOT EXISTS benchmark_passed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE index_versions ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE index_versions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE TABLE IF NOT EXISTS index_aliases (
  tenant_id TEXT NOT NULL, collection_key TEXT NOT NULL, active_version TEXT NOT NULL, previous_version TEXT, generation BIGINT NOT NULL DEFAULT 1, switched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY(tenant_id,collection_key)
);
CREATE TABLE IF NOT EXISTS search_feedback (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, query_id TEXT NOT NULL, document_id UUID REFERENCES indexed_documents(id), actor_id TEXT NOT NULL,
  judgment TEXT NOT NULL CHECK(judgment IN('relevant','irrelevant','clicked','dismissed')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(tenant_id,query_id,document_id,actor_id,judgment)
);
CREATE TABLE IF NOT EXISTS discovery_queries (
  id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, actor_id TEXT NOT NULL, collection_key TEXT NOT NULL,
  query_text TEXT NOT NULL, query_digest TEXT NOT NULL, principal_digest TEXT NOT NULL, index_version TEXT,
  result_count INTEGER NOT NULL, latency_ms INTEGER NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS discovery_benchmark_suites (
  id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, suite_key TEXT NOT NULL, dataset_version TEXT NOT NULL,
  description TEXT, created_by TEXT NOT NULL, dataset_digest TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id,suite_key,dataset_version)
);
CREATE TABLE IF NOT EXISTS discovery_benchmark_cases (
  id TEXT NOT NULL, suite_id UUID NOT NULL REFERENCES discovery_benchmark_suites(id) ON DELETE CASCADE,
  locale TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN('normal','empty','adversarial')),
  query_text TEXT NOT NULL, relevant_external_ids TEXT[] NOT NULL, min_precision DOUBLE PRECISION NOT NULL,
  min_recall DOUBLE PRECISION NOT NULL, max_latency_ms INTEGER NOT NULL, PRIMARY KEY(suite_id,id)
);
CREATE TABLE IF NOT EXISTS discovery_benchmark_runs (
  id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, suite_id UUID NOT NULL REFERENCES discovery_benchmark_suites(id),
  collection_key TEXT NOT NULL, index_version TEXT NOT NULL, result_digest TEXT NOT NULL,
  precision DOUBLE PRECISION NOT NULL, recall DOUBLE PRECISION NOT NULL, latency_p95_ms INTEGER NOT NULL,
  passed BOOLEAN NOT NULL, created_by TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS discovery_benchmark_results (
  run_id UUID NOT NULL REFERENCES discovery_benchmark_runs(id) ON DELETE CASCADE, case_id TEXT NOT NULL,
  returned_external_ids TEXT[] NOT NULL, precision DOUBLE PRECISION NOT NULL, recall DOUBLE PRECISION NOT NULL,
  latency_ms INTEGER NOT NULL, passed BOOLEAN NOT NULL, PRIMARY KEY(run_id,case_id)
);
CREATE TABLE IF NOT EXISTS discovery_recovery_manifests (
  id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, collection_key TEXT NOT NULL, requested_by TEXT NOT NULL,
  source_checkpoints JSONB NOT NULL, target_version TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS discovery_audit_events (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, actor_id TEXT NOT NULL, action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, details JSONB NOT NULL DEFAULT '{}', occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION immutable_discovery_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'discovery audit is append-only'; END $$;
DROP TRIGGER IF EXISTS discovery_audit_immutable ON discovery_audit_events;
CREATE TRIGGER discovery_audit_immutable BEFORE UPDATE OR DELETE ON discovery_audit_events FOR EACH ROW EXECUTE FUNCTION immutable_discovery_audit();
CREATE INDEX IF NOT EXISTS ingestion_claim_idx ON ingestion_jobs(state,available_at);
CREATE INDEX IF NOT EXISTS indexed_document_acl_idx ON indexed_documents USING GIN(allowed_principals);
CREATE INDEX IF NOT EXISTS indexed_document_search_idx ON indexed_documents USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS indexed_document_active_idx ON indexed_documents(tenant_id,index_version,source_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS discovery_queries_tenant_idx ON discovery_queries(tenant_id,created_at DESC);
CREATE INDEX IF NOT EXISTS benchmark_runs_version_idx ON discovery_benchmark_runs(tenant_id,collection_key,index_version,created_at DESC);
COMMIT;
