"use client";

import { canvasContactHref, CanvasElementView } from "@/components/tenant-canvas-renderer";
import { elementsForArtboard, type SiteCanvasConfig } from "@/lib/canvas/site-canvas";
import { canvasThemeStyle } from "@/lib/canvas/theme-style";

const PHONE_W = 390;

export function CanvasPhonePreview({
  open,
  canvas,
  clientName,
  onClose,
}: {
  open: boolean;
  canvas: SiteCanvasConfig;
  clientName: string;
  onClose: () => void;
}) {
  if (!open) return null;

  const board = canvas.artboards.mobile;
  const elements = elementsForArtboard(canvas, "mobile");
  const scale = PHONE_W / board.width;
  const phoneH = Math.min(720, board.height * scale);

  return (
    <div className="fixed inset-0 z-[88] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Fechar preview" onClick={onClose} />
      <div className="relative z-[1] flex max-h-[min(94svh,860px)] w-full max-w-lg flex-col overflow-hidden border border-[var(--studio-line)] bg-[var(--studio-bg)] shadow-2xl max-sm:rounded-b-none">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--studio-line)] px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Preview celular</p>
            <h2 className="mt-1 font-[family-name:var(--font-brand-display)] text-lg font-medium">Como fica no celular</h2>
          </div>
          <button type="button" className="border border-[var(--studio-line)] px-3 py-1 text-xs" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="flex flex-1 justify-center overflow-auto bg-[#1c1915]/[0.92] p-6">
          <div
            className="overflow-hidden rounded-[1.75rem] border-[6px] border-[#2a2620] shadow-xl"
            style={{ width: PHONE_W, height: phoneH }}
          >
            <div
              className="origin-top-left"
              style={{
                width: board.width,
                height: board.height,
                transform: `scale(${scale})`,
                ...canvasThemeStyle(canvas.theme),
              }}
            >
              <div className="relative" style={{ width: board.width, height: board.height }}>
                {elements.map((el) => (
                  <CanvasElementView
                    key={el.id}
                    element={el}
                    board={board}
                    ctx={{
                      clientName,
                      homeHref: "/",
                      contactHref: canvasContactHref(canvas.theme),
                      editorChrome: true,
                      interactive: false,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
