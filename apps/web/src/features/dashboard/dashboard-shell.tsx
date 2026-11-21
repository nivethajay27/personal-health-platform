"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { CyclePhaseCard } from "@/features/dashboard/cycle-phase-card";
import { DailyCheckInCard } from "@/features/dashboard/daily-check-in-card";
import { LocalDataControlsCard } from "@/features/dashboard/local-data-controls-card";
import { LoggingPrototypesCard } from "@/features/dashboard/logging-prototypes-card";
import { PatternVisualizationsCard } from "@/features/dashboard/pattern-visualizations-card";
import { PeriodStartCard } from "@/features/dashboard/period-start-card";
import {
  WebProfileSetup,
  type WebProfileSetupValues,
} from "@/features/profile/web-profile-setup";
import { addDays, getLocalDateString } from "@/lib/date";
import { deleteLocalRecord, localDb } from "@/storage";
import {
  buildCycleDay,
  buildRuleBasedInsights,
  daysBetween,
  getCycleSummary,
  type Cycle,
  type CyclePhase,
  type DailyCheckIn,
  type Insight,
  type MealLog,
  type RecoveryLog,
  type SymptomLog,
  type UserProfile,
  type WorkoutLog,
} from "@cycle-companion/core";

const WEB_LOCAL_USER_ID = "web-local-user";

const phaseGuidance: Record<CyclePhase, string> = {
  menstrual: "Prioritize rest, hydration, warm meals, and gentle movement.",
  follicular: "Build momentum with strength, fresh foods, and steady routines.",
  ovulatory: "Lean into peak energy with strength, cardio, and hydration.",
  luteal: "Support energy with magnesium-rich foods, complex carbs, and lower intensity movement.",
};

type ProfileState = "error" | "loading" | "ready";
type LocalDataState = "error" | "loading" | "local";

function percentFromLevel(level?: number) {
  return level ? `${level * 20}%` : "--";
}

function formatInsightCategory(insight: Insight) {
  return insight.category[0].toUpperCase() + insight.category.slice(1);
}

export function DashboardShell() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [profileState, setProfileState] = useState<ProfileState>("loading");

  const loadProfile = useCallback(async () => {
    setProfileState("loading");

    try {
      const [savedProfiles, savedCycles] = await Promise.all([
        localDb.getUserProfiles(),
        localDb.getCycles(),
      ]);
      const savedProfile = savedProfiles.find(
        (candidate) => candidate.id === WEB_LOCAL_USER_ID,
      );

      setProfile(savedProfile ?? null);
      setCycles(
        savedCycles.filter((cycle) => cycle.userId === WEB_LOCAL_USER_ID),
      );
      setProfileState("ready");
    } catch {
      setProfileState("error");
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadProfile);
  }, [loadProfile]);

  async function handleSetup(values: WebProfileSetupValues) {
    const now = new Date().toISOString();
    const nextProfile: UserProfile = {
      id: WEB_LOCAL_USER_ID,
      displayName: values.displayName,
      averageCycleLength: values.averageCycleLength,
      averagePeriodLength: values.averagePeriodLength,
      dietaryPreferences: [],
      fitnessGoal: "general_health",
      createdAt: now,
      updatedAt: now,
    };
    const initialCycle = createCycle(nextProfile, values.periodStartDate, now);

    await Promise.all([
      localDb.saveUserProfile(nextProfile),
      localDb.saveCycle(initialCycle),
    ]);
    setProfile(nextProfile);
    setCycles([initialCycle]);
    setProfileState("ready");
  }

  async function handlePeriodStart(periodStartDate: string) {
    if (!profile) return;

    const cycle = createCycle(profile, periodStartDate, new Date().toISOString());
    const latestCycle = getLatestCycle(cycles, getLocalDateString());

    await Promise.all([
      localDb.saveCycle(cycle),
      latestCycle && latestCycle.id !== cycle.id
        ? deleteLocalRecord("cycles", latestCycle.id)
        : Promise.resolve(),
    ]);
    setCycles((currentCycles) => [
      ...currentCycles.filter(
        (currentCycle) =>
          currentCycle.id !== cycle.id && currentCycle.id !== latestCycle?.id,
      ),
      cycle,
    ]);
  }

  if (profileState === "loading") return <LoadingScreen />;

  if (!profile) {
    return (
      <WebProfileSetup
        onComplete={handleSetup}
        storageUnavailable={profileState === "error"}
      />
    );
  }

  return (
    <PersonalDashboard
      cycles={cycles}
      onAllLocalDataCleared={loadProfile}
      onPeriodStart={handlePeriodStart}
      profile={profile}
    />
  );
}

function PersonalDashboard({
  cycles,
  onAllLocalDataCleared,
  onPeriodStart,
  profile,
}: {
  cycles: Cycle[];
  onAllLocalDataCleared: () => Promise<void>;
  onPeriodStart: (periodStartDate: string) => Promise<void>;
  profile: UserProfile;
}) {
  const [dayGreeting] = useState(getTimeBasedGreeting);
  const [today] = useState(getLocalDateString);
  const [localCheckIns, setLocalCheckIns] = useState<DailyCheckIn[]>([]);
  const [localMeals, setLocalMeals] = useState<MealLog[]>([]);
  const [localRecoveryLogs, setLocalRecoveryLogs] = useState<RecoveryLog[]>([]);
  const [localSymptoms, setLocalSymptoms] = useState<SymptomLog[]>([]);
  const [localWorkouts, setLocalWorkouts] = useState<WorkoutLog[]>([]);
  const [localDataState, setLocalDataState] = useState<LocalDataState>("loading");
  const [localDataRevision, setLocalDataRevision] = useState(0);

  const currentCycle = useMemo(
    () => getCurrentCycleWindow(profile, cycles, today),
    [cycles, profile, today],
  );
  const currentCycleDay = useMemo(
    () => buildCycleDay({ cycle: currentCycle, targetDate: today }),
    [currentCycle, today],
  );
  const cycleSummary = getCycleSummary(currentCycleDay);
  const currentPhase = cycleSummary.effectivePhase;
  const cycleDays = useMemo(() => buildCycleDays(currentCycle), [currentCycle]);
  const latestPeriodStartDate = useMemo(
    () => getLatestPeriodStartDate(cycles, today),
    [cycles, today],
  );

  const todayCheckIn = localCheckIns.find((checkIn) => checkIn.date === today);
  const todayMeal = localMeals.find((meal) => meal.date === today);
  const todayWorkout = localWorkouts.find((workout) => workout.date === today);
  const todayRecovery = localRecoveryLogs.find((recovery) => recovery.date === today);
  const todaySymptoms = localSymptoms.filter((symptom) => symptom.date === today);
  const hasLocalTodayData = Boolean(todayCheckIn) || todaySymptoms.length > 0;
  const currentCycleDates = useMemo(
    () => new Set(cycleDays.map((day) => day.date)),
    [cycleDays],
  );
  const cycleCheckIns = localCheckIns.filter((checkIn) => currentCycleDates.has(checkIn.date));
  const cycleRecoveryLogs = localRecoveryLogs.filter((log) => currentCycleDates.has(log.date));
  const cycleSymptoms = localSymptoms.filter((symptom) => currentCycleDates.has(symptom.date));
  const cycleWorkouts = localWorkouts.filter((workout) => currentCycleDates.has(workout.date));
  const insights = useMemo(
    () =>
      buildRuleBasedInsights({
        cycleDays,
        dailyCheckIns: cycleCheckIns,
        generatedAt: new Date().toISOString(),
        meals: localMeals.filter((meal) => currentCycleDates.has(meal.date)),
        recoveryLogs: cycleRecoveryLogs,
        symptoms: cycleSymptoms,
        userId: profile.id,
        workouts: cycleWorkouts,
      }),
    [
      currentCycleDates,
      cycleCheckIns,
      cycleDays,
      cycleRecoveryLogs,
      cycleSymptoms,
      cycleWorkouts,
      localMeals,
      profile.id,
    ],
  );

  const refreshLocalDashboardData = useCallback(
    async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
      if (showLoading) setLocalDataState("loading");

      try {
        const [savedCheckIns, savedMeals, savedRecoveryLogs, savedSymptoms, savedWorkouts] = await Promise.all([
          localDb.getDailyCheckIns(),
          localDb.getMealLogs(),
          localDb.getRecoveryLogs(),
          localDb.getSymptomLogs(),
          localDb.getWorkoutLogs(),
        ]);
        setLocalCheckIns(savedCheckIns.filter((record) => record.userId === profile.id));
        setLocalMeals(savedMeals.filter((record) => record.userId === profile.id));
        setLocalRecoveryLogs(savedRecoveryLogs.filter((record) => record.userId === profile.id));
        setLocalSymptoms(savedSymptoms.filter((record) => record.userId === profile.id));
        setLocalWorkouts(savedWorkouts.filter((record) => record.userId === profile.id));
        setLocalDataState("local");
      } catch {
        setLocalDataState("error");
      }
    },
    [profile.id],
  );

  useEffect(() => {
    void Promise.resolve().then(() =>
      refreshLocalDashboardData({ showLoading: false }),
    );
  }, [refreshLocalDashboardData]);

  const keyMetrics = [
    { label: "Energy", value: percentFromLevel(todayCheckIn?.energyLevel), detail: "Daily check-in" },
    { label: "Recovery", value: todayRecovery ? `${todayRecovery.readinessScore}%` : "--", detail: "Readiness score" },
    { label: "Sleep", value: todayCheckIn?.sleepHours ? `${todayCheckIn.sleepHours}h` : "--", detail: "Last night" },
    { label: "Symptoms", value: todaySymptoms.length ? `${todaySymptoms.length}` : "None", detail: "Logged today" },
  ];
  const localDataMessage =
    localDataState === "error"
      ? "Local storage is unavailable right now. Your data could not be loaded."
      : localDataState === "loading"
        ? "Checking this browser for your saved logs."
        : "Your profile and wellness logs stay in this browser.";

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch" id="cycle">
        <div className="grid gap-6">
          <CyclePhaseCard
            cycleDayNumber={cycleSummary.cycleDayNumber}
            cycleLength={profile.averageCycleLength}
            greeting={dayGreeting}
            phase={currentPhase}
            phaseProgress={cycleSummary.phaseProgress}
            predictionConfidence={cycleSummary.predictionConfidence}
            userName={profile.displayName}
          />

          <div className="grid gap-2">
            <Badge className="h-fit w-fit self-start" tone={localDataState === "error" ? "neutral" : "primary"}>
              {localDataState === "loading" ? "Checking local data" : "Private browser data"}
            </Badge>
            <p className="text-sm leading-6 text-secondary-text">{localDataMessage}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {keyMetrics.map((metric) => (
              <Card className="bg-warm-cream shadow-none" key={metric.label}>
                <p className="text-sm text-secondary-text">{metric.label}</p>
                <p className="mt-1 text-3xl font-semibold text-primary-text">{metric.value}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-secondary-text">{metric.detail}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge tone="secondary">Suggested focus</Badge>
                <h2 className="mt-3 font-heading text-2xl font-semibold text-primary-text">Support recovery today</h2>
              </div>
              <Badge>{cycleSummary.predictionConfidence}</Badge>
            </div>
            <p className="mt-4 leading-7 text-secondary-text">{phaseGuidance[currentPhase]}</p>
          </Card>

          <DailyCheckInCard
            checkIn={todayCheckIn}
            date={today}
            hasSavedLocalData={hasLocalTodayData}
            onSaved={handleLocalDataChanged}
            symptoms={todaySymptoms}
            userId={profile.id}
          />
        </div>
      </section>

      <PeriodStartCard latestPeriodStartDate={latestPeriodStartDate} onSave={onPeriodStart} />

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0" id="nutrition">
          <LoggingPrototypesCard
            cyclePhase={currentPhase}
            date={today}
            meal={todayMeal}
            onSaved={handleLocalDataChanged}
            recovery={todayRecovery}
            userId={profile.id}
            workout={todayWorkout}
          />
        </div>

        <Card id="insights">
          <SectionHeader
            description="Generated on this device from your cycle, food, workout, symptom, and recovery logs."
            eyebrow="Patterns"
            title="Personalized insights"
          />
          {insights.length ? (
            <div className="mt-6 grid gap-4">
              {insights.map((insight) => (
                <Card className="bg-warm-cream shadow-none" key={insight.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="primary">{formatInsightCategory(insight)}</Badge>
                    <Badge>{insight.priority} priority</Badge>
                  </div>
                  <h3 className="mt-4 font-heading text-xl font-semibold text-primary-text">{insight.title}</h3>
                  <p className="mt-2 leading-7 text-secondary-text">{insight.message}</p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-card bg-warm-cream p-5 text-sm leading-6 text-secondary-text">
              Log a few check-ins, meals, workouts, or recovery notes to begin seeing personal patterns here.
            </div>
          )}
        </Card>
      </section>

      <PatternVisualizationsCard
        cycleDays={cycleDays}
        dataMode={localDataState}
        dailyCheckIns={cycleCheckIns}
        localRecordCounts={{
          checkIns: localCheckIns.length,
          recovery: localRecoveryLogs.length,
          symptoms: localSymptoms.length,
          workouts: localWorkouts.length,
        }}
        recoveryLogs={cycleRecoveryLogs}
        symptoms={cycleSymptoms}
        workouts={cycleWorkouts}
      />

      <LocalDataControlsCard onLocalDataCleared={handleAllLocalDataCleared} refreshKey={localDataRevision} />
    </AppShell>
  );

  async function handleLocalDataChanged() {
    await refreshLocalDashboardData();
    setLocalDataRevision((revision) => revision + 1);
  }

  async function handleAllLocalDataCleared() {
    await onAllLocalDataCleared();
  }
}

function LoadingScreen() {
  return <main className="flex min-h-screen items-center justify-center bg-background px-6 text-secondary-text">Loading your private cycle space...</main>;
}

function createCycle(profile: UserProfile, startDate: string, timestamp: string): Cycle {
  return {
    id: `cycle-${profile.id}-${startDate}`,
    userId: profile.id,
    startDate,
    averageCycleLength: profile.averageCycleLength,
    averagePeriodLength: profile.averagePeriodLength,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function getCurrentCycleWindow(profile: UserProfile, cycles: Cycle[], targetDate: string): Cycle {
  const sourceCycle = [...cycles]
    .filter((cycle) => cycle.startDate <= targetDate)
    .sort((first, second) => second.startDate.localeCompare(first.startDate))[0] ??
    createCycle(profile, targetDate, profile.updatedAt);
  const elapsedDays = Math.max(daysBetween(sourceCycle.startDate, targetDate), 0);
  const cycleStartOffset = Math.floor(elapsedDays / Math.max(sourceCycle.averageCycleLength, 1)) * sourceCycle.averageCycleLength;
  const startDate = addDays(sourceCycle.startDate, cycleStartOffset);

  return { ...sourceCycle, id: `${sourceCycle.id}-${startDate}`, startDate, endDate: undefined };
}

function getLatestPeriodStartDate(cycles: Cycle[], today: string) {
  return getLatestCycle(cycles, today)?.startDate ?? today;
}

function getLatestCycle(cycles: Cycle[], today: string) {
  return [...cycles]
    .filter((cycle) => cycle.startDate <= today)
    .sort((first, second) => second.startDate.localeCompare(first.startDate))[0];
}

function buildCycleDays(cycle: Cycle) {
  return Array.from({ length: cycle.averageCycleLength }, (_, index) =>
    buildCycleDay({ cycle, targetDate: addDays(cycle.startDate, index) }),
  );
}

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
