"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { buildCycleDay, getCurrentCycle, getCycleSummary } from "@/core";
import { demoDataset } from "@/data";
import { CyclePhaseCard } from "@/features/dashboard/cycle-phase-card";
import { DailyCheckInCard } from "@/features/dashboard/daily-check-in-card";
import { LocalDataControlsCard } from "@/features/dashboard/local-data-controls-card";
import { LoggingPrototypesCard } from "@/features/dashboard/logging-prototypes-card";
import { PatternVisualizationsCard } from "@/features/dashboard/pattern-visualizations-card";
import type { CyclePhase, DailyCheckIn, Insight, SymptomLog } from "@/domain";
import { localDb } from "@/storage";

const DASHBOARD_DATE = "2026-07-09";

const phaseGuidance: Record<CyclePhase, string> = {
  menstrual: "Prioritize rest, hydration, warm meals, and gentle movement.",
  follicular: "Build momentum with strength, fresh foods, and steady routines.",
  ovulatory: "Lean into peak energy with strength, cardio, and hydration.",
  luteal: "Support energy with magnesium-rich foods, complex carbs, and lower intensity movement.",
};

function percentFromLevel(level = 0) {
  return `${level * 20}%`;
}

function formatInsightCategory(insight: Insight) {
  return insight.category[0].toUpperCase() + insight.category.slice(1);
}

export function DashboardShell() {
  const [localCheckIns, setLocalCheckIns] = useState<DailyCheckIn[]>([]);
  const [localSymptoms, setLocalSymptoms] = useState<SymptomLog[]>([]);
  const [localDataStatus, setLocalDataStatus] = useState<
    "loading" | "local" | "demo" | "error"
  >("demo");
  const [localDataRevision, setLocalDataRevision] = useState(0);
  const currentCycle =
    getCurrentCycle(demoDataset.cycles, DASHBOARD_DATE) ??
    demoDataset.cycles[demoDataset.cycles.length - 1];
  const currentCycleDay =
    demoDataset.cycleDays.find(
      (day) => day.cycleId === currentCycle.id && day.date === DASHBOARD_DATE,
    ) ??
    buildCycleDay({
      cycle: currentCycle,
      targetDate: DASHBOARD_DATE,
    });
  const cycleSummary = getCycleSummary(currentCycleDay);
  const currentPhase = cycleSummary.effectivePhase;
  const demoTodayCheckIn = demoDataset.dailyCheckIns.find(
    (checkIn) => checkIn.date === DASHBOARD_DATE,
  );
  const todayMeal = demoDataset.meals.find((meal) => meal.date === DASHBOARD_DATE);
  const todayWorkout = demoDataset.workouts.find(
    (workout) => workout.date === DASHBOARD_DATE,
  );
  const todayRecovery = demoDataset.recoveryLogs.find(
    (recovery) => recovery.date === DASHBOARD_DATE,
  );
  const demoTodaySymptoms = demoDataset.symptoms.filter(
    (symptom) => symptom.date === DASHBOARD_DATE,
  );
  const localTodayCheckIn = localCheckIns.find(
    (checkIn) =>
      checkIn.userId === demoDataset.user.id && checkIn.date === DASHBOARD_DATE,
  );
  const localTodaySymptoms = localSymptoms.filter(
    (symptom) =>
      symptom.userId === demoDataset.user.id && symptom.date === DASHBOARD_DATE,
  );
  const hasLocalTodayData =
    Boolean(localTodayCheckIn) || localTodaySymptoms.length > 0;
  const todayCheckIn = localTodayCheckIn ?? demoTodayCheckIn;
  const todaySymptoms = hasLocalTodayData
    ? localTodaySymptoms
    : demoTodaySymptoms;
  const dailyCheckInsForCurrentCycle = useMemo(
    () =>
      mergeLocalCheckInsForCycle({
        cycleId: currentCycle.id,
        demoCheckIns: demoDataset.dailyCheckIns,
        localCheckIns,
      }),
    [currentCycle.id, localCheckIns],
  );
  const symptomsForCurrentCycle = useMemo(
    () =>
      mergeLocalSymptomsForCycle({
        cycleId: currentCycle.id,
        demoSymptoms: demoDataset.symptoms,
        localSymptoms,
      }),
    [currentCycle.id, localSymptoms],
  );
  const localDataBadge =
    localDataStatus === "local"
      ? "Using local data"
      : localDataStatus === "error"
        ? "Demo mode"
        : localDataStatus === "loading"
          ? "Checking local data"
          : "Demo mode";

  useEffect(() => {
    void refreshLocalDashboardData({ showLoading: false });
  }, []);

  const keyMetrics = [
    {
      label: "Energy",
      value: percentFromLevel(todayCheckIn?.energyLevel),
      detail: "Daily check-in",
    },
    {
      label: "Recovery",
      value: `${todayRecovery?.readinessScore ?? 0}%`,
      detail: "Readiness score",
    },
    {
      label: "Sleep",
      value: `${todayCheckIn?.sleepHours ?? 0}h`,
      detail: "Last night",
    },
    {
      label: "Symptoms",
      value: todaySymptoms.length ? `${todaySymptoms.length}` : "None",
      detail: "Logged today",
    },
  ];

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <div className="grid gap-6">
          <CyclePhaseCard
            cycleDayNumber={cycleSummary.cycleDayNumber}
            phase={currentPhase}
            phaseProgress={cycleSummary.phaseProgress}
            predictionConfidence={cycleSummary.predictionConfidence}
            userName={demoDataset.user.displayName}
          />

          <Badge
            className="h-fit w-fit self-start"
            tone={localDataStatus === "local" ? "primary" : "neutral"}
          >
            {localDataBadge}
          </Badge>

          <div className="grid gap-3 sm:grid-cols-2">
            {keyMetrics.map((metric) => (
              <Card className="bg-warm-cream shadow-none" key={metric.label}>
                <p className="text-sm text-secondary-text">{metric.label}</p>
                <p className="mt-1 text-3xl font-semibold text-primary-text">
                  {metric.value}
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-secondary-text">
                  {metric.detail}
                </p>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge tone="secondary">Suggested focus</Badge>
                <h2 className="mt-3 font-heading text-2xl font-semibold text-primary-text">
                  Support recovery today
                </h2>
              </div>
              <Badge>{cycleSummary.predictionConfidence}</Badge>
            </div>
            <p className="mt-4 leading-7 text-secondary-text">
              {phaseGuidance[currentPhase]}
            </p>
          </Card>

          <DailyCheckInCard
            checkIn={todayCheckIn}
            date={DASHBOARD_DATE}
            onSaved={handleLocalDataChanged}
            symptoms={todaySymptoms}
            userId={demoDataset.user.id}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <LoggingPrototypesCard
          meal={todayMeal}
          recovery={todayRecovery}
          workout={todayWorkout}
        />

        <Card>
          <SectionHeader
            description="Generated from rule checks across cycle, food, workout, symptom, and recovery demo data."
            eyebrow="Patterns"
            title="Personalized insights"
          />

          <div className="mt-6 grid gap-4">
            {demoDataset.insights.map((insight) => (
              <Card className="bg-warm-cream shadow-none" key={insight.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="primary">{formatInsightCategory(insight)}</Badge>
                  <Badge>{insight.priority} priority</Badge>
                </div>
                <h3 className="mt-4 font-heading text-xl font-semibold text-primary-text">
                  {insight.title}
                </h3>
                <p className="mt-2 leading-7 text-secondary-text">
                  {insight.message}
                </p>
              </Card>
            ))}
          </div>
        </Card>
      </section>

      <PatternVisualizationsCard
        cycleDays={demoDataset.cycleDays.filter(
          (day) => day.cycleId === currentCycle.id,
        )}
        dailyCheckIns={dailyCheckInsForCurrentCycle}
        symptoms={symptomsForCurrentCycle}
        workouts={demoDataset.workouts}
      />

      <LocalDataControlsCard
        onLocalDataCleared={handleLocalDataChanged}
        refreshKey={localDataRevision}
      />

      <p className="sr-only" id="next-steps">
        Next step: add richer dashboard components and visualizations.
      </p>
    </AppShell>
  );

  async function refreshLocalDashboardData({
    showLoading = true,
  }: {
    showLoading?: boolean;
  } = {}) {
    if (showLoading) {
      setLocalDataStatus("loading");
    }

    try {
      const [savedCheckIns, savedSymptoms] = await Promise.all([
        localDb.getDailyCheckIns(),
        localDb.getSymptomLogs(),
      ]);
      const userCheckIns = savedCheckIns.filter(
        (checkIn) => checkIn.userId === demoDataset.user.id,
      );
      const userSymptoms = savedSymptoms.filter(
        (symptom) => symptom.userId === demoDataset.user.id,
      );

      setLocalCheckIns(userCheckIns);
      setLocalSymptoms(userSymptoms);
      setLocalDataStatus(
        userCheckIns.length || userSymptoms.length ? "local" : "demo",
      );
    } catch {
      setLocalDataStatus("error");
    }
  }

  async function handleLocalDataChanged() {
    await refreshLocalDashboardData();
    setLocalDataRevision((revision) => revision + 1);
  }
}

function mergeLocalCheckInsForCycle({
  cycleId,
  demoCheckIns,
  localCheckIns,
}: {
  cycleId: string;
  demoCheckIns: DailyCheckIn[];
  localCheckIns: DailyCheckIn[];
}) {
  const cycleDates = new Set(
    demoDataset.cycleDays
      .filter((day) => day.cycleId === cycleId)
      .map((day) => day.date),
  );
  const localByDate = new Map(
    localCheckIns
      .filter((checkIn) => cycleDates.has(checkIn.date))
      .map((checkIn) => [checkIn.date, checkIn]),
  );

  return demoCheckIns
    .filter((checkIn) => cycleDates.has(checkIn.date))
    .map((checkIn) => localByDate.get(checkIn.date) ?? checkIn);
}

function mergeLocalSymptomsForCycle({
  cycleId,
  demoSymptoms,
  localSymptoms,
}: {
  cycleId: string;
  demoSymptoms: SymptomLog[];
  localSymptoms: SymptomLog[];
}) {
  const cycleDates = new Set(
    demoDataset.cycleDays
      .filter((day) => day.cycleId === cycleId)
      .map((day) => day.date),
  );
  const datesWithLocalSymptoms = new Set(
    localSymptoms
      .filter((symptom) => cycleDates.has(symptom.date))
      .map((symptom) => symptom.date),
  );
  const demoWithoutLocalDates = demoSymptoms.filter(
    (symptom) =>
      cycleDates.has(symptom.date) && !datesWithLocalSymptoms.has(symptom.date),
  );
  const localForCycle = localSymptoms.filter((symptom) =>
    cycleDates.has(symptom.date),
  );

  return [...demoWithoutLocalDates, ...localForCycle];
}
