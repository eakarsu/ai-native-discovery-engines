'use strict';
const crypto = require('crypto');

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
const digest = (value) => crypto.createHash('sha256').update(canonical(value)).digest('hex');

function normalizeDocument(document) {
  if (!document.sourceId || !document.externalId || !document.uri || !document.updatedAt) throw new Error('sourceId, externalId, uri and updatedAt are required');
  if (!Array.isArray(document.allowedPrincipals) || !document.allowedPrincipals.length) throw new Error('document ACL is required');
  if (!Number.isFinite(Date.parse(document.updatedAt))) throw new Error('updatedAt must be an ISO timestamp');
  const principals = [...new Set(document.allowedPrincipals.map(String).map((p) => p.trim()).filter(Boolean))].sort();
  if (!principals.length || principals.some((p) => p.length > 200)) throw new Error('document ACL contains an invalid principal');
  const body = String(document.body || '').replace(/\s+/g, ' ').trim();
  if (!body && !document.deleted) throw new Error('non-deleted document body is required');
  return {
    ...document,
    externalId: String(document.externalId),
    body,
    locale: String(document.locale || 'und').toLowerCase(),
    allowedPrincipals: principals,
    contentDigest: digest({ title: document.title || '', body }),
    aclDigest: digest(principals),
    deleted: Boolean(document.deleted),
  };
}

function planIncremental(current, incoming) {
  const existing = new Map(current.map((doc) => [`${doc.sourceId}:${doc.externalId}`, doc]));
  const existingContent = new Map(current.filter((doc) => doc.contentDigest && doc.aclDigest).map((doc) => [`${doc.contentDigest}:${doc.aclDigest}`, `${doc.sourceId}:${doc.externalId}`]));
  const seen = new Set();
  const seenContent = new Map();
  const actions = [];
  for (const raw of incoming) {
    const doc = normalizeDocument(raw);
    const key = `${doc.sourceId}:${doc.externalId}`;
    if (seen.has(key)) throw new Error(`duplicate external document: ${key}`);
    seen.add(key);
    if (!doc.deleted) {
      const identity = `${doc.contentDigest}:${doc.aclDigest}`;
      const duplicateKey = seenContent.get(identity) || existingContent.get(identity);
      if (duplicateKey && duplicateKey !== key) throw new Error(`duplicate document content: ${key} matches ${duplicateKey}`);
      seenContent.set(identity, key);
    }
    const old = existing.get(key);
    if (doc.deleted) actions.push({ type: 'delete', key, doc });
    else if (!old) actions.push({ type: 'insert', key, doc });
    else if (old.contentDigest !== doc.contentDigest || old.aclDigest !== doc.aclDigest) actions.push({ type: 'update', key, doc });
    else actions.push({ type: 'noop', key, doc });
  }
  return actions;
}

function validateIngestionBatch(batch, maxDocuments = 1000, maxBytes = 10_000_000) {
  if (!batch || !Array.isArray(batch.documents)) throw new Error('documents array is required');
  if (!batch.version || !/^[a-zA-Z0-9._-]{1,80}$/.test(batch.version)) throw new Error('valid index version is required');
  if (batch.documents.length > maxDocuments) throw new Error('ingestion document limit exceeded');
  const documents = batch.documents.map(normalizeDocument);
  const bytes = documents.reduce((sum, document) => sum + Buffer.byteLength(document.body || '', 'utf8'), 0);
  if (bytes > maxBytes) throw new Error('ingestion byte limit exceeded');
  return { ...batch, documents, bytes, fullSnapshot: Boolean(batch.fullSnapshot) };
}

function authorizeResults(results, principals, tenantId, now = Date.now()) {
  const granted = new Set(principals);
  return results.filter((result) => result.tenantId === tenantId && result.allowedPrincipals.some((p) => granted.has(p))).map((result) => ({
    ...result,
    provenance: { sourceId: result.sourceId, externalId: result.externalId, uri: result.uri, indexedAt: result.indexedAt, contentDigest: result.contentDigest },
    freshnessSeconds: Math.max(0, Math.floor((now - Date.parse(result.updatedAt)) / 1000)),
  }));
}

function rank(candidate, weights = { lexical: 0.45, semantic: 0.4, freshness: 0.1, feedback: 0.05 }) {
  const components = { lexical: Number(candidate.lexical || 0), semantic: Number(candidate.semantic || 0), freshness: Number(candidate.freshness || 0), feedback: Number(candidate.feedback || 0) };
  const score = Object.entries(weights).reduce((sum, [key, weight]) => sum + components[key] * weight, 0);
  return { score, explanation: Object.entries(weights).map(([key, weight]) => ({ feature: key, value: components[key], weight, contribution: components[key] * weight })) };
}

function evaluate(queryCase, resultIds, latencyMs) {
  if (!queryCase.id || !Array.isArray(queryCase.relevantIds)) throw new Error('invalid benchmark case');
  const returned = new Set(resultIds);
  const relevant = new Set(queryCase.relevantIds);
  let hits = 0;
  for (const id of returned) if (relevant.has(id)) hits += 1;
  const precision = returned.size ? hits / returned.size : 0;
  const recall = relevant.size ? hits / relevant.size : 1;
  return { caseId: queryCase.id, locale: queryCase.locale || 'und', category: queryCase.category || 'normal', resultIds: [...resultIds], precision, recall, latencyMs, passed: precision >= queryCase.minPrecision && recall >= queryCase.minRecall && latencyMs <= queryCase.maxLatencyMs };
}

function validateBenchmark(cases) {
  if (!Array.isArray(cases) || cases.length < 3) throw new Error('at least three benchmark cases are required');
  const categories = new Set(cases.map((c) => c.category));
  const locales = new Set(cases.map((c) => c.locale));
  for (const item of cases) {
    if (!item.id || typeof item.query !== 'string' || !Array.isArray(item.relevantIds)) throw new Error('invalid benchmark case');
    if (![item.minPrecision, item.minRecall].every((value) => Number.isFinite(value) && value >= 0 && value <= 1)) throw new Error('benchmark thresholds must be between zero and one');
    if (!Number.isFinite(item.maxLatencyMs) || item.maxLatencyMs <= 0) throw new Error('benchmark latency threshold is required');
  }
  for (const required of ['normal', 'empty', 'adversarial']) if (!categories.has(required)) throw new Error(`missing ${required} benchmark`);
  if (locales.size < 2) throw new Error('multilingual benchmark coverage required');
  return true;
}

function aggregateEvaluation(results) {
  if (!Array.isArray(results) || !results.length) throw new Error('benchmark results are required');
  const sortedLatency = results.map((result) => result.latencyMs).sort((a, b) => a - b);
  const p95Index = Math.min(sortedLatency.length - 1, Math.ceil(sortedLatency.length * 0.95) - 1);
  return {
    precision: results.reduce((sum, result) => sum + result.precision, 0) / results.length,
    recall: results.reduce((sum, result) => sum + result.recall, 0) / results.length,
    latencyP95Ms: sortedLatency[p95Index],
    passed: results.every((result) => result.passed),
    resultDigest: digest(results),
  };
}

function promoteVersion(version, actor, healthyNodes, minHealthyNodes = 2) {
  if (!version || version.state !== 'ready') throw new Error('index version is not ready');
  if (!actor?.roles?.some((role) => ['index_admin', 'admin'].includes(role))) throw new Error('index_admin role required');
  if (healthyNodes < minHealthyNodes) throw new Error('insufficient healthy capacity');
  return { from: version.activeVersion, to: version.version, strategy: 'atomic_alias_swap', rollbackTo: version.activeVersion };
}

function capacityDecision(stats, limits) {
  const reasons = [];
  if (stats.documents + stats.incomingDocuments > limits.maxDocuments) reasons.push('document capacity');
  if (stats.bytes + stats.incomingBytes > limits.maxBytes) reasons.push('storage capacity');
  if (stats.queueDepth >= limits.maxQueueDepth) reasons.push('queue capacity');
  return { accepted: reasons.length === 0, reasons };
}

function retry(attempts, retryable, maxAttempts = 5) {
  const next = attempts + 1;
  return !retryable || next >= maxAttempts ? { status: 'dead_letter', attempts: next } : { status: 'retry', attempts: next, delaySeconds: Math.min(900, 2 ** next) };
}

function assertSafeConfigRef(value) {
  if (!/^(env|vault|secret):[a-zA-Z0-9_./-]{1,200}$/.test(String(value || ''))) throw new Error('connector config must be a secret reference');
  return value;
}

module.exports = { canonical, digest, normalizeDocument, planIncremental, validateIngestionBatch, authorizeResults, rank, evaluate, validateBenchmark, aggregateEvaluation, promoteVersion, capacityDecision, retry, assertSafeConfigRef };
