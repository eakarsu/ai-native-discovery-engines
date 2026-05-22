const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require("../middleware/auth");
const { logActivity } = require('../lib/activityLog');
router.use(verifyToken);
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`SELECT pub.*, p.name as project_name FROM publications pub LEFT JOIN projects p ON pub.project_id = p.id ORDER BY pub.submitted_at DESC NULLS LAST`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`SELECT pub.*, p.name as project_name FROM publications pub LEFT JOIN projects p ON pub.project_id = p.id WHERE pub.id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', async (req, res) => {
  try {
    const { project_id, title, journal, status, impact_factor, submitted_at, accepted_at, authors } = req.body;
    const r = await pool.query('INSERT INTO publications (project_id,title,journal,status,impact_factor,submitted_at,accepted_at,authors) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [project_id,title,journal,status||'draft',impact_factor,submitted_at,accepted_at,authors]);
    await logActivity(req, 'publication.create', 'publication', r.rows[0].id, title);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', async (req, res) => {
  try {
    const { project_id, title, journal, status, impact_factor, submitted_at, accepted_at, authors } = req.body;
    const r = await pool.query('UPDATE publications SET project_id=$1,title=$2,journal=$3,status=$4,impact_factor=$5,submitted_at=$6,accepted_at=$7,authors=$8 WHERE id=$9 RETURNING *', [project_id,title,journal,status,impact_factor,submitted_at,accepted_at,authors,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    await logActivity(req, 'publication.update', 'publication', r.rows[0].id, title);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM publications WHERE id=$1', [req.params.id]);
    await logActivity(req, 'publication.delete', 'publication', parseInt(req.params.id, 10) || null, null);
    res.json({ success: true });
  }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
