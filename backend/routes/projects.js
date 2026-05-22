const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require("../middleware/auth");
const { logActivity } = require('../lib/activityLog');
router.use(verifyToken);
router.get('/', async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM projects ORDER BY start_date DESC')).rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', async (req, res) => {
  try {
    const { name, domain, goal, status, lead_researcher, start_date, iteration_count, breakthrough_count } = req.body;
    const r = await pool.query('INSERT INTO projects (name,domain,goal,status,lead_researcher,start_date,iteration_count,breakthrough_count) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [name,domain,goal,status,lead_researcher,start_date,iteration_count||0,breakthrough_count||0]);
    await logActivity(req, 'project.create', 'project', r.rows[0].id, name);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', async (req, res) => {
  try {
    const { name, domain, goal, status, lead_researcher, start_date, iteration_count, breakthrough_count } = req.body;
    const r = await pool.query('UPDATE projects SET name=$1,domain=$2,goal=$3,status=$4,lead_researcher=$5,start_date=$6,iteration_count=$7,breakthrough_count=$8 WHERE id=$9 RETURNING *', [name,domain,goal,status,lead_researcher,start_date,iteration_count,breakthrough_count,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    await logActivity(req, 'project.update', 'project', r.rows[0].id, name);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
    await logActivity(req, 'project.delete', 'project', parseInt(req.params.id, 10) || null, null);
    res.json({ success: true });
  }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
