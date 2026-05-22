const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require("../middleware/auth");
const { logActivity } = require('../lib/activityLog');
router.use(verifyToken);
router.get('/', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM researchers ORDER BY h_index DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM researchers WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', async (req, res) => {
  try {
    const { name, institution, specialization, h_index, email, active_projects, publications_count, joined_date } = req.body;
    const r = await pool.query('INSERT INTO researchers (name,institution,specialization,h_index,email,active_projects,publications_count,joined_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [name,institution,specialization,h_index,email,active_projects||0,publications_count||0,joined_date]);
    await logActivity(req, 'researcher.create', 'researcher', r.rows[0].id, name);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', async (req, res) => {
  try {
    const { name, institution, specialization, h_index, email, active_projects, publications_count, joined_date } = req.body;
    const r = await pool.query('UPDATE researchers SET name=$1,institution=$2,specialization=$3,h_index=$4,email=$5,active_projects=$6,publications_count=$7,joined_date=$8 WHERE id=$9 RETURNING *', [name,institution,specialization,h_index,email,active_projects,publications_count,joined_date,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    await logActivity(req, 'researcher.update', 'researcher', r.rows[0].id, name);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM researchers WHERE id=$1', [req.params.id]);
    await logActivity(req, 'researcher.delete', 'researcher', parseInt(req.params.id, 10) || null, null);
    res.json({ success: true });
  }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
