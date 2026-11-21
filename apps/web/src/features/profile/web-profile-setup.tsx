"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLocalDateString, isIsoDate } from "@/lib/date";

export type WebProfileSetupValues = {
  averageCycleLength: number;
  averagePeriodLength: number;
  displayName: string;
  periodStartDate: string;
};

type WebProfileSetupProps = {
  onComplete: (values: WebProfileSetupValues) => Promise<void>;
  storageUnavailable?: boolean;
};

export function WebProfileSetup({
  onComplete,
  storageUnavailable = false,
}: WebProfileSetupProps) {
  const [displayName, setDisplayName] = useState("");
  const [periodStartDate, setPeriodStartDate] = useState(getLocalDateString);
  const [averageCycleLength, setAverageCycleLength] = useState("28");
  const [averagePeriodLength, setAveragePeriodLength] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cycleLength = Number(averageCycleLength);
    const periodLength = Number(averagePeriodLength);

    if (!displayName.trim()) {
      setError("Add a name or greeting to continue.");
      return;
    }
    if (!isIsoDate(periodStartDate) || periodStartDate > getLocalDateString()) {
      setError("Choose a current or past period start date.");
      return;
    }
    if (!Number.isInteger(cycleLength) || cycleLength < 15 || cycleLength > 60) {
      setError("Cycle length should be a whole number from 15 to 60 days.");
      return;
    }
    if (!Number.isInteger(periodLength) || periodLength < 1 || periodLength > 14) {
      setError("Period length should be a whole number from 1 to 14 days.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await onComplete({
        averageCycleLength: cycleLength,
        averagePeriodLength: periodLength,
        displayName: displayName.trim(),
        periodStartDate,
      });
    } catch {
      setError("Your setup could not be saved in this browser. Try again.");
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-primary-text sm:px-10 lg:px-16">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl content-center gap-8">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Cycle Companion
          </p>
          <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">
            Set up your private cycle space.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-secondary-text">
            A few details let the dashboard estimate your cycle context. They stay in this browser.
          </p>
        </div>

        <Card className="max-w-2xl">
          <form className="grid gap-5" onSubmit={(event) => void handleSubmit(event)}>
            <Field label="What should we call you?">
              <input
                autoComplete="name"
                className="input-field"
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your name"
                value={displayName}
              />
            </Field>

            <Field label="First day of your latest period">
              <input
                className="input-field"
                max={getLocalDateString()}
                onChange={(event) => setPeriodStartDate(event.target.value)}
                type="date"
                value={periodStartDate}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Average cycle length">
                <input
                  className="input-field"
                  inputMode="numeric"
                  max="60"
                  min="15"
                  onChange={(event) => setAverageCycleLength(event.target.value)}
                  type="number"
                  value={averageCycleLength}
                />
              </Field>
              <Field label="Average period length">
                <input
                  className="input-field"
                  inputMode="numeric"
                  max="14"
                  min="1"
                  onChange={(event) => setAveragePeriodLength(event.target.value)}
                  type="number"
                  value={averagePeriodLength}
                />
              </Field>
            </div>

            {error ? <p className="text-sm text-phase-menstrual">{error}</p> : null}
            {storageUnavailable ? (
              <p className="text-sm text-phase-menstrual">
                Local storage is unavailable right now. Try another browser or disable private browsing.
              </p>
            ) : null}

            <Button className="w-full sm:w-auto" disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Continue privately"}
            </Button>
          </form>
        </Card>

        <div className="max-w-2xl rounded-card bg-primary/10 p-5 text-sm leading-6 text-secondary-text">
          <p className="font-semibold text-primary-text">No account or password needed</p>
          <p className="mt-1">
            Your profile and wellness logs are stored locally. Cycle Companion does not provide medical advice or fertility prediction.
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-primary-text">
      {label}
      {children}
    </label>
  );
}
