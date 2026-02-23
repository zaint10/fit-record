import { createClient, Client as LibSQLClient } from '@libsql/client';

// Initialize Turso client
const db: LibSQLClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export { db };

// Helper to generate UUIDs
export function generateId(): string {
  return crypto.randomUUID();
}

// Helper to get current ISO timestamp
export function now(): string {
  return new Date().toISOString();
}

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  // Create tables using batch (executeMultiple not supported on HTTP)
  await db.batch([
    // Clients table
    `CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Exercises table
    `CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL CHECK (muscle_group IN ('chest', 'shoulders', 'triceps', 'back', 'biceps', 'legs', 'core', 'cardio', 'full_body')),
      is_bodyweight INTEGER DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Workout sessions table
    `CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Junction table for workout sessions and clients (many-to-many)
    `CREATE TABLE IF NOT EXISTS workout_session_clients (
      id TEXT PRIMARY KEY,
      workout_session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(workout_session_id, client_id)
    )`,

    // Workout exercises (exercises performed in a session by a client)
    `CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY,
      workout_session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      order_index INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Exercise sets (individual sets within a workout exercise)
    `CREATE TABLE IF NOT EXISTS exercise_sets (
      id TEXT PRIMARY KEY,
      workout_exercise_id TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
      set_number INTEGER NOT NULL,
      reps INTEGER,
      weight_kg REAL,
      is_completed INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_workout_session_clients_session ON workout_session_clients(workout_session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_workout_session_clients_client ON workout_session_clients(client_id)`,
    `CREATE INDEX IF NOT EXISTS idx_workout_exercises_session ON workout_exercises(workout_session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_workout_exercises_client ON workout_exercises(client_id)`,
    `CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise ON workout_exercises(exercise_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exercise_sets_workout_exercise ON exercise_sets(workout_exercise_id)`,
    `CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group)`,
  ], 'write');
}

// Run initialization on import (will be called on first request)
let initialized = false;
export async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    await initializeDatabase();
    initialized = true;
  }
}
