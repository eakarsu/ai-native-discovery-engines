'use strict';

const crypto = require('crypto');
const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const domain = require('../governance/discovery');

const router = express.Router();
router.use(auth);

function requireRole(req, res, allowed) {
  if (!allowed.includes(req.user.role)) {
    res.status(403).json({ error: `One of these roles is required: ${allowed.join(', ')}` });
    return false;
  }
  return true;
}

async function audit(client, req, action, targetType, targetId, details = {}) {
  await client.query(
    `INSERT INTO discovery_audit_events(tenant_id,actor_id,action,target_type,target_id,details)
     VALUES($1,$2,$3,$4,$5,$6::jsonb)`,
    [req.user.tenantId, String(req.user.id), action, targetType, String(targetId), JSON.stringify(details)],
  );
}

async function inTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function searchTenant({ tenantId, actorId, principals, query, collectionKey, topK, indexVersion = null }) {
  const text = String(query || '').trim().slice(0, 500);
  if (!text) return { version: null, results: [], latencyMs: 0 };
  const limit = Math.max(1, Math.min(Number(topK) || 10, 50));
  const started = Date.now();
  let version = indexVersion;
  if (!version) {
    const active = await pool.query(
      'SELECT active_version FROM index_aliases WHERE tenant_id=$1 AND collection_key=$2',
      [tenantId, collectionKey],
    );
    if (!active.rowCount) return { version: null, results: [], latencyMs: Date.now() - started };
    version = active.rows[0].active_version;
  }
  const found = await pool.query(
    `SELECT d.id,d.external_id,d.uri,d.title,d.body,d.locale,d.allowed_principals,
            d.source_id,d.source_updated_at AS updated_at,d.indexed_at,d.content_digest,
            ts_rank_cd(d.search_vector,plainto_tsquery('simple',$3)) AS lexical,
            GREATEST(0,1-(EXTRACT(EPOCH FROM (NOW()-d.source_updated_at))/2592000.0)) AS freshness,
            COALESCE(f.feedback_score,0) AS feedback
       FROM indexed_documents d
       JOIN discovery_sources s ON s.id=d.source_id AND s.tenant_id=d.tenant_id
       LEFT JOIN LATERAL (
         SELECT AVG(CASE WHEN judgment IN ('relevant','clicked') THEN 1.0 ELSE -1.0 END) AS feedback_score
           FROM search_feedback WHERE tenant_id=d.tenant_id AND document_id=d.id
       ) f ON TRUE
      WHERE d.tenant_id=$1 AND s.collection_key=$4 AND d.index_version=$5
        AND d.deleted_at IS NULL AND d.allowed_principals ?| $2::text[]
        AND d.search_vector @@ plainto_tsquery('simple',$3)
      ORDER BY lexical DESC,freshness DESC,d.external_id ASC LIMIT $6`,
    [tenantId, principals, text, collectionKey, version, limit],
  );
  const results = found.rows.map((row) => {
    const ranked = domain.rank({ lexical: Number(row.lexical), semantic: 0, freshness: Number(row.freshness), feedback: Number(row.feedback) });
    return {
      id: row.id,
      externalId: row.external_id,
      title: row.title,
      snippet: row.body.slice(0, 400),
      locale: row.locale,
      score: ranked.score,
      ranking: ranked.explanation,
      freshnessSeconds: Math.max(0, Math.floor((Date.now() - Date.parse(row.updated_at)) / 1000)),
      provenance: {
        sourceId: row.source_id,
        externalId: row.external_id,
        uri: row.uri,
        sourceUpdatedAt: row.updated_at,
        indexedAt: row.indexed_at,
        contentDigest: row.content_digest,
        indexVersion: version,
      },
    };
  }).sort((a, b) => b.score - a.score || a.externalId.localeCompare(b.externalId));
  const latencyMs = Date.now() - started;
  const queryId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO discovery_queries(id,tenant_id,actor_id,collection_key,query_text,query_digest,principal_digest,index_version,result_count,latency_ms)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [queryId, tenantId, String(actorId), collectionKey, text, domain.digest(text), domain.digest(principals.slice().sort()), version, results.length, latencyMs],
  );
  return { queryId, version, results, latencyMs };
}

router.post('/sources', async (req, res, next) => {
  if (!requireRole(req, res, ['index_admin', 'admin'])) return;
  try {
    const { sourceKey, sourceType, collectionKey = 'default', connectorConfigRef, maxDocuments, maxBytes } = req.body || {};
    if (!/^[a-zA-Z0-9._-]{1,100}$/.test(String(sourceKey || ''))) return res.status(400).json({ error: 'Invalid sourceKey' });
    if (!['push', 'https', 's3', 'database'].includes(sourceType)) return res.status(400).json({ error: 'Unsupported sourceType' });
    if (sourceType !== 'push') domain.assertSafeConfigRef(connectorConfigRef);
    if (!Number.isSafeInteger(maxDocuments) || maxDocuments < 1 || !Number.isSafeInteger(maxBytes) || maxBytes < 1) return res.status(400).json({ error: 'Positive integer capacity limits are required' });
    const result = await inTransaction(async (client) => {
      const id = crypto.randomUUID();
      const inserted = await client.query(
        `INSERT INTO discovery_sources(id,tenant_id,source_key,source_type,collection_key,connector_config_ref,capacity_document_limit,capacity_byte_limit)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [id, req.user.tenantId, sourceKey, sourceType, collectionKey, connectorConfigRef || null, maxDocuments, maxBytes],
      );
      await audit(client, req, 'source.created', 'source', id, { sourceKey, sourceType, collectionKey });
      return inserted.rows[0];
    });
    res.status(201).json(result);
  } catch (error) { next(error); }
});

router.get('/sources', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id,source_key,source_type,collection_key,checkpoint,enabled,capacity_document_limit,
              capacity_byte_limit,last_success_at,created_at,updated_at
         FROM discovery_sources WHERE tenant_id=$1 ORDER BY source_key`,
      [req.user.tenantId],
    );
    res.json({ sources: result.rows });
  } catch (error) { next(error); }
});

router.post('/collections/:collectionKey/versions', async (req, res, next) => {
  if (!requireRole(req, res, ['index_admin', 'admin'])) return;
  try {
    const version = String(req.body?.version || '');
    if (!/^[a-zA-Z0-9._-]{1,80}$/.test(version)) return res.status(400).json({ error: 'Invalid version' });
    const schemaDigest = domain.digest(req.body?.schema || {});
    const result = await inTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO index_versions(tenant_id,collection_key,version,state,schema_digest)
         VALUES($1,$2,$3,'building',$4) ON CONFLICT DO NOTHING RETURNING *`,
        [req.user.tenantId, req.params.collectionKey, version, schemaDigest],
      );
      if (!inserted.rowCount) {
        const existing = await client.query('SELECT * FROM index_versions WHERE tenant_id=$1 AND collection_key=$2 AND version=$3', [req.user.tenantId, req.params.collectionKey, version]);
        if (existing.rows[0]?.schema_digest !== schemaDigest) { const error = new Error('Version definition conflict'); error.status = 409; throw error; }
        return existing.rows[0];
      }
      await audit(client, req, 'index.build.created', 'index_version', `${req.params.collectionKey}:${version}`, { schemaDigest });
      return inserted.rows[0];
    });
    res.status(202).json(result);
  } catch (error) { next(error); }
});

router.post('/sources/:sourceId/jobs', async (req, res, next) => {
  if (!requireRole(req, res, ['index_admin', 'admin'])) return;
  try {
    const key = String(req.get('idempotency-key') || '');
    if (key.length < 8 || key.length > 160) return res.status(400).json({ error: 'A stable Idempotency-Key is required' });
    const candidate = { ...(req.body || {}), documents: (req.body?.documents || []).map((document) => ({ ...document, sourceId: req.params.sourceId })) };
    const batch = domain.validateIngestionBatch(candidate);
    domain.planIncremental([], batch.documents);
    const requestDigest = domain.digest(batch);
    const result = await inTransaction(async (client) => {
      const source = await client.query('SELECT * FROM discovery_sources WHERE id=$1 AND tenant_id=$2 AND enabled', [req.params.sourceId, req.user.tenantId]);
      if (!source.rowCount) { const error = new Error('Source not found'); error.status = 404; throw error; }
      if (batch.bytes > Number(source.rows[0].capacity_byte_limit)) { const error = new Error('Batch exceeds source byte capacity'); error.status = 409; throw error; }
      const version = await client.query(
        `SELECT 1 FROM index_versions WHERE tenant_id=$1 AND collection_key=$2 AND version=$3 AND state='building'`,
        [req.user.tenantId, source.rows[0].collection_key, batch.version],
      );
      if (!version.rowCount) { const error = new Error('Target version is not building'); error.status = 409; throw error; }
      const inserted = await client.query(
        `INSERT INTO ingestion_jobs(id,tenant_id,source_id,idempotency_key,request_digest,checkpoint_from,checkpoint_to,target_version,request_payload)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
         ON CONFLICT(source_id,idempotency_key) DO NOTHING RETURNING *`,
        [crypto.randomUUID(), req.user.tenantId, req.params.sourceId, key, requestDigest, source.rows[0].checkpoint, batch.checkpointTo || null, batch.version, JSON.stringify(batch)],
      );
      if (inserted.rowCount) {
        await audit(client, req, 'ingestion.queued', 'ingestion_job', inserted.rows[0].id, { sourceId: req.params.sourceId, version: batch.version, requestDigest });
        return { status: 202, job: inserted.rows[0] };
      }
      const existing = await client.query('SELECT * FROM ingestion_jobs WHERE source_id=$1 AND idempotency_key=$2 AND tenant_id=$3', [req.params.sourceId, key, req.user.tenantId]);
      if (existing.rows[0].request_digest !== requestDigest) { const error = new Error('Idempotency conflict'); error.status = 409; throw error; }
      return { status: 200, job: existing.rows[0], duplicate: true };
    });
    res.status(result.status).json({ ...result.job, duplicate: Boolean(result.duplicate) });
  } catch (error) { next(error); }
});

router.post('/jobs/:jobId/apply', async (req, res, next) => {
  if (!requireRole(req, res, ['index_worker', 'index_admin', 'admin'])) return;
  try {
    const result = await inTransaction(async (client) => {
      const selected = await client.query(
        `SELECT j.*,s.collection_key,s.capacity_document_limit,s.capacity_byte_limit
           FROM ingestion_jobs j JOIN discovery_sources s ON s.id=j.source_id
          WHERE j.id=$1 AND j.tenant_id=$2 FOR UPDATE`,
        [req.params.jobId, req.user.tenantId],
      );
      if (!selected.rowCount) { const error = new Error('Job not found'); error.status = 404; throw error; }
      const job = selected.rows[0];
      if (job.state === 'succeeded') return { ...job, duplicate: true };
      if (job.state === 'dead_letter') { const error = new Error('Dead-letter job requires explicit replay'); error.status = 409; throw error; }
      const batch = domain.validateIngestionBatch(job.request_payload);
      if (domain.digest(batch) !== job.request_digest) { const error = new Error('Stored job digest mismatch'); error.status = 409; throw error; }
      const current = await client.query(
        'SELECT source_id AS "sourceId",external_id AS "externalId",content_digest AS "contentDigest",acl_digest AS "aclDigest" FROM indexed_documents WHERE source_id=$1 AND index_version=$2',
        [job.source_id, job.target_version],
      );
      const actions = domain.planIncremental(current.rows, batch.documents);
      const stats = { inserted: 0, updated: 0, deleted: 0, unchanged: 0, propagatedDeletes: 0 };
      for (const action of actions) {
        const document = action.doc;
        if (action.type === 'delete') {
          const deleted = await client.query(
            'UPDATE indexed_documents SET deleted_at=NOW(),indexed_at=NOW() WHERE source_id=$1 AND external_id=$2 AND index_version=$3 AND deleted_at IS NULL',
            [job.source_id, document.externalId, job.target_version],
          );
          stats.deleted += deleted.rowCount;
          continue;
        }
        if (action.type === 'noop') { stats.unchanged += 1; continue; }
        await client.query(
          `INSERT INTO indexed_documents(id,tenant_id,source_id,external_id,uri,title,body,locale,metadata,content_digest,acl_digest,allowed_principals,source_updated_at,index_version,byte_size,deleted_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12::jsonb,$13,$14,$15,NULL)
           ON CONFLICT(source_id,external_id,index_version) DO UPDATE SET
             uri=EXCLUDED.uri,title=EXCLUDED.title,body=EXCLUDED.body,locale=EXCLUDED.locale,metadata=EXCLUDED.metadata,
             content_digest=EXCLUDED.content_digest,acl_digest=EXCLUDED.acl_digest,allowed_principals=EXCLUDED.allowed_principals,
             source_updated_at=EXCLUDED.source_updated_at,indexed_at=NOW(),byte_size=EXCLUDED.byte_size,deleted_at=NULL`,
          [crypto.randomUUID(), req.user.tenantId, job.source_id, document.externalId, document.uri, document.title || null,
            document.body, document.locale, JSON.stringify(document.metadata || {}), document.contentDigest, document.aclDigest,
            JSON.stringify(document.allowedPrincipals), document.updatedAt, job.target_version, Buffer.byteLength(document.body, 'utf8')],
        );
        stats[action.type === 'insert' ? 'inserted' : 'updated'] += 1;
      }
      if (batch.fullSnapshot) {
        const ids = batch.documents.filter((document) => !document.deleted).map((document) => document.externalId);
        const removed = await client.query(
          `UPDATE indexed_documents SET deleted_at=NOW(),indexed_at=NOW()
            WHERE source_id=$1 AND index_version=$2 AND deleted_at IS NULL AND NOT (external_id=ANY($3::text[]))`,
          [job.source_id, job.target_version, ids],
        );
        stats.propagatedDeletes = removed.rowCount;
      }
      const capacity = await client.query(
        `SELECT COUNT(*)::bigint AS documents,COALESCE(SUM(byte_size),0)::bigint AS bytes
           FROM indexed_documents WHERE source_id=$1 AND index_version=$2 AND deleted_at IS NULL`,
        [job.source_id, job.target_version],
      );
      if (Number(capacity.rows[0].documents) > Number(job.capacity_document_limit) || Number(capacity.rows[0].bytes) > Number(job.capacity_byte_limit)) {
        const error = new Error('Source capacity exceeded'); error.status = 409; throw error;
      }
      await client.query('UPDATE discovery_sources SET checkpoint=$1,last_success_at=NOW(),updated_at=NOW() WHERE id=$2', [job.checkpoint_to, job.source_id]);
      await client.query(
        `UPDATE ingestion_jobs SET state='succeeded',stats=$1::jsonb,completed_at=NOW(),updated_at=NOW(),lease_until=NULL WHERE id=$2`,
        [JSON.stringify(stats), job.id],
      );
      await client.query(
        `UPDATE index_versions v SET document_count=x.documents,byte_size=x.bytes
           FROM (SELECT COUNT(*)::bigint AS documents,COALESCE(SUM(d.byte_size),0)::bigint AS bytes
                   FROM indexed_documents d JOIN discovery_sources s ON s.id=d.source_id
                  WHERE d.tenant_id=$1 AND s.collection_key=$2 AND d.index_version=$3 AND d.deleted_at IS NULL) x
          WHERE v.tenant_id=$1 AND v.collection_key=$2 AND v.version=$3`,
        [req.user.tenantId, job.collection_key, job.target_version],
      );
      await audit(client, req, 'ingestion.succeeded', 'ingestion_job', job.id, stats);
      return { id: job.id, state: 'succeeded', stats };
    });
    res.json(result);
  } catch (error) {
    if (error.status !== 404) {
      const current = await pool.query('SELECT attempt FROM ingestion_jobs WHERE id=$1 AND tenant_id=$2', [req.params.jobId, req.user.tenantId]);
      if (current.rowCount) {
        const retryable = /timeout|connection|temporar/i.test(error.message);
        const decision = domain.retry(Number(current.rows[0].attempt), retryable);
        await pool.query(
          `UPDATE ingestion_jobs SET state=$1,attempt=$2,error_code=$3,available_at=NOW()+($4*INTERVAL '1 second'),updated_at=NOW() WHERE id=$5 AND tenant_id=$6`,
          [decision.status === 'retry' ? 'retry' : 'dead_letter', decision.attempts, retryable ? 'TRANSIENT_FAILURE' : 'VALIDATION_FAILURE', decision.delaySeconds || 0, req.params.jobId, req.user.tenantId],
        );
      }
    }
    next(error);
  }
});

router.post('/collections/:collectionKey/versions/:version/ready', async (req, res, next) => {
  if (!requireRole(req, res, ['index_admin', 'admin'])) return;
  try {
    const result = await inTransaction(async (client) => {
      const pending = await client.query(
        `SELECT COUNT(*)::int AS count FROM ingestion_jobs j JOIN discovery_sources s ON s.id=j.source_id
          WHERE j.tenant_id=$1 AND s.collection_key=$2 AND j.target_version=$3 AND j.state<>'succeeded'`,
        [req.user.tenantId, req.params.collectionKey, req.params.version],
      );
      if (pending.rows[0].count) { const error = new Error('Index has unfinished ingestion jobs'); error.status = 409; throw error; }
      const updated = await client.query(
        `UPDATE index_versions SET state='ready',built_at=NOW() WHERE tenant_id=$1 AND collection_key=$2 AND version=$3 AND state='building' AND document_count>0 RETURNING *`,
        [req.user.tenantId, req.params.collectionKey, req.params.version],
      );
      if (!updated.rowCount) { const error = new Error('Non-empty building version not found'); error.status = 409; throw error; }
      await audit(client, req, 'index.build.ready', 'index_version', `${req.params.collectionKey}:${req.params.version}`, { documentCount: updated.rows[0].document_count });
      return updated.rows[0];
    });
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/query', async (req, res, next) => {
  try {
    const principals = Array.isArray(req.user.principals) ? req.user.principals.map(String) : [`user:${req.user.id}`, `role:${req.user.role}`];
    const result = await searchTenant({ tenantId: req.user.tenantId, actorId: req.user.id, principals, query: req.body?.query, collectionKey: req.body?.collectionKey || 'default', topK: req.body?.topK });
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/feedback', async (req, res, next) => {
  try {
    const allowed = ['relevant', 'irrelevant', 'clicked', 'dismissed'];
    if (!allowed.includes(req.body?.judgment)) return res.status(400).json({ error: 'Invalid judgment' });
    const principals = Array.isArray(req.user.principals) ? req.user.principals.map(String) : [`user:${req.user.id}`, `role:${req.user.role}`];
    const accepted = await inTransaction(async (client) => {
      const document = await client.query(
        `SELECT id FROM indexed_documents WHERE id=$1 AND tenant_id=$2 AND deleted_at IS NULL AND allowed_principals ?| $3::text[]`,
        [req.body.documentId, req.user.tenantId, principals],
      );
      if (!document.rowCount) { const error = new Error('Document not found'); error.status = 404; throw error; }
      await client.query(
        `INSERT INTO search_feedback(tenant_id,query_id,document_id,actor_id,judgment)
         VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
        [req.user.tenantId, String(req.body.queryId), req.body.documentId, String(req.user.id), req.body.judgment],
      );
      await audit(client, req, 'search.feedback', 'document', req.body.documentId, { queryId: String(req.body.queryId), judgment: req.body.judgment });
      return true;
    });
    res.status(202).json({ accepted });
  } catch (error) { next(error); }
});

router.post('/benchmarks', async (req, res, next) => {
  if (!requireRole(req, res, ['evaluator', 'index_admin', 'admin'])) return;
  try {
    const cases = (req.body?.cases || []).map((item) => ({
      id: String(item.id || ''), query: String(item.query ?? ''), relevantIds: item.relevantIds || [],
      locale: String(item.locale || 'und'), category: item.category,
      minPrecision: Number(item.minPrecision), minRecall: Number(item.minRecall), maxLatencyMs: Number(item.maxLatencyMs),
    }));
    domain.validateBenchmark(cases);
    const suiteKey = String(req.body?.suiteKey || '');
    const datasetVersion = String(req.body?.datasetVersion || '');
    if (!/^[a-zA-Z0-9._-]{1,80}$/.test(suiteKey) || !/^[a-zA-Z0-9._-]{1,80}$/.test(datasetVersion)) return res.status(400).json({ error: 'Invalid suite or dataset version' });
    const result = await inTransaction(async (client) => {
      const id = crypto.randomUUID();
      const datasetDigest = domain.digest(cases);
      await client.query(
        `INSERT INTO discovery_benchmark_suites(id,tenant_id,suite_key,dataset_version,description,created_by,dataset_digest)
         VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [id, req.user.tenantId, suiteKey, datasetVersion, req.body?.description || null, String(req.user.id), datasetDigest],
      );
      for (const item of cases) await client.query(
        `INSERT INTO discovery_benchmark_cases(id,suite_id,locale,category,query_text,relevant_external_ids,min_precision,min_recall,max_latency_ms)
         VALUES($1,$2,$3,$4,$5,$6::text[],$7,$8,$9)`,
        [item.id, id, item.locale, item.category, item.query, item.relevantIds.map(String), item.minPrecision, item.minRecall, item.maxLatencyMs],
      );
      await audit(client, req, 'benchmark.created', 'benchmark_suite', id, { suiteKey, datasetVersion, datasetDigest });
      return { id, suiteKey, datasetVersion, datasetDigest, caseCount: cases.length };
    });
    res.status(201).json(result);
  } catch (error) { next(error); }
});

router.post('/benchmarks/:suiteId/run', async (req, res, next) => {
  if (!requireRole(req, res, ['evaluator', 'index_admin', 'admin'])) return;
  try {
    const suite = await pool.query(
      `SELECT s.*,json_agg(json_build_object('id',c.id,'query',c.query_text,'relevantIds',c.relevant_external_ids,
             'locale',c.locale,'category',c.category,'minPrecision',c.min_precision,'minRecall',c.min_recall,'maxLatencyMs',c.max_latency_ms) ORDER BY c.id) AS cases
         FROM discovery_benchmark_suites s JOIN discovery_benchmark_cases c ON c.suite_id=s.id
        WHERE s.id=$1 AND s.tenant_id=$2 GROUP BY s.id`,
      [req.params.suiteId, req.user.tenantId],
    );
    if (!suite.rowCount) return res.status(404).json({ error: 'Benchmark suite not found' });
    const collectionKey = String(req.body?.collectionKey || 'default');
    const active = await pool.query('SELECT active_version FROM index_aliases WHERE tenant_id=$1 AND collection_key=$2', [req.user.tenantId, collectionKey]);
    const indexVersion = String(req.body?.indexVersion || active.rows[0]?.active_version || '');
    const version = await pool.query('SELECT 1 FROM index_versions WHERE tenant_id=$1 AND collection_key=$2 AND version=$3 AND state IN(\'ready\',\'active\')', [req.user.tenantId, collectionKey, indexVersion]);
    if (!version.rowCount) return res.status(409).json({ error: 'Benchmark target version is not ready' });
    const principals = Array.isArray(req.user.principals) ? req.user.principals.map(String) : [`user:${req.user.id}`, `role:${req.user.role}`];
    const results = [];
    for (const item of suite.rows[0].cases) {
      const found = await searchTenant({ tenantId: req.user.tenantId, actorId: req.user.id, principals, query: item.query, collectionKey, topK: req.body?.topK || 10, indexVersion });
      results.push(domain.evaluate(item, found.results.map((result) => result.externalId), found.latencyMs));
    }
    const aggregate = domain.aggregateEvaluation(results);
    const run = await inTransaction(async (client) => {
      const id = crypto.randomUUID();
      await client.query(
        `INSERT INTO discovery_benchmark_runs(id,tenant_id,suite_id,collection_key,index_version,result_digest,precision,recall,latency_p95_ms,passed,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [id, req.user.tenantId, req.params.suiteId, collectionKey, indexVersion, aggregate.resultDigest, aggregate.precision, aggregate.recall, aggregate.latencyP95Ms, aggregate.passed, String(req.user.id)],
      );
      for (const result of results) await client.query(
        `INSERT INTO discovery_benchmark_results(run_id,case_id,returned_external_ids,precision,recall,latency_ms,passed)
         VALUES($1,$2,$3::text[],$4,$5,$6,$7)`,
        [id, result.caseId, result.resultIds || [], result.precision, result.recall, result.latencyMs, result.passed],
      );
      if (aggregate.passed) await client.query('UPDATE index_versions SET benchmark_passed=TRUE,benchmark_report=$1::jsonb WHERE tenant_id=$2 AND collection_key=$3 AND version=$4', [JSON.stringify(aggregate), req.user.tenantId, collectionKey, indexVersion]);
      await audit(client, req, 'benchmark.completed', 'benchmark_run', id, { indexVersion, ...aggregate });
      return { id, indexVersion, ...aggregate, results };
    });
    res.status(201).json(run);
  } catch (error) { next(error); }
});

router.post('/collections/:collectionKey/promote', async (req, res, next) => {
  if (!requireRole(req, res, ['index_admin', 'admin'])) return;
  try {
    const result = await inTransaction(async (client) => {
      const version = await client.query(
        `SELECT v.*,a.active_version FROM index_versions v LEFT JOIN index_aliases a USING(tenant_id,collection_key)
          WHERE v.tenant_id=$1 AND v.collection_key=$2 AND v.version=$3 FOR UPDATE OF v`,
        [req.user.tenantId, req.params.collectionKey, req.body?.version],
      );
      if (!version.rowCount || !version.rows[0].benchmark_passed) { const error = new Error('Ready version with a passing benchmark is required'); error.status = 409; throw error; }
      const change = domain.promoteVersion({ ...version.rows[0], activeVersion: version.rows[0].active_version }, { roles: [req.user.role] }, Number(req.body?.healthyNodes), Number(req.body?.minHealthyNodes || 2));
      await client.query("UPDATE index_versions SET state='retired' WHERE tenant_id=$1 AND collection_key=$2 AND state='active'", [req.user.tenantId, req.params.collectionKey]);
      await client.query("UPDATE index_versions SET state='active' WHERE tenant_id=$1 AND collection_key=$2 AND version=$3", [req.user.tenantId, req.params.collectionKey, change.to]);
      await client.query(
        `INSERT INTO index_aliases(tenant_id,collection_key,active_version,previous_version) VALUES($1,$2,$3,$4)
         ON CONFLICT(tenant_id,collection_key) DO UPDATE SET previous_version=index_aliases.active_version,active_version=EXCLUDED.active_version,generation=index_aliases.generation+1,switched_at=NOW()`,
        [req.user.tenantId, req.params.collectionKey, change.to, change.rollbackTo || null],
      );
      await audit(client, req, 'index.promoted', 'index_version', `${req.params.collectionKey}:${change.to}`, change);
      return change;
    });
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/collections/:collectionKey/rollback', async (req, res, next) => {
  if (!requireRole(req, res, ['index_admin', 'admin'])) return;
  try {
    const result = await inTransaction(async (client) => {
      const alias = await client.query('SELECT * FROM index_aliases WHERE tenant_id=$1 AND collection_key=$2 FOR UPDATE', [req.user.tenantId, req.params.collectionKey]);
      if (!alias.rows[0]?.previous_version) { const error = new Error('No rollback version is available'); error.status = 409; throw error; }
      const from = alias.rows[0].active_version;
      const to = alias.rows[0].previous_version;
      await client.query("UPDATE index_versions SET state=CASE WHEN version=$3 THEN 'active' WHEN version=$4 THEN 'retired' ELSE state END WHERE tenant_id=$1 AND collection_key=$2", [req.user.tenantId, req.params.collectionKey, to, from]);
      await client.query('UPDATE index_aliases SET active_version=$3,previous_version=$4,generation=generation+1,switched_at=NOW() WHERE tenant_id=$1 AND collection_key=$2', [req.user.tenantId, req.params.collectionKey, to, from]);
      await audit(client, req, 'index.rolled_back', 'index_version', `${req.params.collectionKey}:${to}`, { from, to });
      return { from, to, strategy: 'atomic_alias_swap' };
    });
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/collections/:collectionKey/recovery-plans', async (req, res, next) => {
  if (!requireRole(req, res, ['index_admin', 'admin'])) return;
  try {
    const targetVersion = String(req.body?.targetVersion || '');
    if (!/^[a-zA-Z0-9._-]{1,80}$/.test(targetVersion)) return res.status(400).json({ error: 'Invalid targetVersion' });
    const result = await inTransaction(async (client) => {
      await client.query(
        `INSERT INTO index_versions(tenant_id,collection_key,version,state,schema_digest)
         VALUES($1,$2,$3,'building',$4)`,
        [req.user.tenantId, req.params.collectionKey, targetVersion, domain.digest(req.body?.schema || {})],
      );
      const sources = await client.query('SELECT id,checkpoint FROM discovery_sources WHERE tenant_id=$1 AND collection_key=$2 AND enabled ORDER BY id', [req.user.tenantId, req.params.collectionKey]);
      const manifestId = crypto.randomUUID();
      const checkpoints = Object.fromEntries(sources.rows.map((source) => [source.id, source.checkpoint]));
      await client.query(
        `INSERT INTO discovery_recovery_manifests(id,tenant_id,collection_key,requested_by,source_checkpoints,target_version)
         VALUES($1,$2,$3,$4,$5::jsonb,$6)`,
        [manifestId, req.user.tenantId, req.params.collectionKey, String(req.user.id), JSON.stringify(checkpoints), targetVersion],
      );
      for (const source of sources.rows) {
        const latest = await client.query(
          `SELECT request_payload FROM ingestion_jobs WHERE tenant_id=$1 AND source_id=$2 AND state='succeeded' ORDER BY completed_at DESC LIMIT 1`,
          [req.user.tenantId, source.id],
        );
        if (!latest.rowCount) continue;
        const payload = { ...latest.rows[0].request_payload, version: targetVersion, fullSnapshot: true };
        await client.query(
          `INSERT INTO ingestion_jobs(id,tenant_id,source_id,idempotency_key,request_digest,checkpoint_from,checkpoint_to,target_version,request_payload)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
          [crypto.randomUUID(), req.user.tenantId, source.id, `recovery:${manifestId}:${source.id}`, domain.digest(payload), source.checkpoint, source.checkpoint, targetVersion, JSON.stringify(payload)],
        );
      }
      await audit(client, req, 'recovery.planned', 'recovery_manifest', manifestId, { collectionKey: req.params.collectionKey, targetVersion, sourceCount: sources.rowCount });
      return { id: manifestId, targetVersion, sourceCheckpoints: checkpoints, replayJobs: sources.rowCount };
    });
    res.status(202).json(result);
  } catch (error) { next(error); }
});

router.get('/monitoring', async (req, res, next) => {
  try {
    const metrics = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM ingestion_jobs WHERE tenant_id=$1 AND state IN('pending','retry')) AS queue_depth,
        (SELECT COUNT(*)::int FROM ingestion_jobs WHERE tenant_id=$1 AND state='dead_letter') AS dead_letters,
        (SELECT COALESCE(EXTRACT(EPOCH FROM (NOW()-MIN(created_at))),0)::bigint FROM ingestion_jobs WHERE tenant_id=$1 AND state IN('pending','retry')) AS oldest_job_seconds,
        (SELECT COUNT(*)::bigint FROM indexed_documents WHERE tenant_id=$1 AND deleted_at IS NULL) AS active_documents,
        (SELECT COUNT(*)::int FROM discovery_sources WHERE tenant_id=$1 AND (last_success_at IS NULL OR last_success_at<NOW()-INTERVAL '24 hours')) AS stale_sources`,
      [req.user.tenantId],
    );
    const versions = await pool.query('SELECT collection_key,active_version,previous_version,generation,switched_at FROM index_aliases WHERE tenant_id=$1 ORDER BY collection_key', [req.user.tenantId]);
    const capacity = await pool.query(
      `SELECT s.id,s.source_key,s.capacity_document_limit,s.capacity_byte_limit,
              COUNT(d.id) FILTER (WHERE d.deleted_at IS NULL)::bigint AS documents,
              COALESCE(SUM(d.byte_size) FILTER (WHERE d.deleted_at IS NULL),0)::bigint AS bytes
         FROM discovery_sources s LEFT JOIN indexed_documents d ON d.source_id=s.id
        WHERE s.tenant_id=$1 GROUP BY s.id ORDER BY s.source_key`,
      [req.user.tenantId],
    );
    res.json({ ...metrics.rows[0], aliases: versions.rows, source_capacity: capacity.rows });
  } catch (error) { next(error); }
});

module.exports = router;
