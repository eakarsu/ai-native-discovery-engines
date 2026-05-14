const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/auth');
router.use(verifyToken);
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`SELECT e.*, h.statement as hypothesis_statement FROM experiments e LEFT JOIN hypotheses h ON e.hypothesis_id = h.id ORDER BY e.started_at DESC NULLS LAST`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`SELECT e.*, h.statement as hypothesis_statement FROM experiments e LEFT JOIN hypotheses h ON e.hypothesis_id = h.id WHERE e.id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', async (req, res) => {
  try {
    const { hypothesis_id, title, design, methodology, status, started_at, completed_at, result_summary } = req.body;
    const r = await pool.query('INSERT INTO experiments (hypothesis_id,title,design,methodology,status,started_at,completed_at,result_summary) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [hypothesis_id,title,design,methodology,status||'designed',started_at,completed_at,result_summary]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', async (req, res) => {
  try {
    const { hypothesis_id, title, design, methodology, status, started_at, completed_at, result_summary } = req.body;
    const r = await pool.query('UPDATE experiments SET hypothesis_id=$1,title=$2,design=$3,methodology=$4,status=$5,started_at=$6,completed_at=$7,result_summary=$8 WHERE id=$9 RETURNING *', [hypothesis_id,title,design,methodology,status,started_at,completed_at,result_summary,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', async (req, res) => {
  try { await pool.query('DELETE FROM experiments WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
