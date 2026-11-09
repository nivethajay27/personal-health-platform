import { describe, expect, it } from "vitest";
import { buildRuleBasedInsights } from "@/core/insights";
import {
  demoCycleDays,
  demoDailyCheckIns,
  demoMeals,
  demoRecoveryLogs,
  demoSymptoms,
  demoUser,
  demoWorkouts,
} from "@/data/demo-data";

const insightInput = {
  cycleDays: demoCycleDays,
  dailyCheckIns: demoDailyCheckIns,
  generatedAt: "2026-07-09T09:00:00.000Z",
  meals: demoMeals,
  recoveryLogs: demoRecoveryLogs,
  symptoms: demoSymptoms,
  userId: demoUser.id,
  workouts: demoWorkouts,
};

describe("rule-based insight engine", () => {
  it("generates the expected pattern insights from sufficient history", () => {
    const insights = buildRuleBasedInsights(insightInput);

    expect(insights.map((insight) => insight.id)).toEqual([
      "rule_luteal_cravings",
      "rule_energy_ovulation_peak",
      "rule_sleep_energy_dip",
      "rule_gentle_movement_low_energy",
      "rule_luteal_symptom_cluster",
    ]);
    expect(insights[0]).toMatchObject({
      priority: "high",
      relatedPhase: "luteal",
      userId: demoUser.id,
    });
  });

  it("does not invent insights when there is not enough history", () => {
    const insights = buildRuleBasedInsights({
      ...insightInput,
      cycleDays: demoCycleDays.slice(0, 5),
      dailyCheckIns: [],
      meals: [],
      recoveryLogs: [],
      symptoms: [],
      workouts: [],
    });

    expect(insights).toEqual([]);
  });

  it("attaches the available history range to generated insights", () => {
    const insights = buildRuleBasedInsights(insightInput);

    expect(insights.every((insight) => insight.dateRange.start === "2026-04-17")).toBe(
      true,
    );
    expect(insights.every((insight) => insight.dateRange.end === "2026-07-09")).toBe(
      true,
    );
  });
});
