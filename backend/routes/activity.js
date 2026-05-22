const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

async function tableExists() {
  try {
    const r = await pool.query("SELECT to_regclass('public.activity_log') AS t");
    return !!r.rows[0]?.t;
  } catch { return false; }
}

router.get('/', async (req, res) => {
  try {
    if (!(await tableExists())) {
      res.set('X-Total-Count', '0');
      return res.json([]);
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const action = req.query.action;
    const entity_type = req.query.entity_type;
    const paginated = req.query.paginated === '1' || req.query.paginated === 'true';
    const conds = [];
    const args = [];
    if (action) { args.push(`%${action}%`); conds.push(`action ILIKE $${args.length}`); }
    if (entity_type) { args.push(entity_type); conds.push(`entity_type = $${args.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    // total count for pagination
    const countRes = await pool.query(`SELECT COUNT(*)::int AS c FROM activity_log ${where}`, args);
    const total = countRes.rows[0]?.c || 0;

    args.push(limit);
    args.push(offset);
    const r = await pool.query(
      `SELECT * FROM activity_log ${where} ORDER BY created_at DESC, id DESC LIMIT $${args.length - 1} OFFSET $${args.length}`,
      args
    );
    res.set('X-Total-Count', String(total));
    if (paginated) {
      return res.json({ items: r.rows, total, limit, offset });
    }
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (!(await tableExists())) return res.status(503).json({ error: 'activity_log table not available' });
    const { action, entity_type, entity_id, details } = req.body;
    if (!action) return res.status(400).json({ error: 'action is required' });
    const r = await pool.query(
      'INSERT INTO activity_log (user_id, user_email, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user?.id || null, req.user?.email || null, action, entity_type || null, entity_id || null, details || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
