"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { demoDataset } from "@/data";
import type { PrivacySettings } from "@/domain";
import { cn } from "@/lib/utils";
import { localDb } from "@/storage";

type SaveState = "idle" | "loading" | "saved" | "error";

const defaultPrivacySettings: PrivacySettings = {
  aiInsightsEnabled: false,
  analyticsEnabled: false,
  cloudSync: "disabled",
  localFirstStorage: true,
  updatedAt: new Date(0).toISOString(),
  userId: demoDataset.user.id,
};

const preferenceRows: Array<{
  description: string;
  field: keyof Pick<
    PrivacySettings,
    "aiInsightsEnabled" | "analyticsEnabled" | "localFirstStorage"
  >;
  locked?: boolean;
  title: string;
}> = [
  {
    description: "Keep wellness logs in this browser before any cloud option is considered.",
    field: "localFirstStorage",
    locked: true,
    title: "Local-first storage",
  },
  {
    description: "Do not send product usage tracking to third-party analytics.",
    field: "analyticsEnabled",
    locked: true,
    title: "Analytics sharing",
  },
  {
    description: "Keep future AI-style insights off until recommendations have stronger safeguards.",
    field: "aiInsightsEnabled",
    title: "AI insights",
  },
];

export function PrivacyPreferencesCard() {
  const [settings, setSettings] = useState<PrivacySettings>(
    defaultPrivacySettings,
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const statusBadge =
    saveState === "error"
      ? "Storage unavailable"
      : saveState === "loading"
        ? "Checking"
        : "Local settings";

  useEffect(() => {
    void loadSettings();
  }, []);

  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeader
          description="Small controls that document the privacy posture before account or cloud features exist."
          eyebrow="Preferences"
          title="Privacy defaults"
        />
        <div className="flex flex-wrap gap-2">
          <Badge tone={saveState === "error" ? "neutral" : "primary"}>
            {statusBadge}
          </Badge>
          <Badge tone={settings.cloudSync === "disabled" ? "primary" : "neutral"}>
            Cloud sync {settings.cloudSync}
          </Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {preferenceRows.map((row) => {
          const enabled = Boolean(settings[row.field]);

          return (
            <button
              aria-pressed={enabled}
              className={cn(
                "rounded-card border border-soft-stone bg-warm-cream p-4 text-left transition-colors",
                row.locked
                  ? "cursor-default"
                  : "hover:border-primary/40 hover:bg-primary/5",
              )}
              disabled={row.locked || saveState === "loading"}
              key={row.field}
              onClick={() => void toggleSetting(row.field)}
              type="button"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-heading text-lg font-semibold text-primary-text">
                    {row.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-secondary-text">
                    {row.description}
                  </p>
                </div>

                <span
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
                    enabled
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-soft-stone bg-surface text-secondary-text",
                  )}
                >
                  {enabled ? "On" : "Off"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-sm leading-6 text-secondary-text">
        {getStatusMessage(saveState, settings.updatedAt)}
      </p>
    </Card>
  );

  async function loadSettings() {
    setSaveState("loading");

    try {
      const savedSettings = await localDb.getPrivacySettings();
      const currentSettings =
        savedSettings.find((record) => record.userId === demoDataset.user.id) ??
        defaultPrivacySettings;

      setSettings(currentSettings);
      setSaveState("idle");
    } catch {
      setSaveState("error");
    }
  }

  async function toggleSetting(
    field: keyof Pick<
      PrivacySettings,
      "aiInsightsEnabled" | "analyticsEnabled" | "localFirstStorage"
    >,
  ) {
    const nextSettings: PrivacySettings = {
      ...settings,
      [field]: !settings[field],
      updatedAt: new Date().toISOString(),
    };

    setSettings(nextSettings);
    setSaveState("loading");

    try {
      await localDb.savePrivacySettings(nextSettings);
      setSaveState("saved");
    } catch {
      setSettings(settings);
      setSaveState("error");
    }
  }
}

function getStatusMessage(saveState: SaveState, updatedAt: string) {
  if (saveState === "loading") return "Checking local privacy preferences...";
  if (saveState === "error") return "Could not save privacy preferences locally.";
  if (saveState === "saved") return "Privacy preferences saved in this browser.";
  if (updatedAt !== defaultPrivacySettings.updatedAt) {
    return "Privacy preferences are loaded from this browser.";
  }

  return "Default privacy preferences are active for this app.";
}
