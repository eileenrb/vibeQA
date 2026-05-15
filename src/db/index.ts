import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.ts';

const sqlite = new Database('sqlite.db');
sqlite.pragma('foreign_keys = ON');
export const db = drizzle(sqlite, { schema });

try {
  // Auto-migrate (simple way for this applet)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      role TEXT NOT NULL,
      avatar TEXT,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY,
      module TEXT NOT NULL,
      feature TEXT,
      title TEXT NOT NULL,
      preconditions TEXT,
      steps TEXT NOT NULL,
      expected_result TEXT NOT NULL,
      priority TEXT NOT NULL,
      severity TEXT NOT NULL,
      automation_status TEXT NOT NULL,
      tags TEXT,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      updated_at INTEGER,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS regression_cycles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      version TEXT NOT NULL,
      status TEXT NOT NULL,
      owner_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      start_date INTEGER,
      end_date INTEGER,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS execution_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cycle_id TEXT NOT NULL REFERENCES regression_cycles(id) ON DELETE CASCADE,
      test_case_id TEXT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      tester_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      environment TEXT,
      build_version TEXT,
      execution_date INTEGER,
      remarks TEXT,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS bugs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      severity TEXT NOT NULL,
      environment TEXT,
      test_case_id TEXT REFERENCES test_cases(id) ON DELETE SET NULL,
      cycle_id TEXT REFERENCES regression_cycles(id) ON DELETE CASCADE,
      assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      qa_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      reopen_count INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER,
      closed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS bug_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bug_id TEXT REFERENCES bugs(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT,
      details TEXT,
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT,
      created_at INTEGER
    );
  `);

  // Ensure password column exists for migrations
  try {
    sqlite.exec("ALTER TABLE users ADD COLUMN password TEXT;");
  } catch (e) {
    // Column likely already exists
  }
} catch (error) {
  console.error("Database initialization error:", error);
}
