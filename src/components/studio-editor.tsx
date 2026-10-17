"use client";

import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { applyPageTemplate, publishPage, restoreVersion, saveDraft, unpublishPage } from "@/actions/studio";
import { StudioActionBar } from "@/components/studio-action-bar";
import { PageTemplatePicker } from "@/components/page-template-picker";
import { libraryPlugin } from "@/components/studio-library";
import { layersPlugin } from "@/components/studio-layers";
import { StudioMobileChrome } from "@/components/studio-mobile-chrome";
import {
  hasSeenStudioOnboarding,
  markStudioOnboardingSeen,
  StudioOnboarding,
} from "@/components/studio-onboarding";
import { StudioPhonePreview } from "@/components/studio-phone-preview";
import { themePlugin } from "@/components/studio-theme-panel";
import { StudioUiProvider, useStudioUi } from "@/components/studio-ui-context";
import { config, puckDictionary } from "@/puck/config";
import type { PageTemplateId } from "@/puck/page-templates";
import { copyTextToClipboard, downloadPublicQrPng } from "@/lib/studio-share";
import type { PageDocument } from "@/puck/schema";
import { useStudioPuck } from "@/puck/use-studio-puck";
import { cn } from "@/lib/cn";

type Version = { id: string; version: number; label: string | null; source: string; createdAt: string };

export function StudioEditor(props: {
  pageId: string;
  clientName: string;
  slug: string;
  segment: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  previewUrl: string;
  publicUrl: string;
  initial: PageDocument;
  versions: Version[];
}) {
  const [liveStatus, setLiveStatus] = useState(props.status);
  useEffect(() => {
    setLiveStatus(props.status);
  }, [props.status]);

  return (
    <StudioUiProvider publicUrl={props.publicUrl} isPublished={liveStatus === "PUBLISHED"}>
      <StudioEditorInner {...props} pageStatus={liveStatus} onPageStatusChange={setLiveStatus} />
    </StudioUiProvider>
  );
}

function StudioEditorInner({
  pageId,
  clientName,
  slug,
  segment,
  pageStatus,
  onPageStatusChange,
  previewUrl,
  publicUrl,
  initial,
  versions,
}: {
  pageId: string;
  clientName: string;
  slug: string;
  segment: string;
  pageStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  onPageStatusChange: (status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => void;
  previewUrl: string;
  publicUrl: string;
  initial: PageDocument;
  versions: Version[];
}) {
  const router = useRouter();
  const { toast, confirm } = useStudioUi();
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
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [mobileThemeHint, setMobileThemeHint] = useState(false);
  const latest = useRef<Data>(initial as Data);
  const skip = useRef(true);

  useEffect(() => {
    setDocument(initial);
    latest.current = initial as Data;
  }, [initial]);

  useEffect(() => {
    setOnboardingOpen(!hasSeenStudioOnboarding());
  }, []);

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

  async function publishLatest() {
    setStatus("Publicando…");
    const result = await publishPage(pageId, latest.current);
    if (result.ok) {
      setDirty(false);
      onPageStatusChange("PUBLISHED");
      setStatus("No ar");
      setMessage("Alterações no ar — o site público já mostra isso.");
      toast("No ar — use Ver site ou Copiar link.");
      router.refresh();
      return true;
    }
    setStatus(result.error);
    return false;
  }

  return (
    <div className="studio-puck relative h-[calc(100vh-3.5rem)] max-lg:pb-[4.25rem]">
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
              slug={slug}
              publicUrl={publicUrl}
              onOpenTemplates={() => setTemplatesOpen(true)}
              onOpenPhone={() => setPhoneOpen(true)}
              onRestore={() => router.refresh()}
              onUnpublish={async () => {
                const ok = await confirm({
                  title: "Despublicar a página?",
                  description: "O site público deixa de mostrar o conteúdo publicado até você publicar de novo.",
                  confirmLabel: "Despublicar",
                  danger: true,
                });
                if (!ok) return;
                await unpublishPage(pageId);
                onPageStatusChange("DRAFT");
                setMessage("Página despublicada.");
                setStatus("Rascunho");
                toast("Página fora do ar.");
                router.refresh();
              }}
              publishSlot={children}
            />
          ),
          actionBar: ({ children, parentAction, label }) => (
            <StudioActionBar parentAction={parentAction} label={label}>
              {children}
            </StudioActionBar>
          ),
          preview: ({ children }) => (
            <>
              {children}
              <StudioMobileChrome
                slug={slug}
                publicUrl={publicUrl}
                pageStatus={pageStatus}
                onOpenTemplates={() => setTemplatesOpen(true)}
                onOpenPhone={() => setPhoneOpen(true)}
              />
              {mobileThemeHint ? (
                <OpenThemeOnce
                  onDone={() => {
                    setMobileThemeHint(false);
                    toast("Painel Tema aberto na barra lateral.");
                  }}
                />
              ) : null}
            </>
          ),
        }}
        onChange={(data) => {
          latest.current = data;
          setTick((value) => value + 1);
        }}
        onPublish={async () => {
          await publishLatest();
        }}
      />
      {message ? (
        <p className="border-t border-[var(--studio-line)] px-4 py-2 text-sm">
          {message}
          {pageStatus === "PUBLISHED" ? (
            <>
              {" "}
              <a className="underline" href={publicUrl} target="_blank" rel="noreferrer">
                Ver site
              </a>
              {" · "}
              <button
                type="button"
                className="underline"
                onClick={() =>
                  void copyTextToClipboard(publicUrl).then((ok) => toast(ok ? "Link do site copiado." : "Não foi possível copiar."))
                }
              >
                Copiar link
              </button>
            </>
          ) : null}
        </p>
      ) : null}

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

      <StudioOnboarding
        open={onboardingOpen}
        busy={busyTemplate}
        publicUrl={publicUrl}
        onSkip={() => {
          markStudioOnboardingSeen();
          setOnboardingOpen(false);
        }}
        onPickTemplate={(id) => {
          void doApplyTemplate(id);
        }}
        onOpenTheme={() => {
          markStudioOnboardingSeen();
          setOnboardingOpen(false);
          if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
            toast("Toque em Tema no dock inferior para ajustar cores e tipografia.");
          } else {
            setMobileThemeHint(true);
          }
        }}
        onPublish={() => {
          void (async () => {
            const ok = await publishLatest();
            markStudioOnboardingSeen();
            setOnboardingOpen(false);
            if (ok) window.open(publicUrl, "_blank", "noopener,noreferrer");
          })();
        }}
      />
    </div>
  );
}

function OpenThemeOnce({ onDone }: { onDone: () => void }) {
  const dispatch = useStudioPuck((state) => state.dispatch);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    dispatch({
      type: "setUi",
      ui: {
        leftSideBarVisible: true,
        rightSideBarVisible: false,
        plugin: { current: "tema" },
      },
    });
    done.current();
  }, [dispatch]);
  return null;
}

function HeaderChrome({
  status,
  dirty,
  pageStatus,
  versions,
  pageId,
  slug,
  publicUrl,
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
  slug: string;
  publicUrl: string;
  onOpenTemplates: () => void;
  onOpenPhone: () => void;
  onRestore: () => void;
  onUnpublish: () => void | Promise<void>;
  publishSlot: ReactNode;
}) {
  const { toast } = useStudioUi();
  const [shareBusy, setShareBusy] = useState<"copy" | "qr" | null>(null);
  const published = pageStatus === "PUBLISHED";

  async function copyLink() {
    if (!published) {
      toast("Publique a página para compartilhar o link público.");
      return;
    }
    setShareBusy("copy");
    try {
      const ok = await copyTextToClipboard(publicUrl);
      toast(ok ? "Link do site copiado." : "Não foi possível copiar. Use Ver site.");
    } finally {
      setShareBusy(null);
    }
  }

  async function downloadQr() {
    if (!published) {
      toast("Publique a página para baixar o QR do site.");
      return;
    }
    setShareBusy("qr");
    try {
      const ok = await downloadPublicQrPng(publicUrl, slug);
      toast(ok ? "QR code baixado — pode imprimir ou enviar." : "Não foi possível baixar o QR. Tente de novo.");
    } finally {
      setShareBusy(null);
    }
  }

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
      {published && !dirty ? (
        <span className="hidden text-[10px] uppercase tracking-wider text-neutral-500 sm:inline">No ar</span>
      ) : null}
      {published ? (
        <a href={publicUrl} target="_blank" rel="noreferrer" className="border px-2 py-1" title="Abre o site público">
          Ver site
        </a>
      ) : (
        <button type="button" className="border px-2 py-1 opacity-60" onClick={() => toast("Publique a página para ver o site no ar.")}>
          Ver site
        </button>
      )}
      <button type="button" className="border px-2 py-1 disabled:opacity-50" disabled={shareBusy !== null} onClick={() => void copyLink()} title="Copia o endereço público">
        {shareBusy === "copy" ? "…" : "Copiar link"}
      </button>
      <button type="button" className="border px-2 py-1 disabled:opacity-50" disabled={shareBusy !== null} onClick={() => void downloadQr()} title="Baixa um PNG do QR code do site">
        {shareBusy === "qr" ? "…" : "Baixar QR"}
      </button>
      <button type="button" className="border px-2 py-1" onClick={onOpenTemplates}>
        Modelos
      </button>
      <button type="button" className="border px-2 py-1" onClick={onOpenPhone}>
        Preview celular
      </button>
      <HistoryTools pageId={pageId} versions={versions} onRestore={onRestore} />
      <button type="button" className="border px-2 py-1" onClick={() => void onUnpublish()} disabled={!published}>
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
              <span className="block text-[10px] text-neutral-500" suppressHydrationWarning>
                {version.createdAt.slice(0, 16).replace("T", " ")}
              </span>
            </button>
          ))}
        </div>
      </details>
    </>
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
