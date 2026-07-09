import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  titleAs?: "h1" | "h2" | "h3";
};

export function SectionHeader({
  className,
  description,
  eyebrow,
  title,
  titleAs = "h2",
}: SectionHeaderProps) {
  const Heading = titleAs;

  return (
    <div className={cn("space-y-5", className)}>
      {eyebrow ? (
        <p className="text-sm font-medium text-secondary">{eyebrow}</p>
      ) : null}
      <Heading
        className={cn(
          "font-heading font-semibold leading-tight text-primary-text",
          titleAs === "h1" ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl",
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p className="max-w-2xl text-base leading-8 text-secondary-text sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
