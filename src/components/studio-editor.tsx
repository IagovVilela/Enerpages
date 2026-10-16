"use client";

import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { applyPageTemplate, publishPage, restoreVersion, saveDraft, unpublishPage } from "@/actions/studio";
import { PageTemplatePicker } from "@/components/page-template-picker";
import { libraryPlugin } from "@/components/studio-library";
import { layersPlugin } from "@/components/studio-layers";
import { StudioPhonePreview } from "@/components/studio-phone-preview";
import { config, puckDictionary } from "@/puck/config";
import { BG_ART_OPTIONS, bgArtStyle } from "@/puck/bg-art";
import type { PageTemplateId } from "@/puck/page-templates";
import { FONT_BY_PERSONALITY, STYLE_BY_PERSONALITY } from "@/lib/ai/archetypes";
import { TYPOGRAPHY_PRESETS } from "@/puck/section-presets";
import { BODY_FONTS, DISPLAY_FONTS, PERSONALITIES, type PageDocument, type Theme } from "@/puck/schema";
import { useStudioPuck } from "@/puck/use-studio-puck";
import { cn } from "@/lib/cn";

type Version = { id: string; version: number; label: string | null; source: string; createdAt: string };

export function StudioEditor({
  pageId,
  clientName,
  slug,
  segment,
  status: pageStatus,
  previewUrl,
  initial,
  versions,
}: {
  pageId: string;
  clientName: string;
  slug: string;
  segment: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  previewUrl: string;
  initial: PageDocument;
  versions: Version[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(pageStatus === "PUBLISHED" ? "No ar" : "Pronto");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [tick, setTick] = useState(0);
  const [editorKey, setEditorKey] = useState(0);
  const [document, setDocument] = useState(initial);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [confirmTemplate, setConfirmTemplate] = useState<PageTemplateId | null>(null);
  const [busyTemplate, setBusyTemplate] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const latest = useRef<Data>(initial as Data);
  const skip = useRef(true);

  useEffect(() => {
    setDocument(initial);
    latest.current = initial as Data;
  }, [initial]);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    setDirty(true);
    setStatus("Não salvo");
    const timer = window.setTimeout(async () => {
      setStatus("Salvando…");
      const result = await saveDraft(pageId, latest.current);
      if (result.ok) {
        setDirty(false);
        setStatus(pageStatus === "PUBLISHED" ? "Salvo · republicar para ir ao ar" : "Salvo");
      } else {
        setStatus(result.error);
      }
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [pageId, tick, pageStatus]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void (async () => {
          setStatus("Salvando…");
          const result = await saveDraft(pageId, latest.current);
          if (result.ok) {
            setDirty(false);
            setStatus(pageStatus === "PUBLISHED" ? "Salvo · republicar para ir ao ar" : "Salvo");
          } else {
            setStatus(result.error);
          }
        })();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pageId, pageStatus]);

  async function doApplyTemplate(id: PageTemplateId) {
    setBusyTemplate(true);
    setMessage("");
    const result = await applyPageTemplate(pageId, id, clientName, segment);
    setBusyTemplate(false);
    setConfirmTemplate(null);
    setTemplatesOpen(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    skip.current = true;
    setDocument(result.data);
    latest.current = result.data as Data;
    setDirty(false);
    setStatus("Modelo aplicado");
    setEditorKey((value) => value + 1);
    setMessage("Modelo aplicado. O layout foi substituído — use Versões se precisar voltar.");
    router.refresh();
  }

  return (
    <div className="studio-puck h-[calc(100vh-3.5rem)]">
      <Puck
        key={editorKey}
        config={config}
        data={document as Data}
        dictionary={puckDictionary}
        height="100%"
        viewports={[
          { width: 390, height: "auto", label: "Celular" },
          { width: 768, height: "auto", label: "Tablet" },
          { width: 1280, height: "auto", label: "Desktop" },
        ]}
        headerTitle={clientName}
        headerPath={slug}
        plugins={[libraryPlugin(), layersPlugin(), themePlugin, aiPlugin(pageId)]}
        overrides={{
          headerActions: ({ children }) => (
            <HeaderChrome
              status={status}
              dirty={dirty}
              pageStatus={pageStatus}
              versions={versions}
              pageId={pageId}
              onOpenTemplates={() => setTemplatesOpen(true)}
              onOpenPhone={() => setPhoneOpen(true)}
              onRestore={() => router.refresh()}
              onUnpublish={async () => {
                await unpublishPage(pageId);
                setMessage("Página despublicada.");
                setStatus("Rascunho");
                router.refresh();
              }}
              publishSlot={children}
            />
          ),
        }}
        onChange={(data) => {
          latest.current = data;
          setTick((value) => value + 1);
        }}
        onPublish={async (data) => {
          setStatus("Publicando…");
          const result = await publishPage(pageId, data);
          if (result.ok) {
            setDirty(false);
            setStatus("No ar");
            setMessage("Alterações no ar — o site público já mostra isso.");
            router.refresh();
          } else {
            setStatus(result.error);
          }
        }}
      />
      {message ? <p className="border-t border-[var(--studio-line)] px-4 py-2 text-sm">{message}</p> : null}

      <PageTemplatePicker
        open={templatesOpen && !confirmTemplate}
        busy={busyTemplate}
        onClose={() => setTemplatesOpen(false)}
        onPick={(id) => setConfirmTemplate(id)}
        title="Trocar modelo de página"
        description="Aplicar substitui o rascunho atual. Uma versão fica salva no histórico."
      />

      {confirmTemplate ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Cancelar" onClick={() => setConfirmTemplate(null)} />
          <div className="relative z-[1] w-full max-w-md border border-[var(--studio-line)] bg-[var(--studio-bg)] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold">Substituir o layout?</h3>
            <p className="mt-2 text-sm text-neutral-600">
              O modelo <strong>{confirmTemplate}</strong> vai substituir o conteúdo do rascunho. O histórico de versões guarda o estado anterior.
            </p>
            <div className="mt-4 flex justify-end gap-2 text-sm">
              <button type="button" className="border px-3 py-2" disabled={busyTemplate} onClick={() => setConfirmTemplate(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="bg-[var(--studio-ink)] px-3 py-2 text-[var(--studio-bg)] disabled:opacity-50"
                disabled={busyTemplate}
                onClick={() => doApplyTemplate(confirmTemplate)}
              >
                {busyTemplate ? "Aplicando…" : "Aplicar modelo"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <StudioPhonePreview open={phoneOpen} url={previewUrl} onClose={() => setPhoneOpen(false)} />
    </div>
  );
}

function HeaderChrome({
  status,
  dirty,
  pageStatus,
  versions,
  pageId,
  onOpenTemplates,
  onOpenPhone,
  onRestore,
  onUnpublish,
  publishSlot,
}: {
  status: string;
  dirty: boolean;
  pageStatus: string;
  versions: Version[];
  pageId: string;
  onOpenTemplates: () => void;
  onOpenPhone: () => void;
  onRestore: () => void;
  onUnpublish: () => void;
  publishSlot: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span
        className={cn(
          "rounded-full border px-2 py-0.5 font-medium",
          dirty
            ? "border-[var(--studio-accent)]/40 text-[var(--studio-accent)]"
            : status === "No ar"
              ? "border-emerald-600/30 text-emerald-800"
              : "border-[var(--studio-line)] text-neutral-600",
        )}
      >
        {status}
      </span>
      {pageStatus === "PUBLISHED" && !dirty ? (
        <span className="hidden text-[10px] uppercase tracking-wider text-neutral-500 sm:inline">No ar</span>
      ) : null}
      <button type="button" className="border px-2 py-1" onClick={onOpenTemplates}>
        Modelos
      </button>
      <button type="button" className="border px-2 py-1" onClick={onOpenPhone}>
        Preview celular
      </button>
      <HistoryTools pageId={pageId} versions={versions} onRestore={onRestore} />
      <button type="button" className="border px-2 py-1" onClick={onUnpublish}>
        Despublicar
      </button>
      {publishSlot}
    </div>
  );
}

function HistoryTools({ pageId, versions, onRestore }: { pageId: string; versions: Version[]; onRestore: () => void }) {
  const history = useStudioPuck((state) => state.history);
  return (
    <>
      <button type="button" className="border px-2 py-1" onClick={() => history.back()} disabled={!history.hasPast}>
        Desfazer
      </button>
      <button type="button" className="border px-2 py-1" onClick={() => history.forward()} disabled={!history.hasFuture}>
        Refazer
      </button>
      <details className="relative">
        <summary className="cursor-pointer border px-2 py-1">Versões</summary>
        <div className="absolute right-0 z-20 mt-2 max-h-80 w-72 overflow-auto border bg-white p-3 text-left shadow">
          {versions.map((version) => (
            <button
              key={version.id}
              type="button"
              className="block w-full border-b py-2 text-left"
              onClick={async () => {
                await restoreVersion(pageId, version.id);
                onRestore();
              }}
            >
              v{version.version} · {version.label || version.source}
              <span className="block text-[10px] text-neutral-500">{new Date(version.createdAt).toLocaleString("pt-BR")}</span>
            </button>
          ))}
        </div>
      </details>
    </>
  );
}

const themePlugin = {
  name: "tema",
  label: "Tema",
  render: () => <ThemePanel />,
};

function ThemePanel() {
  const theme = useStudioPuck((state) => (state.appState.data.root.props as { theme?: Theme } | undefined)?.theme);
  const dispatch = useStudioPuck((state) => state.dispatch);
  if (!theme) return <p className="p-3 text-sm">Tema indisponível.</p>;
  function update(next: Theme) {
    dispatch({
      type: "setData",
      data: (previous) => ({
        content: previous.content,
        zones: previous.zones,
        root: { ...previous.root, props: { ...previous.root.props, theme: next } },
      }),
    });
  }
  const colorLabels: Record<keyof Theme["colors"], string> = {
    primary: "Principal",
    accent: "Secundária / acento",
    background: "Fundo",
    muted: "Superfície",
    foreground: "Texto",
    border: "Borda",
  };
  return (
    <div className="grid gap-4 p-3 text-sm">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Cores do sistema</p>
        <p className="text-[11px] text-neutral-500">Controla a página inteira: fundo, textos, painéis e botões.</p>
        {(Object.keys(theme.colors) as Array<keyof Theme["colors"]>).map((key) => (
          <div key={key} className="flex items-center justify-between gap-2 text-xs">
            <span>{colorLabels[key]}</span>
            <input
              type="color"
              value={toColor(theme.colors[key])}
              onChange={(event) => update({ ...theme, colors: { ...theme.colors, [key]: event.target.value } })}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Arte de fundo</p>
        <div className="grid grid-cols-2 gap-1.5">
          {BG_ART_OPTIONS.map((opt) => {
            const active = (theme.bgArt ?? "none") === opt.id;
            const preview = bgArtStyle({
              bgArt: opt.id,
              bgArtColor: theme.bgArtColor || theme.colors.foreground,
              bgArtStrength: Math.max(theme.bgArtStrength ?? 45, 65),
              colors: theme.colors,
            });
            return (
              <button
                key={opt.id}
                type="button"
                title={opt.label}
                onClick={() => update({ ...theme, bgArt: opt.id })}
                className={cn(
                  "overflow-hidden rounded-lg border text-left",
                  active ? "border-[var(--studio-accent)] ring-1 ring-[var(--studio-accent)]/40" : "border-[var(--studio-line)]",
                )}
              >
                <div className="h-10 w-full" style={{ backgroundColor: theme.colors.background, ...preview }} />
                <span className="block px-1.5 py-1 text-[10px] font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
        {(theme.bgArt ?? "none") !== "none" ? (
          <div className="space-y-2 rounded-lg border border-[var(--studio-line)] p-2">
            <label className="flex items-center justify-between gap-2 text-xs">
              Cor das linhas
              <input
                type="color"
                value={toColor(theme.bgArtColor || theme.colors.foreground)}
                onChange={(event) => update({ ...theme, bgArtColor: event.target.value })}
              />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="flex justify-between">
                Intensidade
                <span className="text-neutral-500">{theme.bgArtStrength ?? 45}%</span>
              </span>
              <input
                type="range"
                min={8}
                max={90}
                value={theme.bgArtStrength ?? 45}
                onChange={(event) => update({ ...theme, bgArtStrength: Number(event.target.value) })}
              />
            </label>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Tipografia</p>
        <div className="grid gap-1">
          {TYPOGRAPHY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.hint}
              onClick={() =>
                update({
                  ...theme,
                  personality: preset.personality,
                  fonts: FONT_BY_PERSONALITY[preset.personality],
                  ...STYLE_BY_PERSONALITY[preset.personality],
                })
              }
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-left",
                theme.personality === preset.personality
                  ? "border-[var(--studio-accent)] bg-white"
                  : "border-[var(--studio-line)] bg-white/70",
              )}
            >
              <span className="block text-xs font-medium">{preset.label}</span>
              <span className="block text-[10px] text-neutral-500">{preset.hint}</span>
            </button>
          ))}
        </div>
        <label className="grid gap-1 text-xs">
          Fonte de título
          <select
            className="border px-2 py-1.5 text-sm"
            value={theme.fonts.display}
            onChange={(event) => update({ ...theme, fonts: { ...theme.fonts, display: event.target.value as Theme["fonts"]["display"] } })}
          >
            {DISPLAY_FONTS.map((font) => (
              <option key={font}>{font}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs">
          Fonte de texto
          <select
            className="border px-2 py-1.5 text-sm"
            value={theme.fonts.body}
            onChange={(event) => update({ ...theme, fonts: { ...theme.fonts, body: event.target.value as Theme["fonts"]["body"] } })}
          >
            {BODY_FONTS.map((font) => (
              <option key={font}>{font}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Forma e ritmo</p>
        {(
          [
            ["radius", "Cantos", ["none", "sm", "md", "lg"]],
            ["shadow", "Sombra", ["none", "soft", "hard"]],
            ["button", "Botão", ["solid", "outline", "pill", "underline"]],
            ["image", "Imagem", ["sharp", "rounded", "framed", "bleed"]],
            ["spacing", "Espaçamento", ["compact", "comfortable", "airy"]],
            ["cursor", "Cursor", ["default", "dot"]],
          ] as const
        ).map(([key, label, options]) => (
          <label key={key} className="grid gap-1 text-xs">
            {label}
            <select
              className="border px-2 py-1.5 text-sm"
              value={theme[key]}
              onChange={(event) => update({ ...theme, [key]: event.target.value })}
            >
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="grid gap-1 text-xs">
          Personalidade
          <select
            className="border px-2 py-1.5 text-sm"
            value={theme.personality}
            onChange={(event) => update({ ...theme, personality: event.target.value as Theme["personality"] })}
          >
            {PERSONALITIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function aiPlugin(pageId: string) {
  return {
    name: "ia",
    label: "IA",
    render: () => <AiPanel pageId={pageId} />,
  };
}

function AiPanel({ pageId }: { pageId: string }) {
  const selectedItem = useStudioPuck((state) => state.selectedItem);
  const dispatch = useStudioPuck((state) => state.dispatch);
  const [note, setNote] = useState("");
  async function run(mode: "text" | "style" | "section") {
    if (!selectedItem) return;
    setNote("Reescrevendo…");
    const response = await fetch("/api/ai/block", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pageId, block: selectedItem, mode }),
    });
    const payload = (await response.json()) as { block?: Data["content"][number]; error?: string; warning?: string };
    if (!response.ok || !payload.block) {
      setNote(payload.error || "Não foi possível reescrever.");
      return;
    }
    dispatch({
      type: "setData",
      data: (previous) => ({
        ...previous,
        content: previous.content.map((item) => (item.props.id === selectedItem.props.id ? payload.block! : item)),
      }),
    });
    setNote(payload.warning || "Bloco atualizado. O autosave grava em seguida.");
  }
  return (
    <div className="grid gap-2 p-3 text-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Assistente</p>
      <p>Bloco selecionado: {selectedItem?.type || "nenhum"}</p>
      <button type="button" className="border px-2 py-1 text-left" onClick={() => run("text")}>
        Reescrever texto
      </button>
      <button type="button" className="border px-2 py-1 text-left" onClick={() => run("style")}>
        Mudar estilo
      </button>
      <button type="button" className="border px-2 py-1 text-left" onClick={() => run("section")}>
        Regenerar seção
      </button>
      {note ? <p className="text-xs">{note}</p> : null}
      <p className="text-xs text-neutral-500">Depoimentos e fotos de pessoas continuam como placeholder.</p>
    </div>
  );
}

function toColor(value: string) {
  return /^#(?:[0-9a-fA-F]{6})$/.test(value) ? value : "#000000";
}
