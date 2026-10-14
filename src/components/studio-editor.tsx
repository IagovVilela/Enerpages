"use client";

import { Puck, usePuck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { publishPage, restoreVersion, saveDraft, unpublishPage } from "@/actions/studio";
import { config, puckDictionary } from "@/puck/config";
import { BODY_FONTS, DISPLAY_FONTS, PERSONALITIES, type PageDocument, type Theme } from "@/puck/schema";

type Version = { id: string; version: number; label: string | null; source: string; createdAt: string };

export function StudioEditor({
  pageId,
  clientName,
  slug,
  initial,
  versions,
}: {
  pageId: string;
  clientName: string;
  slug: string;
  initial: PageDocument;
  versions: Version[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState("Pronto");
  const [message, setMessage] = useState("");
  const [tick, setTick] = useState(0);
  const latest = useRef<Data>(initial as Data);
  const skip = useRef(true);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    setStatus("Salvando…");
    const timer = window.setTimeout(async () => {
      const result = await saveDraft(pageId, latest.current);
      setStatus(result.ok ? "Salvo" : result.error);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [pageId, tick]);

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <Puck
        config={config}
        data={initial as Data}
        dictionary={puckDictionary}
        height="100%"
        viewports={[
          { width: 390, height: "auto", label: "Celular" },
          { width: 768, height: "auto", label: "Tablet" },
          { width: 1280, height: "auto", label: "Desktop" },
        ]}
        headerTitle={clientName}
        headerPath={slug}
        plugins={[themePlugin, aiPlugin(pageId)]}
        onChange={(data) => {
          latest.current = data;
          setTick((value) => value + 1);
        }}
        onPublish={async (data) => {
          setStatus("Publicando…");
          const result = await publishPage(pageId, data);
          setStatus(result.ok ? "Publicada" : result.error);
          if (result.ok) router.refresh();
        }}
        renderHeaderActions={() => (
          <div className="flex items-center gap-2 text-xs">
            <span>{status}</span>
            <HistoryTools pageId={pageId} versions={versions} onRestore={() => router.refresh()} />
            <button
              type="button"
              className="border px-2 py-1"
              onClick={async () => {
                await unpublishPage(pageId);
                setMessage("Página despublicada.");
                router.refresh();
              }}
            >
              Despublicar
            </button>
          </div>
        )}
      />
      {message ? <p className="px-4 py-2 text-sm">{message}</p> : null}
    </div>
  );
}

function HistoryTools({ pageId, versions, onRestore }: { pageId: string; versions: Version[]; onRestore: () => void }) {
  const { history } = usePuck();
  return (
    <>
      <button type="button" className="border px-2 py-1" onClick={() => history.back()} disabled={!history.hasPast}>Desfazer</button>
      <button type="button" className="border px-2 py-1" onClick={() => history.forward()} disabled={!history.hasFuture}>Refazer</button>
      <details>
        <summary className="cursor-pointer border px-2 py-1">Versões</summary>
        <div className="absolute right-4 z-20 mt-2 max-h-80 w-72 overflow-auto border bg-white p-3 text-left shadow">
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
  const { appState, dispatch } = usePuck();
  const theme = (appState.data.root.props as { theme?: Theme } | undefined)?.theme;
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
  return (
    <div className="grid gap-3 p-3 text-sm">
      <label className="grid gap-1">Personalidade
        <select value={theme.personality} onChange={(event) => update({ ...theme, personality: event.target.value as Theme["personality"] })}>
          {PERSONALITIES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      {(Object.keys(theme.colors) as Array<keyof Theme["colors"]>).map((key) => (
        <label key={key} className="flex items-center justify-between gap-2 capitalize">{key}
          <input type="color" value={toColor(theme.colors[key])} onChange={(event) => update({ ...theme, colors: { ...theme.colors, [key]: event.target.value } })} />
        </label>
      ))}
      <label className="grid gap-1">Fonte de título
        <select value={theme.fonts.display} onChange={(event) => update({ ...theme, fonts: { ...theme.fonts, display: event.target.value as Theme["fonts"]["display"] } })}>
          {DISPLAY_FONTS.map((font) => <option key={font}>{font}</option>)}
        </select>
      </label>
      <label className="grid gap-1">Fonte de texto
        <select value={theme.fonts.body} onChange={(event) => update({ ...theme, fonts: { ...theme.fonts, body: event.target.value as Theme["fonts"]["body"] } })}>
          {BODY_FONTS.map((font) => <option key={font}>{font}</option>)}
        </select>
      </label>
      {(["radius", "shadow", "button", "image", "spacing", "cursor"] as const).map((key) => (
        <label key={key} className="grid gap-1 capitalize">{key}
          <input value={theme[key]} onChange={(event) => update({ ...theme, [key]: event.target.value })} />
        </label>
      ))}
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
  const { selectedItem, appState, dispatch } = usePuck();
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
      <p>Bloco selecionado: {selectedItem?.type || "nenhum"}</p>
      <button type="button" className="border px-2 py-1 text-left" onClick={() => run("text")}>Reescrever texto</button>
      <button type="button" className="border px-2 py-1 text-left" onClick={() => run("style")}>Mudar estilo</button>
      <button type="button" className="border px-2 py-1 text-left" onClick={() => run("section")}>Regenerar seção</button>
      {note ? <p className="text-xs">{note}</p> : null}
      <p className="text-xs text-neutral-500">Depoimentos e fotos de pessoas continuam como placeholder.</p>
      <p className="sr-only">{appState.ui.leftSideBarVisible ? "aberto" : "fechado"}</p>
    </div>
  );
}

function toColor(value: string) {
  return /^#(?:[0-9a-fA-F]{6})$/.test(value) ? value : "#000000";
}
