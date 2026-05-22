// Shared best-effort activity logger used by entity CRUD routes and AI endpoints.
// Writes to activity_log; never throws (silently swallows so a logging failure
// can never break a user-visible request).
const pool = require('../db');

async function logActivity(req, action, entity_type, entity_id, details) {
  try {
    await pool.query(
      'INSERT INTO activity_log (user_id, user_email, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5,$6)',
      [
        req?.user?.id || null,
        req?.user?.email || null,
        action,
        entity_type || null,
        entity_id || null,
        details ? String(details).slice(0, 500) : null,
      ]
    );
  } catch (_e) {
    // best-effort, ignore if table missing or DB unavailable
  }
}

module.exports = { logActivity };
