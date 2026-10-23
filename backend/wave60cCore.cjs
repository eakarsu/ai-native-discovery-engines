"use strict";
// Wave 60C pure helpers — deterministic offline fallbacks, no provider calls.
function showValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
function filterRecords(rows, { q = "", status = "" } = {}) {
  const needle = String(q || "").trim().toLowerCase();
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (status && String(row?.status ?? "") !== status) return false;
    if (!needle) return true;
    return Object.values(row || {}).some((v) => showValue(v).toLowerCase().includes(needle));
  });
}
function toCSV(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const keys = [];
  for (const row of list) for (const key of Object.keys(row || {})) if (!keys.includes(key)) keys.push(key);
  const cell = (v) => { const s = showValue(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [keys.join(","), ...list.map((row) => keys.map((k) => cell(row?.[k])).join(","))].join("\n") + "\n";
}
function fallbackEnvelope(kind, sections, extra = {}) {
  return { aiGenerated: false, source: "deterministic-fallback", label: "Deterministic offline fallback — not AI-generated", kind, sections, ...extra };
}
function num(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function parseTaskInput(body = {}) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return { error: "title is required" };
  const status = ["OPEN", "DONE", "CANCELLED"].includes(body.status) ? body.status : "OPEN";
  const priority = ["LOW", "HIGH"].includes(body.priority) ? body.priority : "NORMAL";
  return { title: title.slice(0, 200), description: typeof body.description === "string" ? body.description.slice(0, 2000) : null, status, priority };
}
function analyze_discovery_gap_scan(rows) {
  const open = rows.filter((r) => !["DONE", "Closed", "completed"].includes(String(r?.status ?? ""))).length;
  const total = rows.reduce((s, r) => s + num(r?.amount_usd ?? r?.amount), 0);
  return fallbackEnvelope("discovery-gap-scan", [
    { title: "Discovery gap scan — scope", detail: `${rows.length} record(s) reviewed; ${open} still open. Recorded total $${total} (zero amounts are preserved, not hidden).` },
    { title: "Discovery gap scan — finding", detail: `${open} record(s) remain open; check hypotheses without linked experiments or results first.` },
    { title: "Discovery gap scan — next step", detail: "Assign an accountable owner, attach source evidence, and re-run this check after updating the record." },
  ], { recordsReviewed: rows.length, openCount: open, totalAmount: total });
}
function analyze_source_freshness_check(rows) {
  const open = rows.filter((r) => !["DONE", "Closed", "completed"].includes(String(r?.status ?? ""))).length;
  const total = rows.reduce((s, r) => s + num(r?.amount_usd ?? r?.amount), 0);
  return fallbackEnvelope("source-freshness-check", [
    { title: "Source freshness check — scope", detail: `${rows.length} record(s) reviewed; ${open} still open. Recorded total $${total} (zero amounts are preserved, not hidden).` },
    { title: "Source freshness check — finding", detail: `Review open discovery sources for stale crawls before the next governed query run.` },
    { title: "Source freshness check — next step", detail: "Assign an accountable owner, attach source evidence, and re-run this check after updating the record." },
  ], { recordsReviewed: rows.length, openCount: open, totalAmount: total });
}
function analyze_result_quality_summary(rows) {
  const open = rows.filter((r) => !["DONE", "Closed", "completed"].includes(String(r?.status ?? ""))).length;
  const total = rows.reduce((s, r) => s + num(r?.amount_usd ?? r?.amount), 0);
  return fallbackEnvelope("result-quality-summary", [
    { title: "Result quality summary — scope", detail: `${rows.length} record(s) reviewed; ${open} still open. Recorded total $${total} (zero amounts are preserved, not hidden).` },
    { title: "Result quality summary — finding", detail: `${rows.length} result record(s) totalling $${total}; flag low-confidence results for replication review.` },
    { title: "Result quality summary — next step", detail: "Assign an accountable owner, attach source evidence, and re-run this check after updating the record." },
  ], { recordsReviewed: rows.length, openCount: open, totalAmount: total });
}
const ANALYZERS = { "discovery-gap-scan": analyze_discovery_gap_scan, "source-freshness-check": analyze_source_freshness_check, "result-quality-summary": analyze_result_quality_summary };
const fallbackKinds = ["discovery-gap-scan", "source-freshness-check", "result-quality-summary"];
function analyzeFallback(kind, records) {
  const fn = ANALYZERS[kind];
  return fn ? fn(Array.isArray(records) ? records : records ? [records] : []) : null;
}
module.exports = { showValue, filterRecords, toCSV, fallbackEnvelope, parseTaskInput, analyzeFallback, fallbackKinds };
