# Completeness Review: ai-native-discovery-engines

**Review date:** 2026-07-20

## Assessment basis

Static inspection plus isolated PostgreSQL schema/migration application, explicit administrator provisioning, backend startup, database-backed login/authenticated API acceptance, maintained tests, and a production frontend build. External corpus connectors and production relevance/capacity certification were not exercised.

## Classification

**Functional but incomplete**

This is a substantive but unfinished search/discovery application, not just an empty scaffold. Inspection found 113 source files across `frontend/`, `backend/` using Next.js, React, Express; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Implement durable source ingestion with incremental indexing, deletion propagation, deduplication, and replayable jobs.
2. Add permission-aware query filtering, provenance, freshness, explainable ranking, and relevance feedback.
3. Define benchmark datasets for recall, precision, latency, multilingual behavior, and adversarial or empty queries.
4. Add index versioning, zero-downtime rebuild, monitoring, capacity limits, and disaster recovery.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.

## Evidence inspected

- `frontend/src/App.tsx:25`
- `backend/routes/sample_data.js:8`
- `backend/server.js`
- `backend/middleware/auth.js`
- `requirements.txt`
- `start.sh`

## Recommended next action

Choose one real search/discovery journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-19)

1. Implemented durable tenant-scoped sources, bounded content-hashed job payloads, source checkpoints, stable idempotency conflict detection, retries/dead letters, incremental insert/update/no-op planning, external-key and content/ACL deduplication, explicit tombstones, full-snapshot deletion propagation, and replay into named building versions in `backend/governance/discovery.js`, `backend/routes/governedDiscovery.js`, and `backend/db/migrations/001_discovery_engine.sql`. Job success, checkpoint advance, document writes, capacity checks, version counts, and audit evidence share one database transaction; uncertain clients replay the original key rather than creating duplicate work.
2. Implemented SQL-level tenant and principal ACL filtering before rank calculation, active-alias version selection, parameterized full-text retrieval, deterministic ranking contributions, provenance/content hashes, source and index timestamps, freshness age, bounded result counts, principal/query audit hashes, and authorization-checked relevance feedback. The authenticated query path exposes why each result ranked and never returns a candidate outside the caller's tenant/principal set.
3. Added durable versioned benchmark suites and cases with required normal, empty, adversarial, and multilingual coverage plus explicit per-case precision, recall, and latency thresholds. Benchmark runs execute the real permission-filtered candidate-version query path without changing the live alias, persist case evidence and a reproducible aggregate digest, and fail closed if any case misses its threshold; the former simulated-prior benchmark and generic-model routes are retired.
4. Added building/ready/active/retired index states, non-empty and completed-job readiness gates, benchmark-gated atomic alias promotion, healthy-node capacity gates, one-step atomic rollback, per-source document/byte capacity, queue/dead-letter/staleness monitoring, and persisted recovery manifests that recreate deterministic full-snapshot replay jobs into a new version. `RUNBOOK.md` documents alerts, backup/restore, replay, benchmark, promotion, rollback, and provider-outage practice rather than treating a rebuild request as recovered service.
5. Added 14 project-owned domain, architecture, failure, security, migration, and PostgreSQL-backed HTTP acceptance tests plus CI with PostgreSQL 16, lockfile installs, repeat migration, database-enabled tests, backend/frontend dependency audits, syntax checks, and the frontend build. On 2026-07-19 all 14 tests passed, including a disposable-database journey through source creation, duplicate/conflicting jobs, incremental/full-snapshot application, deletion propagation, ACL isolation, measured multilingual/adversarial benchmarks, promotion, feedback, monitoring, recovery planning, and immutable-audit rejection. The additive migration applied twice; backend and frontend production audits reported zero vulnerabilities; the Vite production build, shell syntax, and diff checks passed. `start.sh` now separates check/migrate/start, requires explicit migration approval, binds the server to loopback, and never creates/seeds a database, installs dependencies, or kills processes. Tracked-history inspection found no committed `.env` file; local environment files remain ignored and `.env.example` is placeholder-only.

External launch gates remain: provision tenant and role administration; implement/certify deployment-owned source connector workers and secret resolution; approve source licenses, retention, and deletion policy; supply representative multilingual/adversarial relevance judgments and production thresholds; validate any semantic/vector provider before assigning it nonzero rank weight; and complete intended-scale capacity, concurrency, source-outage, backup/restore, replay, rollback, monitoring, privacy, and disaster-recovery exercises. No external corpus license, connector delivery, semantic-provider quality, production relevance, capacity, or recovery certification is claimed from repository-only validation.

## Runtime acceptance (2026-07-20)

- `start.sh start` now requires an explicit validated `BACKEND_PORT`, refuses an occupied port, binds only to `127.0.0.1`, and supplies the assigned tenant/CORS origin only in isolated test mode. Neither the launcher nor `backend/server.js` has a listener-port fallback or performs schema/data mutation.
- Initial identity provisioning is a separate acknowledgement-gated command that refuses overwrite and stores a bcrypt cost-12 password. Acceptance used that single account rather than the broad legacy sample-data surface.
- The first and only recorded attempt in `_runtime_non_suite_repair_shard2l.tsv` is `API_VERIFIED / startup_login_session_api`. PostgreSQL used `127.0.0.1:55623`, the backend used `127.0.0.1:6060`, and reserved UI port `6061` stayed listener-free. Login verified PostgreSQL credentials and the bearer-authenticated `/api/auth/me` endpoint reloaded the persisted user.
- Current verification passed 14 maintained tests (13 passed and one PostgreSQL acceptance journey skipped without its opt-in test database), backend syntax checks, and the TypeScript/Vite production build. Shell syntax, diff checks, and assigned-port release checks passed.
