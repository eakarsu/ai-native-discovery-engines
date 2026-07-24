BEGIN;
CREATE TABLE IF NOT EXISTS runtime_ai_results (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  tenant_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider='openrouter'),
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMIT;
