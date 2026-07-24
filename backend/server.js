const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('./db');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/runtime-ai', require('./routes/runtime-ai'));
app.use('/api/governed-discovery', require('./routes/governedDiscovery'));

app.get('/api/health/live', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/health/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1 FROM discovery_sources LIMIT 1');
    res.json({ status: 'ready', authoritativeSurface: '/api/governed-discovery' });
  } catch (_error) {
    res.status(503).json({ status: 'not_ready' });
  }
});

// Unscoped CRUD, demo data, simulated benchmarks, generic-model actions, and
// generated gap/visualization routes are intentionally outside the supported
// product boundary. Keep a deterministic tombstone instead of silent success.
app.use('/api', (_req, res) => res.status(410).json({
  error: 'Legacy/generated surface retired; use /api/governed-discovery',
}));

app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') console.error(err.stack);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' });
});

if (require.main === module) {
  const port = Number(process.env.BACKEND_PORT);
  const host = process.env.BACKEND_HOST;
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || host !== '127.0.0.1') throw new Error('BACKEND_PORT and BACKEND_HOST=127.0.0.1 are required');
  app.listen(port, host, () => console.log(`DiscoverAI backend running on http://${host}:${port}`));
}

module.exports = app;
