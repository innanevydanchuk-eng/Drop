import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

/**
 * Database helper using the shared team-db CLI (Turso SQLite).
 * Each call syncs automatically.
 */
function query(sql) {
  try {
    const output = execSync(`team-db "${sql.replace(/"/g, '\\"')}"`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return JSON.parse(output.trim() || '[]');
  } catch (err) {
    console.error('Database query error:', err.message);
    throw new Error('Database query failed');
  }
}

export function createUser({ email, name, passwordHash }) {
  const id = uuidv4();
  query(
    `INSERT INTO users (id, email, name, password_hash) VALUES ('${id}', '${email}', '${name}', '${passwordHash}')`
  );
  return { id, email, name };
}

export function findUserByEmail(email) {
  const rows = query(`SELECT * FROM users WHERE email = '${email}'`);
  return rows.length > 0 ? rows[0] : null;
}

export function findUserById(id) {
  const rows = query(`SELECT * FROM users WHERE id = '${id}'`);
  return rows.length > 0 ? rows[0] : null;
}

export function createPortal({ userId, clientName, projectName, slug }) {
  const id = uuidv4();
  query(
    `INSERT INTO portals (id, user_id, client_name, project_name, slug) VALUES ('${id}', '${userId}', '${clientName}', '${projectName}', '${slug}')`
  );
  return { id, userId, clientName, projectName, slug, status: 'active' };
}

export function getPortalsByUserId(userId) {
  return query(`SELECT * FROM portals WHERE user_id = '${userId}' ORDER BY created_at DESC`);
}

export function getPortalBySlug(slug) {
  const rows = query(`SELECT * FROM portals WHERE slug = '${slug}'`);
  return rows.length > 0 ? rows[0] : null;
}

export function getPortalById(id) {
  const rows = query(`SELECT * FROM portals WHERE id = '${id}'`);
  return rows.length > 0 ? rows[0] : null;
}

export function createFile({ portalId, uploadedBy, filename, filepath, fileSize }) {
  const id = uuidv4();
  query(
    `INSERT INTO files (id, portal_id, uploaded_by, filename, filepath, file_size) VALUES ('${id}', '${portalId}', '${uploadedBy}', '${filename}', '${filepath}', ${fileSize || 0})`
  );
  return { id, portalId, uploadedBy, filename, filepath };
}

export function getFilesByPortalId(portalId) {
  return query(`SELECT * FROM files WHERE portal_id = '${portalId}' ORDER BY uploaded_at DESC`);
}

export function createApproval({ portalId, requestedBy, notes }) {
  const id = uuidv4();
  const notesEscaped = (notes || '').replace(/'/g, "''");
  query(
    `INSERT INTO approvals (id, portal_id, requested_by, notes) VALUES ('${id}', '${portalId}', '${requestedBy}', '${notesEscaped}')`
  );
  return { id, portalId, status: 'pending', requestedBy };
}

export function updateApprovalStatus(id, status) {
  query(
    `UPDATE approvals SET status = '${status}', resolved_at = datetime('now') WHERE id = '${id}'`
  );
}

export function getApprovalsByPortalId(portalId) {
  return query(`SELECT * FROM approvals WHERE portal_id = '${portalId}' ORDER BY created_at DESC`);
}

export function createPayment({ portalId, amountCents, currency = 'gbp' }) {
  const id = uuidv4();
  query(
    `INSERT INTO payments (id, portal_id, amount_cents, currency) VALUES ('${id}', '${portalId}', ${amountCents}, '${currency}')`
  );
  return { id, portalId, amountCents, currency, status: 'pending' };
}

export function updatePaymentStripeId(id, stripePaymentIntentId) {
  query(
    `UPDATE payments SET stripe_payment_intent_id = '${stripePaymentIntentId}' WHERE id = '${id}'`
  );
}

export function updatePaymentStatus(id, status) {
  query(`UPDATE payments SET status = '${status}' WHERE id = '${id}'`);
}

export function getPaymentsByPortalId(portalId) {
  return query(`SELECT * FROM payments WHERE portal_id = '${portalId}' ORDER BY created_at DESC`);
}

// ─── Events / Lead Tracking ──────────────────────────────

export function logEvent({ eventType, userId = null, portalId = null, metadata = null }) {
  const id = uuidv4();
  const userIdVal = userId ? `'${userId}'` : 'NULL';
  const portalIdVal = portalId ? `'${portalId}'` : 'NULL';
  const metaString = metadata ? `'${JSON.stringify(metadata).replace(/'/g, "''")}'` : 'NULL';
  query(
    `INSERT INTO events (id, event_type, user_id, portal_id, metadata) VALUES ('${id}', '${eventType}', ${userIdVal}, ${portalIdVal}, ${metaString})`
  );
  return { id, eventType };
}

export function getEventStats() {
  return query(`SELECT event_type, COUNT(*) as count, DATE(created_at) as date FROM events WHERE created_at >= datetime('now', '-30 days') GROUP BY event_type, DATE(created_at) ORDER BY date DESC, event_type`);
}

export function getTotalEventCounts() {
  return query(`SELECT event_type, COUNT(*) as count FROM events GROUP BY event_type ORDER BY count DESC`);
}

export function getRecentEvents(limit = 20) {
  return query(`SELECT * FROM events ORDER BY created_at DESC LIMIT ${limit}`);
}

export function getUserCount() {
  const rows = query('SELECT COUNT(*) as count FROM users');
  return rows[0]?.count || 0;
}

export function getPortalCount() {
  const rows = query('SELECT COUNT(*) as count FROM portals');
  return rows[0]?.count || 0;
}
