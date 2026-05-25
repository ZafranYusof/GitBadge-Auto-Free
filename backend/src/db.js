import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = join(DATA_DIR, 'farm.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- Migration system ---
const migrations = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS farm_sessions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        username TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        count INTEGER NOT NULL DEFAULT 1,
        completed INTEGER NOT NULL DEFAULT 0,
        delay INTEGER NOT NULL DEFAULT 2000,
        repo_name TEXT,
        repo_owner TEXT,
        use_existing_repo INTEGER NOT NULL DEFAULT 0,
        stealth_level INTEGER NOT NULL DEFAULT 0,
        repo_visibility TEXT NOT NULL DEFAULT 'public',
        existing_repo TEXT,
        priority INTEGER NOT NULL DEFAULT 0,
        started_at TEXT,
        completed_at TEXT,
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS badge_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        badge_id TEXT NOT NULL,
        tier TEXT,
        unlocked_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS farm_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        message TEXT NOT NULL,
        level TEXT NOT NULL DEFAULT 'info',
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES farm_sessions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT NOT NULL,
        value TEXT,
        username TEXT NOT NULL,
        PRIMARY KEY (key, username)
      );

      CREATE INDEX IF NOT EXISTS idx_farm_sessions_username ON farm_sessions(username);
      CREATE INDEX IF NOT EXISTS idx_farm_sessions_status ON farm_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_farm_logs_session ON farm_logs(session_id);
      CREATE INDEX IF NOT EXISTS idx_badge_history_username ON badge_history(username);
    `
  },
  {
    version: 2,
    up: `
      ALTER TABLE farm_sessions ADD COLUMN options TEXT DEFAULT '{}';
    `
  }
];

function runMigrations() {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = db.prepare('SELECT version FROM _migrations ORDER BY version').all();
  const appliedVersions = new Set(applied.map(r => r.version));

  for (const migration of migrations) {
    if (!appliedVersions.has(migration.version)) {
      db.exec(migration.up);
      db.prepare('INSERT INTO _migrations (version) VALUES (?)').run(migration.version);
      console.log(`[DB] Applied migration v${migration.version}`);
    }
  }
}

// Run migrations on import
runMigrations();

// --- Session CRUD ---

export function createSession({ id, type, username, count, delay, repoVisibility, useExistingRepo, existingRepo, priority = 0, options = {} }) {
  const stmt = db.prepare(`
    INSERT INTO farm_sessions (id, type, username, status, count, completed, delay, repo_visibility, use_existing_repo, existing_repo, priority, options)
    VALUES (?, ?, ?, 'queued', ?, 0, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, type, username, count, delay, repoVisibility || 'public', useExistingRepo ? 1 : 0, existingRepo || null, priority, JSON.stringify(options));
  return getSession(id);
}

export function getSessionOptions(id) {
  const session = getSession(id);
  if (!session || !session.options) return {};
  try {
    return JSON.parse(session.options);
  } catch {
    return {};
  }
}

export function getSession(id) {
  return db.prepare('SELECT * FROM farm_sessions WHERE id = ?').get(id);
}

export function getSessionsByUsername(username) {
  return db.prepare('SELECT * FROM farm_sessions WHERE username = ? ORDER BY created_at DESC').all(username);
}

export function getSessionsByStatus(status) {
  return db.prepare('SELECT * FROM farm_sessions WHERE status = ? ORDER BY priority DESC, created_at ASC').all(status);
}

export function getQueuedSessions() {
  return db.prepare("SELECT * FROM farm_sessions WHERE status = 'queued' ORDER BY priority DESC, created_at ASC").all();
}

export function getActiveSessions() {
  return db.prepare("SELECT * FROM farm_sessions WHERE status IN ('running', 'queued', 'paused') ORDER BY created_at DESC").all();
}

export function updateSessionStatus(id, status, extra = {}) {
  const sets = ['status = ?'];
  const values = [status];

  if (extra.completed !== undefined) {
    sets.push('completed = ?');
    values.push(extra.completed);
  }
  if (extra.repoName !== undefined) {
    sets.push('repo_name = ?');
    values.push(extra.repoName);
  }
  if (extra.repoOwner !== undefined) {
    sets.push('repo_owner = ?');
    values.push(extra.repoOwner);
  }
  if (extra.errorMessage !== undefined) {
    sets.push('error_message = ?');
    values.push(extra.errorMessage);
  }
  if (status === 'running' && !extra.skipStartedAt) {
    sets.push("started_at = datetime('now')");
  }
  if (['completed', 'error', 'cancelled'].includes(status)) {
    sets.push("completed_at = datetime('now')");
  }

  values.push(id);
  db.prepare(`UPDATE farm_sessions SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getSession(id);
}

export function incrementSessionCompleted(id) {
  db.prepare('UPDATE farm_sessions SET completed = completed + 1 WHERE id = ?').run(id);
  return getSession(id);
}

// --- Logs ---

export function addSessionLog(sessionId, message, level = 'info') {
  db.prepare('INSERT INTO farm_logs (session_id, message, level) VALUES (?, ?, ?)').run(sessionId, message, level);
}

export function getSessionLogs(sessionId, limit = 100) {
  return db.prepare('SELECT * FROM farm_logs WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?').all(sessionId, limit);
}

export function getRecentLogs(username, limit = 100) {
  return db.prepare(`
    SELECT fl.*, fs.type as session_type
    FROM farm_logs fl
    JOIN farm_sessions fs ON fl.session_id = fs.id
    WHERE fs.username = ?
    ORDER BY fl.timestamp DESC
    LIMIT ?
  `).all(username, limit);
}

// --- Badge History ---

export function addBadgeUnlock(username, badgeId, tier) {
  db.prepare('INSERT INTO badge_history (username, badge_id, tier) VALUES (?, ?, ?)').run(username, badgeId, tier);
}

export function getBadgeHistory(username) {
  return db.prepare('SELECT * FROM badge_history WHERE username = ? ORDER BY unlocked_at DESC').all(username);
}

// --- Settings ---

export function getSetting(username, key) {
  const row = db.prepare('SELECT value FROM settings WHERE username = ? AND key = ?').get(username, key);
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

export function setSetting(username, key, value) {
  const jsonValue = JSON.stringify(value);
  db.prepare(`
    INSERT INTO settings (username, key, value) VALUES (?, ?, ?)
    ON CONFLICT(key, username) DO UPDATE SET value = excluded.value
  `).run(username, key, jsonValue);
}

export function getAllSettings(username) {
  const rows = db.prepare('SELECT key, value FROM settings WHERE username = ?').all(username);
  const result = {};
  for (const row of rows) {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      result[row.key] = row.value;
    }
  }
  return result;
}

// --- Farm History (from sessions) ---

export function getFarmHistory(username, limit = 200) {
  return db.prepare(`
    SELECT * FROM farm_sessions
    WHERE username = ? AND status IN ('completed', 'error', 'cancelled')
    ORDER BY completed_at DESC
    LIMIT ?
  `).all(username, limit);
}

// --- Cleanup ---

export function deleteOldSessions(daysOld = 30) {
  return db.prepare(`
    DELETE FROM farm_sessions
    WHERE completed_at IS NOT NULL
    AND completed_at < datetime('now', '-' || ? || ' days')
  `).run(daysOld);
}

export default db;
