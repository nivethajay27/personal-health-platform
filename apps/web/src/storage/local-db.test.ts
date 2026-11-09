import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { localDb } from "@/storage";
import type { DailyCheckIn, MealLog } from "@/domain";

const checkIn: DailyCheckIn = {
  id: "checkin_001",
  userId: "user_001",
  date: "2026-07-09",
  energyLevel: 3,
  mood: "calm",
  cravings: ["none"],
  createdAt: "2026-07-09T09:00:00.000Z",
  updatedAt: "2026-07-09T09:00:00.000Z",
};

const meal: MealLog = {
  id: "meal_001",
  userId: "user_001",
  date: "2026-07-09",
  mealType: "lunch",
  name: "Grain bowl",
  nutrientFocus: ["protein_focused", "fiber"],
  createdAt: "2026-07-09T12:00:00.000Z",
};

afterEach(async () => {
  await localDb.clearAll();
});

describe("local data storage", () => {
  it("saves records and includes them in a complete local export", async () => {
    await localDb.saveDailyCheckIn(checkIn);
    await localDb.saveMealLog(meal);

    const exportData = await localDb.exportAll();
    const counts = await localDb.getCounts();

    expect(exportData.dailyCheckIns).toEqual([checkIn]);
    expect(exportData.mealLogs).toEqual([meal]);
    expect(counts.dailyCheckIns).toBe(1);
    expect(counts.mealLogs).toBe(1);
  });

  it("clears every local store when a user deletes all browser data", async () => {
    await localDb.saveDailyCheckIn(checkIn);
    await localDb.saveMealLog(meal);

    await localDb.clearAll();

    const exportData = await localDb.exportAll();
    expect(Object.values(exportData).every((records) => records.length === 0)).toBe(
      true,
    );
  });
});
