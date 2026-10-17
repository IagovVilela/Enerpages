"use client";

import type { CanvasElement, CanvasElementType } from "@/lib/canvas/site-canvas";
import { cn } from "@/lib/cn";

const LAYER_LABEL: Record<CanvasElementType, string> = {
  text: "Texto",
  button: "Botão",
  badge: "Selo",
  divider: "Divisor",
  spacer: "Espaço",
  hero: "Hero",
  panel: "Painel",
  grid: "Grade",
  rect: "Faixa",
  image: "Imagem",
  media: "Mídia",
  navbar: "Menu",
  services: "Serviços",
  team: "Equipe",
  contact: "Contato",
  footer: "Rodapé",
};

type Props = {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onToggleLock: (id: string) => void;
  onBringFront: (id: string) => void;
  onSendBack: (id: string) => void;
  className?: string;
};

export function CanvasLayersPanel({
  elements,
  selectedId,
  onSelect,
  onToggleHidden,
  onToggleLock,
  onBringFront,
  onSendBack,
  className,
}: Props) {
  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="shrink-0 border-b border-[var(--studio-line)] px-1 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Camadas</p>
        <p className="mt-0.5 text-[11px] text-neutral-500">Frente no topo · clique para selecionar</p>
      </div>
      {elements.length === 0 ? (
        <p className="px-1 py-4 text-xs text-neutral-500">Nenhum elemento nesta tela.</p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto py-2">
          {elements.map((el) => {
            const active = el.id === selectedId;
            return (
              <li key={el.id} className="mb-1">
                <div
                  className={cn(
                    "border px-2 py-1.5 transition",
                    active ? "border-[var(--studio-ink)] bg-[var(--studio-bg)]" : "border-transparent hover:border-[var(--studio-line)]",
                    el.hidden && "opacity-50",
                  )}
                >
                  <button type="button" className="flex w-full items-center gap-2 text-left" onClick={() => onSelect(el.id)}>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{LAYER_LABEL[el.type] ?? el.type}</span>
                    {el.locked ? <span className="text-[10px] text-neutral-500">travado</span> : null}
                  </button>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <button type="button" className="border border-[var(--studio-line)] px-1.5 py-0.5 text-[10px]" onClick={() => onToggleHidden(el.id)}>
                      {el.hidden ? "Mostrar" : "Ocultar"}
                    </button>
                    <button type="button" className="border border-[var(--studio-line)] px-1.5 py-0.5 text-[10px]" onClick={() => onToggleLock(el.id)}>
                      {el.locked ? "Destravar" : "Travar"}
                    </button>
                    <button type="button" className="border border-[var(--studio-line)] px-1.5 py-0.5 text-[10px]" onClick={() => onBringFront(el.id)}>
                      Frente
                    </button>
                    <button type="button" className="border border-[var(--studio-line)] px-1.5 py-0.5 text-[10px]" onClick={() => onSendBack(el.id)}>
                      Trás
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
