import { getDatabase } from './database';
import {
  calculateStepDelta,
  getAvailableRewardSteps,
} from '../features/activity/stepRewards';
import { getLocalDateKey, getRecentLocalDateKeys } from '../utils/date';
import {
  coerceInteger,
  normalizeBlockedApps,
  normalizeEmail,
  normalizeLanguage,
  normalizeNickname,
  normalizeTheme,
  validatePassword,
} from '../utils/validation';
import { LockFitNative } from '../native/lockFitNative';
import {
  normalizeStepRewardClaim,
  normalizeStepSensorValue,
  normalizeWorkoutEntry,
} from '../utils/activityValidation';
import type {
  AppUsageRecord,
  BlockedApp,
  LanguagePreference,
  StepDayRecord,
  StepRewardLogEntry,
  ThemeName,
  UserAccount,
  WeeklyActivitySummary,
  WorkoutLogEntry,
} from '../types/lockfit';

type SettingsRow = {
  unlock_bonus_minutes: number;
  onboarding_completed: number;
  session_active: number;
  theme_preference: ThemeName;
  language_preference: LanguagePreference;
  steps_per_reward: number;
  step_bonus_minutes: number;
};

type AppRow = {
  package_name: string;
  app_name: string;
  daily_limit_minutes: number;
};

type UsageRow = {
  package_name: string;
  used_minutes: number;
};

type BonusRow = {
  bonus_minutes: number;
};

type WorkoutRow = {
  id: string;
  completed_at: string;
  exercise_type: WorkoutLogEntry['exerciseType'];
  repetitions: number;
  bonus_minutes: number;
  challenge_type: WorkoutLogEntry['challengeType'];
};

type AccountRow = {
  email: string;
  password: string;
  nickname: string;
  created_at: string;
};

type StepDayRow = {
  date_key: string;
  steps: number;
  rewarded_steps: number;
  last_sensor_value: number | null;
  updated_at: string;
};

type StepRewardRow = {
  id: string;
  completed_at: string;
  date_key: string;
  steps: number;
  bonus_minutes: number;
};

type DailyBonusRow = {
  date_key: string;
  bonus_minutes: number;
};

export async function getSettings() {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SettingsRow>(
    `SELECT unlock_bonus_minutes, onboarding_completed, session_active, theme_preference,
            language_preference, steps_per_reward, step_bonus_minutes
     FROM settings
     WHERE id = 1`,
  );

  return {
    unlockBonusMinutes: coerceInteger(row?.unlock_bonus_minutes ?? 15, 1, 240, 15),
    onboardingCompleted: Boolean(row?.onboarding_completed ?? 0),
    sessionActive: Boolean(row?.session_active ?? 0),
    themePreference: normalizeTheme(row?.theme_preference),
    languagePreference: normalizeLanguage(row?.language_preference),
    stepsPerReward: coerceInteger(row?.steps_per_reward ?? 500, 100, 100_000, 500),
    stepBonusMinutes: coerceInteger(row?.step_bonus_minutes ?? 5, 1, 240, 5),
  };
}

export async function saveSettings(payload: {
  unlockBonusMinutes?: number;
  onboardingCompleted?: boolean;
  sessionActive?: boolean;
  themePreference?: ThemeName;
  languagePreference?: LanguagePreference;
  stepsPerReward?: number;
  stepBonusMinutes?: number;
}) {
  const db = await getDatabase();
  const current = await getSettings();
  const unlockBonusMinutes = coerceInteger(
    payload.unlockBonusMinutes ?? current.unlockBonusMinutes,
    1,
    240,
    current.unlockBonusMinutes,
  );
  const stepsPerReward = coerceInteger(
    payload.stepsPerReward ?? current.stepsPerReward,
    100,
    100_000,
    current.stepsPerReward,
  );
  const stepBonusMinutes = coerceInteger(
    payload.stepBonusMinutes ?? current.stepBonusMinutes,
    1,
    240,
    current.stepBonusMinutes,
  );

  await db.runAsync(
    `UPDATE settings
     SET unlock_bonus_minutes = ?, onboarding_completed = ?, session_active = ?, theme_preference = ?,
         language_preference = ?, steps_per_reward = ?, step_bonus_minutes = ?
     WHERE id = 1`,
    unlockBonusMinutes,
    Number(payload.onboardingCompleted ?? current.onboardingCompleted),
    Number(payload.sessionActive ?? current.sessionActive),
    normalizeTheme(payload.themePreference ?? current.themePreference),
    normalizeLanguage(payload.languagePreference ?? current.languagePreference),
    stepsPerReward,
    stepBonusMinutes,
  );
}

export async function getUserAccount(): Promise<UserAccount | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AccountRow>(
    'SELECT email, password, nickname, created_at FROM user_account WHERE id = 1',
  );

  if (!row) {
    return null;
  }

  if (!row.password.startsWith('pbkdf2_sha256$')) {
    await db.runAsync(
      'UPDATE user_account SET password = ? WHERE id = 1',
      await LockFitNative.hashPassword(row.password),
    );
  }

  return {
    email: row.email,
    nickname: row.nickname,
    createdAt: row.created_at,
  };
}

export async function registerUserAccount(payload: {
  email: string;
  password: string;
  nickname: string;
}) {
  const db = await getDatabase();
  const existingAccount = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM user_account WHERE id = 1',
  );

  if (existingAccount) {
    throw new Error('Аккаунт уже создан на этом устройстве.');
  }

  const validatedPassword = validatePassword(payload.password);
  const passwordHash = await LockFitNative.hashPassword(validatedPassword);

  await db.runAsync(
    `INSERT INTO user_account (id, email, password, nickname, created_at)
     VALUES (1, ?, ?, ?, ?)`,
    normalizeEmail(payload.email),
    passwordHash,
    normalizeNickname(payload.nickname),
    new Date().toISOString(),
  );

  await saveSettings({ sessionActive: true });
}

export async function loginUserAccount(payload: {
  email: string;
  password: string;
}) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AccountRow>(
    `SELECT email, password
     FROM user_account
     WHERE id = 1`,
  );

  if (!row) {
    throw new Error('Сначала зарегистрируй аккаунт.');
  }

  const validatedPassword = validatePassword(payload.password);
  const passwordMatches = row.password.startsWith('pbkdf2_sha256$')
    ? await LockFitNative.verifyPassword(validatedPassword, row.password)
    : row.password === validatedPassword;

  if (row.email !== normalizeEmail(payload.email) || !passwordMatches) {
    throw new Error('Почта или пароль введены неверно.');
  }

  if (!row.password.startsWith('pbkdf2_sha256$')) {
    await db.runAsync(
      'UPDATE user_account SET password = ? WHERE id = 1',
      await LockFitNative.hashPassword(validatedPassword),
    );
  }

  await saveSettings({ sessionActive: true });
}

export async function logoutUserAccount() {
  await saveSettings({ sessionActive: false });
}

export async function deleteLocalAccount() {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM user_account;
      DELETE FROM blocked_apps;
      DELETE FROM daily_usage;
      DELETE FROM daily_bonus;
      DELETE FROM workout_log;
      DELETE FROM step_daily;
      DELETE FROM step_reward_log;
      DELETE FROM settings;
      INSERT INTO settings (id, daily_limit_minutes, unlock_bonus_minutes)
      VALUES (1, 60, 15);
    `);
  });
  await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE); VACUUM;');
}

export async function updateNickname(nickname: string) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE user_account
     SET nickname = ?
     WHERE id = 1`,
    normalizeNickname(nickname),
  );
}

export async function replaceBlockedApps(apps: BlockedApp[]) {
  const db = await getDatabase();
  const normalizedApps = normalizeBlockedApps(apps);
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM blocked_apps');

    for (const app of normalizedApps) {
      await db.runAsync(
        `INSERT INTO blocked_apps (package_name, app_name, daily_limit_minutes)
         VALUES (?, ?, ?)`,
        app.packageName,
        app.appName,
        app.dailyLimitMinutes,
      );
    }
  });
}

export async function getBlockedApps(): Promise<BlockedApp[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AppRow>(
    `SELECT package_name, app_name, daily_limit_minutes
     FROM blocked_apps
     ORDER BY app_name ASC`,
  );

  return rows.map((row) => ({
    packageName: row.package_name,
    appName: row.app_name,
    dailyLimitMinutes: row.daily_limit_minutes ?? 30,
  }));
}

export async function upsertTodayUsage(records: AppUsageRecord[], dateKey = getLocalDateKey()) {
  const db = await getDatabase();
  const updatedAt = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    for (const record of records) {
      await db.runAsync(
        `INSERT INTO daily_usage (date_key, package_name, used_minutes, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(date_key, package_name)
         DO UPDATE SET used_minutes = excluded.used_minutes, updated_at = excluded.updated_at`,
        dateKey,
        record.packageName,
        record.usedMinutes,
        updatedAt,
      );
    }
  });
}

export async function incrementUsageForDemo(
  packageName: string,
  deltaMinutes: number,
  dateKey = getLocalDateKey(),
) {
  const db = await getDatabase();
  const updatedAt = new Date().toISOString();
  const current = await db.getFirstAsync<{ used_minutes: number }>(
    `SELECT used_minutes
     FROM daily_usage
     WHERE date_key = ? AND package_name = ?`,
    dateKey,
    packageName,
  );

  await db.runAsync(
    `INSERT INTO daily_usage (date_key, package_name, used_minutes, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(date_key, package_name)
     DO UPDATE SET used_minutes = excluded.used_minutes, updated_at = excluded.updated_at`,
    dateKey,
    packageName,
    (current?.used_minutes ?? 0) + deltaMinutes,
    updatedAt,
  );
}

export async function getTodayUsage(dateKey = getLocalDateKey()): Promise<AppUsageRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<UsageRow>(
    `SELECT package_name, used_minutes
     FROM daily_usage
     WHERE date_key = ?
     ORDER BY used_minutes DESC, package_name ASC`,
    dateKey,
  );

  return rows.map((row) => ({
    packageName: row.package_name,
    usedMinutes: row.used_minutes,
  }));
}

export async function getTodayBonusMinutes(dateKey = getLocalDateKey()) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<BonusRow>(
    `SELECT bonus_minutes
     FROM daily_bonus
     WHERE date_key = ?`,
    dateKey,
  );

  return row?.bonus_minutes ?? 0;
}

export async function addWorkoutLogEntry(entry: WorkoutLogEntry, dateKey = getLocalDateKey()) {
  const db = await getDatabase();
  const updatedAt = new Date().toISOString();
  const safeEntry = normalizeWorkoutEntry(entry);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO workout_log (id, completed_at, exercise_type, repetitions, bonus_minutes, challenge_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      safeEntry.id,
      safeEntry.completedAt,
      safeEntry.exerciseType,
      safeEntry.repetitions,
      safeEntry.bonusMinutes,
      safeEntry.challengeType,
    );

    await db.runAsync(
      `INSERT INTO daily_bonus (date_key, bonus_minutes, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(date_key)
       DO UPDATE SET bonus_minutes = daily_bonus.bonus_minutes + excluded.bonus_minutes,
                     updated_at = excluded.updated_at`,
      dateKey,
      safeEntry.bonusMinutes,
      updatedAt,
    );
  });
}

function mapStepDay(row: StepDayRow): StepDayRecord {
  return {
    dateKey: row.date_key,
    steps: row.steps,
    rewardedSteps: row.rewarded_steps,
    lastSensorValue: row.last_sensor_value,
    updatedAt: row.updated_at,
  };
}

export async function getStepDay(dateKey = getLocalDateKey()): Promise<StepDayRecord> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<StepDayRow>(
    `SELECT date_key, steps, rewarded_steps, last_sensor_value, updated_at
     FROM step_daily
     WHERE date_key = ?`,
    dateKey,
  );

  if (row) {
    return mapStepDay(row);
  }

  return {
    dateKey,
    steps: 0,
    rewardedSteps: 0,
    lastSensorValue: null,
    updatedAt: new Date().toISOString(),
  };
}

export async function recordStepSensorValue(
  sensorValue: number,
  dateKey = getLocalDateKey(),
): Promise<StepDayRecord> {
  const db = await getDatabase();
  const safeSensorValue = normalizeStepSensorValue(sensorValue);
  const updatedAt = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    const current = await db.getFirstAsync<StepDayRow>(
      `SELECT date_key, steps, rewarded_steps, last_sensor_value, updated_at
       FROM step_daily
       WHERE date_key = ?`,
      dateKey,
    );

    if (!current) {
      const previous = await db.getFirstAsync<{ last_sensor_value: number | null }>(
        `SELECT last_sensor_value
         FROM step_daily
         WHERE last_sensor_value IS NOT NULL
         ORDER BY updated_at DESC
         LIMIT 1`,
      );
      const delta = calculateStepDelta(previous?.last_sensor_value ?? null, safeSensorValue);
      await db.runAsync(
        `INSERT INTO step_daily
         (date_key, steps, rewarded_steps, last_sensor_value, updated_at)
         VALUES (?, ?, 0, ?, ?)`,
        dateKey,
        delta,
        safeSensorValue,
        updatedAt,
      );
      return;
    }

    const delta = calculateStepDelta(current.last_sensor_value, safeSensorValue);

    await db.runAsync(
      `UPDATE step_daily
       SET steps = steps + ?, last_sensor_value = ?, updated_at = ?
       WHERE date_key = ?`,
      delta,
      safeSensorValue,
      updatedAt,
      dateKey,
    );
  });

  return getStepDay(dateKey);
}

export async function claimStepReward(payload: {
  steps: number;
  bonusMinutes: number;
  dateKey?: string;
}): Promise<StepRewardLogEntry> {
  const db = await getDatabase();
  const dateKey = payload.dateKey ?? getLocalDateKey();
  const { steps, bonusMinutes } = normalizeStepRewardClaim(payload);
  const completedAt = new Date().toISOString();
  const id = `steps-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await db.withTransactionAsync(async () => {
    const current = await db.getFirstAsync<StepDayRow>(
      `SELECT date_key, steps, rewarded_steps, last_sensor_value, updated_at
       FROM step_daily
       WHERE date_key = ?`,
      dateKey,
    );
    const availableSteps = getAvailableRewardSteps(
      current?.steps ?? 0,
      current?.rewarded_steps ?? 0,
    );

    if (!current || availableSteps < steps) {
      throw new Error('Недостаточно новых шагов для получения бонуса.');
    }

    await db.runAsync(
      `UPDATE step_daily
       SET rewarded_steps = rewarded_steps + ?, updated_at = ?
       WHERE date_key = ?`,
      steps,
      completedAt,
      dateKey,
    );
    await db.runAsync(
      `INSERT INTO step_reward_log (id, completed_at, date_key, steps, bonus_minutes)
       VALUES (?, ?, ?, ?, ?)`,
      id,
      completedAt,
      dateKey,
      steps,
      bonusMinutes,
    );
    await db.runAsync(
      `INSERT INTO daily_bonus (date_key, bonus_minutes, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(date_key)
       DO UPDATE SET bonus_minutes = daily_bonus.bonus_minutes + excluded.bonus_minutes,
                     updated_at = excluded.updated_at`,
      dateKey,
      bonusMinutes,
      completedAt,
    );
  });

  return { id, completedAt, steps, bonusMinutes };
}

export async function getStepRewardLog(limit = 20): Promise<StepRewardLogEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<StepRewardRow>(
    `SELECT id, completed_at, date_key, steps, bonus_minutes
     FROM step_reward_log
     ORDER BY completed_at DESC
     LIMIT ?`,
    limit,
  );

  return rows.map((row) => ({
    id: row.id,
    completedAt: row.completed_at,
    steps: row.steps,
    bonusMinutes: row.bonus_minutes,
  }));
}

export async function getWeeklyActivitySummary(
  now = new Date(),
): Promise<WeeklyActivitySummary> {
  const db = await getDatabase();
  const dateKeys = getRecentLocalDateKeys(7, now);
  const placeholders = dateKeys.map(() => '?').join(', ');
  const [stepRows, bonusRows, workouts] = await Promise.all([
    db.getAllAsync<StepDayRow>(
      `SELECT date_key, steps, rewarded_steps, last_sensor_value, updated_at
       FROM step_daily
       WHERE date_key IN (${placeholders})`,
      ...dateKeys,
    ),
    db.getAllAsync<DailyBonusRow>(
      `SELECT date_key, bonus_minutes
       FROM daily_bonus
       WHERE date_key IN (${placeholders})`,
      ...dateKeys,
    ),
    getWorkoutLog(500),
  ]);

  const stepsByDate = new Map(stepRows.map((row) => [row.date_key, row.steps]));
  const bonusByDate = new Map(bonusRows.map((row) => [row.date_key, row.bonus_minutes]));
  const workoutsByDate = new Map<string, { workouts: number; repetitions: number }>();

  workouts.forEach((workout) => {
    const dateKey = getLocalDateKey(new Date(workout.completedAt));
    if (!dateKeys.includes(dateKey)) {
      return;
    }

    const current = workoutsByDate.get(dateKey) ?? { workouts: 0, repetitions: 0 };
    current.workouts += 1;
    current.repetitions += workout.repetitions;
    workoutsByDate.set(dateKey, current);
  });

  const days = dateKeys.map((dateKey) => ({
    dateKey,
    steps: stepsByDate.get(dateKey) ?? 0,
    workouts: workoutsByDate.get(dateKey)?.workouts ?? 0,
    repetitions: workoutsByDate.get(dateKey)?.repetitions ?? 0,
    bonusMinutes: bonusByDate.get(dateKey) ?? 0,
  }));

  return {
    startDateKey: dateKeys[0]!,
    endDateKey: dateKeys[dateKeys.length - 1]!,
    activeDays: days.filter(
      (day) => day.steps > 0 || day.workouts > 0 || day.bonusMinutes > 0,
    ).length,
    totalSteps: days.reduce((sum, day) => sum + day.steps, 0),
    totalWorkouts: days.reduce((sum, day) => sum + day.workouts, 0),
    totalRepetitions: days.reduce((sum, day) => sum + day.repetitions, 0),
    totalBonusMinutes: days.reduce((sum, day) => sum + day.bonusMinutes, 0),
    days,
  };
}

export async function getWorkoutLog(limit = 20): Promise<WorkoutLogEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<WorkoutRow>(
    `SELECT id, completed_at, exercise_type, repetitions, bonus_minutes, challenge_type
     FROM workout_log
     ORDER BY completed_at DESC
     LIMIT ?`,
    limit,
  );

  return rows.map((row) => ({
    id: row.id,
    completedAt: row.completed_at,
    exerciseType: row.exercise_type,
    repetitions: row.repetitions,
    bonusMinutes: row.bonus_minutes,
    challengeType: row.challenge_type,
  }));
}
