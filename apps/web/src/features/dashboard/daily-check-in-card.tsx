import type { ReactNode } from "react";
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
  symptoms: SymptomLog[];
};

export function DailyCheckInCard({
  checkIn,
  symptoms,
}: DailyCheckInCardProps) {
  const selectedSymptoms = new Set(symptoms.map((symptom) => symptom.symptom));
  const cravings: CravingType[] = checkIn?.cravings.length
    ? checkIn.cravings
    : ["none"];

  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          description="A fast demo flow for logging how today feels without turning the habit into paperwork."
          eyebrow="Daily check-in"
          title="Log today's body signals"
        />
        <Badge tone="primary">2 min flow</Badge>
      </div>

      <div className="mt-6 grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ScaleRow
            label="Energy"
            maxLabel="High"
            minLabel="Low"
            value={checkIn?.energyLevel ?? 3}
          />
          <ScaleRow
            label="Sleep"
            maxLabel="Rested"
            minLabel="Tired"
            value={sleepToLevel(checkIn?.sleepHours)}
          />
          <ScaleRow
            label="Stress"
            maxLabel="High"
            minLabel="Low"
            value={checkIn?.stressLevel ?? 3}
          />
          <ScaleRow
            label="Soreness"
            maxLabel="High"
            minLabel="Low"
            value={checkIn?.sorenessLevel ?? 2}
          />
        </div>

        <ChipGroup label="Mood">
          {moodOptions.map((mood) => (
            <Chip active={checkIn?.mood === mood.value} key={mood.value}>
              {mood.label}
            </Chip>
          ))}
        </ChipGroup>

        <ChipGroup label="Symptoms">
          {quickSymptoms.map((symptom) => (
            <Chip active={selectedSymptoms.has(symptom)} key={symptom}>
              {symptomLabels[symptom]}
            </Chip>
          ))}
        </ChipGroup>

        <ChipGroup label="Cravings">
          {cravings.map((craving) => (
            <Chip active key={craving}>
              {cravingLabels[craving]}
            </Chip>
          ))}
        </ChipGroup>

        <div className="rounded-card border border-soft-stone bg-warm-cream p-4">
          <p className="text-sm font-medium text-secondary-text">Short note</p>
          <p className="mt-2 leading-7 text-primary-text">
            {checkIn?.notes ??
              "No note yet. Keep this optional so daily logging stays light."}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-secondary-text">
          Prototype only: local-first saving comes after the form behavior is
          designed.
        </p>
        <Button disabled>Save check-in</Button>
      </div>
    </Card>
  );
}

type ScaleRowProps = {
  label: string;
  maxLabel: string;
  minLabel: string;
  value: IntensityLevel;
};

function ScaleRow({ label, maxLabel, minLabel, value }: ScaleRowProps) {
  return (
    <div className="rounded-card border border-soft-stone bg-warm-cream p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium text-primary-text">{label}</p>
        <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-primary-text">
          {value}/5
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-soft-stone">
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
};

function Chip({ active = false, children }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-4 py-2 text-sm font-medium",
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-soft-stone bg-surface text-secondary-text",
      )}
    >
      {children}
    </span>
  );
}

function sleepToLevel(hours = 7): IntensityLevel {
  if (hours >= 8) return 5;
  if (hours >= 7) return 4;
  if (hours >= 6) return 3;
  if (hours >= 5) return 2;
  return 1;
}
