import type { Metadata } from "next";
import { SettingsShell } from "@/features/settings/settings-shell";

export const metadata: Metadata = {
  title: "Privacy Settings | Cycle Companion",
  description:
    "Review local-first storage, export controls, and privacy choices for Cycle Companion.",
};

export default function SettingsPage() {
  return <SettingsShell />;
}
