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
  phase: CyclePhase;
  phaseProgress: number;
  predictionConfidence: PredictionConfidence;
  userName: string;
};

export function CyclePhaseCard({
  cycleDayNumber,
  phase,
  phaseProgress,
  predictionConfidence,
  userName,
}: CyclePhaseCardProps) {
  const phaseWindow = DEFAULT_PHASE_WINDOWS.find(
    (window) => window.phase === phase,
  );
  const dayMarkerPosition = `${Math.min(Math.max((cycleDayNumber / 28) * 100, 0), 100)}%`;

  return (
    <Card className="overflow-hidden p-0">
      <div className={cn("h-2", phaseClasses[phase])} />
      <div className="space-y-8 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge tone="secondary">Today</Badge>
            <h1 className="mt-3 font-heading text-4xl font-semibold leading-tight text-primary-text sm:text-5xl">
              {phaseLabels[phase]} phase
            </h1>
            <p className="mt-4 max-w-2xl leading-8 text-secondary-text">
              Day {cycleDayNumber} of {userName}&apos;s demo cycle. This is{" "}
              <span className="font-medium text-primary-text">
                {predictionConfidence}
              </span>{" "}
              guidance, not medical certainty.
            </p>
          </div>

          <Badge>{predictionConfidence}</Badge>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-secondary-text">
            <span>Cycle phase map</span>
            <span>{Math.round(phaseProgress * 100)}% through phase</span>
          </div>

          <div className="relative pt-6">
            <div
              className="absolute top-0 h-6 w-px bg-primary-text"
              style={{ left: dayMarkerPosition }}
            >
              <span className="absolute left-1/2 top-[-1.5rem] -translate-x-1/2 whitespace-nowrap rounded-full bg-primary-text px-2 py-1 text-xs font-semibold text-white">
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
