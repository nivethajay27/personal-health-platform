import type { ISODateString } from "@/domain/common";

export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export type PredictionConfidence = "estimated" | "likely" | "confirmed";

export type FlowLevel = "none" | "spotting" | "light" | "medium" | "heavy";

export type Cycle = {
  id: string;
  userId: string;
  startDate: ISODateString;
  endDate?: ISODateString;
  averageCycleLength: number;
  averagePeriodLength: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type CycleDay = {
  id: string;
  cycleId: string;
  date: ISODateString;
  cycleDayNumber: number;
  estimatedPhase: CyclePhase;
  phaseOverride?: CyclePhase;
  predictionConfidence: PredictionConfidence;
  flow?: FlowLevel;
};

export type PhaseWindow = {
  phase: CyclePhase;
  startDay: number;
  endDay: number;
};
