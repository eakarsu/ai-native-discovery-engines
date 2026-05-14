const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

async function tableExists(name) {
  try {
    const r = await pool.query("SELECT to_regclass($1) AS t", [`public.${name}`]);
    return !!r.rows[0]?.t;
  } catch { return false; }
}

async function safeCount(sql, args = []) {
  try {
    const r = await pool.query(sql, args);
    return parseInt(r.rows[0]?.count || 0, 10);
  } catch { return 0; }
}

// GET /api/dashboard/stats
// Returns { counts, recent_activity } for the post-login dashboard.
router.get('/stats', async (req, res) => {
  try {
    const counts = {
      projects: await safeCount('SELECT COUNT(*)::int AS count FROM projects'),
      active_hypotheses: await safeCount("SELECT COUNT(*)::int AS count FROM hypotheses WHERE status IN ('proposed','under_test','testing','active')"),
      hypotheses_total: await safeCount('SELECT COUNT(*)::int AS count FROM hypotheses'),
      experiments: await safeCount('SELECT COUNT(*)::int AS count FROM experiments'),
      experiments_running: await safeCount("SELECT COUNT(*)::int AS count FROM experiments WHERE status IN ('running','in_progress','active')"),
      publications: await safeCount('SELECT COUNT(*)::int AS count FROM publications'),
      researchers: await safeCount('SELECT COUNT(*)::int AS count FROM researchers'),
      results: await safeCount('SELECT COUNT(*)::int AS count FROM results'),
      breakthroughs: await safeCount('SELECT COUNT(*)::int AS count FROM results WHERE breakthrough = TRUE'),
      recent_results: await safeCount("SELECT COUNT(*)::int AS count FROM results WHERE published_at >= NOW() - INTERVAL '30 days' OR id IN (SELECT id FROM results ORDER BY id DESC LIMIT 10)"),
    };

    let recent_activity = [];
    if (await tableExists('activity_log')) {
      try {
        const r = await pool.query('SELECT id, user_email, action, entity_type, entity_id, details, created_at FROM activity_log ORDER BY created_at DESC, id DESC LIMIT 10');
        recent_activity = r.rows;
      } catch { recent_activity = []; }
    }

    res.json({ counts, recent_activity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
