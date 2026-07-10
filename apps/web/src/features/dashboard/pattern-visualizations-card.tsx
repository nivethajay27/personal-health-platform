"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import type {
  CycleDay,
  CyclePhase,
  DailyCheckIn,
  RecoveryLog,
  SymptomLog,
  SymptomType,
  WorkoutLog,
} from "@/domain";
import { cn } from "@/lib/utils";

type ChartView = "energy" | "symptoms" | "workouts" | "recovery";
type DataMode = "loading" | "local" | "demo" | "error";

const chartViews: Array<{
  label: string;
  value: ChartView;
}> = [
  { label: "Energy", value: "energy" },
  { label: "Symptoms", value: "symptoms" },
  { label: "Workout", value: "workouts" },
  { label: "Recovery", value: "recovery" },
];

const phaseLabels: Record<CyclePhase, string> = {
  follicular: "Follicular",
  luteal: "Luteal",
  menstrual: "Menstrual",
  ovulatory: "Ovulation",
};

const phaseOrder: CyclePhase[] = [
  "menstrual",
  "follicular",
  "ovulatory",
  "luteal",
];

const symptomLabels: Record<SymptomType, string> = {
  acne: "Acne",
  back_pain: "Back pain",
  bloating: "Bloating",
  breast_tenderness: "Tenderness",
  cramps: "Cramps",
  cravings: "Cravings",
  fatigue: "Fatigue",
  headache: "Headache",
  mood_swings: "Mood swings",
};

const displayedSymptoms: SymptomType[] = [
  "cramps",
  "bloating",
  "fatigue",
  "cravings",
  "headache",
  "mood_swings",
];

type PatternVisualizationsCardProps = {
  cycleDays: CycleDay[];
  dailyCheckIns: DailyCheckIn[];
  dataMode: DataMode;
  localRecordCounts: {
    checkIns: number;
    recovery: number;
    symptoms: number;
    workouts: number;
  };
  recoveryLogs: RecoveryLog[];
  symptoms: SymptomLog[];
  workouts: WorkoutLog[];
};

export function PatternVisualizationsCard({
  cycleDays,
  dailyCheckIns,
  dataMode,
  localRecordCounts,
  recoveryLogs,
  symptoms,
  workouts,
}: PatternVisualizationsCardProps) {
  const [activeView, setActiveView] = useState<ChartView>("energy");
  const {
    energyTrend,
    recoveryTrend,
    summaries,
    symptomHeatmap,
    workoutIntensityByPhase,
  } = useMemo(() => {
    const cycleDayByDate = new Map(
      cycleDays.map((day) => [day.date, day] as const),
    );

    const energyTrend = dailyCheckIns
      .map((checkIn) => {
        const cycleDay = cycleDayByDate.get(checkIn.date);

        return cycleDay
          ? {
              cycleDay: cycleDay.cycleDayNumber,
              energy: checkIn.energyLevel,
              phase: phaseLabels[cycleDay.estimatedPhase],
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => a.cycleDay - b.cycleDay);

    const recoveryTrend = recoveryLogs
      .map((recovery) => {
        const cycleDay = cycleDayByDate.get(recovery.date);

        return cycleDay
          ? {
              cycleDay: cycleDay.cycleDayNumber,
              phase: phaseLabels[cycleDay.estimatedPhase],
              readiness: recovery.readinessScore ?? 0,
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => a.cycleDay - b.cycleDay);

    const workoutIntensityByPhase = phaseOrder.map((phase) => {
      const phaseWorkouts = workouts.filter(
        (workout) => workout.cyclePhase === phase,
      );
      const averageIntensity = phaseWorkouts.length
        ? phaseWorkouts.reduce((sum, workout) => sum + workout.intensity, 0) /
          phaseWorkouts.length
        : 0;

      return {
        averageIntensity: Number(averageIntensity.toFixed(1)),
        phase: phaseLabels[phase],
      };
    });

    const symptomHeatmap = displayedSymptoms.map((symptom) => ({
      symptom,
      values: phaseOrder.map((phase) => {
        const count = symptoms.filter((entry) => {
          const cycleDay = cycleDayByDate.get(entry.date);
          return entry.symptom === symptom && cycleDay?.estimatedPhase === phase;
        }).length;

        return {
          count,
          phase,
        };
      }),
    }));

    return {
      energyTrend,
      recoveryTrend,
      summaries: {
        energy: getEnergySummary(energyTrend),
        recovery: getRecoverySummary(recoveryTrend),
        symptoms: getSymptomSummary(symptomHeatmap),
        workouts: getWorkoutSummary(workoutIntensityByPhase),
      },
      symptomHeatmap,
      workoutIntensityByPhase,
    };
  }, [cycleDays, dailyCheckIns, recoveryLogs, symptoms, workouts]);
  const localCount = getLocalCountForView(activeView, localRecordCounts);
  const hasEnoughLocalData = localCount >= getLocalThreshold(activeView);

  return (
    <Card id="patterns">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          description="Filter the visual layer to inspect one pattern at a time."
          eyebrow="Visual patterns"
          title="Trends across the cycle"
        />
        <div className="flex flex-wrap gap-2">
          <Badge tone="primary">Recharts</Badge>
          <Badge>{getDataModeLabel(dataMode)}</Badge>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {chartViews.map((view) => (
          <button
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              activeView === view.value
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-soft-stone bg-surface text-secondary-text hover:bg-warm-cream",
            )}
            key={view.value}
            onClick={() => setActiveView(view.value)}
            type="button"
          >
            {view.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <SummaryTile label="Pattern summary" value={summaries[activeView]} />
        <SummaryTile label="Data source" value={getDataSourceCopy(dataMode)} />
        <SummaryTile
          label="Local coverage"
          value={`${localCount} local ${getLocalCountLabel(activeView)}`}
        />
      </div>

      {!hasEnoughLocalData && dataMode === "local" ? (
        <PatternNotice
          message={`Showing demo baseline with ${localCount} local ${getLocalCountLabel(
            activeView,
          )}. More saved logs will make this view more personal.`}
        />
      ) : null}

      <div className="mt-6">
        {activeView === "energy" ? (
          <ChartPanel
            description="Energy tends to rise near ovulation and taper in late luteal days."
            hasData={energyTrend.length > 1}
            scaleLabel="Scale 1-5"
            title="Energy by cycle day"
          >
            <ResponsiveContainer height="100%" width="100%">
              <LineChart
                data={energyTrend}
                margin={{ bottom: 4, left: -24, right: 12, top: 12 }}
              >
                <CartesianGrid stroke="#e8e4de" strokeDasharray="4 4" />
                <XAxis
                  dataKey="cycleDay"
                  stroke="#727272"
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={[1, 5]}
                  stroke="#727272"
                  tickCount={5}
                  tickLine={false}
                  tickMargin={8}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(label) => `Cycle day ${label}`}
                />
                <Line
                  dataKey="energy"
                  dot={{ fill: "#7faf8a", r: 3 }}
                  isAnimationActive={false}
                  name="Energy"
                  stroke="#7faf8a"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>
        ) : null}

        {activeView === "workouts" ? (
          <ChartPanel
            description="Average logged workout intensity grouped by estimated phase."
            hasData={workoutIntensityByPhase.some(
              (phase) => phase.averageIntensity > 0,
            )}
            scaleLabel="Scale 0-5"
            title="Workout intensity by phase"
          >
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={workoutIntensityByPhase}
                margin={{ bottom: 4, left: -24, right: 8, top: 12 }}
              >
                <CartesianGrid stroke="#e8e4de" strokeDasharray="4 4" />
                <XAxis
                  dataKey="phase"
                  interval={0}
                  stroke="#727272"
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, 5]}
                  stroke="#727272"
                  tickCount={6}
                  tickLine={false}
                  tickMargin={8}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="averageIntensity"
                  fill="#b9a7d5"
                  isAnimationActive={false}
                  name="Average intensity"
                  radius={[12, 12, 4, 4]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        ) : null}

        {activeView === "recovery" ? (
          <ChartPanel
            description="Readiness combines sleep quality, hydration, fatigue, stress, and soreness."
            hasData={recoveryTrend.length > 1}
            scaleLabel="Score 0-100"
            title="Recovery readiness by cycle day"
          >
            <ResponsiveContainer height="100%" width="100%">
              <LineChart
                data={recoveryTrend}
                margin={{ bottom: 4, left: -16, right: 12, top: 12 }}
              >
                <CartesianGrid stroke="#e8e4de" strokeDasharray="4 4" />
                <XAxis
                  dataKey="cycleDay"
                  stroke="#727272"
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#727272"
                  tickCount={5}
                  tickLine={false}
                  tickMargin={8}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(label) => `Cycle day ${label}`}
                />
                <Line
                  dataKey="readiness"
                  dot={{ fill: "#d97b87", r: 3 }}
                  isAnimationActive={false}
                  name="Readiness"
                  stroke="#d97b87"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>
        ) : null}

        {activeView === "symptoms" ? (
          <div className="min-w-0 overflow-hidden rounded-card border border-soft-stone bg-warm-cream p-4">
            <ChartHeader
              description="Counts by phase, using soft intensity instead of alarm-style colors."
              scaleLabel="Counts"
              title="Symptom heatmap"
            />
            {symptoms.length ? (
              <div className="mt-5 max-w-full overflow-x-auto">
                <div className="min-w-[420px]">
                  <div className="grid grid-cols-[120px_repeat(4,minmax(64px,1fr))] gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-secondary-text">
                    <span>Symptom</span>
                    {phaseOrder.map((phase) => (
                      <span className="text-center" key={phase}>
                        {phaseLabels[phase]}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2">
                    {symptomHeatmap.map((row) => (
                      <div
                        className="grid grid-cols-[120px_repeat(4,minmax(64px,1fr))] items-center gap-2"
                        key={row.symptom}
                      >
                        <span className="text-sm font-medium text-primary-text">
                          {symptomLabels[row.symptom]}
                        </span>
                        {row.values.map((value) => (
                          <span
                            className="rounded-2xl px-3 py-2 text-center text-sm font-semibold text-primary-text"
                            key={`${row.symptom}-${value.phase}`}
                            style={{
                              backgroundColor: getHeatmapColor(value.count),
                            }}
                          >
                            {value.count}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyChartState message="No symptoms have been logged for this cycle yet." />
            )}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e8e4de",
  borderRadius: "16px",
  color: "#2d2d2d",
};

type ChartPanelProps = {
  children: React.ReactNode;
  description: string;
  hasData: boolean;
  scaleLabel: string;
  title: string;
};

function ChartPanel({
  children,
  description,
  hasData,
  scaleLabel,
  title,
}: ChartPanelProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-card border border-soft-stone bg-warm-cream p-4">
      <ChartHeader
        description={description}
        scaleLabel={scaleLabel}
        title={title}
      />
      <div className="mt-4 h-56 overflow-hidden">
        {hasData ? (
          children
        ) : (
          <EmptyChartState message="Not enough entries yet. Save more logs to build this chart." />
        )}
      </div>
    </div>
  );
}

type ChartHeaderProps = {
  description: string;
  scaleLabel: string;
  title: string;
};

function ChartHeader({ description, scaleLabel, title }: ChartHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 className="font-heading text-xl font-semibold text-primary-text">
          {title}
        </h3>
        <p className="mt-1 text-sm text-secondary-text">{description}</p>
      </div>
      <span className="text-sm font-medium text-secondary-text">
        {scaleLabel}
      </span>
    </div>
  );
}

type SummaryTileProps = {
  label: string;
  value: string;
};

function SummaryTile({ label, value }: SummaryTileProps) {
  return (
    <div className="rounded-card border border-soft-stone bg-warm-cream p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary-text">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-primary-text">{value}</p>
    </div>
  );
}

function PatternNotice({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-card border border-secondary/30 bg-secondary/10 p-4 text-sm leading-6 text-secondary-text">
      {message}
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-card border border-dashed border-soft-stone bg-surface p-6 text-center text-sm leading-6 text-secondary-text">
      {message}
    </div>
  );
}

function getHeatmapColor(count: number) {
  if (count >= 8) return "rgba(217, 123, 135, 0.48)";
  if (count >= 4) return "rgba(217, 123, 135, 0.28)";
  if (count >= 1) return "rgba(217, 123, 135, 0.14)";
  return "#ffffff";
}

function getEnergySummary(
  trend: Array<{ cycleDay: number; energy: number; phase: string }>,
) {
  if (trend.length < 2) return "Save more check-ins to compare energy patterns.";

  const peak = trend.reduce((best, item) =>
    item.energy > best.energy ? item : best,
  );

  return `Energy peaks around day ${peak.cycleDay} in ${peak.phase.toLowerCase()} data.`;
}

function getWorkoutSummary(
  phases: Array<{ averageIntensity: number; phase: string }>,
) {
  const strongestPhase = phases.reduce((best, item) =>
    item.averageIntensity > best.averageIntensity ? item : best,
  );

  if (!strongestPhase.averageIntensity) {
    return "Save workouts to compare intensity by phase.";
  }

  return `${strongestPhase.phase} currently has the highest average workout intensity.`;
}

function getRecoverySummary(
  trend: Array<{ cycleDay: number; readiness: number; phase: string }>,
) {
  if (trend.length < 2) return "Save recovery logs to compare readiness.";

  const averageReadiness = Math.round(
    trend.reduce((sum, item) => sum + item.readiness, 0) / trend.length,
  );

  return `Average readiness is ${averageReadiness}% across this cycle view.`;
}

function getSymptomSummary(
  rows: Array<{
    symptom: SymptomType;
    values: Array<{ count: number; phase: CyclePhase }>;
  }>,
) {
  const strongest = rows
    .flatMap((row) =>
      row.values.map((value) => ({
        count: value.count,
        phase: value.phase,
        symptom: row.symptom,
      })),
    )
    .reduce(
      (best, item) => (item.count > best.count ? item : best),
      { count: 0, phase: "menstrual" as CyclePhase, symptom: "cramps" as SymptomType },
    );

  if (!strongest.count) return "Save symptoms to compare phase patterns.";

  return `${symptomLabels[strongest.symptom]} appears most in ${phaseLabels[
    strongest.phase
  ].toLowerCase()} data.`;
}

function getDataModeLabel(dataMode: DataMode) {
  if (dataMode === "local") return "Local + demo";
  if (dataMode === "error") return "Demo fallback";
  if (dataMode === "loading") return "Checking data";

  return "Demo data";
}

function getDataSourceCopy(dataMode: DataMode) {
  if (dataMode === "local") return "Saved local logs are blended with demo history.";
  if (dataMode === "error") return "Storage is unavailable, so demo data is shown.";
  if (dataMode === "loading") return "Checking this browser for saved logs.";

  return "Demo baseline is shown until local logs are saved.";
}

function getLocalCountForView(
  view: ChartView,
  counts: PatternVisualizationsCardProps["localRecordCounts"],
) {
  if (view === "energy") return counts.checkIns;
  if (view === "recovery") return counts.recovery;
  if (view === "symptoms") return counts.symptoms;

  return counts.workouts;
}

function getLocalThreshold(view: ChartView) {
  if (view === "symptoms") return 1;
  return 2;
}

function getLocalCountLabel(view: ChartView) {
  if (view === "energy") return "check-ins";
  if (view === "recovery") return "recovery logs";
  if (view === "symptoms") return "symptom logs";

  return "workouts";
}
