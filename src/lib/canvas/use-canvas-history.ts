"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import type { SiteCanvasConfig } from "@/lib/canvas/site-canvas";

const MAX_HISTORY = 80;
const COALESCE_MS = 400;

function cloneCanvas(c: SiteCanvasConfig): SiteCanvasConfig {
  return structuredClone(c);
}

function sameCanvas(a: SiteCanvasConfig, b: SiteCanvasConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function resolveNext(prev: SiteCanvasConfig, updater: SetStateAction<SiteCanvasConfig>): SiteCanvasConfig {
  return typeof updater === "function" ? updater(prev) : updater;
}

export function useCanvasHistory(initial: SiteCanvasConfig) {
  const [canvas, setCanvasState] = useState(initial);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const presentRef = useRef(canvas);
  const pastRef = useRef<SiteCanvasConfig[]>([]);
  const futureRef = useRef<SiteCanvasConfig[]>([]);
  const gestureBaselineRef = useRef<SiteCanvasConfig | null>(null);
  const coalesceBaselineRef = useRef<SiteCanvasConfig | null>(null);
  const coalesceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    presentRef.current = canvas;
  }, [canvas]);

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const clearCoalesceTimer = useCallback(() => {
    if (coalesceTimerRef.current) {
      clearTimeout(coalesceTimerRef.current);
      coalesceTimerRef.current = null;
    }
  }, []);

  const pushPast = useCallback(
    (snapshot: SiteCanvasConfig) => {
      pastRef.current.push(snapshot);
      if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift();
      futureRef.current = [];
      syncFlags();
    },
    [syncFlags],
  );

  const flushCoalesce = useCallback(() => {
    clearCoalesceTimer();
    if (coalesceBaselineRef.current) {
      if (!sameCanvas(coalesceBaselineRef.current, presentRef.current)) {
        pushPast(coalesceBaselineRef.current);
      }
      coalesceBaselineRef.current = null;
    }
  }, [clearCoalesceTimer, pushPast]);

  const beginInteraction = useCallback(() => {
    flushCoalesce();
    if (!gestureBaselineRef.current) {
      gestureBaselineRef.current = cloneCanvas(presentRef.current);
    }
  }, [flushCoalesce]);

  const endInteraction = useCallback(() => {
    const baseline = gestureBaselineRef.current;
    gestureBaselineRef.current = null;
    // presentRef may lag one frame behind the last setCanvas during drag — prefer live state via flush on next tick
    queuePromise.resolve().then(() => {
      if (baseline && !sameCanvas(baseline, presentRef.current)) {
        pushPast(baseline);
      }
    });
  }, [pushPast]);

  const setCanvas = useCallback(
    (updater: SetStateAction<SiteCanvasConfig>) => {
      setCanvasState((prev) => {
        const next = resolveNext(prev, updater);
        if (sameCanvas(next, prev)) return prev;
        if (gestureBaselineRef.current) {
          presentRef.current = next;
          return next;
        }
        if (!coalesceBaselineRef.current) {
          coalesceBaselineRef.current = cloneCanvas(prev);
        }
        clearCoalesceTimer();
        coalesceTimerRef.current = setTimeout(() => {
          flushCoalesce();
        }, COALESCE_MS);
        presentRef.current = next;
        return next;
      });
    },
    [clearCoalesceTimer, flushCoalesce],
  );

  const commitCanvas = useCallback(
    (updater: SetStateAction<SiteCanvasConfig>) => {
      flushCoalesce();
      gestureBaselineRef.current = null;
      setCanvasState((prev) => {
        const next = resolveNext(prev, updater);
        if (sameCanvas(next, prev)) return prev;
        const snapshot = cloneCanvas(prev);
        presentRef.current = next;
        queuePromise.resolve().then(() => {
          pushPast(snapshot);
        });
        return next;
      });
    },
    [flushCoalesce, pushPast],
  );

  const replaceCanvas = useCallback(
    (next: SiteCanvasConfig) => {
      clearCoalesceTimer();
      coalesceBaselineRef.current = null;
      gestureBaselineRef.current = null;
      pastRef.current = [];
      futureRef.current = [];
      presentRef.current = next;
      setCanvasState(next);
      syncFlags();
    },
    [clearCoalesceTimer, syncFlags],
  );

  const undo = useCallback(() => {
    flushCoalesce();
    gestureBaselineRef.current = null;
    const previous = pastRef.current.pop();
    if (!previous) {
      syncFlags();
      return;
    }
    futureRef.current.push(cloneCanvas(presentRef.current));
    presentRef.current = previous;
    setCanvasState(previous);
    syncFlags();
  }, [flushCoalesce, syncFlags]);

  const redo = useCallback(() => {
    flushCoalesce();
    gestureBaselineRef.current = null;
    const next = futureRef.current.pop();
    if (!next) {
      syncFlags();
      return;
    }
    pastRef.current.push(cloneCanvas(presentRef.current));
    presentRef.current = next;
    setCanvasState(next);
    syncFlags();
  }, [flushCoalesce, syncFlags]);

  useEffect(() => () => clearCoalesceTimer(), [clearCoalesceTimer]);

  return {
    canvas,
    setCanvas,
    commitCanvas,
    replaceCanvas,
    beginInteraction,
    endInteraction,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
