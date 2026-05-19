const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

// Cross-entity search with optional filters.
// Query params:
//   q          : free-text query (case-insensitive partial match)
//   entity     : optional one of projects|hypotheses|experiments|results|publications|researchers
//   status     : optional status filter (where applicable)
//   domain     : optional project domain filter
//   limit      : per-entity result cap (default 25, max 100)
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const entity = (req.query.entity || '').toString().trim();
    const status = (req.query.status || '').toString().trim();
    const domain = (req.query.domain || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const like = `%${q}%`;

    const out = {};

    const wantAll = !entity;
    const want = (e) => wantAll || entity === e;

    if (want('projects')) {
      const args = [like];
      const conds = ['(name ILIKE $1 OR goal ILIKE $1 OR lead_researcher ILIKE $1 OR domain ILIKE $1)'];
      if (status) { args.push(status); conds.push(`status = $${args.length}`); }
      if (domain) { args.push(domain); conds.push(`domain = $${args.length}`); }
      args.push(limit);
      const r = await pool.query(`SELECT id,name,domain,goal,status,lead_researcher FROM projects WHERE ${conds.join(' AND ')} ORDER BY id DESC LIMIT $${args.length}`, args);
      out.projects = r.rows;
    }
    if (want('hypotheses')) {
      const args = [like];
      const conds = ['(statement ILIKE $1 OR supporting_evidence ILIKE $1)'];
      if (status) { args.push(status); conds.push(`status = $${args.length}`); }
      args.push(limit);
      const r = await pool.query(`SELECT id,project_id,statement,status,confidence_score FROM hypotheses WHERE ${conds.join(' AND ')} ORDER BY id DESC LIMIT $${args.length}`, args);
      out.hypotheses = r.rows;
    }
    if (want('experiments')) {
      const args = [like];
      const conds = ['(title ILIKE $1 OR design ILIKE $1 OR methodology ILIKE $1)'];
      if (status) { args.push(status); conds.push(`status = $${args.length}`); }
      args.push(limit);
      const r = await pool.query(`SELECT id,hypothesis_id,title,design,status FROM experiments WHERE ${conds.join(' AND ')} ORDER BY id DESC LIMIT $${args.length}`, args);
      out.experiments = r.rows;
    }
    if (want('results')) {
      const args = [like];
      const conds = ['(conclusion ILIKE $1 OR data_summary ILIKE $1 OR outcome ILIKE $1)'];
      args.push(limit);
      const r = await pool.query(`SELECT id,experiment_id,outcome,significance_pct,breakthrough,conclusion FROM results WHERE ${conds.join(' AND ')} ORDER BY id DESC LIMIT $${args.length}`, args);
      out.results = r.rows;
    }
    if (want('publications')) {
      const args = [like];
      const conds = ['(title ILIKE $1 OR journal ILIKE $1 OR authors ILIKE $1)'];
      if (status) { args.push(status); conds.push(`status = $${args.length}`); }
      args.push(limit);
      const r = await pool.query(`SELECT id,project_id,title,journal,status,impact_factor FROM publications WHERE ${conds.join(' AND ')} ORDER BY id DESC LIMIT $${args.length}`, args);
      out.publications = r.rows;
    }
    if (want('researchers')) {
      const args = [like];
      const conds = ['(name ILIKE $1 OR institution ILIKE $1 OR specialization ILIKE $1)'];
      args.push(limit);
      const r = await pool.query(`SELECT id,name,institution,specialization,h_index FROM researchers WHERE ${conds.join(' AND ')} ORDER BY id DESC LIMIT $${args.length}`, args);
      out.researchers = r.rows;
    }

    res.json({ query: q, entity: entity || 'all', filters: { status, domain }, results: out });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
