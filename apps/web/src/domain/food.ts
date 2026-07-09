import type { CyclePhase } from "@/domain/cycle";
import type {
  ISODateString,
  ISODateTimeString,
  IntensityLevel,
} from "@/domain/common";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type NutrientFocus =
  | "iron_rich"
  | "protein_focused"
  | "magnesium_rich"
  | "complex_carbs"
  | "hydration"
  | "anti_inflammatory"
  | "fiber";

export type MealLog = {
  id: string;
  userId: string;
  date: ISODateString;
  mealType: MealType;
  name: string;
  cyclePhase?: CyclePhase;
  proteinEstimate?: IntensityLevel;
  fiberEstimate?: IntensityLevel;
  hydrationEstimate?: IntensityLevel;
  cravingsPresent?: boolean;
  nutrientFocus: NutrientFocus[];
  notes?: string;
  createdAt: ISODateTimeString;
};
