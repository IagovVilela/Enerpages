"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Animation } from "@/puck/schema";
import { cn } from "@/lib/cn";

/** Animations only after mount — avoids SSR/client text mismatch (React #418). */
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

  // Always the same DOM text tree on server + first client paint.
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

/** Keep text as a single node forever — split animation caused React #418 (nbsp vs space). */
export function SplitText({ text, className }: { text: string; mode?: "words" | "chars"; className?: string }) {
  return <span className={className}>{text}</span>;
}

export function Counter({ value }: { value: string }) {
  return <span>{value}</span>;
}
