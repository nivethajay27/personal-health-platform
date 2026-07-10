import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { LocalDataControlsCard } from "@/features/dashboard/local-data-controls-card";
import { PrivacyPreferencesCard } from "@/features/settings/privacy-preferences-card";

const privacyPromises = [
  {
    detail: "Check-ins, symptoms, workouts, food, and recovery logs stay in IndexedDB.",
    title: "Local-first storage",
  },
  {
    detail: "The MVP does not require sign-in, cloud sync, or shared wellness records.",
    title: "No account required",
  },
  {
    detail: "Insights describe patterns and avoid diagnosis, treatment, or fertility claims.",
    title: "No medical claims",
  },
  {
    detail: "Users can export or delete browser-stored data from this screen.",
    title: "User control",
  },
];

const boundaryItems = [
  "No fertility prediction",
  "No diagnosis",
  "No treatment advice",
  "No third-party analytics",
  "No cloud sync yet",
];

export function SettingsShell() {
  return (
    <AppShell activeHref="/settings">
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <Card className="bg-warm-cream">
          <Badge tone="primary">Privacy-first</Badge>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold leading-tight text-primary-text sm:text-5xl">
            Settings built around sensitive body data.
          </h1>
          <p className="mt-5 max-w-2xl leading-8 text-secondary-text">
            Cycle Companion treats cycle, symptom, nutrition, workout, and
            recovery logs as personal data. The MVP keeps storage local and
            gives users clear controls before any account or cloud feature is
            added.
          </p>
        </Card>

        <Card>
          <SectionHeader
            description="Clear boundaries keep the product useful without pretending to be medical software."
            eyebrow="Product boundaries"
            title="What this app will not do"
          />

          <div className="mt-6 flex flex-wrap gap-3">
            {boundaryItems.map((item) => (
              <Badge key={item}>{item}</Badge>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {privacyPromises.map((promise) => (
          <Card className="bg-surface" key={promise.title}>
            <div className="mb-5 h-2 w-12 rounded-full bg-primary" />
            <h2 className="font-heading text-xl font-semibold text-primary-text">
              {promise.title}
            </h2>
            <p className="mt-3 leading-7 text-secondary-text">
              {promise.detail}
            </p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <PrivacyPreferencesCard />
        <LocalDataControlsCard />
      </section>
    </AppShell>
  );
}
