import type { ISODateString, TrendDirection } from "@/domain/common";
import type { CyclePhase } from "@/domain/cycle";

export type InsightCategory =
  | "cycle"
  | "nutrition"
  | "symptoms"
  | "workout"
  | "recovery";

export type InsightPriority = "low" | "medium" | "high";

export type InsightSource =
  | "cycle"
  | "daily_check_in"
  | "symptoms"
  | "meals"
  | "workouts"
  | "recovery";

export type Insight = {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: InsightCategory;
  priority: InsightPriority;
  sources: InsightSource[];
  relatedPhase?: CyclePhase;
  trendDirection?: TrendDirection;
  dateRange: {
    start: ISODateString;
    end: ISODateString;
  };
  generatedAt: ISODateString;
};
