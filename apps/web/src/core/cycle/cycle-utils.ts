import type {
  Cycle,
  CycleDay,
  CyclePhase,
  PhaseWindow,
  PredictionConfidence,
} from "@/domain";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_PHASE_WINDOWS: PhaseWindow[] = [
  { phase: "menstrual", startDay: 1, endDay: 5 },
  { phase: "follicular", startDay: 6, endDay: 13 },
  { phase: "ovulatory", startDay: 14, endDay: 16 },
  { phase: "luteal", startDay: 17, endDay: 28 },
];

type EstimateCycleDayInput = {
  cycleStartDate: string;
  targetDate: string;
};

type EstimateCyclePhaseInput = {
  averageCycleLength?: number;
  cycleDayNumber: number;
  phaseWindows?: PhaseWindow[];
};

type BuildCycleDayInput = {
  cycle: Cycle;
  targetDate: string;
  phaseOverride?: CyclePhase;
};

type CycleSummary = {
  cycleDayNumber: number;
  effectivePhase: CyclePhase;
  estimatedPhase: CyclePhase;
  phaseOverride?: CyclePhase;
  phaseProgress: number;
  predictionConfidence: PredictionConfidence;
};

export function toUtcDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

export function daysBetween(startDate: string, endDate: string) {
  const start = toUtcDate(startDate).getTime();
  const end = toUtcDate(endDate).getTime();

  return Math.floor((end - start) / MS_PER_DAY);
}

export function estimateCycleDay({
  cycleStartDate,
  targetDate,
}: EstimateCycleDayInput) {
  return daysBetween(cycleStartDate, targetDate) + 1;
}

export function estimateCyclePhase({
  averageCycleLength = 28,
  cycleDayNumber,
  phaseWindows = DEFAULT_PHASE_WINDOWS,
}: EstimateCyclePhaseInput): CyclePhase {
  const normalizedDay =
    ((cycleDayNumber - 1) % Math.max(averageCycleLength, 1)) + 1;
  const matchingWindow = phaseWindows.find(
    (window) =>
      normalizedDay >= window.startDay && normalizedDay <= window.endDay,
  );

  return matchingWindow?.phase ?? "luteal";
}

export function getEffectivePhase(cycleDay: CycleDay) {
  return cycleDay.phaseOverride ?? cycleDay.estimatedPhase;
}

export function getPhaseWindow(
  phase: CyclePhase,
  phaseWindows = DEFAULT_PHASE_WINDOWS,
) {
  return phaseWindows.find((window) => window.phase === phase);
}

export function getPhaseProgress(
  cycleDayNumber: number,
  phase: CyclePhase,
  phaseWindows = DEFAULT_PHASE_WINDOWS,
) {
  const phaseWindow = getPhaseWindow(phase, phaseWindows);

  if (!phaseWindow) return 0;

  const phaseLength = phaseWindow.endDay - phaseWindow.startDay + 1;
  const daysIntoPhase = cycleDayNumber - phaseWindow.startDay + 1;
  const progress = daysIntoPhase / phaseLength;

  return Math.min(Math.max(progress, 0), 1);
}

export function getPredictionConfidence(
  cycleDayNumber: number,
): PredictionConfidence {
  if (cycleDayNumber <= 5) return "confirmed";
  if (cycleDayNumber <= 16) return "likely";
  return "estimated";
}

export function buildCycleDay({
  cycle,
  targetDate,
  phaseOverride,
}: BuildCycleDayInput): CycleDay {
  const cycleDayNumber = estimateCycleDay({
    cycleStartDate: cycle.startDate,
    targetDate,
  });
  const estimatedPhase = estimateCyclePhase({
    averageCycleLength: cycle.averageCycleLength,
    cycleDayNumber,
  });

  return {
    id: `${cycle.id}_${targetDate}`,
    cycleId: cycle.id,
    date: targetDate,
    cycleDayNumber,
    estimatedPhase,
    phaseOverride,
    predictionConfidence: getPredictionConfidence(cycleDayNumber),
    flow:
      cycleDayNumber <= 2
        ? "medium"
        : cycleDayNumber <= cycle.averagePeriodLength
          ? "light"
          : "none",
  };
}

export function getCycleSummary(cycleDay: CycleDay): CycleSummary {
  const effectivePhase = getEffectivePhase(cycleDay);

  return {
    cycleDayNumber: cycleDay.cycleDayNumber,
    effectivePhase,
    estimatedPhase: cycleDay.estimatedPhase,
    phaseOverride: cycleDay.phaseOverride,
    phaseProgress: getPhaseProgress(cycleDay.cycleDayNumber, effectivePhase),
    predictionConfidence: cycleDay.predictionConfidence,
  };
}

export function getCurrentCycle(cycles: Cycle[], targetDate: string) {
  return cycles.find((cycle) => {
    const startsOnOrBeforeTarget = cycle.startDate <= targetDate;
    const endsOnOrAfterTarget = !cycle.endDate || cycle.endDate >= targetDate;

    return startsOnOrBeforeTarget && endsOnOrAfterTarget;
  });
}
