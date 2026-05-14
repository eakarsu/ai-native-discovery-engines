const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows, columns) {
  const header = columns.join(',');
  const body = rows.map(r => columns.map(c => csvCell(r[c])).join(',')).join('\n');
  return header + '\n' + body + (body ? '\n' : '');
}

router.get('/projects.csv', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM projects ORDER BY id ASC');
    const cols = ['id', 'name', 'domain', 'goal', 'status', 'lead_researcher', 'start_date', 'iteration_count', 'breakthrough_count'];
    const csv = rowsToCsv(r.rows, cols);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="projects.csv"');
    res.send(csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/publications.csv', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM publications ORDER BY id ASC');
    const cols = ['id', 'project_id', 'title', 'journal', 'status', 'impact_factor', 'submitted_at', 'accepted_at', 'authors'];
    const csv = rowsToCsv(r.rows, cols);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="publications.csv"');
    res.send(csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
