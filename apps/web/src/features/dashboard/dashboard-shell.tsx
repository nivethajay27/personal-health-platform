import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { buildCycleDay, getCurrentCycle, getCycleSummary } from "@/core";
import { demoDataset } from "@/data";
import { CyclePhaseCard } from "@/features/dashboard/cycle-phase-card";
import { DailyCheckInCard } from "@/features/dashboard/daily-check-in-card";
import { LoggingPrototypesCard } from "@/features/dashboard/logging-prototypes-card";
import { PatternVisualizationsCard } from "@/features/dashboard/pattern-visualizations-card";
import type { CyclePhase, Insight } from "@/domain";

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
  const todayCheckIn = demoDataset.dailyCheckIns.find(
    (checkIn) => checkIn.date === DASHBOARD_DATE,
  );
  const todayMeal = demoDataset.meals.find((meal) => meal.date === DASHBOARD_DATE);
  const todayWorkout = demoDataset.workouts.find(
    (workout) => workout.date === DASHBOARD_DATE,
  );
  const todayRecovery = demoDataset.recoveryLogs.find(
    (recovery) => recovery.date === DASHBOARD_DATE,
  );
  const todaySymptoms = demoDataset.symptoms.filter(
    (symptom) => symptom.date === DASHBOARD_DATE,
  );

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

          <DailyCheckInCard checkIn={todayCheckIn} symptoms={todaySymptoms} />
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
            description="These are rule-based demo insights. Later, this section can become a richer insight engine."
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
        dailyCheckIns={demoDataset.dailyCheckIns.filter((checkIn) =>
          demoDataset.cycleDays.some(
            (day) =>
              day.cycleId === currentCycle.id && day.date === checkIn.date,
          ),
        )}
        symptoms={demoDataset.symptoms}
        workouts={demoDataset.workouts}
      />

      <p className="sr-only" id="next-steps">
        Next step: add richer dashboard components and visualizations.
      </p>
    </AppShell>
  );
}
