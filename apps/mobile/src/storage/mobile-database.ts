import * as SQLite from 'expo-sqlite';

import type {
  CravingType,
  CyclePhase,
  IntensityLevel,
  MealType,
  Mood,
  NutrientFocus,
  SymptomType,
  WorkoutType,
} from '@/core';

const DATABASE_NAME = 'cycle-companion.db';

const cravingTypes = new Set<CravingType>(['sweet', 'salty', 'carbs', 'chocolate', 'none']);
const moods = new Set<Mood>(['calm', 'happy', 'energized', 'sensitive', 'anxious', 'low']);
const symptomTypes = new Set<SymptomType>([
  'cramps',
  'bloating',
  'headache',
  'fatigue',
  'cravings',
  'acne',
  'mood_swings',
  'breast_tenderness',
  'back_pain',
]);
const nutrientFocuses = new Set<NutrientFocus>([
  'iron_rich',
  'protein_focused',
  'magnesium_rich',
  'complex_carbs',
  'hydration',
  'anti_inflammatory',
  'fiber',
]);

export type DailyCheckInRecord = {
  cravings: CravingType[];
  date: string;
  energyLevel: IntensityLevel;
  mood: Mood;
  notes: string;
  sleepHours: number | null;
  sleepQuality: IntensityLevel | null;
  sorenessLevel: IntensityLevel | null;
  stressLevel: IntensityLevel | null;
  symptoms: SymptomType[];
  updatedAt: string;
  userId: string;
};

export type MealLogRecord = {
  cravingsPresent: boolean;
  cyclePhase: CyclePhase;
  date: string;
  fiberEstimate: IntensityLevel;
  hydrationEstimate: IntensityLevel;
  mealType: MealType;
  name: string;
  notes: string;
  nutrientFocus: NutrientFocus[];
  proteinEstimate: IntensityLevel;
  updatedAt: string;
  userId: string;
};

export type WorkoutLogRecord = {
  cyclePhase: CyclePhase;
  date: string;
  durationMinutes: number;
  intensity: IntensityLevel;
  notes: string;
  perceivedEffort: IntensityLevel;
  recoveryAfterward: IntensityLevel;
  type: WorkoutType;
  updatedAt: string;
  userId: string;
};

export type RecoveryLogRecord = {
  date: string;
  fatigueLevel: IntensityLevel;
  hydrationLevel: IntensityLevel;
  notes: string;
  readinessScore: number;
  sleepHours: number;
  sleepQuality: IntensityLevel;
  sorenessLevel: IntensityLevel;
  stressLevel: IntensityLevel;
  updatedAt: string;
  userId: string;
};

type DailyCheckInRow = Omit<DailyCheckInRecord, 'cravings' | 'symptoms'> & {
  cravings: string;
  symptoms: string;
};

type MealLogRow = Omit<MealLogRecord, 'cravingsPresent' | 'nutrientFocus'> & {
  cravingsPresent: number;
  nutrientFocus: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function loadDailyCheckIn({
  date,
  userId,
}: Pick<DailyCheckInRecord, 'date' | 'userId'>) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<DailyCheckInRow>(
    `SELECT
      user_id AS userId,
      date,
      energy_level AS energyLevel,
      mood,
      sleep_hours AS sleepHours,
      sleep_quality AS sleepQuality,
      cravings,
      stress_level AS stressLevel,
      soreness_level AS sorenessLevel,
      symptoms,
      notes,
      updated_at AS updatedAt
    FROM daily_check_ins
    WHERE user_id = ? AND date = ?`,
    userId,
    date,
  );

  return row ? toDailyCheckInRecord(row) : null;
}

export async function saveDailyCheckIn({
  cravings,
  date,
  energyLevel,
  mood,
  notes,
  sleepHours,
  sleepQuality,
  sorenessLevel,
  stressLevel,
  symptoms,
  userId,
}: Omit<DailyCheckInRecord, 'updatedAt'>) {
  const database = await getDatabase();
  const updatedAt = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO daily_check_ins (
      user_id,
      date,
      energy_level,
      mood,
      sleep_hours,
      sleep_quality,
      cravings,
      stress_level,
      soreness_level,
      symptoms,
      notes,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      energy_level = excluded.energy_level,
      mood = excluded.mood,
      sleep_hours = excluded.sleep_hours,
      sleep_quality = excluded.sleep_quality,
      cravings = excluded.cravings,
      stress_level = excluded.stress_level,
      soreness_level = excluded.soreness_level,
      symptoms = excluded.symptoms,
      notes = excluded.notes,
      updated_at = excluded.updated_at`,
    userId,
    date,
    energyLevel,
    mood,
    sleepHours,
    sleepQuality,
    JSON.stringify(cravings),
    stressLevel,
    sorenessLevel,
    JSON.stringify(symptoms),
    notes.trim(),
    updatedAt,
  );
}

export async function loadMealLog({
  date,
  userId,
}: Pick<MealLogRecord, 'date' | 'userId'>) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<MealLogRow>(
    `SELECT
      user_id AS userId,
      date,
      meal_type AS mealType,
      name,
      cycle_phase AS cyclePhase,
      protein_estimate AS proteinEstimate,
      fiber_estimate AS fiberEstimate,
      hydration_estimate AS hydrationEstimate,
      cravings_present AS cravingsPresent,
      nutrient_focus AS nutrientFocus,
      notes,
      updated_at AS updatedAt
    FROM meal_logs
    WHERE user_id = ? AND date = ?`,
    userId,
    date,
  );

  return row ? toMealLogRecord(row) : null;
}

export async function saveMealLog({
  cravingsPresent,
  cyclePhase,
  date,
  fiberEstimate,
  hydrationEstimate,
  mealType,
  name,
  notes,
  nutrientFocus,
  proteinEstimate,
  userId,
}: Omit<MealLogRecord, 'updatedAt'>) {
  const database = await getDatabase();
  const updatedAt = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO meal_logs (
      user_id, date, meal_type, name, cycle_phase, protein_estimate,
      fiber_estimate, hydration_estimate, cravings_present, nutrient_focus,
      notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      meal_type = excluded.meal_type,
      name = excluded.name,
      cycle_phase = excluded.cycle_phase,
      protein_estimate = excluded.protein_estimate,
      fiber_estimate = excluded.fiber_estimate,
      hydration_estimate = excluded.hydration_estimate,
      cravings_present = excluded.cravings_present,
      nutrient_focus = excluded.nutrient_focus,
      notes = excluded.notes,
      updated_at = excluded.updated_at`,
    userId,
    date,
    mealType,
    name.trim(),
    cyclePhase,
    proteinEstimate,
    fiberEstimate,
    hydrationEstimate,
    cravingsPresent ? 1 : 0,
    JSON.stringify(nutrientFocus),
    notes.trim(),
    updatedAt,
  );
}

export async function loadWorkoutLog({
  date,
  userId,
}: Pick<WorkoutLogRecord, 'date' | 'userId'>) {
  const database = await getDatabase();

  return database.getFirstAsync<WorkoutLogRecord>(
    `SELECT
      user_id AS userId,
      date,
      type,
      duration_minutes AS durationMinutes,
      intensity,
      perceived_effort AS perceivedEffort,
      cycle_phase AS cyclePhase,
      recovery_afterward AS recoveryAfterward,
      notes,
      updated_at AS updatedAt
    FROM workout_logs
    WHERE user_id = ? AND date = ?`,
    userId,
    date,
  );
}

export async function saveWorkoutLog({
  cyclePhase,
  date,
  durationMinutes,
  intensity,
  notes,
  perceivedEffort,
  recoveryAfterward,
  type,
  userId,
}: Omit<WorkoutLogRecord, 'updatedAt'>) {
  const database = await getDatabase();
  const updatedAt = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO workout_logs (
      user_id, date, type, duration_minutes, intensity, perceived_effort,
      cycle_phase, recovery_afterward, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      type = excluded.type,
      duration_minutes = excluded.duration_minutes,
      intensity = excluded.intensity,
      perceived_effort = excluded.perceived_effort,
      cycle_phase = excluded.cycle_phase,
      recovery_afterward = excluded.recovery_afterward,
      notes = excluded.notes,
      updated_at = excluded.updated_at`,
    userId,
    date,
    type,
    durationMinutes,
    intensity,
    perceivedEffort,
    cyclePhase,
    recoveryAfterward,
    notes.trim(),
    updatedAt,
  );
}

export async function loadRecoveryLog({
  date,
  userId,
}: Pick<RecoveryLogRecord, 'date' | 'userId'>) {
  const database = await getDatabase();

  return database.getFirstAsync<RecoveryLogRecord>(
    `SELECT
      user_id AS userId,
      date,
      sleep_hours AS sleepHours,
      sleep_quality AS sleepQuality,
      hydration_level AS hydrationLevel,
      fatigue_level AS fatigueLevel,
      stress_level AS stressLevel,
      soreness_level AS sorenessLevel,
      readiness_score AS readinessScore,
      notes,
      updated_at AS updatedAt
    FROM recovery_logs
    WHERE user_id = ? AND date = ?`,
    userId,
    date,
  );
}

export async function saveRecoveryLog({
  date,
  fatigueLevel,
  hydrationLevel,
  notes,
  readinessScore,
  sleepHours,
  sleepQuality,
  sorenessLevel,
  stressLevel,
  userId,
}: Omit<RecoveryLogRecord, 'updatedAt'>) {
  const database = await getDatabase();
  const updatedAt = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO recovery_logs (
      user_id, date, sleep_hours, sleep_quality, hydration_level, fatigue_level,
      stress_level, soreness_level, readiness_score, notes, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      sleep_hours = excluded.sleep_hours,
      sleep_quality = excluded.sleep_quality,
      hydration_level = excluded.hydration_level,
      fatigue_level = excluded.fatigue_level,
      stress_level = excluded.stress_level,
      soreness_level = excluded.soreness_level,
      readiness_score = excluded.readiness_score,
      notes = excluded.notes,
      updated_at = excluded.updated_at`,
    userId,
    date,
    sleepHours,
    sleepQuality,
    hydrationLevel,
    fatigueLevel,
    stressLevel,
    sorenessLevel,
    readinessScore,
    notes.trim(),
    updatedAt,
  );
}

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS daily_check_ins (
          user_id TEXT NOT NULL,
          date TEXT NOT NULL,
          energy_level INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
          mood TEXT NOT NULL DEFAULT 'calm',
          sleep_hours REAL,
          sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
          cravings TEXT NOT NULL DEFAULT '[]',
          stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
          soreness_level INTEGER CHECK (soreness_level BETWEEN 1 AND 5),
          symptoms TEXT NOT NULL DEFAULT '[]',
          notes TEXT NOT NULL DEFAULT '',
          updated_at TEXT NOT NULL,
          PRIMARY KEY (user_id, date)
        );
      `);
      await migrateDailyCheckIns(database);
      await createLogTables(database);

      return database;
    });
  }

  try {
    return await databasePromise;
  } catch (error) {
    databasePromise = null;
    throw error;
  }
}

async function createLogTables(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS meal_logs (
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      cycle_phase TEXT NOT NULL,
      protein_estimate INTEGER NOT NULL CHECK (protein_estimate BETWEEN 1 AND 5),
      fiber_estimate INTEGER NOT NULL CHECK (fiber_estimate BETWEEN 1 AND 5),
      hydration_estimate INTEGER NOT NULL CHECK (hydration_estimate BETWEEN 1 AND 5),
      cravings_present INTEGER NOT NULL DEFAULT 0,
      nutrient_focus TEXT NOT NULL DEFAULT '[]',
      notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, date)
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      intensity INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 5),
      perceived_effort INTEGER NOT NULL CHECK (perceived_effort BETWEEN 1 AND 5),
      cycle_phase TEXT NOT NULL,
      recovery_afterward INTEGER NOT NULL CHECK (recovery_afterward BETWEEN 1 AND 5),
      notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, date)
    );

    CREATE TABLE IF NOT EXISTS recovery_logs (
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      sleep_hours REAL NOT NULL,
      sleep_quality INTEGER NOT NULL CHECK (sleep_quality BETWEEN 1 AND 5),
      hydration_level INTEGER NOT NULL CHECK (hydration_level BETWEEN 1 AND 5),
      fatigue_level INTEGER NOT NULL CHECK (fatigue_level BETWEEN 1 AND 5),
      stress_level INTEGER NOT NULL CHECK (stress_level BETWEEN 1 AND 5),
      soreness_level INTEGER NOT NULL CHECK (soreness_level BETWEEN 1 AND 5),
      readiness_score INTEGER NOT NULL CHECK (readiness_score BETWEEN 0 AND 100),
      notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, date)
    );
  `);
}

async function migrateDailyCheckIns(database: SQLite.SQLiteDatabase) {
  const columns = await database.getAllAsync<{ name: string }>('PRAGMA table_info(daily_check_ins)');
  const columnNames = new Set(columns.map((column) => column.name));
  const migrations = [
    ['mood', "ALTER TABLE daily_check_ins ADD COLUMN mood TEXT NOT NULL DEFAULT 'calm'"],
    ['sleep_hours', 'ALTER TABLE daily_check_ins ADD COLUMN sleep_hours REAL'],
    ['sleep_quality', 'ALTER TABLE daily_check_ins ADD COLUMN sleep_quality INTEGER'],
    ['cravings', "ALTER TABLE daily_check_ins ADD COLUMN cravings TEXT NOT NULL DEFAULT '[]'"],
    ['stress_level', 'ALTER TABLE daily_check_ins ADD COLUMN stress_level INTEGER'],
    ['soreness_level', 'ALTER TABLE daily_check_ins ADD COLUMN soreness_level INTEGER'],
    ['symptoms', "ALTER TABLE daily_check_ins ADD COLUMN symptoms TEXT NOT NULL DEFAULT '[]'"],
    ['notes', "ALTER TABLE daily_check_ins ADD COLUMN notes TEXT NOT NULL DEFAULT ''"],
  ] as const;

  for (const [columnName, statement] of migrations) {
    if (!columnNames.has(columnName)) {
      await database.execAsync(statement);
    }
  }
}

function toDailyCheckInRecord(row: DailyCheckInRow): DailyCheckInRecord {
  return {
    ...row,
    cravings: parseValues(row.cravings, cravingTypes),
    mood: moods.has(row.mood) ? row.mood : 'calm',
    notes: row.notes ?? '',
    symptoms: parseValues(row.symptoms, symptomTypes),
  };
}

function toMealLogRecord(row: MealLogRow): MealLogRecord {
  return {
    ...row,
    cravingsPresent: Boolean(row.cravingsPresent),
    nutrientFocus: parseValues(row.nutrientFocus, nutrientFocuses),
  };
}

function parseValues<T extends string>(value: string, allowedValues: Set<T>) {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is T => typeof item === 'string' && allowedValues.has(item as T));
  } catch {
    return [];
  }
}
