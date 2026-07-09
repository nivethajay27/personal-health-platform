"use client";

import { useMemo } from "react";
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
  SymptomLog,
  SymptomType,
  WorkoutLog,
} from "@/domain";

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
  symptoms: SymptomLog[];
  workouts: WorkoutLog[];
};

export function PatternVisualizationsCard({
  cycleDays,
  dailyCheckIns,
  symptoms,
  workouts,
}: PatternVisualizationsCardProps) {
  const { energyTrend, symptomHeatmap, workoutIntensityByPhase } =
    useMemo(() => {
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
            return (
              entry.symptom === symptom && cycleDay?.estimatedPhase === phase
            );
          }).length;

          return {
            count,
            phase,
          };
        }),
      }));

      return {
        energyTrend,
        symptomHeatmap,
        workoutIntensityByPhase,
      };
    }, [cycleDays, dailyCheckIns, symptoms, workouts]);

  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          description="Early visual layer showing how cycle, check-in, workout, and symptom data can become patterns."
          eyebrow="Visual patterns"
          title="Trends across the cycle"
        />
        <Badge tone="primary">Recharts</Badge>
      </div>

      <div className="mt-6 grid gap-5">
        <div className="rounded-card border border-soft-stone bg-warm-cream p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-heading text-xl font-semibold text-primary-text">
                Energy by cycle day
              </h3>
              <p className="mt-1 text-sm text-secondary-text">
                Demo check-ins show energy rising near ovulation and tapering in
                luteal days.
              </p>
            </div>
            <span className="text-sm font-medium text-secondary-text">
              Scale 1-5
            </span>
          </div>

          <div className="mt-4 h-56">
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
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e8e4de",
                    borderRadius: "16px",
                    color: "#2d2d2d",
                  }}
                  labelFormatter={(label) => `Cycle day ${label}`}
                />
                <Line
                  dataKey="energy"
                  dot={{ fill: "#7faf8a", r: 3 }}
                  isAnimationActive={false}
                  stroke="#7faf8a"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-card border border-soft-stone bg-warm-cream p-4">
            <h3 className="font-heading text-xl font-semibold text-primary-text">
              Workout intensity by phase
            </h3>
            <p className="mt-1 text-sm text-secondary-text">
              Average logged workout intensity grouped by estimated phase.
            </p>

            <div className="mt-4 h-52">
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
                  <Tooltip
                    contentStyle={{
                      background: "#ffffff",
                      border: "1px solid #e8e4de",
                      borderRadius: "16px",
                      color: "#2d2d2d",
                    }}
                  />
                  <Bar
                    dataKey="averageIntensity"
                    fill="#b9a7d5"
                    isAnimationActive={false}
                    radius={[12, 12, 4, 4]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-card border border-soft-stone bg-warm-cream p-4">
            <h3 className="font-heading text-xl font-semibold text-primary-text">
              Symptom heatmap
            </h3>
            <p className="mt-1 text-sm text-secondary-text">
              Counts by phase, using soft intensity instead of alarm-style
              colors.
            </p>

            <div className="mt-5 overflow-x-auto">
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
          </div>
        </div>
      </div>
    </Card>
  );
}

function getHeatmapColor(count: number) {
  if (count >= 8) return "rgba(217, 123, 135, 0.48)";
  if (count >= 4) return "rgba(217, 123, 135, 0.28)";
  if (count >= 1) return "rgba(217, 123, 135, 0.14)";
  return "#ffffff";
}
