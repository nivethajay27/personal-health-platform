// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CyclePhaseCard } from "@/features/dashboard/cycle-phase-card";

describe("CyclePhaseCard", () => {
  it("shows a personal greeting with transparent phase guidance", () => {
    render(
      <CyclePhaseCard
        cycleDayNumber={28}
        greeting="Good morning"
        phase="luteal"
        phaseProgress={1}
        predictionConfidence="estimated"
        userName="Anaya"
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Good morning, Anaya." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Today's check-in")).toBeInTheDocument();
    expect(screen.getByText("Luteal phase")).toBeInTheDocument();
    expect(screen.getByText("Day 28")).toBeInTheDocument();
    expect(screen.getByText("estimated")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.tagName === "P" &&
        element.textContent?.includes("guidance, not medical certainty."),
      ),
    ).toBeInTheDocument();
  });
});
