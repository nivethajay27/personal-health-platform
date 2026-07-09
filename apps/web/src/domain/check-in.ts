import type {
  ISODateString,
  ISODateTimeString,
  IntensityLevel,
} from "@/domain/common";

export type Mood =
  | "calm"
  | "happy"
  | "energized"
  | "sensitive"
  | "anxious"
  | "low";

export type CravingType =
  | "sweet"
  | "salty"
  | "carbs"
  | "chocolate"
  | "none";

export type DailyCheckIn = {
  id: string;
  userId: string;
  date: ISODateString;
  energyLevel: IntensityLevel;
  mood: Mood;
  sleepHours?: number;
  sleepQuality?: IntensityLevel;
  cravings: CravingType[];
  stressLevel?: IntensityLevel;
  sorenessLevel?: IntensityLevel;
  notes?: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
};
