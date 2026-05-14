const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');
router.use(verifyToken);
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`SELECT r.*, e.title as experiment_title FROM results r LEFT JOIN experiments e ON r.experiment_id = e.id ORDER BY r.id DESC`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`SELECT r.*, e.title as experiment_title FROM results r LEFT JOIN experiments e ON r.experiment_id = e.id WHERE r.id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', async (req, res) => {
  try {
    const { experiment_id, outcome, significance_pct, breakthrough, data_summary, conclusion, published, published_at } = req.body;
    const r = await pool.query('INSERT INTO results (experiment_id,outcome,significance_pct,breakthrough,data_summary,conclusion,published,published_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [experiment_id,outcome,significance_pct,breakthrough||false,data_summary,conclusion,published||false,published_at]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', async (req, res) => {
  try {
    const { experiment_id, outcome, significance_pct, breakthrough, data_summary, conclusion, published, published_at } = req.body;
    const r = await pool.query('UPDATE results SET experiment_id=$1,outcome=$2,significance_pct=$3,breakthrough=$4,data_summary=$5,conclusion=$6,published=$7,published_at=$8 WHERE id=$9 RETURNING *', [experiment_id,outcome,significance_pct,breakthrough,data_summary,conclusion,published,published_at,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', async (req, res) => {
  try { await pool.query('DELETE FROM results WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
