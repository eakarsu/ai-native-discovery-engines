'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const enabled = process.env.RUN_DB_TESTS === '1';

test('persisted ingestion, ACL query, benchmark, promotion, recovery and immutable audit', { skip: !enabled }, async (t) => {
  const jwt = require('jsonwebtoken');
  const pool = require('../db');
  const app = require('../server');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => { await new Promise((resolve) => server.close(resolve)); await pool.end(); });
  const base = `http://127.0.0.1:${server.address().port}/api/governed-discovery`;
  const token = jwt.sign(
    { id: 'admin-1', role: 'admin', tenantId: 'tenant-a', principals: ['user:admin-1', 'role:admin', 'group:a'] },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '5m' },
  );
  const call = async (path, options = {}) => {
    const response = await fetch(`${base}${path}`, {
      method: options.method || 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const body = await response.json();
    return { status: response.status, body };
  };

  const source = await call('/sources', { method: 'POST', body: {
    sourceKey: 'acceptance-source', sourceType: 'push', collectionKey: 'research', maxDocuments: 10, maxBytes: 100000,
  } });
  assert.equal(source.status, 201, JSON.stringify(source.body));
  const sourceId = source.body.id;
  assert.equal((await call('/collections/research/versions', { method: 'POST', body: { version: 'v1', schema: { tokenizer: 'simple' } } })).status, 202);

  const documents = [
    { externalId: 'doc-alpha', uri: 'https://source.test/alpha', updatedAt: '2026-07-18T00:00:00Z', title: 'Alpha study', body: 'alpha discovery evidence', locale: 'en', allowedPrincipals: ['group:a'] },
    { externalId: 'doc-private', uri: 'https://source.test/private', updatedAt: '2026-07-18T00:00:00Z', title: 'Private alpha', body: 'alpha restricted evidence', locale: 'en', allowedPrincipals: ['group:b'] },
    { externalId: 'doc-obsolete', uri: 'https://source.test/obsolete', updatedAt: '2026-07-18T00:00:00Z', title: 'Obsolete', body: 'obsolete text', locale: 'en', allowedPrincipals: ['group:a'] },
  ];
  const first = await call(`/sources/${sourceId}/jobs`, { method: 'POST', headers: { 'Idempotency-Key': 'acceptance-ingestion-1' }, body: { version: 'v1', checkpointTo: 'page-1', documents } });
  assert.equal(first.status, 202, JSON.stringify(first.body));
  assert.equal((await call(`/jobs/${first.body.id}/apply`, { method: 'POST', body: {} })).status, 200);
  const duplicate = await call(`/sources/${sourceId}/jobs`, { method: 'POST', headers: { 'Idempotency-Key': 'acceptance-ingestion-1' }, body: { version: 'v1', checkpointTo: 'page-1', documents } });
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.body.duplicate, true);
  const conflict = await call(`/sources/${sourceId}/jobs`, { method: 'POST', headers: { 'Idempotency-Key': 'acceptance-ingestion-1' }, body: { version: 'v1', checkpointTo: 'different', documents } });
  assert.equal(conflict.status, 409);

  const snapshotDocuments = documents.slice(0, 2).map((document) => document.externalId === 'doc-alpha' ? { ...document, body: 'alpha discovery evidence revised' } : document);
  const snapshot = await call(`/sources/${sourceId}/jobs`, { method: 'POST', headers: { 'Idempotency-Key': 'acceptance-ingestion-2' }, body: { version: 'v1', checkpointTo: 'page-2', fullSnapshot: true, documents: snapshotDocuments } });
  assert.equal(snapshot.status, 202);
  const appliedSnapshot = await call(`/jobs/${snapshot.body.id}/apply`, { method: 'POST', body: {} });
  assert.equal(appliedSnapshot.body.stats.propagatedDeletes, 1);
  assert.equal((await call('/collections/research/versions/v1/ready', { method: 'POST', body: {} })).status, 200);

  const suite = await call('/benchmarks', { method: 'POST', body: {
    suiteKey: 'acceptance', datasetVersion: '2026-07-19', cases: [
      { id: 'normal-en', query: 'alpha', relevantIds: ['doc-alpha'], locale: 'en', category: 'normal', minPrecision: 1, minRecall: 1, maxLatencyMs: 2000 },
      { id: 'empty-en', query: '', relevantIds: [], locale: 'en', category: 'empty', minPrecision: 0, minRecall: 1, maxLatencyMs: 2000 },
      { id: 'attack-es', query: "' OR 1=1 --", relevantIds: [], locale: 'es', category: 'adversarial', minPrecision: 0, minRecall: 1, maxLatencyMs: 2000 },
    ],
  } });
  assert.equal(suite.status, 201, JSON.stringify(suite.body));
  const benchmark = await call(`/benchmarks/${suite.body.id}/run`, { method: 'POST', body: { collectionKey: 'research', indexVersion: 'v1' } });
  assert.equal(benchmark.status, 201, JSON.stringify(benchmark.body));
  assert.equal(benchmark.body.passed, true);
  const promoted = await call('/collections/research/promote', { method: 'POST', body: { version: 'v1', healthyNodes: 2 } });
  assert.equal(promoted.status, 200, JSON.stringify(promoted.body));

  const query = await call('/query', { method: 'POST', body: { collectionKey: 'research', query: 'alpha' } });
  assert.equal(query.status, 200);
  assert.deepEqual(query.body.results.map((result) => result.externalId), ['doc-alpha']);
  assert.equal(query.body.results[0].provenance.indexVersion, 'v1');
  assert.ok(query.body.results[0].ranking.length >= 4);
  assert.equal((await call('/feedback', { method: 'POST', body: { queryId: query.body.queryId, documentId: query.body.results[0].id, judgment: 'relevant' } })).status, 202);

  const recovery = await call('/collections/research/recovery-plans', { method: 'POST', body: { targetVersion: 'v2', schema: { tokenizer: 'simple' } } });
  assert.equal(recovery.status, 202, JSON.stringify(recovery.body));
  assert.equal(recovery.body.replayJobs, 1);
  const monitoring = await call('/monitoring');
  assert.equal(monitoring.status, 200);
  assert.equal(monitoring.body.aliases[0].active_version, 'v1');

  await assert.rejects(
    pool.query("UPDATE discovery_audit_events SET actor_id='tampered' WHERE tenant_id='tenant-a'"),
    /append-only/,
  );
});
