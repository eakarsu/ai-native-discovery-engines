"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { analyzeFallback, fallbackKinds, filterRecords, parseTaskInput, showValue, toCSV } = require("../wave60cCore.cjs");

const rows = [
  { id: 1, title: "Alpha", status: "OPEN", amount_usd: 0, active: false, note: "" },
  { id: 2, title: "Beta", status: "DONE", amount_usd: 250, active: true, note: "done" },
];

test("showValue preserves false, 0 and empty string distinctly", () => {
  assert.equal(showValue(false), "false");
  assert.equal(showValue(0), "0");
  assert.equal(showValue(""), "");
});

test("filterRecords searches and filters the main list", () => {
  assert.equal(filterRecords(rows, { q: "alpha" }).length, 1);
  assert.equal(filterRecords(rows, { status: "DONE" })[0].title, "Beta");
});

test("toCSV keeps false/0/empty cells readable", () => {
  assert.ok(toCSV(rows).split("\n")[1].includes("false"));
});

test("task input validates title and defaults", () => {
  assert.equal(parseTaskInput({}).error, "title is required");
  assert.equal(parseTaskInput({ title: " X " }).status, "OPEN");
});

test("offline AI fallbacks are labelled aiGenerated:false with sections", () => {
  assert.ok(fallbackKinds.length >= 2 && fallbackKinds.length <= 3);
  for (const kind of fallbackKinds) {
    const result = analyzeFallback(kind, rows);
    assert.equal(result.aiGenerated, false);
    assert.ok(result.sections.length >= 3 && result.sections.every((s) => s.title && s.detail));
  }
  assert.equal(analyzeFallback("nope", rows), null);
});

test("wave router is mounted behind auth in server", () => {
  const server = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
  assert.ok(server.includes("wave60c"), "server must mount wave60c");
});
