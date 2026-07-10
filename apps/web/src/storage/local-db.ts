import type {
  Cycle,
  CycleDay,
  DailyCheckIn,
  Insight,
  MealLog,
  PrivacySettings,
  RecoveryLog,
  SymptomLog,
  UserProfile,
  WorkoutLog,
} from "@/domain";

export const LOCAL_DB_NAME = "cycle-companion-local";
export const LOCAL_DB_VERSION = 1;

export const localStoreNames = [
  "userProfiles",
  "cycles",
  "cycleDays",
  "dailyCheckIns",
  "symptomLogs",
  "mealLogs",
  "workoutLogs",
  "recoveryLogs",
  "insights",
  "privacySettings",
] as const;

export type LocalStoreName = (typeof localStoreNames)[number];

type LocalRecordByStore = {
  cycles: Cycle;
  cycleDays: CycleDay;
  dailyCheckIns: DailyCheckIn;
  insights: Insight;
  mealLogs: MealLog;
  privacySettings: PrivacySettings;
  recoveryLogs: RecoveryLog;
  symptomLogs: SymptomLog;
  userProfiles: UserProfile;
  workoutLogs: WorkoutLog;
};

type StoreConfig = {
  indexes?: Array<{
    keyPath: string;
    name: string;
    options?: IDBIndexParameters;
  }>;
  keyPath: string;
  name: LocalStoreName;
};

const storeConfigs: StoreConfig[] = [
  {
    keyPath: "id",
    name: "userProfiles",
  },
  {
    indexes: [{ keyPath: "userId", name: "userId" }],
    keyPath: "id",
    name: "cycles",
  },
  {
    indexes: [
      { keyPath: "cycleId", name: "cycleId" },
      { keyPath: "date", name: "date" },
    ],
    keyPath: "id",
    name: "cycleDays",
  },
  {
    indexes: [
      { keyPath: "userId", name: "userId" },
      { keyPath: "date", name: "date" },
    ],
    keyPath: "id",
    name: "dailyCheckIns",
  },
  {
    indexes: [
      { keyPath: "userId", name: "userId" },
      { keyPath: "date", name: "date" },
    ],
    keyPath: "id",
    name: "symptomLogs",
  },
  {
    indexes: [
      { keyPath: "userId", name: "userId" },
      { keyPath: "date", name: "date" },
    ],
    keyPath: "id",
    name: "mealLogs",
  },
  {
    indexes: [
      { keyPath: "userId", name: "userId" },
      { keyPath: "date", name: "date" },
    ],
    keyPath: "id",
    name: "workoutLogs",
  },
  {
    indexes: [
      { keyPath: "userId", name: "userId" },
      { keyPath: "date", name: "date" },
    ],
    keyPath: "id",
    name: "recoveryLogs",
  },
  {
    indexes: [{ keyPath: "userId", name: "userId" }],
    keyPath: "id",
    name: "insights",
  },
  {
    keyPath: "userId",
    name: "privacySettings",
  },
];

export function isIndexedDbAvailable() {
  return typeof indexedDB !== "undefined";
}

export function openLocalDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(
      new Error("IndexedDB is only available in the browser."),
    );
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_DB_NAME, LOCAL_DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;

      storeConfigs.forEach((config) => {
        const store = db.objectStoreNames.contains(config.name)
          ? request.transaction?.objectStore(config.name)
          : db.createObjectStore(config.name, { keyPath: config.keyPath });

        config.indexes?.forEach((index) => {
          if (store && !store.indexNames.contains(index.name)) {
            store.createIndex(index.name, index.keyPath, index.options);
          }
        });
      });
    };
  });
}

export function saveLocalRecord<StoreName extends LocalStoreName>(
  storeName: StoreName,
  record: LocalRecordByStore[StoreName],
) {
  return withObjectStore(storeName, "readwrite", (store) => store.put(record));
}

export function getLocalRecords<StoreName extends LocalStoreName>(
  storeName: StoreName,
) {
  return withObjectStore<LocalRecordByStore[StoreName][]>(
    storeName,
    "readonly",
    (store) => store.getAll(),
  );
}

export async function exportAllLocalData() {
  const entries = await Promise.all(
    localStoreNames.map(async (storeName) => {
      const records = await getLocalRecords(storeName);

      return [storeName, records] as const;
    }),
  );

  return Object.fromEntries(entries) as {
    [StoreName in LocalStoreName]: LocalRecordByStore[StoreName][];
  };
}

export async function getLocalRecordCounts() {
  const entries = await Promise.all(
    localStoreNames.map(async (storeName) => {
      const records = await getLocalRecords(storeName);

      return [storeName, records.length] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<LocalStoreName, number>;
}

export function deleteLocalRecord(
  storeName: LocalStoreName,
  key: IDBValidKey,
) {
  return withObjectStore(storeName, "readwrite", (store) => store.delete(key));
}

export function clearLocalStore(storeName: LocalStoreName) {
  return withObjectStore(storeName, "readwrite", (store) => store.clear());
}

export async function clearAllLocalData() {
  await Promise.all(localStoreNames.map((storeName) => clearLocalStore(storeName)));
}

export const localDb = {
  saveCycle: (record: Cycle) => saveLocalRecord("cycles", record),
  saveCycleDay: (record: CycleDay) => saveLocalRecord("cycleDays", record),
  saveDailyCheckIn: (record: DailyCheckIn) =>
    saveLocalRecord("dailyCheckIns", record),
  saveInsight: (record: Insight) => saveLocalRecord("insights", record),
  saveMealLog: (record: MealLog) => saveLocalRecord("mealLogs", record),
  savePrivacySettings: (record: PrivacySettings) =>
    saveLocalRecord("privacySettings", record),
  saveRecoveryLog: (record: RecoveryLog) =>
    saveLocalRecord("recoveryLogs", record),
  saveSymptomLog: (record: SymptomLog) => saveLocalRecord("symptomLogs", record),
  saveUserProfile: (record: UserProfile) => saveLocalRecord("userProfiles", record),
  saveWorkoutLog: (record: WorkoutLog) => saveLocalRecord("workoutLogs", record),

  getCycles: () => getLocalRecords("cycles"),
  getCycleDays: () => getLocalRecords("cycleDays"),
  getDailyCheckIns: () => getLocalRecords("dailyCheckIns"),
  getInsights: () => getLocalRecords("insights"),
  getMealLogs: () => getLocalRecords("mealLogs"),
  getPrivacySettings: () => getLocalRecords("privacySettings"),
  getRecoveryLogs: () => getLocalRecords("recoveryLogs"),
  getSymptomLogs: () => getLocalRecords("symptomLogs"),
  getUserProfiles: () => getLocalRecords("userProfiles"),
  getWorkoutLogs: () => getLocalRecords("workoutLogs"),

  clearAll: clearAllLocalData,
  exportAll: exportAllLocalData,
  getCounts: getLocalRecordCounts,
};

function withObjectStore<Result>(
  storeName: LocalStoreName,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<Result>,
) {
  return new Promise<Result>((resolve, reject) => {
    void openLocalDatabase()
      .then((db) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = operation(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
        transaction.onabort = () => {
          db.close();
          reject(transaction.error);
        };
      })
      .catch(reject);
  });
}
