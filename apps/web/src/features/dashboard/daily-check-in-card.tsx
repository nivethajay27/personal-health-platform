"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import type {
  CravingType,
  DailyCheckIn,
  IntensityLevel,
  Mood,
  SymptomLog,
  SymptomType,
} from "@/domain";
import { cn } from "@/lib/utils";
import { deleteLocalRecord, localDb } from "@/storage";

const moodOptions: Array<{ label: string; value: Mood }> = [
  { label: "Calm", value: "calm" },
  { label: "Happy", value: "happy" },
  { label: "Energized", value: "energized" },
  { label: "Sensitive", value: "sensitive" },
  { label: "Anxious", value: "anxious" },
  { label: "Low", value: "low" },
];

const cravingLabels: Record<CravingType, string> = {
  carbs: "Carbs",
  chocolate: "Chocolate",
  none: "None",
  salty: "Salty",
  sweet: "Sweet",
};

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

const quickSymptoms: SymptomType[] = [
  "cramps",
  "bloating",
  "fatigue",
  "cravings",
  "headache",
  "mood_swings",
];

type DailyCheckInCardProps = {
  checkIn?: DailyCheckIn;
  date: string;
  hasSavedLocalData?: boolean;
  onSaved?: () => Promise<void> | void;
  symptoms: SymptomLog[];
  userId: string;
};

export function DailyCheckInCard({
  checkIn,
  date,
  hasSavedLocalData = false,
  onSaved,
  symptoms,
  userId,
}: DailyCheckInCardProps) {
  const [energyLevel, setEnergyLevel] = useState<IntensityLevel>(
    checkIn?.energyLevel ?? 3,
  );
  const [sleepHours, setSleepHours] = useState(checkIn?.sleepHours ?? 7);
  const [stressLevel, setStressLevel] = useState<IntensityLevel>(
    checkIn?.stressLevel ?? 3,
  );
  const [sorenessLevel, setSorenessLevel] = useState<IntensityLevel>(
    checkIn?.sorenessLevel ?? 2,
  );
  const [mood, setMood] = useState<Mood>(checkIn?.mood ?? "calm");
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>(
    symptoms.map((symptom) => symptom.symptom),
  );
  const [cravings, setCravings] = useState<CravingType[]>(
    checkIn?.cravings.length ? checkIn.cravings : ["none"],
  );
  const [notes, setNotes] = useState(checkIn?.notes ?? "");
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          description="A fast flow for logging how today feels without turning the habit into paperwork."
          eyebrow="Daily check-in"
          title="How are you feeling today?"
        />
        <Badge tone="primary">2 min flow</Badge>
      </div>

      <div className="mt-6 grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ScaleRow
            label="Energy"
            maxLabel="High"
            minLabel="Low"
            onChange={setEnergyLevel}
            value={energyLevel}
          />
          <ScaleRow
            label="Sleep"
            maxLabel="Rested"
            minLabel="Tired"
            onChange={(value) => setSleepHours(sleepHoursFromLevel(value))}
            value={sleepToLevel(sleepHours)}
          />
          <ScaleRow
            label="Stress"
            maxLabel="High"
            minLabel="Low"
            onChange={setStressLevel}
            value={stressLevel}
          />
          <ScaleRow
            label="Soreness"
            maxLabel="High"
            minLabel="Low"
            onChange={setSorenessLevel}
            value={sorenessLevel}
          />
        </div>

        <ChipGroup label="Mood">
          {moodOptions.map((moodOption) => (
            <Chip
              active={moodOption.value === mood}
              key={moodOption.value}
              onClick={() => setMood(moodOption.value)}
            >
              {moodOption.label}
            </Chip>
          ))}
        </ChipGroup>

        <ChipGroup label="Symptoms">
          {quickSymptoms.map((symptom) => (
            <Chip
              active={selectedSymptoms.includes(symptom)}
              key={symptom}
              onClick={() => toggleSymptom(symptom)}
            >
              {symptomLabels[symptom]}
            </Chip>
          ))}
        </ChipGroup>

        <ChipGroup label="Cravings">
          {(Object.keys(cravingLabels) as CravingType[]).map((craving) => (
            <Chip
              active={cravings.includes(craving)}
              key={craving}
              onClick={() => toggleCraving(craving)}
            >
              {cravingLabels[craving]}
            </Chip>
          ))}
        </ChipGroup>

        <div className="rounded-card border border-soft-stone bg-warm-cream p-4">
          <label
            className="text-sm font-medium text-secondary-text"
            htmlFor="daily-check-in-note"
          >
            Short note
          </label>
          <textarea
            className="mt-3 min-h-24 w-full resize-none rounded-2xl border border-soft-stone bg-surface p-4 text-primary-text outline-none transition focus:border-primary"
            id="daily-check-in-note"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional note about today"
            value={notes}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-secondary-text">
          {getSaveMessage(saveState, hasSavedLocalData)}
        </p>
        <Button disabled={saveState === "saving"} onClick={saveCheckIn}>
          {saveState === "saving" ? "Saving..." : "Save check-in"}
        </Button>
      </div>
    </Card>
  );

  function toggleSymptom(symptom: SymptomType) {
    setSaveState("idle");
    setSelectedSymptoms((currentSymptoms) =>
      currentSymptoms.includes(symptom)
        ? currentSymptoms.filter((currentSymptom) => currentSymptom !== symptom)
        : [...currentSymptoms, symptom],
    );
  }

  function toggleCraving(craving: CravingType) {
    setSaveState("idle");
    setCravings((currentCravings) => {
      if (craving === "none") return ["none"];

      const withoutNone = currentCravings.filter(
        (currentCraving) => currentCraving !== "none",
      );

      return withoutNone.includes(craving)
        ? withoutNone.filter((currentCraving) => currentCraving !== craving)
        : [...withoutNone, craving];
    });
  }

  async function saveCheckIn() {
    const timestamp = new Date().toISOString();
    const checkInId = checkIn?.id ?? `checkin_${userId}_${date}`;
    const normalizedCravings: CravingType[] = cravings.length
      ? cravings
      : ["none"];

    setSaveState("saving");

    try {
      await localDb.saveDailyCheckIn({
        id: checkInId,
        userId,
        date,
        energyLevel,
        mood,
        sleepHours,
        sleepQuality: sleepToLevel(sleepHours),
        cravings: normalizedCravings,
        stressLevel,
        sorenessLevel,
        notes: notes.trim() || undefined,
        createdAt: checkIn?.createdAt ?? timestamp,
        updatedAt: timestamp,
      });

      await Promise.all(
        quickSymptoms.map((symptom) => {
          const symptomId = buildSymptomId({ date, symptom, userId });

          if (!selectedSymptoms.includes(symptom)) {
            return deleteLocalRecord("symptomLogs", symptomId);
          }

          return localDb.saveSymptomLog({
            id: symptomId,
            userId,
            date,
            symptom,
            severity: 3,
            createdAt: timestamp,
          });
        }),
      );

      setSaveState("saved");
      await onSaved?.();
    } catch {
      setSaveState("error");
    }
  }
}

type ScaleRowProps = {
  label: string;
  maxLabel: string;
  minLabel: string;
  onChange: (value: IntensityLevel) => void;
  value: IntensityLevel;
};

function ScaleRow({
  label,
  maxLabel,
  minLabel,
  onChange,
  value,
}: ScaleRowProps) {
  return (
    <div className="rounded-card border border-soft-stone bg-warm-cream p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium text-primary-text">{label}</p>
        <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-primary-text">
          {value}/5
        </span>
      </div>
      <input
        aria-label={label}
        className="mt-4 w-full accent-primary"
        max={5}
        min={1}
        onChange={(event) => onChange(Number(event.target.value) as IntensityLevel)}
        type="range"
        value={value}
      />
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft-stone">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${value * 20}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-xs font-medium uppercase tracking-[0.14em] text-secondary-text">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

type ChipGroupProps = {
  children: ReactNode;
  label: string;
};

function ChipGroup({ children, label }: ChipGroupProps) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-secondary-text">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

type ChipProps = {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
};

function Chip({ active = false, children, onClick }: ChipProps) {
  return (
    <button
      className={cn(
        "inline-flex rounded-full border px-4 py-2 text-sm font-medium",
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-soft-stone bg-surface text-secondary-text",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function sleepToLevel(hours = 7): IntensityLevel {
  if (hours >= 8) return 5;
  if (hours >= 7) return 4;
  if (hours >= 6) return 3;
  if (hours >= 5) return 2;
  return 1;
}

function sleepHoursFromLevel(value: IntensityLevel) {
  const sleepHoursByLevel: Record<IntensityLevel, number> = {
    1: 5,
    2: 6,
    3: 6.5,
    4: 7.5,
    5: 8.5,
  };

  return sleepHoursByLevel[value];
}

function buildSymptomId({
  date,
  symptom,
  userId,
}: {
  date: string;
  symptom: SymptomType;
  userId: string;
}) {
  return `symptom_${userId}_${date}_${symptom}`;
}

function getSaveMessage(
  saveState: "idle" | "saving" | "saved" | "error",
  hasSavedLocalData: boolean,
) {
  if (saveState === "saving") return "Saving privately on this device...";
  if (saveState === "saved") return "Saved locally. No cloud sync or sharing.";
  if (saveState === "error") {
    return "Could not save locally. Check browser storage permissions.";
  }
  if (hasSavedLocalData) return "Loaded from local browser storage.";

  return "Starter values are editable. Save to create your check-in.";
}
