import { describe, expect, it } from "vitest";
import {
  buildCycleDay,
  estimateCycleDay,
  estimateCyclePhase,
  getCurrentCycle,
  getCycleSummary,
  getPhaseProgress,
} from "@/core/cycle";
import type { Cycle } from "@/domain";

const cycle: Cycle = {
  id: "cycle_001",
  userId: "user_001",
  startDate: "2026-07-01",
  averageCycleLength: 28,
  averagePeriodLength: 5,
  createdAt: "2026-07-01T09:00:00.000Z",
  updatedAt: "2026-07-01T09:00:00.000Z",
};

describe("cycle utilities", () => {
  it("calculates cycle days from a manually entered period start date", () => {
    expect(
      estimateCycleDay({
        cycleStartDate: "2026-07-01",
        targetDate: "2026-07-28",
      }),
    ).toBe(28);
  });

  it("maps cycle days to the expected phase and wraps after the average cycle length", () => {
    expect(estimateCyclePhase({ cycleDayNumber: 1 })).toBe("menstrual");
    expect(estimateCyclePhase({ cycleDayNumber: 9 })).toBe("follicular");
    expect(estimateCyclePhase({ cycleDayNumber: 15 })).toBe("ovulatory");
    expect(estimateCyclePhase({ cycleDayNumber: 24 })).toBe("luteal");
    expect(estimateCyclePhase({ cycleDayNumber: 29 })).toBe("menstrual");
  });

  it("uses a manual phase override while preserving the estimated phase", () => {
    const cycleDay = buildCycleDay({
      cycle,
      targetDate: "2026-07-15",
      phaseOverride: "follicular",
    });

    expect(cycleDay.estimatedPhase).toBe("ovulatory");
    expect(getCycleSummary(cycleDay)).toMatchObject({
      effectivePhase: "follicular",
      estimatedPhase: "ovulatory",
      phaseOverride: "follicular",
    });
  });

  it("keeps phase progress inside a usable zero-to-one range", () => {
    expect(getPhaseProgress(17, "luteal")).toBeCloseTo(1 / 12);
    expect(getPhaseProgress(28, "luteal")).toBe(1);
    expect(getPhaseProgress(4, "luteal")).toBe(0);
  });

  it("finds the cycle that contains the requested date", () => {
    const closedCycle = { ...cycle, endDate: "2026-07-28" };
    const nextCycle = {
      ...cycle,
      id: "cycle_002",
      startDate: "2026-07-29",
      endDate: "2026-08-25",
    };

    expect(getCurrentCycle([closedCycle, nextCycle], "2026-07-30")?.id).toBe(
      "cycle_002",
    );
  });
});
