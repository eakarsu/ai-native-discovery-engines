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
//   offset     : per-entity result offset for pagination (default 0)
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const entity = (req.query.entity || '').toString().trim();
    const status = (req.query.status || '').toString().trim();
    const domain = (req.query.domain || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const like = `%${q}%`;

    const out = {};
    const totals = {};

    const wantAll = !entity;
    const want = (e) => wantAll || entity === e;

    // Each per-entity block: compute total count, then page of rows.
    if (want('projects')) {
      const args = [like];
      const conds = ['(name ILIKE $1 OR goal ILIKE $1 OR lead_researcher ILIKE $1 OR domain ILIKE $1)'];
      if (status) { args.push(status); conds.push(`status = $${args.length}`); }
      if (domain) { args.push(domain); conds.push(`domain = $${args.length}`); }
      const where = `WHERE ${conds.join(' AND ')}`;
      const c = await pool.query(`SELECT COUNT(*)::int AS c FROM projects ${where}`, args);
      totals.projects = c.rows[0]?.c || 0;
      args.push(limit); args.push(offset);
      const r = await pool.query(`SELECT id,name,domain,goal,status,lead_researcher FROM projects ${where} ORDER BY id DESC LIMIT $${args.length - 1} OFFSET $${args.length}`, args);
      out.projects = r.rows;
    }
    if (want('hypotheses')) {
      const args = [like];
      const conds = ['(statement ILIKE $1 OR supporting_evidence ILIKE $1)'];
      if (status) { args.push(status); conds.push(`status = $${args.length}`); }
      const where = `WHERE ${conds.join(' AND ')}`;
      const c = await pool.query(`SELECT COUNT(*)::int AS c FROM hypotheses ${where}`, args);
      totals.hypotheses = c.rows[0]?.c || 0;
      args.push(limit); args.push(offset);
      const r = await pool.query(`SELECT id,project_id,statement,status,confidence_score FROM hypotheses ${where} ORDER BY id DESC LIMIT $${args.length - 1} OFFSET $${args.length}`, args);
      out.hypotheses = r.rows;
    }
    if (want('experiments')) {
      const args = [like];
      const conds = ['(title ILIKE $1 OR design ILIKE $1 OR methodology ILIKE $1)'];
      if (status) { args.push(status); conds.push(`status = $${args.length}`); }
      const where = `WHERE ${conds.join(' AND ')}`;
      const c = await pool.query(`SELECT COUNT(*)::int AS c FROM experiments ${where}`, args);
      totals.experiments = c.rows[0]?.c || 0;
      args.push(limit); args.push(offset);
      const r = await pool.query(`SELECT id,hypothesis_id,title,design,status FROM experiments ${where} ORDER BY id DESC LIMIT $${args.length - 1} OFFSET $${args.length}`, args);
      out.experiments = r.rows;
    }
    if (want('results')) {
      const args = [like];
      const conds = ['(conclusion ILIKE $1 OR data_summary ILIKE $1 OR outcome ILIKE $1)'];
      const where = `WHERE ${conds.join(' AND ')}`;
      const c = await pool.query(`SELECT COUNT(*)::int AS c FROM results ${where}`, args);
      totals.results = c.rows[0]?.c || 0;
      args.push(limit); args.push(offset);
      const r = await pool.query(`SELECT id,experiment_id,outcome,significance_pct,breakthrough,conclusion FROM results ${where} ORDER BY id DESC LIMIT $${args.length - 1} OFFSET $${args.length}`, args);
      out.results = r.rows;
    }
    if (want('publications')) {
      const args = [like];
      const conds = ['(title ILIKE $1 OR journal ILIKE $1 OR authors ILIKE $1)'];
      if (status) { args.push(status); conds.push(`status = $${args.length}`); }
      const where = `WHERE ${conds.join(' AND ')}`;
      const c = await pool.query(`SELECT COUNT(*)::int AS c FROM publications ${where}`, args);
      totals.publications = c.rows[0]?.c || 0;
      args.push(limit); args.push(offset);
      const r = await pool.query(`SELECT id,project_id,title,journal,status,impact_factor FROM publications ${where} ORDER BY id DESC LIMIT $${args.length - 1} OFFSET $${args.length}`, args);
      out.publications = r.rows;
    }
    if (want('researchers')) {
      const args = [like];
      const conds = ['(name ILIKE $1 OR institution ILIKE $1 OR specialization ILIKE $1)'];
      const where = `WHERE ${conds.join(' AND ')}`;
      const c = await pool.query(`SELECT COUNT(*)::int AS c FROM researchers ${where}`, args);
      totals.researchers = c.rows[0]?.c || 0;
      args.push(limit); args.push(offset);
      const r = await pool.query(`SELECT id,name,institution,specialization,h_index FROM researchers ${where} ORDER BY id DESC LIMIT $${args.length - 1} OFFSET $${args.length}`, args);
      out.researchers = r.rows;
    }

    const grandTotal = Object.values(totals).reduce((a, b) => a + (b || 0), 0);
    res.set('X-Total-Count', String(grandTotal));
    res.json({
      query: q,
      entity: entity || 'all',
      filters: { status, domain },
      pagination: { limit, offset, totals, grand_total: grandTotal },
      results: out,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
