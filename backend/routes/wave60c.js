"use strict";
const express = require("express");
const pool = require("../db");
const verifyToken = require("../middleware/auth");
const { analyzeFallback, fallbackKinds, filterRecords, parseTaskInput, toCSV } = require("../wave60cCore.cjs");

const router = express.Router();
router.use(verifyToken);

router.get("/tasks", async (req, res, next) => {
  try {
    const rows = (await pool.query("SELECT * FROM staff_tasks ORDER BY due_at ASC NULLS LAST, created_at DESC LIMIT 200")).rows;
    const items = filterRecords(rows, { q: req.query.q, status: req.query.status });
    res.json({ tasks: items, count: items.length });
  } catch (e) { next(e); }
});
router.get("/tasks/export", async (req, res, next) => {
  try {
    const rows = (await pool.query("SELECT * FROM staff_tasks ORDER BY created_at DESC LIMIT 500")).rows;
    const items = filterRecords(rows, { q: req.query.q, status: req.query.status });
    if (String(req.query.format || "csv").toLowerCase() === "json") return res.json({ items, count: items.length });
    res.type("text/csv").set("Content-Disposition", "attachment; filename=tasks.csv").send(toCSV(items));
  } catch (e) { next(e); }
});
router.post("/tasks", async (req, res, next) => {
  try {
    const parsed = parseTaskInput(req.body || {});
    if (parsed.error) return res.status(422).json({ error: parsed.error });
    const created = await pool.query(
      "INSERT INTO staff_tasks(title,description,priority,status,created_by) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [parsed.title, parsed.description, parsed.priority, parsed.status, req.user.id]);
    res.status(201).json({ task: created.rows[0] });
  } catch (e) { next(e); }
});
router.patch("/tasks/:id", async (req, res, next) => {
  try {
    const existing = (await pool.query("SELECT * FROM staff_tasks WHERE id=$1", [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ error: "Task not found" });
    const status = req.body?.status === undefined ? existing.status : (["OPEN", "DONE", "CANCELLED"].includes(req.body.status) ? req.body.status : null);
    if (!status) return res.status(422).json({ error: "status must be OPEN, DONE, or CANCELLED" });
    const updated = await pool.query(
      "UPDATE staff_tasks SET status=$1, completed_at=$2, updated_at=NOW() WHERE id=$3 RETURNING *",
      [status, status === "DONE" ? new Date() : status ? null : existing.completed_at, req.params.id]);
    res.json({ task: updated.rows[0] });
  } catch (e) { next(e); }
});
router.post("/ai/fallback/:kind", (req, res) => {
  const result = analyzeFallback(req.params.kind, req.body?.records ?? req.body?.record ?? []);
  if (!result) return res.status(404).json({ error: "Unknown fallback analysis", kinds: fallbackKinds });
  res.json({ result });
});
module.exports = router;
