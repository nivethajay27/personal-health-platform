"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";
import { localDb } from "@/storage";

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

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const nutrientFocuses: NutrientFocus[] = [
  "protein_focused",
  "fiber",
  "hydration",
  "iron_rich",
  "magnesium_rich",
  "complex_carbs",
];
const workoutTypes: WorkoutType[] = [
  "walking",
  "yoga",
  "pilates",
  "strength_training",
  "cardio",
  "hiit",
  "stretching",
  "rest_day",
];

type SaveState = "idle" | "saving" | "saved" | "error";

type LoggingPrototypesCardProps = {
  cyclePhase: CyclePhase;
  date: string;
  meal?: MealLog;
  onSaved?: () => Promise<void> | void;
  recovery?: RecoveryLog;
  userId: string;
  workout?: WorkoutLog;
};

export function LoggingPrototypesCard({
  cyclePhase,
  date,
  meal,
  onSaved,
  recovery,
  userId,
  workout,
}: LoggingPrototypesCardProps) {
  const [mealType, setMealType] = useState<MealType>(
    meal?.mealType ?? "breakfast",
  );
  const [mealName, setMealName] = useState(meal?.name ?? "");
  const [proteinEstimate, setProteinEstimate] = useState<IntensityLevel>(
    meal?.proteinEstimate ?? 3,
  );
  const [fiberEstimate, setFiberEstimate] = useState<IntensityLevel>(
    meal?.fiberEstimate ?? 3,
  );
  const [hydrationEstimate, setHydrationEstimate] = useState<IntensityLevel>(
    meal?.hydrationEstimate ?? 3,
  );
  const [cravingsPresent, setCravingsPresent] = useState(
    meal?.cravingsPresent ?? false,
  );
  const [selectedNutrients, setSelectedNutrients] = useState<NutrientFocus[]>(
    meal?.nutrientFocus?.length ? meal.nutrientFocus : ["protein_focused"],
  );
  const [mealNotes, setMealNotes] = useState(meal?.notes ?? "");

  const [workoutType, setWorkoutType] = useState<WorkoutType>(
    workout?.type ?? "walking",
  );
  const [durationMinutes, setDurationMinutes] = useState(
    workout?.durationMinutes ?? 30,
  );
  const [intensity, setIntensity] = useState<IntensityLevel>(
    workout?.intensity ?? 3,
  );
  const [perceivedEffort, setPerceivedEffort] = useState<IntensityLevel>(
    workout?.perceivedEffort ?? 3,
  );
  const [recoveryAfterward, setRecoveryAfterward] = useState<IntensityLevel>(
    workout?.recoveryAfterward ?? 3,
  );
  const [workoutNotes, setWorkoutNotes] = useState(workout?.notes ?? "");

  const [sleepHours, setSleepHours] = useState(recovery?.sleepHours ?? 7);
  const [sleepQuality, setSleepQuality] = useState<IntensityLevel>(
    recovery?.sleepQuality ?? 3,
  );
  const [hydrationLevel, setHydrationLevel] = useState<IntensityLevel>(
    recovery?.hydrationLevel ?? 3,
  );
  const [fatigueLevel, setFatigueLevel] = useState<IntensityLevel>(
    recovery?.fatigueLevel ?? 3,
  );
  const [stressLevel, setStressLevel] = useState<IntensityLevel>(
    recovery?.stressLevel ?? 3,
  );
  const [sorenessLevel, setSorenessLevel] = useState<IntensityLevel>(
    recovery?.sorenessLevel ?? 2,
  );
  const [recoveryNotes, setRecoveryNotes] = useState(recovery?.notes ?? "");
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({
    meal: "idle",
    recovery: "idle",
    workout: "idle",
  });

  const readinessScore = Math.round(
    (sleepQuality * 18 +
      hydrationLevel * 14 +
      (6 - fatigueLevel) * 14 +
      (6 - stressLevel) * 14 +
      (6 - sorenessLevel) * 12) /
      3.6,
  );

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
        <LogPanel
          accent="bg-primary"
          actionLabel="Save meal"
          hasSavedLocalData={isLocalRecord(meal)}
          eyebrow={mealTypeLabels[mealType]}
          onSave={saveMeal}
          saveState={saveState.meal}
          title={mealName.trim() || "Quick meal log"}
        >
          <ChipPicker
            label="Meal type"
            onSelect={setMealType}
            options={mealTypes.map((type) => ({
              label: mealTypeLabels[type],
              value: type,
            }))}
            selected={mealType}
          />

          <label className="grid gap-2 text-sm font-medium text-secondary-text">
            Meal name
            <input
              className="h-12 rounded-button border border-soft-stone bg-surface px-4 text-primary-text outline-none focus:border-primary"
              onChange={(event) => setMealName(event.target.value)}
              placeholder="Oatmeal with chia"
              value={mealName}
            />
          </label>

          <MeterGrid
            items={[
              {
                label: "Protein",
                onChange: setProteinEstimate,
                value: proteinEstimate,
              },
              {
                label: "Fiber",
                onChange: setFiberEstimate,
                value: fiberEstimate,
              },
              {
                label: "Hydration",
                onChange: setHydrationEstimate,
                value: hydrationEstimate,
              },
            ]}
          />

          <MultiChipPicker
            label="Nutrient focus"
            onToggle={toggleNutrient}
            options={nutrientFocuses.map((focus) => ({
              label: nutrientLabels[focus],
              value: focus,
            }))}
            selected={selectedNutrients}
          />

          <button
            aria-pressed={cravingsPresent}
            className={cn(
              "w-fit rounded-full border px-4 py-2 text-sm font-medium",
              cravingsPresent
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-soft-stone bg-surface text-secondary-text",
            )}
            onClick={() => setCravingsPresent((current) => !current)}
            type="button"
          >
            Cravings {cravingsPresent ? "present" : "not present"}
          </button>

          <ShortNote
            onChange={setMealNotes}
            placeholder="Optional food pattern note"
            value={mealNotes}
          />
        </LogPanel>

        <LogPanel
          accent="bg-secondary"
          actionLabel="Save workout"
          hasSavedLocalData={isLocalRecord(workout)}
          eyebrow={phaseLabels[cyclePhase]}
          onSave={saveWorkout}
          saveState={saveState.workout}
          title={workoutLabels[workoutType]}
        >
          <ChipPicker
            label="Workout type"
            onSelect={setWorkoutType}
            options={workoutTypes.map((type) => ({
              label: workoutLabels[type],
              value: type,
            }))}
            selected={workoutType}
          />

          <label className="grid gap-2 text-sm font-medium text-secondary-text">
            Duration
            <input
              className="h-12 rounded-button border border-soft-stone bg-surface px-4 text-primary-text outline-none focus:border-primary"
              min={0}
              onChange={(event) =>
                setDurationMinutes(Number(event.target.value))
              }
              type="number"
              value={durationMinutes}
            />
          </label>

          <MeterGrid
            items={[
              {
                label: "Intensity",
                onChange: setIntensity,
                value: intensity,
              },
              {
                label: "Perceived effort",
                onChange: setPerceivedEffort,
                value: perceivedEffort,
              },
              {
                label: "Recovery afterward",
                onChange: setRecoveryAfterward,
                value: recoveryAfterward,
              },
            ]}
          />

          <ShortNote
            onChange={setWorkoutNotes}
            placeholder="Optional workout or recovery note"
            value={workoutNotes}
          />
        </LogPanel>

        <LogPanel
          accent="bg-phase-luteal"
          actionLabel="Save recovery"
          hasSavedLocalData={isLocalRecord(recovery)}
          eyebrow="Readiness"
          onSave={saveRecovery}
          saveState={saveState.recovery}
          title={`${readinessScore}% recovery score`}
        >
          <label className="grid gap-2 text-sm font-medium text-secondary-text">
            Sleep hours
            <input
              className="h-12 rounded-button border border-soft-stone bg-surface px-4 text-primary-text outline-none focus:border-primary"
              max={12}
              min={0}
              onChange={(event) => setSleepHours(Number(event.target.value))}
              step={0.25}
              type="number"
              value={sleepHours}
            />
          </label>

          <MeterGrid
            items={[
              {
                label: "Sleep quality",
                onChange: setSleepQuality,
                value: sleepQuality,
              },
              {
                label: "Hydration",
                onChange: setHydrationLevel,
                value: hydrationLevel,
              },
              {
                label: "Fatigue",
                onChange: setFatigueLevel,
                value: fatigueLevel,
              },
              {
                label: "Stress",
                onChange: setStressLevel,
                value: stressLevel,
              },
              {
                label: "Soreness",
                onChange: setSorenessLevel,
                value: sorenessLevel,
              },
            ]}
          />

          <ShortNote
            onChange={setRecoveryNotes}
            placeholder="Optional recovery note"
            value={recoveryNotes}
          />
        </LogPanel>
      </div>
    </Card>
  );

  function toggleNutrient(value: NutrientFocus) {
    setSelectedNutrients((current) => {
      if (current.includes(value)) {
        const nextValues = current.filter((item) => item !== value);
        return nextValues.length ? nextValues : current;
      }

      return [...current, value];
    });
  }

  async function saveMeal() {
    const createdAt = new Date().toISOString();
    const record: MealLog = {
      id: `local_meal_${userId}_${date}`,
      createdAt,
      cravingsPresent,
      cyclePhase,
      date,
      fiberEstimate,
      hydrationEstimate,
      mealType,
      name: mealName.trim() || "Quick meal log",
      notes: mealNotes.trim() || undefined,
      nutrientFocus: selectedNutrients,
      proteinEstimate,
      userId,
    };

    await saveRecord("meal", () => localDb.saveMealLog(record));
  }

  async function saveWorkout() {
    const createdAt = new Date().toISOString();
    const record: WorkoutLog = {
      id: `local_workout_${userId}_${date}`,
      createdAt,
      cyclePhase,
      date,
      durationMinutes,
      intensity,
      notes: workoutNotes.trim() || undefined,
      perceivedEffort,
      recoveryAfterward,
      type: workoutType,
      userId,
    };

    await saveRecord("workout", () => localDb.saveWorkoutLog(record));
  }

  async function saveRecovery() {
    const createdAt = new Date().toISOString();
    const record: RecoveryLog = {
      id: `local_recovery_${userId}_${date}`,
      createdAt,
      date,
      fatigueLevel,
      hydrationLevel,
      notes: recoveryNotes.trim() || undefined,
      readinessScore,
      sleepHours,
      sleepQuality,
      sorenessLevel,
      stressLevel,
      userId,
    };

    await saveRecord("recovery", () => localDb.saveRecoveryLog(record));
  }

  async function saveRecord(key: string, save: () => Promise<unknown>) {
    setSaveState((current) => ({ ...current, [key]: "saving" }));

    try {
      await save();
      setSaveState((current) => ({ ...current, [key]: "saved" }));
      await onSaved?.();
    } catch {
      setSaveState((current) => ({ ...current, [key]: "error" }));
    }
  }
}

type LogPanelProps = {
  accent: string;
  actionLabel: string;
  children: React.ReactNode;
  hasSavedLocalData?: boolean;
  eyebrow: string;
  onSave: () => void;
  saveState: SaveState;
  title: string;
};

function LogPanel({
  accent,
  actionLabel,
  children,
  hasSavedLocalData = false,
  eyebrow,
  onSave,
  saveState,
  title,
}: LogPanelProps) {
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
            <p className="mt-2 text-sm text-secondary-text">
              {getSaveMessage(saveState, hasSavedLocalData)}
            </p>
          </div>
          <Button
            className="h-11 px-4"
            disabled={saveState === "saving"}
            onClick={onSave}
            variant="secondary"
          >
            {saveState === "saving" ? "Saving..." : actionLabel}
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
    onChange: (value: IntensityLevel) => void;
    value: IntensityLevel;
  }>;
};

function MeterGrid({ items }: MeterGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <label className="rounded-2xl bg-surface p-3" key={item.label}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-primary-text">
              {item.label}
            </span>
            <span className="text-sm font-semibold text-secondary-text">
              {item.value}/5
            </span>
          </div>
          <input
            className="mt-3 w-full accent-primary"
            max={5}
            min={1}
            onChange={(event) =>
              item.onChange(toIntensityLevel(Number(event.target.value)))
            }
            type="range"
            value={item.value}
          />
        </label>
      ))}
    </div>
  );
}

type ChipPickerProps<Value extends string> = {
  label: string;
  onSelect: (value: Value) => void;
  options: Array<{ label: string; value: Value }>;
  selected: Value;
};

function ChipPicker<Value extends string>({
  label,
  onSelect,
  options,
  selected,
}: ChipPickerProps<Value>) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-secondary-text">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium",
              selected === option.value
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-soft-stone bg-surface text-secondary-text",
            )}
            key={option.value}
            onClick={() => onSelect(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type MultiChipPickerProps<Value extends string> = {
  label: string;
  onToggle: (value: Value) => void;
  options: Array<{ label: string; value: Value }>;
  selected: Value[];
};

function MultiChipPicker<Value extends string>({
  label,
  onToggle,
  options,
  selected,
}: MultiChipPickerProps<Value>) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-secondary-text">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium",
              selected.includes(option.value)
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-soft-stone bg-surface text-secondary-text",
            )}
            key={option.value}
            onClick={() => onToggle(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type ShortNoteProps = {
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

function ShortNote({ onChange, placeholder, value }: ShortNoteProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-secondary-text">
      Short note
      <textarea
        className="min-h-24 rounded-card border border-soft-stone bg-surface p-4 text-primary-text outline-none focus:border-primary"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function getSaveMessage(saveState: SaveState, hasSavedLocalData: boolean) {
  if (saveState === "saving") return "Saving to local browser storage...";
  if (saveState === "saved") return "Saved locally for today's pattern view.";
  if (saveState === "error") return "Could not save locally. Try again.";
  if (hasSavedLocalData) return "Loaded from local browser storage.";

  return "Starter values are editable. Save to create your log.";
}

function toIntensityLevel(value: number): IntensityLevel {
  return Math.min(Math.max(Math.round(value), 1), 5) as IntensityLevel;
}

function isLocalRecord(record?: { id: string }) {
  return record?.id.startsWith("local_") ?? false;
}
