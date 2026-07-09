import type { ISODateString } from "@/domain/common";

export type FitnessGoal =
  | "general_health"
  | "strength"
  | "endurance"
  | "mobility"
  | "recovery";

export type DietaryPreference =
  | "balanced"
  | "high_protein"
  | "plant_based"
  | "vegetarian"
  | "gluten_free"
  | "dairy_free";

export type UserProfile = {
  id: string;
  displayName: string;
  email?: string;
  averageCycleLength: number;
  averagePeriodLength: number;
  fitnessGoal?: FitnessGoal;
  dietaryPreferences: DietaryPreference[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
};
