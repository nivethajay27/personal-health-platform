import type {
  CycleDay,
  CyclePhase,
  DailyCheckIn,
  Insight,
  InsightPriority,
  MealLog,
  RecoveryLog,
  SymptomLog,
  WorkoutLog,
  WorkoutType,
} from "@/domain";

type BuildRuleBasedInsightsInput = {
  cycleDays: CycleDay[];
  dailyCheckIns: DailyCheckIn[];
  generatedAt: string;
  meals: MealLog[];
  recoveryLogs: RecoveryLog[];
  symptoms: SymptomLog[];
  userId: string;
  workouts: WorkoutLog[];
};

type PhaseAverages = Record<CyclePhase, number>;

const phaseOrder: CyclePhase[] = [
  "menstrual",
  "follicular",
  "ovulatory",
  "luteal",
];

const gentleWorkoutTypes: WorkoutType[] = [
  "rest_day",
  "walking",
  "yoga",
  "stretching",
];

const priorityRank: Record<InsightPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function buildRuleBasedInsights({
  cycleDays,
  dailyCheckIns,
  generatedAt,
  meals,
  recoveryLogs,
  symptoms,
  userId,
  workouts,
}: BuildRuleBasedInsightsInput): Insight[] {
  const cycleDayByDate = new Map(cycleDays.map((day) => [day.date, day]));
  const dateRange = getDateRange(cycleDays);

  const insights = [
    buildEnergyPeakInsight({
      cycleDayByDate,
      dailyCheckIns,
      dateRange,
      generatedAt,
      userId,
      workouts,
    }),
    buildLutealCravingsInsight({
      cycleDayByDate,
      dailyCheckIns,
      dateRange,
      generatedAt,
      meals,
      userId,
    }),
    buildLowSleepEnergyInsight({
      dailyCheckIns,
      dateRange,
      generatedAt,
      recoveryLogs,
      userId,
    }),
    buildGentleMovementInsight({
      dailyCheckIns,
      dateRange,
      generatedAt,
      recoveryLogs,
      userId,
      workouts,
    }),
    buildSymptomPhaseInsight({
      cycleDayByDate,
      dateRange,
      generatedAt,
      symptoms,
      userId,
    }),
  ].filter((insight): insight is Insight => Boolean(insight));

  return insights.sort(
    (a, b) => priorityRank[b.priority] - priorityRank[a.priority],
  );
}

type RuleContext = {
  dateRange: Insight["dateRange"];
  generatedAt: string;
  userId: string;
};

type PhaseRuleContext = RuleContext & {
  cycleDayByDate: Map<string, CycleDay>;
};

function buildEnergyPeakInsight({
  cycleDayByDate,
  dailyCheckIns,
  dateRange,
  generatedAt,
  userId,
  workouts,
}: PhaseRuleContext & {
  dailyCheckIns: DailyCheckIn[];
  workouts: WorkoutLog[];
}): Insight | null {
  const energyByPhase = averageCheckInValueByPhase({
    checkIns: dailyCheckIns,
    cycleDayByDate,
    getValue: (checkIn) => checkIn.energyLevel,
  });
  const workoutByPhase = averageWorkoutIntensityByPhase(workouts);

  if (energyByPhase.ovulatory < 4.5 || workoutByPhase.ovulatory < 4) {
    return null;
  }

  return {
    id: "rule_energy_ovulation_peak",
    userId,
    title: "Energy appears strongest near ovulation",
    message:
      "Demo logs show energy and workout intensity trending higher around ovulation days. This can help users plan more demanding movement when it feels supportive.",
    category: "cycle",
    priority: "medium",
    sources: ["cycle", "daily_check_in", "workouts"],
    relatedPhase: "ovulatory",
    trendDirection: "up",
    dateRange,
    generatedAt,
  };
}

function buildLutealCravingsInsight({
  cycleDayByDate,
  dailyCheckIns,
  dateRange,
  generatedAt,
  meals,
  userId,
}: PhaseRuleContext & {
  dailyCheckIns: DailyCheckIn[];
  meals: MealLog[];
}): Insight | null {
  const lutealCravingCheckIns = dailyCheckIns.filter((checkIn) => {
    const cycleDay = cycleDayByDate.get(checkIn.date);
    return (
      cycleDay?.estimatedPhase === "luteal" &&
      checkIn.cravings.some((craving) => craving !== "none")
    );
  });
  const lutealCravingMeals = meals.filter((meal) => {
    const cycleDay = cycleDayByDate.get(meal.date);
    return cycleDay?.estimatedPhase === "luteal" && meal.cravingsPresent;
  });

  if (lutealCravingCheckIns.length + lutealCravingMeals.length < 6) {
    return null;
  }

  return {
    id: "rule_luteal_cravings",
    userId,
    title: "Cravings show up often in luteal logs",
    message:
      "Cravings appear more often during luteal days, alongside magnesium-rich and complex-carb meal patterns. The app can surface nourishment-focused suggestions without calorie tracking.",
    category: "nutrition",
    priority: "high",
    sources: ["cycle", "daily_check_in", "meals"],
    relatedPhase: "luteal",
    trendDirection: "up",
    dateRange,
    generatedAt,
  };
}

function buildLowSleepEnergyInsight({
  dailyCheckIns,
  dateRange,
  generatedAt,
  recoveryLogs,
  userId,
}: RuleContext & {
  dailyCheckIns: DailyCheckIn[];
  recoveryLogs: RecoveryLog[];
}): Insight | null {
  const recoveryByDate = new Map(
    recoveryLogs.map((recovery) => [recovery.date, recovery]),
  );
  const lowerSleepDays = dailyCheckIns.filter((checkIn) => {
    const recovery = recoveryByDate.get(checkIn.date);
    return (
      (checkIn.sleepHours ?? recovery?.sleepHours ?? 8) < 7 &&
      checkIn.energyLevel <= 3
    );
  });

  if (lowerSleepDays.length < 8) {
    return null;
  }

  return {
    id: "rule_sleep_energy_dip",
    userId,
    title: "Lower sleep often appears with lower energy",
    message:
      "Days under 7 hours of sleep often appear near lower energy check-ins in the demo data. This is a pattern cue, not a diagnosis or treatment recommendation.",
    category: "recovery",
    priority: "medium",
    sources: ["daily_check_in", "recovery"],
    trendDirection: "down",
    dateRange,
    generatedAt,
  };
}

function buildGentleMovementInsight({
  dailyCheckIns,
  dateRange,
  generatedAt,
  recoveryLogs,
  userId,
  workouts,
}: RuleContext & {
  dailyCheckIns: DailyCheckIn[];
  recoveryLogs: RecoveryLog[];
  workouts: WorkoutLog[];
}): Insight | null {
  const checkInByDate = new Map(
    dailyCheckIns.map((checkIn) => [checkIn.date, checkIn]),
  );
  const recoveryByDate = new Map(
    recoveryLogs.map((recovery) => [recovery.date, recovery]),
  );
  const gentleLowEnergyDays = workouts.filter((workout) => {
    const checkIn = checkInByDate.get(workout.date);
    const recovery = recoveryByDate.get(workout.date);

    return (
      gentleWorkoutTypes.includes(workout.type) &&
      ((checkIn?.energyLevel ?? 5) <= 3 ||
        (recovery?.fatigueLevel ?? 1) >= 4)
    );
  });

  if (gentleLowEnergyDays.length < 8) {
    return null;
  }

  return {
    id: "rule_gentle_movement_low_energy",
    userId,
    title: "Gentle movement appears on lower-energy days",
    message:
      "Walking, yoga, stretching, and rest days show up often when energy is lower or fatigue is higher. This supports flexible workout suggestions by cycle context.",
    category: "workout",
    priority: "medium",
    sources: ["daily_check_in", "workouts", "recovery"],
    trendDirection: "stable",
    dateRange,
    generatedAt,
  };
}

function buildSymptomPhaseInsight({
  cycleDayByDate,
  dateRange,
  generatedAt,
  symptoms,
  userId,
}: PhaseRuleContext & {
  symptoms: SymptomLog[];
}): Insight | null {
  const lutealSymptoms = symptoms.filter((symptom) => {
    const cycleDay = cycleDayByDate.get(symptom.date);
    return (
      cycleDay?.estimatedPhase === "luteal" &&
      ["bloating", "cravings", "mood_swings"].includes(symptom.symptom)
    );
  });

  if (lutealSymptoms.length < 6) {
    return null;
  }

  return {
    id: "rule_luteal_symptom_cluster",
    userId,
    title: "A luteal symptom cluster appears in the logs",
    message:
      "Bloating, cravings, and mood shifts show up together in several luteal entries. The app can group these as a pattern while keeping the language non-medical.",
    category: "symptoms",
    priority: "low",
    sources: ["cycle", "symptoms"],
    relatedPhase: "luteal",
    trendDirection: "up",
    dateRange,
    generatedAt,
  };
}

function averageCheckInValueByPhase({
  checkIns,
  cycleDayByDate,
  getValue,
}: {
  checkIns: DailyCheckIn[];
  cycleDayByDate: Map<string, CycleDay>;
  getValue: (checkIn: DailyCheckIn) => number | undefined;
}): PhaseAverages {
  return phaseOrder.reduce((averages, phase) => {
    const values = checkIns
      .filter((checkIn) => cycleDayByDate.get(checkIn.date)?.estimatedPhase === phase)
      .map(getValue)
      .filter((value): value is number => typeof value === "number");

    return {
      ...averages,
      [phase]: average(values),
    };
  }, {} as PhaseAverages);
}

function averageWorkoutIntensityByPhase(workouts: WorkoutLog[]): PhaseAverages {
  return phaseOrder.reduce((averages, phase) => {
    const values = workouts
      .filter((workout) => workout.cyclePhase === phase)
      .map((workout) => workout.intensity);

    return {
      ...averages,
      [phase]: average(values),
    };
  }, {} as PhaseAverages);
}

function average(values: number[]) {
  if (!values.length) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getDateRange(cycleDays: CycleDay[]): Insight["dateRange"] {
  const dates = cycleDays.map((day) => day.date).sort();

  return {
    start: dates[0] ?? "",
    end: dates[dates.length - 1] ?? "",
  };
}
