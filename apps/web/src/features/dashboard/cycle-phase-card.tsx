import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DEFAULT_PHASE_WINDOWS } from "@/core";
import type { CyclePhase, PredictionConfidence } from "@/domain";
import { cn } from "@/lib/utils";

const phaseLabels: Record<CyclePhase, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulatory: "Ovulation",
  luteal: "Luteal",
};

const phaseClasses: Record<CyclePhase, string> = {
  menstrual: "bg-phase-menstrual",
  follicular: "bg-phase-follicular",
  ovulatory: "bg-phase-ovulation",
  luteal: "bg-phase-luteal",
};

type CyclePhaseCardProps = {
  cycleDayNumber: number;
  greeting: string;
  phase: CyclePhase;
  phaseProgress: number;
  predictionConfidence: PredictionConfidence;
  userName: string;
};

export function CyclePhaseCard({
  cycleDayNumber,
  greeting,
  phase,
  phaseProgress,
  predictionConfidence,
  userName,
}: CyclePhaseCardProps) {
  const phaseWindow = DEFAULT_PHASE_WINDOWS.find(
    (window) => window.phase === phase,
  );
  const dayMarkerPosition = `${Math.min(Math.max((cycleDayNumber / 28) * 100, 0), 100)}%`;
  const dayMarkerLabelClass =
    cycleDayNumber >= 26
      ? "right-0 translate-x-0"
      : cycleDayNumber <= 2
        ? "left-0 translate-x-0"
        : "left-1/2 -translate-x-1/2";

  return (
    <Card className="overflow-hidden p-0">
      <div className={cn("h-2", phaseClasses[phase])} />
      <div className="space-y-8 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge tone="secondary">Today&apos;s check-in</Badge>
            <h1 className="mt-3 font-heading text-4xl font-semibold leading-tight text-primary-text sm:text-5xl">
              {greeting}, {userName}.
            </h1>
            <p className="mt-4 max-w-2xl leading-8 text-secondary-text">
              You&apos;re on day {cycleDayNumber}. Your body signals suggest a{" "}
              <span className="font-medium text-primary-text">
                {phaseLabels[phase].toLowerCase()} phase
              </span>{" "}
              pattern today. This is{" "}
              <span className="font-medium text-primary-text">
                {predictionConfidence}
              </span>{" "}
              guidance, not medical certainty.
            </p>
          </div>

          <Badge>{phaseLabels[phase]} phase</Badge>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1 text-sm text-secondary-text sm:flex-row sm:items-center sm:justify-between">
            <span>Cycle phase map</span>
            <span>{Math.round(phaseProgress * 100)}% through phase</span>
          </div>

          <div className="relative pt-8">
            <div
              className="absolute top-2 h-6 w-px bg-primary-text"
              style={{ left: dayMarkerPosition }}
            >
              <span
                className={cn(
                  "absolute top-0 whitespace-nowrap rounded-full bg-primary-text px-2 py-1 text-xs font-semibold text-white",
                  dayMarkerLabelClass,
                )}
              >
                Day {cycleDayNumber}
              </span>
            </div>

            <div className="grid grid-cols-[5fr_8fr_3fr_12fr] gap-1 overflow-hidden rounded-full bg-warm-cream">
              {DEFAULT_PHASE_WINDOWS.map((window) => (
                <div
                  aria-label={`${phaseLabels[window.phase]} days ${window.startDay}-${window.endDay}`}
                  className={cn(
                    "h-4",
                    phaseClasses[window.phase],
                    window.phase === phase ? "opacity-100" : "opacity-35",
                  )}
                  key={window.phase}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3 text-sm text-secondary-text sm:grid-cols-4">
            {DEFAULT_PHASE_WINDOWS.map((window) => (
              <div key={window.phase}>
                <div
                  className={cn(
                    "mb-2 h-2 w-10 rounded-full",
                    phaseClasses[window.phase],
                  )}
                />
                <p className="font-medium text-primary-text">
                  {phaseLabels[window.phase]}
                </p>
                <p>
                  Days {window.startDay}-{window.endDay}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card bg-warm-cream p-4">
          <p className="text-sm font-medium text-secondary-text">
            Current window
          </p>
          <p className="mt-1 font-heading text-xl font-semibold text-primary-text">
            {phaseWindow
              ? `Days ${phaseWindow.startDay}-${phaseWindow.endDay}`
              : "Flexible range"}
          </p>
        </div>
      </div>
    </Card>
  );
}
