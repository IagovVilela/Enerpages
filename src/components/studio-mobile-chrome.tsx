"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LibraryPanel } from "@/components/studio-library";
import { LayersPanel } from "@/components/studio-layers";
import { ThemePanel } from "@/components/studio-theme-panel";
import { useStudioUi } from "@/components/studio-ui-context";
import { copyTextToClipboard, downloadPublicQrPng } from "@/lib/studio-share";
import { useStudioPuck } from "@/puck/use-studio-puck";
import { cn } from "@/lib/cn";

export type MobileSheet = "library" | "layers" | "theme" | "fields" | "more" | null;

type Props = {
  slug: string;
  publicUrl: string;
  pageStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  onOpenTemplates: () => void;
  onOpenPhone: () => void;
};

export function StudioMobileChrome({ slug, publicUrl, pageStatus, onOpenTemplates, onOpenPhone }: Props) {
  const [sheet, setSheet] = useState<MobileSheet>(null);
  const dispatch = useStudioPuck((state) => state.dispatch);
  const selectedItem = useStudioPuck((state) => state.selectedItem);
  const history = useStudioPuck((state) => state.history);
  const { toast } = useStudioUi();
  const published = pageStatus === "PUBLISHED";

  useEffect(() => {
    function syncSidebars() {
      const narrow = window.matchMedia("(max-width: 1023px)").matches;
      if (!narrow) return;
      dispatch({
        type: "setUi",
        ui: { leftSideBarVisible: false, rightSideBarVisible: false },
      });
    }
    syncSidebars();
    const media = window.matchMedia("(max-width: 1023px)");
    media.addEventListener("change", syncSidebars);
    return () => media.removeEventListener("change", syncSidebars);
  }, [dispatch]);

  function toggle(next: MobileSheet) {
    setSheet((current) => (current === next ? null : next));
  }

  function duplicateSelected() {
    if (!selectedItem) return;
    const selectedId = (selectedItem.props as { id?: string }).id;
    dispatch({
      type: "setData",
      data: (previous) => {
        const index = previous.content.findIndex((block) => (block.props as { id?: string }).id === selectedId);
        if (index < 0) return previous;
        const item = previous.content[index];
        const clone = {
          ...item,
          props: {
            ...item.props,
            id: `${String(item.type).toLowerCase()}-${Date.now().toString(36)}`,
            locked: false,
          },
        };
        const content = [...previous.content];
        content.splice(index + 1, 0, clone);
        return { ...previous, content };
      },
    });
    toast("Bloco duplicado.");
  }

  return (
    <>
      <nav
        className="studio-mobile-dock fixed inset-x-0 bottom-0 z-[70] flex gap-0.5 overflow-x-auto border-t border-[var(--studio-line)] bg-[var(--studio-bg)]/95 px-1 py-1.5 backdrop-blur lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
        aria-label="Ferramentas do editor"
      >
        {selectedItem ? (
          <>
            <DockBtn active={sheet === "library"} onClick={() => toggle("library")} label="Itens" />
            <DockBtn active={sheet === "layers"} onClick={() => toggle("layers")} label="Camadas" />
            <DockBtn active={sheet === "fields"} onClick={() => toggle("fields")} label="Editar" />
            <DockBtn onClick={duplicateSelected} label="Duplicar" />
            <DockBtn active={sheet === "more"} onClick={() => toggle("more")} label="Mais" />
          </>
        ) : (
          <>
            <DockBtn onClick={onOpenTemplates} label="Modelos" />
            <DockBtn active={sheet === "library"} onClick={() => toggle("library")} label="Itens" />
            <DockBtn active={sheet === "layers"} onClick={() => toggle("layers")} label="Camadas" />
            <DockBtn active={sheet === "theme"} onClick={() => toggle("theme")} label="Tema" />
            <DockBtn onClick={onOpenPhone} label="Celular" />
            <DockBtn active={sheet === "more"} onClick={() => toggle("more")} label="Mais" />
          </>
        )}
      </nav>

      <MobileSheet
        open={sheet !== null}
        title={
          sheet === "library"
            ? "Biblioteca"
            : sheet === "layers"
              ? "Camadas"
              : sheet === "theme"
                ? "Tema"
                : sheet === "fields"
                  ? "Propriedades"
                  : "Opções"
        }
        onClose={() => setSheet(null)}
      >
        {sheet === "library" ? <LibraryPanel /> : null}
        {sheet === "layers" ? <LayersPanel /> : null}
        {sheet === "theme" ? <ThemePanel /> : null}
        {sheet === "fields" ? (
          <div className="grid gap-2 p-4 text-sm">
            <p className="text-neutral-600">
              Abre o painel de propriedades do Puck para o bloco selecionado
              {selectedItem ? ` (${selectedItem.type})` : ""}.
            </p>
            <button
              type="button"
              className="rounded-xl border border-[var(--studio-line)] bg-[var(--studio-ink)] px-4 py-3 text-left font-medium text-[var(--studio-bg)]"
              onClick={() => {
                dispatch({ type: "setUi", ui: { rightSideBarVisible: true, leftSideBarVisible: false } });
                setSheet(null);
              }}
            >
              Abrir propriedades
            </button>
          </div>
        ) : null}
        {sheet === "more" ? (
          <div className="grid gap-1 p-3 text-sm">
            <SheetAction
              label="Abrir propriedades"
              hint="Mostra o painel direito do Puck"
              onClick={() => {
                dispatch({ type: "setUi", ui: { rightSideBarVisible: true, leftSideBarVisible: false } });
                setSheet(null);
              }}
            />
            <SheetAction
              label="Abrir biblioteca Puck"
              hint="Mostra o painel esquerdo do Puck"
              onClick={() => {
                dispatch({ type: "setUi", ui: { leftSideBarVisible: true, rightSideBarVisible: false } });
                setSheet(null);
              }}
            />
            <SheetAction label="Modelos de página" onClick={() => { onOpenTemplates(); setSheet(null); }} />
            <SheetAction label="Preview celular" onClick={() => { onOpenPhone(); setSheet(null); }} />
            <SheetAction
              label="Desfazer"
              onClick={() => history.back()}
              disabled={!history.hasPast}
            />
            <SheetAction
              label="Refazer"
              onClick={() => history.forward()}
              disabled={!history.hasFuture}
            />
            <SheetAction
              label="Copiar link do site"
              hint={published ? publicUrl : "Publique primeiro"}
              onClick={() => {
                if (!published) {
                  toast("Publique a página para compartilhar o link público.");
                  return;
                }
                void copyTextToClipboard(publicUrl).then((ok) => toast(ok ? "Link do site copiado." : "Não foi possível copiar."));
              }}
            />
            <SheetAction
              label="Baixar QR"
              onClick={() => {
                if (!published) {
                  toast("Publique a página para baixar o QR do site.");
                  return;
                }
                void downloadPublicQrPng(publicUrl, slug).then((ok) =>
                  toast(ok ? "QR code baixado — pode imprimir ou enviar." : "Não foi possível baixar o QR."),
                );
              }}
            />
            {published ? (
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[var(--studio-line)] px-4 py-3 text-left hover:bg-white"
                onClick={() => setSheet(null)}
              >
                Ver site público
              </a>
            ) : null}
          </div>
        ) : null}
      </MobileSheet>
    </>
  );
}

function DockBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 text-[10px] font-semibold transition",
        active ? "bg-[var(--studio-ink)] text-[var(--studio-bg)]" : "text-neutral-600 hover:bg-white",
      )}
    >
      {label}
    </button>
  );
}

function MobileSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center lg:hidden">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Fechar" onClick={onClose} />
      <div
        className="relative z-[1] flex max-h-[min(78svh,640px)] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--studio-line)] bg-[var(--studio-bg)] shadow-2xl"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--studio-line)] px-4 py-3">
          <p className="text-sm font-semibold">{title}</p>
          <button type="button" className="border px-2 py-1 text-xs" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function SheetAction({
  label,
  hint,
  onClick,
  disabled,
}: {
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl border border-[var(--studio-line)] px-4 py-3 text-left disabled:opacity-40"
    >
      <span className="block text-sm font-medium">{label}</span>
      {hint ? <span className="mt-0.5 block text-[11px] text-neutral-500">{hint}</span> : null}
    </button>
  );
}
