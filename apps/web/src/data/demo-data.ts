import type {
  CravingType,
  Cycle,
  CycleDay,
  CyclePhase,
  DailyCheckIn,
  IntensityLevel,
  MealLog,
  MealType,
  Mood,
  NutrientFocus,
  PrivacySettings,
  RecoveryLog,
  SymptomLog,
  SymptomType,
  UserProfile,
  WorkoutLog,
  WorkoutType,
} from "@/domain";
import { buildRuleBasedInsights } from "@/core";

const DEMO_USER_ID = "user_demo_001";
const DEMO_NOW = "2026-07-09T09:00:00.000Z";

export const demoUser: UserProfile = {
  id: DEMO_USER_ID,
  displayName: "Anaya",
  email: "demo@flowra.app",
  averageCycleLength: 28,
  averagePeriodLength: 5,
  fitnessGoal: "general_health",
  dietaryPreferences: ["high_protein", "balanced"],
  createdAt: "2026-04-17T09:00:00.000Z",
  updatedAt: DEMO_NOW,
};

export const demoPrivacySettings: PrivacySettings = {
  userId: DEMO_USER_ID,
  localFirstStorage: true,
  cloudSync: "disabled",
  analyticsEnabled: false,
  aiInsightsEnabled: false,
  updatedAt: DEMO_NOW,
};

export const demoCycles: Cycle[] = [
  {
    id: "cycle_demo_001",
    userId: DEMO_USER_ID,
    startDate: "2026-04-17",
    endDate: "2026-05-14",
    averageCycleLength: 28,
    averagePeriodLength: 5,
    createdAt: "2026-04-17T09:00:00.000Z",
    updatedAt: "2026-05-14T20:00:00.000Z",
  },
  {
    id: "cycle_demo_002",
    userId: DEMO_USER_ID,
    startDate: "2026-05-15",
    endDate: "2026-06-11",
    averageCycleLength: 28,
    averagePeriodLength: 5,
    createdAt: "2026-05-15T09:00:00.000Z",
    updatedAt: "2026-06-11T20:00:00.000Z",
  },
  {
    id: "cycle_demo_003",
    userId: DEMO_USER_ID,
    startDate: "2026-06-12",
    endDate: "2026-07-09",
    averageCycleLength: 28,
    averagePeriodLength: 5,
    createdAt: "2026-06-12T09:00:00.000Z",
    updatedAt: DEMO_NOW,
  },
];

const phaseByDay = (day: number): CyclePhase => {
  if (day <= 5) return "menstrual";
  if (day <= 13) return "follicular";
  if (day <= 16) return "ovulatory";
  return "luteal";
};

const addDays = (date: string, days: number) => {
  const nextDate = new Date(`${date}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate.toISOString().slice(0, 10);
};

const levelForPhase = (phase: CyclePhase, day: number): IntensityLevel => {
  if (phase === "ovulatory") return 5;
  if (phase === "follicular") return day % 2 === 0 ? 4 : 5;
  if (phase === "luteal") return day > 23 ? 2 : 3;
  return day <= 2 ? 2 : 3;
};

const moodForPhase = (phase: CyclePhase): Mood => {
  const moods: Record<CyclePhase, Mood> = {
    menstrual: "low",
    follicular: "energized",
    ovulatory: "happy",
    luteal: "sensitive",
  };

  return moods[phase];
};

const cravingsForPhase = (phase: CyclePhase): CravingType[] => {
  if (phase === "luteal") return ["sweet", "carbs"];
  if (phase === "menstrual") return ["chocolate"];
  return ["none"];
};

const mealPatternByPhase: Record<
  CyclePhase,
  {
    meal: string;
    mealType: MealType;
    nutrientFocus: NutrientFocus[];
  }
> = {
  menstrual: {
    meal: "Spinach omelet",
    mealType: "breakfast",
    nutrientFocus: ["iron_rich", "hydration"],
  },
  follicular: {
    meal: "Greek yogurt with berries",
    mealType: "breakfast",
    nutrientFocus: ["protein_focused", "fiber"],
  },
  ovulatory: {
    meal: "Salmon salad",
    mealType: "lunch",
    nutrientFocus: ["anti_inflammatory", "protein_focused", "hydration"],
  },
  luteal: {
    meal: "Oatmeal with chia",
    mealType: "breakfast",
    nutrientFocus: ["magnesium_rich", "complex_carbs", "protein_focused"],
  },
};

const workoutByPhase: Record<CyclePhase, WorkoutType[]> = {
  menstrual: ["rest_day", "walking", "yoga"],
  follicular: ["strength_training", "pilates", "cardio"],
  ovulatory: ["strength_training", "hiit", "cardio"],
  luteal: ["walking", "strength_training", "stretching", "yoga"],
};

export const demoCycleDays: CycleDay[] = demoCycles.flatMap((cycle) =>
  Array.from({ length: 28 }, (_, index) => {
    const cycleDayNumber = index + 1;
    const date = addDays(cycle.startDate, index);
    const estimatedPhase = phaseByDay(cycleDayNumber);

    return {
      id: `${cycle.id}_day_${cycleDayNumber.toString().padStart(2, "0")}`,
      cycleId: cycle.id,
      date,
      cycleDayNumber,
      estimatedPhase,
      predictionConfidence: cycleDayNumber <= 5 ? "confirmed" : "estimated",
      flow:
        cycleDayNumber <= 2
          ? "medium"
          : cycleDayNumber <= 5
            ? "light"
            : "none",
    };
  }),
);

export const demoDailyCheckIns: DailyCheckIn[] = demoCycleDays.map((day) => {
  const energyLevel = levelForPhase(day.estimatedPhase, day.cycleDayNumber);

  return {
    id: `checkin_${day.id}`,
    userId: DEMO_USER_ID,
    date: day.date,
    energyLevel,
    mood: moodForPhase(day.estimatedPhase),
    sleepHours:
      day.estimatedPhase === "luteal"
        ? 6.8
        : day.estimatedPhase === "menstrual"
          ? 7.8
          : 7.4,
    sleepQuality: day.estimatedPhase === "luteal" ? 3 : 4,
    cravings: cravingsForPhase(day.estimatedPhase),
    stressLevel: day.estimatedPhase === "luteal" ? 4 : 3,
    sorenessLevel: day.estimatedPhase === "ovulatory" ? 3 : 2,
    notes:
      day.cycleDayNumber === 24
        ? "Energy lower today. Kept movement gentle."
        : undefined,
    createdAt: `${day.date}T08:30:00.000Z`,
    updatedAt: `${day.date}T08:30:00.000Z`,
  };
});

export const demoMeals: MealLog[] = demoCycleDays.map((day) => {
  const pattern = mealPatternByPhase[day.estimatedPhase];

  return {
    id: `meal_${day.id}`,
    userId: DEMO_USER_ID,
    date: day.date,
    mealType: pattern.mealType,
    name: pattern.meal,
    cyclePhase: day.estimatedPhase,
    proteinEstimate: day.estimatedPhase === "menstrual" ? 3 : 4,
    fiberEstimate: day.estimatedPhase === "luteal" ? 4 : 3,
    hydrationEstimate: day.estimatedPhase === "ovulatory" ? 5 : 3,
    cravingsPresent: day.estimatedPhase === "luteal",
    nutrientFocus: pattern.nutrientFocus,
    createdAt: `${day.date}T12:00:00.000Z`,
  };
});

export const demoWorkouts: WorkoutLog[] = demoCycleDays.map((day, index) => {
  const options = workoutByPhase[day.estimatedPhase];
  const type = options[index % options.length];
  const isRestDay = type === "rest_day";
  const intensity = isRestDay
    ? 1
    : day.estimatedPhase === "ovulatory"
      ? 5
      : day.estimatedPhase === "follicular"
        ? 4
        : 2;

  return {
    id: `workout_${day.id}`,
    userId: DEMO_USER_ID,
    date: day.date,
    type,
    durationMinutes: isRestDay ? 0 : type === "walking" ? 30 : 45,
    intensity,
    perceivedEffort: intensity,
    cyclePhase: day.estimatedPhase,
    recoveryAfterward:
      day.estimatedPhase === "menstrual" || day.estimatedPhase === "luteal"
        ? 3
        : 4,
    notes: isRestDay ? "Rest day logged for recovery." : undefined,
    createdAt: `${day.date}T18:00:00.000Z`,
  };
});

export const demoRecoveryLogs: RecoveryLog[] = demoDailyCheckIns.map(
  (checkIn) => ({
    id: `recovery_${checkIn.id}`,
    userId: DEMO_USER_ID,
    date: checkIn.date,
    sleepHours: checkIn.sleepHours,
    sleepQuality: checkIn.sleepQuality,
    hydrationLevel: checkIn.energyLevel >= 4 ? 4 : 3,
    fatigueLevel: checkIn.energyLevel <= 2 ? 4 : 2,
    stressLevel: checkIn.stressLevel,
    sorenessLevel: checkIn.sorenessLevel,
    readinessScore: checkIn.energyLevel * 16 + (checkIn.sleepQuality ?? 3) * 4,
    createdAt: `${checkIn.date}T20:30:00.000Z`,
  }),
);

const symptomsForDay = (day: CycleDay): SymptomType[] => {
  if (day.estimatedPhase === "menstrual") return ["cramps", "fatigue"];
  if (day.estimatedPhase === "ovulatory" && day.cycleDayNumber === 14) {
    return ["bloating"];
  }
  if (day.estimatedPhase === "luteal" && day.cycleDayNumber >= 24) {
    return ["cravings", "bloating", "mood_swings"];
  }
  return [];
};

export const demoSymptoms: SymptomLog[] = demoCycleDays.flatMap((day) =>
  symptomsForDay(day).map((symptom, index) => ({
    id: `symptom_${day.id}_${index + 1}`,
    userId: DEMO_USER_ID,
    date: day.date,
    symptom,
    severity:
      day.estimatedPhase === "menstrual" || day.cycleDayNumber >= 24 ? 4 : 2,
    createdAt: `${day.date}T09:00:00.000Z`,
  })),
);

export const demoInsights = buildRuleBasedInsights({
  cycleDays: demoCycleDays,
  dailyCheckIns: demoDailyCheckIns,
  generatedAt: DEMO_NOW,
  meals: demoMeals,
  recoveryLogs: demoRecoveryLogs,
  symptoms: demoSymptoms,
  userId: DEMO_USER_ID,
  workouts: demoWorkouts,
});

export const demoDataset = {
  user: demoUser,
  privacySettings: demoPrivacySettings,
  cycles: demoCycles,
  cycleDays: demoCycleDays,
  dailyCheckIns: demoDailyCheckIns,
  meals: demoMeals,
  workouts: demoWorkouts,
  recoveryLogs: demoRecoveryLogs,
  symptoms: demoSymptoms,
  insights: demoInsights,
};
