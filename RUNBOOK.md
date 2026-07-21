# Governed discovery runbook

`discovery_sources`, replay-safe `ingestion_jobs`, tombstoned `indexed_documents`, and atomic `index_aliases` are the production boundary. Every document carries a tenant, source identity, freshness timestamp, content digest, provenance URI, and principal ACL. Authorization filtering occurs before ranking. Feedback is tenant-scoped. Promotion requires a ready version, benchmark report, index-admin role, and sufficient healthy capacity; the previous alias remains the rollback target.

Install dependencies explicitly and run `./start.sh check`. Back up PostgreSQL, then apply the additive migration with `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate`. Startup never creates, seeds, migrates, installs, or kills processes. Monitor job age/depth, dead letters, source lag, deletion lag, query latency/error rate, authorization denials, capacity, benchmark drift, and active/previous aliases. Disaster recovery requires a database restore plus deterministic replay from source checkpoints into a new version before an alias swap.

## Controlled release journey

1. Configure `DATABASE_URL`, a random 32+ character `JWT_SECRET`, the tenant identity source, and a strict `CORS_ORIGIN`. Non-push source credentials must be secret-manager references such as `vault:discovery/source`; never send credentials in a source record or ingestion payload.
2. Create a tenant-scoped source and a new building index version. Submit bounded batches with a stable `Idempotency-Key`, source/external IDs, provenance URI, source timestamp, locale, body, and at least one allowed principal.
3. Apply queued jobs using an `index_worker`, `index_admin`, or `admin` identity. A full-snapshot job tombstones source documents omitted from that snapshot. Retry the same key after an uncertain response; a changed payload under that key is a conflict.
4. Mark the version ready only after all its jobs succeed. Create a versioned benchmark dataset containing normal, empty, adversarial, and at least two-locale cases. The benchmark route executes real ACL-filtered queries against the candidate version; it does not swap the live alias or use simulated priors.
5. Promote only a ready version with a passing benchmark and the required healthy-node count. Promotion and rollback use an atomic alias transaction and retain the previous version.

The supported API is `/api/governed-discovery`. `/monitoring` reports queue age/depth, dead letters, stale sources, aliases, and per-source document/byte capacity. Alert before either capacity limit reaches 80%, on any dead letter, source lag beyond the approved freshness objective, or a benchmark regression. Keep job payloads and source checkpoints for the approved replay window.

For disaster recovery, restore PostgreSQL to an isolated environment, verify audit and content hashes, create a recovery plan for a new version, apply its replay jobs, rerun the pinned benchmark, then promote. Never overwrite the active version. Regularly prove database backup restore, source replay, alias rollback, and secret rotation. Connector outages remain explicit retry/dead-letter states and must not be reported as indexed success.

Source licenses and authoritative connector credentials, production relevance targets, multilingual/adversarial corpus review, capacity testing, privacy/security assessment, and external AI/search provider evaluation remain launch gates. Generated AI, simulated benchmark, unscoped legacy, demo, and visualization routes are retired from the server and return HTTP 410; they are not an enableable production fallback.
