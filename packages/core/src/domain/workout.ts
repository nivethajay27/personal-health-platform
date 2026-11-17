import type { CyclePhase } from "./cycle";
import type {
  ISODateString,
  ISODateTimeString,
  IntensityLevel,
} from "./common";

export type WorkoutType =
  | "walking"
  | "yoga"
  | "pilates"
  | "strength_training"
  | "cardio"
  | "hiit"
  | "stretching"
  | "rest_day";

export type WorkoutLog = {
  id: string;
  userId: string;
  date: ISODateString;
  type: WorkoutType;
  durationMinutes?: number;
  intensity: IntensityLevel;
  perceivedEffort: IntensityLevel;
  cyclePhase?: CyclePhase;
  recoveryAfterward?: IntensityLevel;
  notes?: string;
  createdAt: ISODateTimeString;
};
