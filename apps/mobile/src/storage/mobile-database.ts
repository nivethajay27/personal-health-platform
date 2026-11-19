import * as SQLite from 'expo-sqlite';

import type { CravingType, IntensityLevel, Mood, SymptomType } from '@/core';

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

type DailyCheckInRow = Omit<DailyCheckInRecord, 'cravings' | 'symptoms'> & {
  cravings: string;
  symptoms: string;
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

function parseValues<T extends string>(value: string, allowedValues: Set<T>) {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is T => typeof item === 'string' && allowedValues.has(item as T));
  } catch {
    return [];
  }
}
