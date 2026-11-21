"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLocalDateString, isIsoDate } from "@/lib/date";

type PeriodStartCardProps = {
  latestPeriodStartDate: string;
  onSave: (periodStartDate: string) => Promise<void>;
};

export function PeriodStartCard({ latestPeriodStartDate, onSave }: PeriodStartCardProps) {
  const [periodStartDate, setPeriodStartDate] = useState(latestPeriodStartDate);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function savePeriodStart(nextDate = periodStartDate) {
    if (!isIsoDate(nextDate) || nextDate > getLocalDateString()) {
      setStatus("error");
      return;
    }

    setStatus("saving");
    try {
      await onSave(nextDate);
      setPeriodStartDate(nextDate);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Card className="bg-warm-cream">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge tone="secondary">Cycle control</Badge>
          <h2 className="mt-3 font-heading text-2xl font-semibold text-primary-text">
            Keep your cycle date current
          </h2>
          <p className="mt-2 max-w-xl leading-7 text-secondary-text">
            Period starts are the reference point for the phase estimate. Update this whenever you need to.
          </p>
        </div>
        <Button
          disabled={status === "saving"}
          onClick={() => void savePeriodStart(getLocalDateString())}
          variant="secondary"
        >
          Period started today
        </Button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="grid flex-1 gap-2 text-sm font-semibold text-primary-text">
          Latest period start
          <input
            className="input-field"
            max={getLocalDateString()}
            onChange={(event) => setPeriodStartDate(event.target.value)}
            type="date"
            value={periodStartDate}
          />
        </label>
        <Button disabled={status === "saving"} onClick={() => void savePeriodStart()}>
          {status === "saving" ? "Saving..." : "Save date"}
        </Button>
      </div>

      <p aria-live="polite" className="mt-3 text-sm text-secondary-text">
        {status === "error"
          ? "Choose a valid current or past date, then try again."
          : status === "saved"
            ? "Period start saved privately in this browser."
            : "This is an estimate, not medical certainty."}
      </p>
    </Card>
  );
}
