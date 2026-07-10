import type { ReactNode } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/#nutrition", label: "Nutrition" },
  { href: "/#cycle", label: "Cycle" },
  { href: "/#insights", label: "Insights" },
  { href: "/settings", label: "Privacy" },
];

type AppShellProps = {
  activeHref?: string;
  children: ReactNode;
};

export function AppShell({ activeHref = "/", children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-primary-text sm:px-10 lg:px-16">
      <PageContainer className="min-h-[calc(100vh-4rem)] justify-between gap-12">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Cycle Companion
            </p>
            <p className="mt-1 text-sm text-secondary-text">
              Private pattern tracking for cycle-aware wellness
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <nav aria-label="Primary navigation" className="hidden md:block">
              <ul className="flex items-center gap-2 rounded-full border border-soft-stone bg-surface p-1 text-sm text-secondary-text">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      className={cn(
                        "block rounded-full px-3 py-2 transition-colors hover:bg-warm-cream hover:text-primary-text",
                        activeHref === item.href &&
                          "bg-warm-cream font-medium text-primary-text",
                      )}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <Badge>Planning build</Badge>
          </div>
        </header>

        {children}
      </PageContainer>
    </main>
  );
}
