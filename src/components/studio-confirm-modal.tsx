"use client";

export function StudioConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label={cancelLabel} onClick={onCancel} />
      <div className="relative z-[1] w-full max-w-md border border-[var(--studio-line)] bg-[var(--studio-bg)] p-5 shadow-2xl">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-neutral-600">{description}</p>
        <div className="mt-4 flex justify-end gap-2 text-sm">
          <button type="button" className="border px-3 py-2" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              danger
                ? "bg-red-700 px-3 py-2 text-white disabled:opacity-50"
                : "bg-[var(--studio-ink)] px-3 py-2 text-[var(--studio-bg)] disabled:opacity-50"
            }
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
