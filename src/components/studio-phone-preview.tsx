"use client";

export function StudioPhonePreview({
  open,
  url,
  onClose,
}: {
  open: boolean;
  url: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Fechar preview" onClick={onClose} />
      <div className="relative z-[1] flex max-h-[min(94svh,860px)] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-[var(--studio-line)] bg-[var(--studio-bg)] shadow-2xl max-sm:rounded-b-none">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--studio-line)] px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Preview celular</p>
            <p className="text-sm text-neutral-600">Rascunho atual · não publica sozinho</p>
          </div>
          <button type="button" className="rounded-full border border-[var(--studio-line)] px-3 py-1 text-xs" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="flex flex-1 justify-center overflow-hidden bg-neutral-900/90 p-4">
          <div className="relative h-[min(72svh,700px)] w-[min(100%,360px)] overflow-hidden rounded-[1.75rem] border-[6px] border-neutral-800 bg-white shadow-xl">
            <iframe title="Preview celular" src={url} className="h-full w-full border-0 bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
