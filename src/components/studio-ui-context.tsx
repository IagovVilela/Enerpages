"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { StudioConfirmModal } from "@/components/studio-confirm-modal";

type ConfirmRequest = {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
};

type StudioUiValue = {
  publicUrl: string;
  isPublished: boolean;
  toast: (message: string) => void;
  confirm: (request: ConfirmRequest) => Promise<boolean>;
};

const StudioUiContext = createContext<StudioUiValue | null>(null);

export function StudioUiProvider({
  publicUrl,
  isPublished,
  children,
}: {
  publicUrl: string;
  isPublished: boolean;
  children: ReactNode;
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [confirmState, setConfirmState] = useState<(ConfirmRequest & { resolve: (ok: boolean) => void }) | null>(null);

  const toast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage((current) => (current === message ? "" : current)), 2800);
  }, []);

  const confirm = useCallback((request: ConfirmRequest) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...request, resolve });
    });
  }, []);

  const value = useMemo(
    () => ({ publicUrl, isPublished, toast, confirm }),
    [publicUrl, isPublished, toast, confirm],
  );

  return (
    <StudioUiContext.Provider value={value}>
      {children}
      {toastMessage ? (
        <div
          role="status"
          className="pointer-events-none fixed bottom-4 left-1/2 z-[95] -translate-x-1/2 rounded-lg border border-[var(--studio-line)] bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)] shadow-lg"
        >
          {toastMessage}
        </div>
      ) : null}
      <StudioConfirmModal
        open={Boolean(confirmState)}
        title={confirmState?.title || ""}
        description={confirmState?.description || ""}
        confirmLabel={confirmState?.confirmLabel}
        danger={confirmState?.danger}
        onCancel={() => {
          confirmState?.resolve(false);
          setConfirmState(null);
        }}
        onConfirm={() => {
          confirmState?.resolve(true);
          setConfirmState(null);
        }}
      />
    </StudioUiContext.Provider>
  );
}

export function useStudioUi() {
  const value = useContext(StudioUiContext);
  if (!value) throw new Error("useStudioUi must be used within StudioUiProvider");
  return value;
}
