import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'cycle-companion.db';

export type EnergyCheckIn = {
  date: string;
  energyLevel: number;
  updatedAt: string;
  userId: string;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function loadEnergyCheckIn({
  date,
  userId,
}: Pick<EnergyCheckIn, 'date' | 'userId'>) {
  const database = await getDatabase();

  return database.getFirstAsync<EnergyCheckIn>(
    `SELECT
      user_id AS userId,
      date,
      energy_level AS energyLevel,
      updated_at AS updatedAt
    FROM daily_check_ins
    WHERE user_id = ? AND date = ?`,
    userId,
    date,
  );
}

export async function saveEnergyCheckIn({
  date,
  energyLevel,
  userId,
}: Pick<EnergyCheckIn, 'date' | 'energyLevel' | 'userId'>) {
  const database = await getDatabase();
  const updatedAt = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO daily_check_ins (user_id, date, energy_level, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      energy_level = excluded.energy_level,
      updated_at = excluded.updated_at`,
    userId,
    date,
    energyLevel,
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
          updated_at TEXT NOT NULL,
          PRIMARY KEY (user_id, date)
        );
      `);

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
