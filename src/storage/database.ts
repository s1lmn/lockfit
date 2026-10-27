import * as SQLite from 'expo-sqlite';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync('lockfit.db');
  }

  return databasePromise;
}

async function hasColumn(
  db: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string,
) {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
  return rows.some((row) => row.name === columnName);
}

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string,
  definition: string,
) {
  if (!(await hasColumn(db, tableName, columnName))) {
    await db.execAsync(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`,
    );
  }
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      daily_limit_minutes INTEGER NOT NULL DEFAULT 60,
      unlock_bonus_minutes INTEGER NOT NULL DEFAULT 15,
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      session_active INTEGER NOT NULL DEFAULT 0,
      theme_preference TEXT NOT NULL DEFAULT 'sand',
      language_preference TEXT NOT NULL DEFAULT 'system',
      steps_per_reward INTEGER NOT NULL DEFAULT 500,
      step_bonus_minutes INTEGER NOT NULL DEFAULT 5
    );

    CREATE TABLE IF NOT EXISTS user_account (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blocked_apps (
      package_name TEXT PRIMARY KEY NOT NULL,
      app_name TEXT NOT NULL,
      daily_limit_minutes INTEGER NOT NULL DEFAULT 30
    );

    CREATE TABLE IF NOT EXISTS daily_usage (
      date_key TEXT NOT NULL,
      package_name TEXT NOT NULL,
      used_minutes INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (date_key, package_name)
    );

    CREATE TABLE IF NOT EXISTS daily_bonus (
      date_key TEXT PRIMARY KEY NOT NULL,
      bonus_minutes INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_log (
      id TEXT PRIMARY KEY NOT NULL,
      completed_at TEXT NOT NULL,
      exercise_type TEXT NOT NULL,
      repetitions INTEGER NOT NULL,
      bonus_minutes INTEGER NOT NULL,
      challenge_type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS step_daily (
      date_key TEXT PRIMARY KEY NOT NULL,
      steps INTEGER NOT NULL DEFAULT 0,
      rewarded_steps INTEGER NOT NULL DEFAULT 0,
      last_sensor_value INTEGER,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS step_reward_log (
      id TEXT PRIMARY KEY NOT NULL,
      completed_at TEXT NOT NULL,
      date_key TEXT NOT NULL,
      steps INTEGER NOT NULL,
      bonus_minutes INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_step_reward_log_date
    ON step_reward_log(date_key);

    INSERT OR IGNORE INTO settings (id, daily_limit_minutes, unlock_bonus_minutes)
    VALUES (1, 60, 15);
  `);

  await ensureColumn(db, 'settings', 'onboarding_completed', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'settings', 'session_active', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'settings', 'theme_preference', "TEXT NOT NULL DEFAULT 'sand'");
  await ensureColumn(db, 'settings', 'language_preference', "TEXT NOT NULL DEFAULT 'system'");
  await ensureColumn(db, 'settings', 'steps_per_reward', 'INTEGER NOT NULL DEFAULT 500');
  await ensureColumn(db, 'settings', 'step_bonus_minutes', 'INTEGER NOT NULL DEFAULT 5');
  await ensureColumn(db, 'blocked_apps', 'daily_limit_minutes', 'INTEGER NOT NULL DEFAULT 30');
}
