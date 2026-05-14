const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');
router.use(verifyToken);
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`SELECT h.*, p.name as project_name, p.domain FROM hypotheses h LEFT JOIN projects p ON h.project_id = p.id ORDER BY h.created_at DESC`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`SELECT h.*, p.name as project_name, p.domain FROM hypotheses h LEFT JOIN projects p ON h.project_id = p.id WHERE h.id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', async (req, res) => {
  try {
    const { project_id, statement, confidence_score, status, supporting_evidence, contradicting_evidence, generated_by } = req.body;
    const r = await pool.query('INSERT INTO hypotheses (project_id,statement,confidence_score,status,supporting_evidence,contradicting_evidence,generated_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [project_id,statement,confidence_score,status,supporting_evidence,contradicting_evidence,generated_by||'human']);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', async (req, res) => {
  try {
    const { project_id, statement, confidence_score, status, supporting_evidence, contradicting_evidence, generated_by } = req.body;
    const r = await pool.query('UPDATE hypotheses SET project_id=$1,statement=$2,confidence_score=$3,status=$4,supporting_evidence=$5,contradicting_evidence=$6,generated_by=$7 WHERE id=$8 RETURNING *', [project_id,statement,confidence_score,status,supporting_evidence,contradicting_evidence,generated_by,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', async (req, res) => {
  try { await pool.query('DELETE FROM hypotheses WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
