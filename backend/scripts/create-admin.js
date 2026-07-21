'use strict';
const bcrypt = require('bcrypt');
const pool = require('../db');

async function main() {
  if (process.env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') throw new Error('Refusing admin provisioning without explicit acknowledgement');
  const email = String(process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD || '';
  const name = String(process.env.PROVISION_ADMIN_NAME || 'Initial Administrator').trim();
  if (!email || password.length < 12) throw new Error('Administrator email and a password of at least 12 characters are required');
  const existing = await pool.query('SELECT 1 FROM users WHERE lower(email)=lower($1)', [email]);
  if (existing.rowCount) throw new Error(`Refusing to overwrite existing account ${email}`);
  await pool.query('INSERT INTO users(email,password_hash,name,role) VALUES($1,$2,$3,$4)', [email, await bcrypt.hash(password, 12), name, 'admin']);
  console.log(`Provisioned initial administrator ${email}`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
