import type { CSSProperties } from "react";
import { defaultLayout, type Layout } from "@/puck/schema";
import { cn } from "@/lib/cn";

const paddingClass: Record<Layout["paddingY"], string> = {
  none: "py-0",
  sm: "py-6 md:py-8",
  md: "",
  lg: "py-16 md:py-24",
  xl: "py-24 md:py-32",
};

const widthClass: Record<Layout["maxWidth"], string> = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  full: "max-w-none",
};

export function resolveLayout(layout?: Layout | null): Layout {
  return layout ?? defaultLayout();
}

export function layoutSectionClass(layout?: Layout | null, className?: string) {
  const resolved = resolveLayout(layout);
  return cn(paddingClass[resolved.paddingY], className);
}

export function layoutInnerClass(layout?: Layout | null, className?: string) {
  const resolved = resolveLayout(layout);
  return cn("mx-auto w-full", widthClass[resolved.maxWidth], className);
}

/** Use theme --space-section only when padding is the default "md". */
export function layoutSectionStyle(layout?: Layout | null): CSSProperties | undefined {
  const resolved = resolveLayout(layout);
  if (resolved.paddingY !== "md") return undefined;
  return { paddingBlock: "var(--space-section)" };
}
