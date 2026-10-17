"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Animation } from "@/puck/schema";
import { cn } from "@/lib/cn";

/** Avoid SSR/client text mismatch from prefers-reduced-motion. */
function useMotionReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const reduce = useReducedMotion();
  return { ready, reduce: Boolean(reduce) };
}

const ease = {
  easeOut: [0.22, 1, 0.36, 1] as const,
  easeInOut: [0.65, 0, 0.35, 1] as const,
  spring: { type: "spring" as const, stiffness: 180, damping: 22 },
  linear: "linear" as const,
};

export function MotionPreset({
  animation,
  className,
  children,
  preserveLcp = false,
}: {
  animation?: Animation;
  className?: string;
  children: ReactNode;
  preserveLcp?: boolean;
}) {
  const { ready, reduce } = useMotionReady();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [28, -28]);

  if (!ready || !animation || reduce || animation.preset === "none" || animation.preset === "split-words" || animation.preset === "split-chars") {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  if (animation.trigger === "scroll") {
    return (
      <motion.div ref={ref} style={{ y }} className={className}>
        {children}
      </motion.div>
    );
  }

  const hidden = {
    opacity: preserveLcp ? 1 : 0,
    x: animation.preset === "slide-left" ? 28 : 0,
    y: animation.preset === "slide-up" || animation.preset === "fade" || animation.preset === "blur-in" ? 24 : 0,
    scale: animation.preset === "scale" ? 0.96 : 1,
  };
  const shown = { opacity: 1, x: 0, y: 0, scale: 1 };
  const transition =
    animation.easing === "spring"
      ? { ...ease.spring, delay: animation.delay }
      : { duration: animation.duration, delay: animation.delay, ease: ease[animation.easing] };

  return (
    <motion.div
      ref={ref}
      className={cn(
        className,
        animation.preset === "stagger" && "stagger-children",
        animation.preset === "mask-reveal" && "preset-mask",
        animation.preset === "blur-in" && "preset-blur",
      )}
      initial={animation.trigger === "hover" ? shown : hidden}
      whileInView={animation.trigger === "view" ? shown : undefined}
      animate={animation.trigger === "load" ? shown : undefined}
      whileHover={animation.trigger === "hover" ? { scale: 1.015 } : undefined}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

export function SplitText({ text, mode, className }: { text: string; mode: "words" | "chars"; className?: string }) {
  const { ready, reduce } = useMotionReady();
  // Same markup on server and first client paint — avoids React #418 text mismatch.
  if (!ready || reduce) return <span className={className}>{text}</span>;
  const parts = mode === "words" ? text.split(" ") : [...text];
  return (
    <span className={className} aria-label={text}>
      {parts.map((part, index) => (
        <motion.span
          key={`${part}-${index}`}
          className="inline-block"
          initial={{ opacity: 0, y: "0.35em" }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: Math.min(index * 0.035, 0.45), duration: 0.45 }}
          aria-hidden
        >
          {part}
          {mode === "words" ? "\u00A0" : null}
        </motion.span>
      ))}
    </span>
  );
}

export function Counter({ value }: { value: string }) {
  const { ready, reduce } = useMotionReady();
  const match = value.match(/-?\d[\d.]*/);
  const number = match ? Number(match[0].replace(/\./g, "")) : null;
  if (!ready || reduce || number === null || Number.isNaN(number)) return <span>{value}</span>;
  return (
    <motion.span
      initial={{ opacity: 0.4 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {value}
    </motion.span>
  );
}
