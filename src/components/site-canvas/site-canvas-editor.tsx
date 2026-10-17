"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CanvasOnboarding,
  hasSeenCanvasOnboarding,
  markCanvasOnboardingSeen,
} from "@/components/site-canvas/canvas-onboarding";
import { CanvasLayersPanel } from "@/components/site-canvas/canvas-layers-panel";
import { CanvasPhonePreview } from "@/components/site-canvas/canvas-phone-preview";
import { canvasContactHref, CanvasElementView } from "@/components/tenant-canvas-renderer";
import { CANVAS_BG_ART_OPTIONS } from "@/lib/canvas/bg-art";
import { snapFrameToGrid, snapFrameWithSmartGuides, type SmartGuide } from "@/lib/canvas/layout-grid";
import { CANVAS_MEDIA_ACCEPT } from "@/lib/canvas/media";
import {
  buildCanvasPageTemplate,
  PAGE_TEMPLATE_META,
  type CanvasPageTemplateId,
} from "@/lib/canvas/page-templates";
import {
  applyStylePreset,
  createPremadeSection,
  createStyledLibraryElement,
  nextArtboardY,
  PREMADE_SECTIONS,
  stylePresetsForType,
  type PremadeSectionId,
} from "@/lib/canvas/presets";
import {
  copyDesktopToMobile,
  createLibraryElement,
  elementsForArtboard,
  layerElementsForArtboard,
  type CanvasArtboardId,
  type CanvasElement,
  type CanvasElementType,
  type SiteCanvasConfig,
} from "@/lib/canvas/site-canvas";
import { MaskedPhoneInput } from "@/components/masked-phone-input";
import { applyThemeChangeToCanvas, canvasThemeStyle } from "@/lib/canvas/theme-style";
import { useCanvasHistory } from "@/lib/canvas/use-canvas-history";
import { cn } from "@/lib/cn";
import { uploadFile } from "@/puck/media-upload";

const LIBRARY: { group: string; types: CanvasElementType[] }[] = [
  { group: "Básicos", types: ["text", "button", "badge", "divider", "spacer"] },
  { group: "Layout", types: ["hero", "panel", "grid", "rect"] },
  { group: "Mídia", types: ["image", "media"] },
  { group: "Negócio", types: ["navbar", "services", "team", "contact", "footer"] },
];

const LABELS: Record<CanvasElementType, string> = {
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
  navbar: "Navbar",
  services: "Serviços",
  team: "Equipe",
  contact: "Contato",
  footer: "Rodapé",
};

const PRONTOS: { type: "button" | "badge" | "text" | "panel" | "hero" | "rect"; presetId: string; label: string }[] = [
  { type: "button", presetId: "solid", label: "Botão sólido" },
  { type: "button", presetId: "outline", label: "Botão contorno" },
  { type: "badge", presetId: "pill-brand", label: "Selo pílula" },
  { type: "text", presetId: "display", label: "Texto display" },
  { type: "panel", presetId: "card", label: "Painel card" },
  { type: "hero", presetId: "cinematic", label: "Hero cinema" },
  { type: "rect", presetId: "band", label: "Faixa full" },
];

type LeftTab = "itens" | "secoes" | "prontos" | "camadas";

type Props = {
  pageId: string;
  clientName: string;
  initial: SiteCanvasConfig;
  statusLabel: string;
  onSave: (canvas: SiteCanvasConfig) => Promise<{ ok: boolean; error?: string }>;
  onPublish: (canvas: SiteCanvasConfig) => Promise<{ ok: boolean; error?: string }>;
  onSwitchToPuck: () => void;
  onLiveChange?: (canvas: SiteCanvasConfig) => void;
};

export function SiteCanvasEditor({
  clientName,
  initial,
  statusLabel,
  onSave,
  onPublish,
  onSwitchToPuck,
  onLiveChange,
}: Props) {
  const history = useCanvasHistory(initial);
  const { canvas, setCanvas, commitCanvas, beginInteraction, endInteraction, undo, redo, canUndo, canRedo } = history;
  const [artboard, setArtboard] = useState<CanvasArtboardId>("desktop");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [guides, setGuides] = useState<SmartGuide[]>([]);
  const [zoom, setZoom] = useState(0.55);
  const [leftTab, setLeftTab] = useState<LeftTab>("itens");
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [confirmTemplate, setConfirmTemplate] = useState<CanvasPageTemplateId | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [inspectorFocus, setInspectorFocus] = useState<"props" | "theme">("theme");
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    mode: "move" | "resize";
    handle?: string;
    startX: number;
    startY: number;
    startFrame: CanvasElement["frame"];
  } | null>(null);

  useEffect(() => {
    onLiveChange?.(canvas);
  }, [canvas, onLiveChange]);

  useEffect(() => {
    setOnboardingOpen(!hasSeenCanvasOnboarding());
  }, []);

  const board = canvas.artboards[artboard];
  const els = useMemo(() => elementsForArtboard(canvas, artboard), [canvas, artboard]);
  const layerEls = useMemo(() => layerElementsForArtboard(canvas, artboard), [canvas, artboard]);
  const selected = els.find((e) => e.id === selectedId) || layerEls.find((e) => e.id === selectedId) || null;

  const markDirty = useCallback(() => {
    setDirty(true);
    setMessage("");
  }, []);

  const updateElement = useCallback(
    (id: string, patch: Partial<CanvasElement>, commit = false) => {
      const fn = commit ? commitCanvas : setCanvas;
      fn((prev) => ({
        ...prev,
        elements: prev.elements.map((e) => (e.id === id ? { ...e, ...patch, props: { ...e.props, ...patch.props } } : e)),
      }));
      markDirty();
    },
    [commitCanvas, setCanvas, markDirty],
  );

  function addType(type: CanvasElementType) {
    const atY = nextArtboardY(canvas, artboard);
    const next = createLibraryElement(type, artboard, board.width, atY);
    commitCanvas((prev) => ({ ...prev, elements: [...prev.elements, next] }));
    setSelectedId(next.id);
    setInspectorFocus("props");
    markDirty();
  }

  function addSection(id: PremadeSectionId) {
    const atY = nextArtboardY(canvas, artboard);
    const nodes = createPremadeSection(id, artboard, board.width, atY);
    commitCanvas((prev) => ({ ...prev, elements: [...prev.elements, ...nodes] }));
    if (nodes[0]) setSelectedId(nodes[0].id);
    markDirty();
  }

  function addPronto(type: (typeof PRONTOS)[number]["type"], presetId: string) {
    const atY = nextArtboardY(canvas, artboard);
    const next = createStyledLibraryElement(type, presetId, artboard, board.width, atY);
    if (!next) return;
    commitCanvas((prev) => ({ ...prev, elements: [...prev.elements, next] }));
    setSelectedId(next.id);
    markDirty();
  }

  function removeSelected() {
    if (!selected || selected.locked) return;
    commitCanvas((prev) => ({ ...prev, elements: prev.elements.filter((e) => e.id !== selected.id) }));
    setSelectedId(null);
    markDirty();
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy: CanvasElement = {
      ...structuredClone(selected),
      id: `${selected.type}-${Date.now().toString(36)}`,
      frame: { ...selected.frame, x: selected.frame.x + 16, y: selected.frame.y + 16 },
      zIndex: selected.zIndex + 1,
    };
    commitCanvas((prev) => ({ ...prev, elements: [...prev.elements, copy] }));
    setSelectedId(copy.id);
    markDirty();
  }

  function bringFront(id: string) {
    const maxZ = Math.max(0, ...canvas.elements.filter((e) => e.artboard === artboard).map((e) => e.zIndex));
    updateElement(id, { zIndex: maxZ + 1 }, true);
  }

  function sendBack(id: string) {
    const minZ = Math.min(0, ...canvas.elements.filter((e) => e.artboard === artboard).map((e) => e.zIndex));
    updateElement(id, { zIndex: minZ - 1 }, true);
  }

  function applyTemplate(id: CanvasPageTemplateId) {
    const next = buildCanvasPageTemplate(id, clientName);
    commitCanvas(() => next);
    setSelectedId(null);
    setConfirmTemplate(null);
    setTemplatesOpen(false);
    markDirty();
    setMessage(`Modelo ${id} aplicado.`);
  }

  function onPointerDown(e: React.PointerEvent, el: CanvasElement, mode: "move" | "resize", handle?: string) {
    if (el.locked) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(el.id);
    setInspectorFocus("props");
    beginInteraction();
    dragRef.current = {
      id: el.id,
      mode,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startFrame: { ...el.frame },
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = (e.clientX - drag.startX) / zoom;
      const dy = (e.clientY - drag.startY) / zoom;
      let frame = { ...drag.startFrame };
      if (drag.mode === "move") {
        frame.x = drag.startFrame.x + dx;
        frame.y = drag.startFrame.y + dy;
      } else {
        const h = drag.handle || "se";
        if (h.includes("e")) frame.w = Math.max(24, drag.startFrame.w + dx);
        if (h.includes("s")) frame.h = Math.max(8, drag.startFrame.h + dy);
        if (h.includes("w")) {
          frame.x = drag.startFrame.x + dx;
          frame.w = Math.max(24, drag.startFrame.w - dx);
        }
        if (h.includes("n")) {
          frame.y = drag.startFrame.y + dy;
          frame.h = Math.max(8, drag.startFrame.h - dy);
        }
      }
      const peers = els.filter((item) => item.id !== drag.id).map((item) => item.frame);
      const snapped = snapFrameWithSmartGuides(frame, board, peers);
      setGuides(snapped.guides);
      setCanvas((prev) => ({
        ...prev,
        elements: prev.elements.map((item) =>
          item.id === drag.id ? { ...item, frame: snapFrameToGrid(snapped.frame) } : item,
        ),
      }));
      markDirty();
    }
    function onUp() {
      if (!dragRef.current) return;
      dragRef.current = null;
      setGuides([]);
      endInteraction();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [board, els, endInteraction, markDirty, setCanvas, zoom]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }
      if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  async function save() {
    setBusy(true);
    const result = await onSave(canvas);
    setBusy(false);
    if (result.ok) {
      setDirty(false);
      setMessage("Salvo.");
    } else {
      setMessage(result.error || "Falha ao salvar.");
    }
  }

  async function publish() {
    setBusy(true);
    const result = await onPublish(canvas);
    setBusy(false);
    if (result.ok) {
      setDirty(false);
      setMessage("Publicado no motor Ze.");
      markCanvasOnboardingSeen();
      setOnboardingOpen(false);
    } else {
      setMessage(result.error || "Falha ao publicar.");
    }
  }

  const selectedPresets = selected ? stylePresetsForType(selected.type) : [];

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col bg-[var(--studio-bg)] text-[var(--studio-ink)]">
      <header className="flex flex-wrap items-center gap-2 border-b border-[var(--studio-line)] bg-[color-mix(in_srgb,var(--studio-bg)_88%,white)] px-3 py-2 text-sm">
        <span className="font-[family-name:var(--font-brand-display)] font-medium">Ambiente Ze</span>
        <button type="button" className="border border-[var(--studio-line)] bg-white px-2 py-1" onClick={onSwitchToPuck}>
          Ir para Puck
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            className={cn("border px-2 py-1", artboard === "desktop" ? "bg-[var(--studio-ink)] text-[var(--studio-bg)]" : "bg-white")}
            onClick={() => setArtboard("desktop")}
          >
            Desktop
          </button>
          <button
            type="button"
            className={cn("border px-2 py-1", artboard === "mobile" ? "bg-[var(--studio-ink)] text-[var(--studio-bg)]" : "bg-white")}
            onClick={() => setArtboard("mobile")}
          >
            Celular
          </button>
        </div>
        <button
          type="button"
          className="border bg-white px-2 py-1"
          onClick={() => {
            commitCanvas((prev) => copyDesktopToMobile(prev));
            setArtboard("mobile");
            markDirty();
          }}
        >
          Copiar desktop → mobile
        </button>
        <button
          type="button"
          className="border bg-white px-2 py-1 disabled:opacity-40"
          disabled={!canUndo}
          onClick={undo}
          title="Desfazer (Ctrl+Z)"
        >
          Desfazer
        </button>
        <button
          type="button"
          className="border bg-white px-2 py-1 disabled:opacity-40"
          disabled={!canRedo}
          onClick={redo}
          title="Refazer (Ctrl+Y)"
        >
          Refazer
        </button>
        <button type="button" className="border bg-white px-2 py-1" onClick={() => setTemplatesOpen(true)}>
          Modelos
        </button>
        <button type="button" className="border bg-white px-2 py-1" onClick={() => setPhoneOpen(true)}>
          Preview celular
        </button>
        <span className="text-xs text-neutral-500">{dirty ? "Não salvo" : statusLabel}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <label className="flex items-center gap-1 text-xs">
            Zoom
            <input type="range" min={0.3} max={1} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          </label>
          <button type="button" className="border bg-white px-3 py-1 disabled:opacity-50" disabled={busy} onClick={() => void save()}>
            Salvar
          </button>
          <button
            type="button"
            className="bg-[var(--studio-accent)] px-3 py-1 text-white disabled:opacity-50"
            disabled={busy}
            onClick={() => void publish()}
          >
            Publicar
          </button>
        </div>
      </header>
      {message ? <p className="border-b border-[var(--studio-line)] px-3 py-1 text-xs">{message}</p> : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[260px_1fr_290px]">
        <aside className="flex min-h-0 flex-col border-r border-[var(--studio-line)] bg-white">
          <div className="flex shrink-0 gap-1 border-b border-[var(--studio-line)] p-2 text-[11px]">
            {(
              [
                ["itens", "Itens"],
                ["secoes", "Seções"],
                ["prontos", "Prontos"],
                ["camadas", "Camadas"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={cn(
                  "flex-1 border px-1 py-1.5",
                  leftTab === id ? "border-[var(--studio-ink)] bg-[var(--studio-bg)]" : "border-transparent text-neutral-500",
                )}
                onClick={() => setLeftTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {leftTab === "itens"
              ? LIBRARY.map((group) => (
                  <div key={group.group} className="mt-2 first:mt-0">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-400">{group.group}</p>
                    <div className="mt-1 grid gap-1">
                      {group.types.map((type) => (
                        <button
                          key={type}
                          type="button"
                          className="flex items-center justify-between border border-[var(--studio-line)] px-2 py-2 text-left text-sm hover:bg-[var(--studio-bg)]"
                          onClick={() => addType(type)}
                        >
                          {LABELS[type]}
                          <span className="text-neutral-300">⋮⋮</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              : null}
            {leftTab === "secoes" ? (
              <div className="grid gap-1">
                {PREMADE_SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    className="border border-[var(--studio-line)] px-2 py-2 text-left text-sm hover:bg-[var(--studio-bg)]"
                    onClick={() => addSection(sec.id)}
                  >
                    <span className="font-medium">{sec.label}</span>
                    <span className="mt-0.5 block text-[11px] text-neutral-500">{sec.hint}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {leftTab === "prontos" ? (
              <div className="grid gap-1">
                {PRONTOS.map((item) => (
                  <button
                    key={`${item.type}-${item.presetId}`}
                    type="button"
                    className="border border-[var(--studio-line)] px-2 py-2 text-left text-sm hover:bg-[var(--studio-bg)]"
                    onClick={() => addPronto(item.type, item.presetId)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
            {leftTab === "camadas" ? (
              <CanvasLayersPanel
                elements={layerEls}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setInspectorFocus("props");
                }}
                onToggleHidden={(id) => {
                  const el = layerEls.find((e) => e.id === id);
                  if (!el) return;
                  updateElement(id, { hidden: !el.hidden }, true);
                }}
                onToggleLock={(id) => {
                  const el = layerEls.find((e) => e.id === id);
                  if (!el) return;
                  updateElement(id, { locked: !el.locked }, true);
                }}
                onBringFront={bringFront}
                onSendBack={sendBack}
              />
            ) : null}
          </div>
        </aside>

        <section
          className="relative flex min-h-0 justify-center overflow-auto bg-[#ddd6c8] p-6"
          onPointerDown={() => setSelectedId(null)}
        >
          <div
            className="relative shrink-0"
            style={{
              width: board.width * zoom,
              height: board.height * zoom,
            }}
          >
            <div
              ref={stageRef}
              className="absolute top-0 left-0 shadow-lg"
              style={{
                width: board.width,
                height: board.height,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                ...canvasThemeStyle(canvas.theme),
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
                  backgroundSize: "8px 8px",
                }}
              />
              {els.map((el) => (
                <div
                  key={el.id}
                  className="absolute"
                  style={{ left: el.frame.x, top: el.frame.y, width: el.frame.w, height: el.frame.h, zIndex: el.zIndex }}
                >
                  <div
                    className={cn(
                      "absolute inset-0 cursor-move",
                      selectedId === el.id ? "ring-2 ring-[var(--studio-accent)]" : "hover:ring-1 hover:ring-black/30",
                    )}
                    onPointerDown={(e) => onPointerDown(e, el, "move")}
                  >
                    <CanvasElementView
                      element={{ ...el, frame: { x: 0, y: 0, w: el.frame.w, h: el.frame.h } }}
                      board={{ width: el.frame.w || 1, height: el.frame.h || 1 }}
                      ctx={{
                        clientName,
                        homeHref: "/",
                        contactHref: canvasContactHref(canvas.theme),
                        editorChrome: true,
                        interactive: false,
                      }}
                      layout="fill"
                    />
                  </div>
                  {selectedId === el.id && !el.locked
                    ? (["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const).map((handle) => (
                        <span
                          key={handle}
                          className="absolute h-2.5 w-2.5 bg-[var(--studio-accent)]"
                          style={{
                            left: handle.includes("w") ? -4 : handle.includes("e") ? "calc(100% - 6px)" : "calc(50% - 5px)",
                            top: handle.includes("n") ? -4 : handle.includes("s") ? "calc(100% - 6px)" : "calc(50% - 5px)",
                            cursor: `${handle}-resize`,
                          }}
                          onPointerDown={(e) => onPointerDown(e, el, "resize", handle)}
                        />
                      ))
                    : null}
                </div>
              ))}
              {guides.map((g, i) =>
                g.axis === "v" ? (
                  <div key={i} className="pointer-events-none absolute top-0 bottom-0 w-px bg-[#ec4899]" style={{ left: g.pos }} />
                ) : (
                  <div key={i} className="pointer-events-none absolute left-0 right-0 h-px bg-[#ec4899]" style={{ top: g.pos }} />
                ),
              )}
            </div>
          </div>
        </section>

        <aside className="overflow-y-auto border-l border-[var(--studio-line)] bg-white p-3">
          <div className="mb-2 flex gap-1 text-[11px]">
            <button
              type="button"
              className={cn("flex-1 border px-2 py-1", inspectorFocus === "props" ? "border-[var(--studio-ink)]" : "border-transparent text-neutral-500")}
              onClick={() => setInspectorFocus("props")}
            >
              Conteúdo
            </button>
            <button
              type="button"
              className={cn("flex-1 border px-2 py-1", inspectorFocus === "theme" ? "border-[var(--studio-ink)]" : "border-transparent text-neutral-500")}
              onClick={() => {
                setInspectorFocus("theme");
                setSelectedId(null);
              }}
            >
              Tema
            </button>
          </div>

          {inspectorFocus === "props" && selected ? (
            <div className="grid gap-2 text-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                {LABELS[selected.type]}
              </p>
              <div className="flex flex-wrap gap-1">
                <button type="button" className="border px-2 py-1" onClick={duplicateSelected}>
                  Duplicar
                </button>
                <button type="button" className="border px-2 py-1" onClick={removeSelected}>
                  Excluir
                </button>
                <button type="button" className="border px-2 py-1" onClick={() => updateElement(selected.id, { locked: !selected.locked }, true)}>
                  {selected.locked ? "Destravar" : "Travar"}
                </button>
                <button type="button" className="border px-2 py-1" onClick={() => bringFront(selected.id)}>
                  Frente
                </button>
                <button type="button" className="border px-2 py-1" onClick={() => sendBack(selected.id)}>
                  Trás
                </button>
              </div>
              {selectedPresets.length ? (
                <div className="grid gap-1">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500">Estilos prontos</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className="border border-[var(--studio-line)] px-2 py-1 text-xs"
                        title={preset.hint}
                        onClick={() => {
                          commitCanvas((prev) => ({
                            ...prev,
                            elements: prev.elements.map((e) =>
                              e.id === selected.id ? applyStylePreset(e, preset) : e,
                            ),
                          }));
                          markDirty();
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {selected.type === "text" || selected.type === "button" || selected.type === "badge" ? (
                <label className="grid gap-1">
                  Texto
                  <textarea
                    className="border px-2 py-1"
                    value={selected.props?.text || ""}
                    onChange={(e) => updateElement(selected.id, { props: { text: e.target.value } })}
                  />
                </label>
              ) : null}
              {selected.type === "button" || selected.type === "hero" ? (
                <div className="grid gap-2 rounded border border-[var(--studio-line)] p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Ação / link</p>
                  {selected.type === "hero" ? (
                    <label className="grid gap-1">
                      Texto do botão
                      <input
                        className="border px-2 py-1"
                        value={selected.props?.ctaLabel || ""}
                        onChange={(e) => updateElement(selected.id, { props: { ctaLabel: e.target.value } })}
                        placeholder="Falar conosco"
                      />
                    </label>
                  ) : null}
                  <label className="grid gap-1">
                    Link de destino
                    <input
                      className="border px-2 py-1"
                      value={selected.props?.href || ""}
                      onChange={(e) => updateElement(selected.id, { props: { href: e.target.value } })}
                      placeholder="https://wa.me/55… ou #contato"
                    />
                  </label>
                  <p className="text-[11px] text-neutral-500">
                    Cole um URL (WhatsApp, site, formulário) ou deixe vazio / escreva <code>whatsapp</code> para usar o número do tema.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="border px-2 py-1 text-xs"
                      onClick={() => updateElement(selected.id, { props: { href: "whatsapp" } }, true)}
                    >
                      WhatsApp do tema
                    </button>
                    <button
                      type="button"
                      className="border px-2 py-1 text-xs"
                      onClick={() => updateElement(selected.id, { props: { href: "#contato" } }, true)}
                    >
                      #contato
                    </button>
                    <button
                      type="button"
                      className="border px-2 py-1 text-xs"
                      onClick={() => updateElement(selected.id, { props: { href: "https://wa.me/" } }, true)}
                    >
                      wa.me/
                    </button>
                  </div>
                </div>
              ) : null}
              {selected.type === "hero" ||
              selected.type === "panel" ||
              selected.type === "services" ||
              selected.type === "team" ||
              selected.type === "contact" ? (
                <>
                  <label className="grid gap-1">
                    Título
                    <input
                      className="border px-2 py-1"
                      value={selected.props?.title || ""}
                      onChange={(e) => updateElement(selected.id, { props: { title: e.target.value } })}
                    />
                  </label>
                  <label className="grid gap-1">
                    Descrição
                    <textarea
                      className="border px-2 py-1"
                      value={selected.props?.description || ""}
                      onChange={(e) => updateElement(selected.id, { props: { description: e.target.value } })}
                    />
                  </label>
                </>
              ) : null}
              {selected.type === "image" || selected.type === "media" || selected.type === "hero" ? (
                <label className="grid gap-1">
                  Mídia
                  <input
                    type="file"
                    accept={CANVAS_MEDIA_ACCEPT}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const result = await uploadFile(file);
                      if (result.url) updateElement(selected.id, { props: { mediaUrl: result.url } }, true);
                    }}
                  />
                </label>
              ) : null}
              <details className="mt-2">
                <summary className="cursor-pointer text-xs uppercase tracking-wider text-neutral-500">Posição e tamanho</summary>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["x", "y", "w", "h"] as const).map((key) => (
                    <label key={key} className="grid gap-1 text-xs uppercase">
                      {key}
                      <input
                        type="number"
                        className="border px-2 py-1"
                        value={Math.round(selected.frame[key])}
                        onChange={(e) =>
                          updateElement(selected.id, { frame: { ...selected.frame, [key]: Number(e.target.value) } }, true)
                        }
                      />
                    </label>
                  ))}
                </div>
              </details>
            </div>
          ) : (
            <div className="grid gap-2 text-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Tema da página</p>
              <label className="grid gap-1">
                Primária
                <input
                  type="color"
                  value={canvas.theme?.primary || "#9a3412"}
                  onChange={(e) => {
                    commitCanvas((prev) => applyThemeChangeToCanvas(prev, { ...prev.theme, primary: e.target.value }));
                    markDirty();
                  }}
                />
              </label>
              <label className="grid gap-1">
                Fundo
                <input
                  type="color"
                  value={canvas.theme?.background || "#0f1419"}
                  onChange={(e) => {
                    commitCanvas((prev) => applyThemeChangeToCanvas(prev, { ...prev.theme, background: e.target.value }));
                    markDirty();
                  }}
                />
              </label>
              <label className="grid gap-1">
                Texto
                <input
                  type="color"
                  value={canvas.theme?.text || "#fafafa"}
                  onChange={(e) => {
                    commitCanvas((prev) => applyThemeChangeToCanvas(prev, { ...prev.theme, text: e.target.value }));
                    markDirty();
                  }}
                />
              </label>
              <label className="grid gap-1">
                Arte de fundo
                <select
                  className="border px-2 py-1"
                  value={canvas.theme?.bgArt || "none"}
                  onChange={(e) => {
                    commitCanvas((prev) =>
                      applyThemeChangeToCanvas(prev, {
                        ...prev.theme,
                        bgArt: e.target.value as NonNullable<SiteCanvasConfig["theme"]>["bgArt"],
                      }),
                    );
                    markDirty();
                  }}
                >
                  {CANVAS_BG_ART_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-2 grid gap-2 border-t border-[var(--studio-line)] pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">WhatsApp da página</p>
                <label className="grid gap-1">
                  Telefone WhatsApp
                  <MaskedPhoneInput
                    mode="whatsapp"
                    className="border px-2 py-1"
                    placeholder="(11) 99999-0000 ou +1555…"
                    value={canvas.theme?.whatsappPhone || ""}
                    onChange={(value) => {
                      commitCanvas((prev) =>
                        applyThemeChangeToCanvas(prev, { ...prev.theme, whatsappPhone: value }),
                      );
                      markDirty();
                    }}
                  />
                </label>
                <label className="grid gap-1">
                  Mensagem padrão
                  <textarea
                    className="border px-2 py-1"
                    rows={2}
                    placeholder="Olá! Vim pelo site."
                    value={canvas.theme?.whatsappMessage || ""}
                    onChange={(e) => {
                      commitCanvas((prev) =>
                        applyThemeChangeToCanvas(prev, { ...prev.theme, whatsappMessage: e.target.value }),
                      );
                      markDirty();
                    }}
                  />
                </label>
                <p className="text-[11px] text-neutral-500">
                  Botões com link vazio ou &quot;whatsapp&quot; abrem esta conversa.
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      <CanvasPhonePreview open={phoneOpen} canvas={canvas} clientName={clientName} onClose={() => setPhoneOpen(false)} />

      <CanvasOnboarding
        open={onboardingOpen}
        busy={busy}
        onSkip={() => {
          markCanvasOnboardingSeen();
          setOnboardingOpen(false);
        }}
        onPickTemplate={(id) => applyTemplate(id)}
        onOpenTheme={() => {
          setInspectorFocus("theme");
          setSelectedId(null);
        }}
        onPublish={() => {
          void publish();
        }}
      />

      {templatesOpen && !confirmTemplate ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Fechar" onClick={() => setTemplatesOpen(false)} />
          <div className="relative z-[1] max-h-[85svh] w-full max-w-3xl overflow-y-auto border border-[var(--studio-line)] bg-[var(--studio-bg)] p-5 shadow-2xl">
            <h3 className="font-[family-name:var(--font-brand-display)] text-xl font-medium">Modelos de página</h3>
            <p className="mt-1 text-sm text-neutral-600">Aplicar substitui o canvas atual. Peça confirmação no próximo passo.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PAGE_TEMPLATE_META.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className="border border-[var(--studio-line)] p-3 text-left hover:border-[var(--studio-ink)]"
                  onClick={() => setConfirmTemplate(tpl.id)}
                >
                  <div className="mb-2 h-12" style={{ background: `linear-gradient(135deg, ${tpl.swatch}, #1c1915)` }} />
                  <p className="font-medium">{tpl.label}</p>
                  <p className="text-xs text-neutral-600">{tpl.tagline}</p>
                </button>
              ))}
            </div>
            <button type="button" className="mt-4 border px-3 py-2 text-sm" onClick={() => setTemplatesOpen(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {confirmTemplate ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Cancelar" onClick={() => setConfirmTemplate(null)} />
          <div className="relative z-[1] w-full max-w-md border border-[var(--studio-line)] bg-[var(--studio-bg)] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold">Substituir o canvas?</h3>
            <p className="mt-2 text-sm text-neutral-600">
              O modelo <strong>{confirmTemplate}</strong> vai substituir todos os elementos. Esta ação entra no histórico (desfazer).
            </p>
            <div className="mt-4 flex justify-end gap-2 text-sm">
              <button type="button" className="border px-3 py-2" onClick={() => setConfirmTemplate(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="bg-[var(--studio-ink)] px-3 py-2 text-[var(--studio-bg)]"
                onClick={() => applyTemplate(confirmTemplate)}
              >
                Aplicar modelo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
