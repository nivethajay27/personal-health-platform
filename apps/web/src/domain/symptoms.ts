import type {
  ISODateString,
  ISODateTimeString,
  IntensityLevel,
} from "@/domain/common";

export type SymptomType =
  | "cramps"
  | "bloating"
  | "headache"
  | "fatigue"
  | "cravings"
  | "acne"
  | "mood_swings"
  | "breast_tenderness"
  | "back_pain";

export type SymptomLog = {
  id: string;
  userId: string;
  date: ISODateString;
  symptom: SymptomType;
  severity: IntensityLevel;
  notes?: string;
  createdAt: ISODateTimeString;
};
