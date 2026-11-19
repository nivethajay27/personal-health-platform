import {
  buildRuleBasedInsights,
  type CycleDay,
} from '@/core';
import {
  loadAllMealLogs,
  loadAllRecoveryLogs,
  loadAllWorkoutLogs,
  loadRecentDailyCheckIns,
} from '@/storage/mobile-database';

export async function buildMobileRuleBasedInsights(userId: string) {
  const [checkIns, meals, recoveryLogs, workouts] = await Promise.all([
    loadRecentDailyCheckIns({ limit: 90, userId }),
    loadAllMealLogs({ userId }),
    loadAllRecoveryLogs({ userId }),
    loadAllWorkoutLogs({ userId }),
  ]);

  if (checkIns.length < 6) return [];

  return buildRuleBasedInsights({
    cycleDays: checkIns.map((checkIn) => toCycleDay(checkIn)),
    dailyCheckIns: checkIns.map((checkIn) => ({
      createdAt: checkIn.updatedAt,
      cravings: checkIn.cravings,
      date: checkIn.date,
      energyLevel: checkIn.energyLevel,
      id: `mobile-check-in-${checkIn.date}`,
      mood: checkIn.mood,
      notes: checkIn.notes || undefined,
      sleepHours: checkIn.sleepHours ?? undefined,
      sleepQuality: checkIn.sleepQuality ?? undefined,
      sorenessLevel: checkIn.sorenessLevel ?? undefined,
      stressLevel: checkIn.stressLevel ?? undefined,
      updatedAt: checkIn.updatedAt,
      userId,
    })),
    generatedAt: new Date().toISOString(),
    meals: meals.map((meal) => ({
      cravingsPresent: meal.cravingsPresent,
      createdAt: meal.updatedAt,
      cyclePhase: meal.cyclePhase,
      date: meal.date,
      fiberEstimate: meal.fiberEstimate,
      hydrationEstimate: meal.hydrationEstimate,
      id: `mobile-meal-${meal.date}`,
      mealType: meal.mealType,
      name: meal.name || meal.mealType,
      notes: meal.notes || undefined,
      nutrientFocus: meal.nutrientFocus,
      proteinEstimate: meal.proteinEstimate,
      userId,
    })),
    recoveryLogs: recoveryLogs.map((recovery) => ({
      createdAt: recovery.updatedAt,
      date: recovery.date,
      fatigueLevel: recovery.fatigueLevel,
      hydrationLevel: recovery.hydrationLevel,
      id: `mobile-recovery-${recovery.date}`,
      notes: recovery.notes || undefined,
      readinessScore: recovery.readinessScore,
      sleepHours: recovery.sleepHours,
      sleepQuality: recovery.sleepQuality,
      sorenessLevel: recovery.sorenessLevel,
      stressLevel: recovery.stressLevel,
      userId,
    })),
    symptoms: checkIns.flatMap((checkIn) =>
      checkIn.symptoms.map((symptom) => ({
        createdAt: checkIn.updatedAt,
        date: checkIn.date,
        id: `mobile-symptom-${checkIn.date}-${symptom}`,
        severity: 3,
        symptom,
        userId,
      })),
    ),
    userId,
    workouts: workouts.map((workout) => ({
      createdAt: workout.updatedAt,
      cyclePhase: workout.cyclePhase,
      date: workout.date,
      durationMinutes: workout.durationMinutes,
      id: `mobile-workout-${workout.date}`,
      intensity: workout.intensity,
      notes: workout.notes || undefined,
      perceivedEffort: workout.perceivedEffort,
      recoveryAfterward: workout.recoveryAfterward,
      type: workout.type,
      userId,
    })),
  });
}

function toCycleDay(checkIn: Awaited<ReturnType<typeof loadRecentDailyCheckIns>>[number]): CycleDay {
  return {
    cycleDayNumber: 1,
    cycleId: `mobile-cycle-${checkIn.cyclePhase}`,
    date: checkIn.date,
    estimatedPhase: checkIn.cyclePhase,
    flow: 'none',
    id: `mobile-cycle-day-${checkIn.date}`,
    predictionConfidence: 'estimated',
  };
}
