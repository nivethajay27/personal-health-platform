"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import type { LocalStoreName } from "@/storage";
import { localDb } from "@/storage";

type LocalDataState =
  | "idle"
  | "loading"
  | "ready"
  | "exported"
  | "cleared"
  | "error";

type LocalDataControlsCardProps = {
  onLocalDataCleared?: () => void;
  refreshKey?: number;
};

const visibleStores: Array<{
  label: string;
  name: LocalStoreName;
}> = [
  { label: "Check-ins", name: "dailyCheckIns" },
  { label: "Symptoms", name: "symptomLogs" },
  { label: "Meals", name: "mealLogs" },
  { label: "Workouts", name: "workoutLogs" },
  { label: "Recovery", name: "recoveryLogs" },
  { label: "Privacy", name: "privacySettings" },
];

export function LocalDataControlsCard({
  onLocalDataCleared,
  refreshKey = 0,
}: LocalDataControlsCardProps) {
  const [counts, setCounts] = useState<Record<LocalStoreName, number> | null>(
    null,
  );
  const [state, setState] = useState<LocalDataState>("idle");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    void refreshCounts({ quiet: true });
  }, [refreshKey]);

  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          description="Local controls for reviewing, exporting, and deleting browser-stored wellness data."
          eyebrow="Privacy controls"
          title="Local data stays on this device"
        />
        <Badge tone="secondary">IndexedDB</Badge>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {visibleStores.map((store) => (
          <div
            className="rounded-card border border-soft-stone bg-warm-cream p-4"
            key={store.name}
          >
            <p className="text-sm text-secondary-text">{store.label}</p>
            <p className="mt-1 font-heading text-2xl font-semibold text-primary-text">
              {counts ? counts[store.name] : "-"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <p className="text-sm leading-6 text-secondary-text">
          {getStateMessage(state, confirmClear)}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            disabled={state === "loading"}
            onClick={() => refreshCounts()}
            variant="secondary"
          >
            Refresh counts
          </Button>
          <Button
            disabled={state === "loading"}
            onClick={exportLocalData}
            variant="secondary"
          >
            Export JSON
          </Button>
          <Button
            disabled={state === "loading"}
            onClick={clearLocalData}
            variant="ghost"
          >
            {confirmClear ? "Confirm delete" : "Delete local data"}
          </Button>
        </div>
      </div>
    </Card>
  );

  async function exportLocalData() {
    setState("loading");
    setConfirmClear(false);

    try {
      const exportedData = await localDb.exportAll();
      const blob = new Blob([JSON.stringify(exportedData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.download = `cycle-companion-local-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      setCounts(await localDb.getCounts());
      setState("exported");
    } catch {
      setState("error");
    }
  }

  async function clearLocalData() {
    if (!confirmClear) {
      setConfirmClear(true);
      setState("idle");
      return;
    }

    setState("loading");

    try {
      await localDb.clearAll();
      setCounts(await localDb.getCounts());
      setConfirmClear(false);
      setState("cleared");
      onLocalDataCleared?.();
    } catch {
      setState("error");
    }
  }

  async function refreshCounts({ quiet = false } = {}) {
    if (!quiet) {
      setState("loading");
    }
    setConfirmClear(false);

    try {
      setCounts(await localDb.getCounts());
      setState(quiet ? "idle" : "ready");
    } catch {
      setState("error");
    }
  }
}

function getStateMessage(state: LocalDataState, confirmClear: boolean) {
  if (confirmClear) return "Click confirm delete to remove local browser data.";
  if (state === "loading") return "Checking local browser storage...";
  if (state === "ready") return "Local data counts are up to date.";
  if (state === "exported") return "Export created from local browser data.";
  if (state === "cleared") return "Local browser data has been deleted.";
  if (state === "error") return "Could not access local browser storage.";

  return "No account or cloud sync is required for these controls.";
}
