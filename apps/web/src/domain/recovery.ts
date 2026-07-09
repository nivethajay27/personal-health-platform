import type {
  ISODateString,
  ISODateTimeString,
  IntensityLevel,
} from "@/domain/common";

export type RecoveryLog = {
  id: string;
  userId: string;
  date: ISODateString;
  sleepHours?: number;
  sleepQuality?: IntensityLevel;
  hydrationLevel?: IntensityLevel;
  fatigueLevel?: IntensityLevel;
  stressLevel?: IntensityLevel;
  sorenessLevel?: IntensityLevel;
  readinessScore?: number;
  notes?: string;
  createdAt: ISODateTimeString;
};
