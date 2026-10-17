"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const DEFAULT_STEPS = [
  "Lendo o briefing…",
  "Montando estrutura…",
  "Escrevendo textos…",
  "Aplicando animações…",
  "Finalizando propostas…",
];

export function RequestProgress({
  active,
  label,
  steps = DEFAULT_STEPS,
  className,
}: {
  active: boolean;
  label?: string;
  steps?: string[];
  className?: string;
}) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      setStepIndex(0);
      return;
    }

    setProgress(8);
    setStepIndex(0);
    const tick = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current;
        const remaining = 92 - current;
        return Math.min(92, current + Math.max(1.2, remaining * 0.045));
      });
    }, 400);
    const step = window.setInterval(() => {
      setStepIndex((current) => Math.min(steps.length - 1, current + 1));
    }, 3200);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(step);
    };
  }, [active, steps.length]);

  useEffect(() => {
    if (!active && progress > 0) setProgress(100);
  }, [active, progress]);

  if (!active && progress === 0) return null;

  const message = label || steps[stepIndex] || steps[0];

  return (
    <div
      className={cn(
        "grid gap-2 border border-[var(--studio-line)] bg-white px-4 py-3",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy={active}
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-medium text-[var(--studio-ink)]">{message}</p>
        <span className="tabular-nums text-neutral-500">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--studio-line)]">
        <div
          className="h-full rounded-full bg-[var(--studio-ink)] transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-neutral-500">
        Aguarde — novas gerações ficam bloqueadas até esta terminar.
      </p>
    </div>
  );
}
