import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import type {
  CyclePhase,
  IntensityLevel,
  MealLog,
  MealType,
  NutrientFocus,
  RecoveryLog,
  WorkoutLog,
  WorkoutType,
} from "@/domain";

const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Breakfast",
  dinner: "Dinner",
  lunch: "Lunch",
  snack: "Snack",
};

const nutrientLabels: Record<NutrientFocus, string> = {
  anti_inflammatory: "Anti-inflammatory",
  complex_carbs: "Complex carbs",
  fiber: "Fiber",
  hydration: "Hydration",
  iron_rich: "Iron-rich",
  magnesium_rich: "Magnesium-rich",
  protein_focused: "Protein-focused",
};

const workoutLabels: Record<WorkoutType, string> = {
  cardio: "Cardio",
  hiit: "HIIT",
  pilates: "Pilates",
  rest_day: "Rest day",
  stretching: "Stretching",
  strength_training: "Strength training",
  walking: "Walking",
  yoga: "Yoga",
};

const phaseLabels: Record<CyclePhase, string> = {
  follicular: "Follicular",
  luteal: "Luteal",
  menstrual: "Menstrual",
  ovulatory: "Ovulation",
};

type LoggingPrototypesCardProps = {
  meal?: MealLog;
  recovery?: RecoveryLog;
  workout?: WorkoutLog;
};

export function LoggingPrototypesCard({
  meal,
  recovery,
  workout,
}: LoggingPrototypesCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          description="Lightweight logging for pattern discovery, not calorie tracking or rigid performance scoring."
          eyebrow="Log prototypes"
          title="Food, workout, and recovery"
        />
        <Badge tone="secondary">Pattern-first</Badge>
      </div>

      <div className="mt-6 grid gap-4">
        <LogPrototypePanel
          accent="bg-primary"
          actionLabel="Save meal"
          eyebrow={meal ? mealTypeLabels[meal.mealType] : "Meal"}
          title={meal?.name ?? "No meal logged"}
        >
          <MeterGrid
            items={[
              {
                label: "Protein",
                value: meal?.proteinEstimate ?? 3,
              },
              {
                label: "Fiber",
                value: meal?.fiberEstimate ?? 3,
              },
              {
                label: "Hydration",
                value: meal?.hydrationEstimate ?? 3,
              },
            ]}
          />
          <ChipRow
            label="Nutrient focus"
            values={
              meal?.nutrientFocus.map((focus) => nutrientLabels[focus]) ?? [
                "Balanced",
              ]
            }
          />
          <KeyValue
            label="Cravings"
            value={meal?.cravingsPresent ? "Present" : "Not logged"}
          />
        </LogPrototypePanel>

        <LogPrototypePanel
          accent="bg-secondary"
          actionLabel="Save workout"
          eyebrow={workout?.cyclePhase ? phaseLabels[workout.cyclePhase] : "Cycle phase"}
          title={workout ? workoutLabels[workout.type] : "No workout logged"}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <KeyValue
              label="Duration"
              value={
                workout?.durationMinutes
                  ? `${workout.durationMinutes} min`
                  : "Recovery day"
              }
            />
            <KeyValue
              label="Recovery afterward"
              value={`${workout?.recoveryAfterward ?? 3}/5`}
            />
          </div>
          <MeterGrid
            items={[
              {
                label: "Intensity",
                value: workout?.intensity ?? 3,
              },
              {
                label: "Perceived effort",
                value: workout?.perceivedEffort ?? 3,
              },
            ]}
          />
        </LogPrototypePanel>

        <LogPrototypePanel
          accent="bg-phase-luteal"
          actionLabel="Save recovery"
          eyebrow="Readiness"
          title={`${recovery?.readinessScore ?? 0}% recovery score`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <KeyValue
              label="Sleep"
              value={`${recovery?.sleepHours ?? 0}h · ${
                recovery?.sleepQuality ?? 0
              }/5 quality`}
            />
            <KeyValue
              label="Fatigue"
              value={`${recovery?.fatigueLevel ?? 0}/5`}
            />
          </div>
          <MeterGrid
            items={[
              {
                label: "Hydration",
                value: recovery?.hydrationLevel ?? 3,
              },
              {
                label: "Stress",
                value: recovery?.stressLevel ?? 3,
              },
              {
                label: "Soreness",
                value: recovery?.sorenessLevel ?? 2,
              },
            ]}
          />
        </LogPrototypePanel>
      </div>
    </Card>
  );
}

type LogPrototypePanelProps = {
  accent: string;
  actionLabel: string;
  children: ReactNode;
  eyebrow: string;
  title: string;
};

function LogPrototypePanel({
  accent,
  actionLabel,
  children,
  eyebrow,
  title,
}: LogPrototypePanelProps) {
  return (
    <div className="overflow-hidden rounded-card border border-soft-stone bg-warm-cream">
      <div className={`h-1.5 ${accent}`} />
      <div className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary-text">
              {eyebrow}
            </p>
            <h3 className="mt-1 font-heading text-xl font-semibold text-primary-text">
              {title}
            </h3>
          </div>
          <Button className="h-11 px-4" disabled variant="secondary">
            {actionLabel}
          </Button>
        </div>
        <div className="mt-4 grid gap-4">{children}</div>
      </div>
    </div>
  );
}

type MeterGridProps = {
  items: Array<{
    label: string;
    value: IntensityLevel;
  }>;
};

function MeterGrid({ items }: MeterGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div className="rounded-2xl bg-surface p-3" key={item.label}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-primary-text">{item.label}</p>
            <span className="text-sm font-semibold text-secondary-text">
              {item.value}/5
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft-stone">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${item.value * 20}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type ChipRowProps = {
  label: string;
  values: string[];
};

function ChipRow({ label, values }: ChipRowProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-secondary-text">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
            key={value}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

type KeyValueProps = {
  label: string;
  value: string;
};

function KeyValue({ label, value }: KeyValueProps) {
  return (
    <div className="rounded-2xl bg-surface p-3">
      <p className="text-sm text-secondary-text">{label}</p>
      <p className="mt-1 font-medium text-primary-text">{value}</p>
    </div>
  );
}
