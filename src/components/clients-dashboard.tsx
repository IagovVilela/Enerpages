"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  archivePage,
  deletePage,
  duplicatePage,
  updatePageLogo,
  updatePageSegment,
  updatePageTags,
} from "@/actions/studio";
import { normalizePageTag, segmentLabel } from "@/lib/segment-labels";
import { uploadFile } from "@/puck/media-upload";
import { SEGMENTS } from "@/puck/schema";

export type DashboardPageItem = {
  id: string;
  clientName: string;
  logoUrl: string | null;
  slug: string;
  segment: string;
  tags: string[];
  status: string;
  updatedAt: string;
  views: number;
  leads: number;
  publicUrl: string | null;
  theme: { background: string; foreground: string; primary: string };
};

export function ClientsDashboard({ pages }: { pages: DashboardPageItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState("all");
  const [status, setStatus] = useState("all");
  const [tag, setTag] = useState("all");
  const [draftTags, setDraftTags] = useState<Record<string, string>>({});
  const [logoBusy, setLogoBusy] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<Record<string, string>>({});
  const logoInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const segmentsInUse = useMemo(() => {
    const set = new Set(pages.map((page) => page.segment));
    return SEGMENTS.filter((item) => set.has(item));
  }, [pages]);

  const tagsInUse = useMemo(() => {
    const set = new Set<string>();
    for (const page of pages) {
      for (const item of page.tags) set.add(item);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [pages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pages.filter((page) => {
      if (segment !== "all" && page.segment !== segment) return false;
      if (status !== "all" && page.status !== status) return false;
      if (tag !== "all" && !page.tags.some((item) => item.toLowerCase() === tag.toLowerCase())) return false;
      if (!q) return true;
      const hay = `${page.clientName} ${page.slug} ${page.segment} ${page.tags.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [pages, query, segment, status, tag]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function onSegmentChange(pageId: string, next: string) {
    await updatePageSegment(pageId, next);
    refresh();
  }

  async function addTag(page: DashboardPageItem) {
    const raw = draftTags[page.id] ?? "";
    const nextTag = normalizePageTag(raw);
    if (!nextTag) return;
    const next = [...page.tags, nextTag];
    await updatePageTags(page.id, next);
    setDraftTags((prev) => ({ ...prev, [page.id]: "" }));
    refresh();
  }

  async function removeTag(page: DashboardPageItem, remove: string) {
    await updatePageTags(
      page.id,
      page.tags.filter((item) => item.toLowerCase() !== remove.toLowerCase()),
    );
    refresh();
  }

  async function onLogoFile(page: DashboardPageItem, file: File | undefined) {
    if (!file) return;
    setLogoBusy(page.id);
    setLogoError((prev) => ({ ...prev, [page.id]: "" }));
    const result = await uploadFile(file);
    if (!result.url) {
      setLogoBusy(null);
      setLogoError((prev) => ({ ...prev, [page.id]: result.error || "Falha no envio" }));
      return;
    }
    await updatePageLogo(page.id, result.url);
    setLogoBusy(null);
    refresh();
  }

  async function clearLogo(page: DashboardPageItem) {
    setLogoBusy(page.id);
    setLogoError((prev) => ({ ...prev, [page.id]: "" }));
    await updatePageLogo(page.id, null);
    setLogoBusy(null);
    refresh();
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 border border-[var(--studio-line)] bg-white p-4">
        <label className="grid gap-1 text-sm">
          Buscar
          <input
            className="border border-[var(--studio-line)] px-3 py-2"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, slug ou identificador"
          />
        </label>

        <div className="grid gap-2">
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Tipo de página</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={segment === "all"} onClick={() => setSegment("all")} label="Todos" />
            {(segmentsInUse.length ? segmentsInUse : SEGMENTS).map((item) => (
              <FilterChip
                key={item}
                active={segment === item}
                onClick={() => setSegment(item)}
                label={segmentLabel(item)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Status
            <select
              className="border border-[var(--studio-line)] px-3 py-2"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">Todos</option>
              <option value="PUBLISHED">No ar</option>
              <option value="DRAFT">Rascunho</option>
              <option value="ARCHIVED">Arquivada</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Identificador
            <select
              className="border border-[var(--studio-line)] px-3 py-2"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
            >
              <option value="all">Todos</option>
              {tagsInUse.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-xs text-neutral-500">
          {filtered.length} de {pages.length} páginas
          {pending ? " · atualizando…" : null}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((page) => (
          <article
            key={page.id}
            className="grid gap-4 border border-[var(--studio-line)] bg-white p-4 md:grid-cols-[7rem_1fr]"
          >
            <div
              className="relative grid min-h-28 place-items-center p-3"
              style={{ background: page.theme.background, color: page.theme.foreground }}
            >
              {page.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL de upload do cliente
                <img src={page.logoUrl} alt="" className="max-h-20 max-w-full object-contain" />
              ) : (
                <span
                  className="grid size-12 place-items-center text-lg font-semibold"
                  style={{ background: page.theme.primary, color: page.theme.background }}
                  aria-hidden
                >
                  {(page.clientName.trim()[0] || "?").toUpperCase()}
                </span>
              )}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl">{page.clientName}</h2>
                <span className="text-xs uppercase tracking-[0.14em]">{statusLabel(page.status)}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <input
                  ref={(el) => {
                    logoInputs.current[page.id] = el;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  tabIndex={-1}
                  disabled={logoBusy === page.id}
                  onChange={(event) => {
                    void onLogoFile(page, event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="border border-[var(--studio-ink)] px-2.5 py-1 text-xs"
                  disabled={logoBusy === page.id}
                  onClick={() => logoInputs.current[page.id]?.click()}
                >
                  {logoBusy === page.id ? "Enviando…" : page.logoUrl ? "Trocar logo" : "Anexar logo"}
                </button>
                {page.logoUrl ? (
                  <button
                    type="button"
                    className="border border-[var(--studio-line)] px-2.5 py-1 text-xs"
                    disabled={logoBusy === page.id}
                    onClick={() => void clearLogo(page)}
                  >
                    Remover
                  </button>
                ) : null}
                {logoError[page.id] ? <span className="text-xs text-red-700">{logoError[page.id]}</span> : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-neutral-500">
                  Tipo
                  <select
                    className="ml-2 border border-[var(--studio-line)] px-2 py-1 text-sm text-[var(--studio-ink)]"
                    value={page.segment}
                    onChange={(event) => void onSegmentChange(page.id, event.target.value)}
                  >
                    {SEGMENTS.map((item) => (
                      <option key={item} value={item}>
                        {segmentLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="text-sm text-neutral-600" suppressHydrationWarning>
                  · editada {page.updatedAt}
                </span>
              </div>

              <p className="text-sm">
                {page.views} visitas · {page.leads} leads
              </p>

              <div className="grid gap-2">
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Identificadores</p>
                <div className="flex flex-wrap gap-1.5">
                  {page.tags.length ? (
                    page.tags.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => void removeTag(page, item)}
                        className="border border-[var(--studio-line)] bg-[var(--studio-bg)] px-2 py-0.5 text-xs hover:border-[var(--studio-ink)]"
                        title="Remover identificador"
                      >
                        {item} ×
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-400">Nenhum ainda</span>
                  )}
                </div>
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void addTag(page);
                  }}
                >
                  <input
                    className="min-w-[10rem] flex-1 border border-[var(--studio-line)] px-2 py-1.5 text-sm"
                    value={draftTags[page.id] ?? ""}
                    onChange={(event) => setDraftTags((prev) => ({ ...prev, [page.id]: event.target.value }))}
                    placeholder="Ex.: VIP, prioridade, CLI-12"
                    maxLength={40}
                  />
                  <button
                    type="submit"
                    className="border border-[var(--studio-ink)] px-3 py-1.5 text-sm"
                    disabled={!(draftTags[page.id] ?? "").trim()}
                  >
                    Adicionar
                  </button>
                </form>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <Link href={`/pages/${page.id}`}>Editar</Link>
                {page.publicUrl ? <a href={page.publicUrl}>Abrir site</a> : null}
                <form
                  action={async () => {
                    const id = await duplicatePage(page.id);
                    router.push(`/pages/${id}`);
                  }}
                >
                  <button type="submit">Duplicar</button>
                </form>
                <form
                  action={async () => {
                    await archivePage(page.id);
                    refresh();
                  }}
                >
                  <button type="submit">Arquivar</button>
                </form>
                <form
                  action={async () => {
                    await deletePage(page.id);
                    refresh();
                  }}
                >
                  <button type="submit">Excluir</button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!filtered.length && pages.length ? (
        <div className="border border-dashed border-[var(--studio-line)] bg-white/60 p-8 text-center">
          <p className="text-lg font-medium">Nenhuma página com esses filtros</p>
          <button
            type="button"
            className="mt-3 border border-[var(--studio-ink)] px-3 py-1.5 text-sm"
            onClick={() => {
              setQuery("");
              setSegment("all");
              setStatus("all");
              setTag("all");
            }}
          >
            Limpar filtros
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "bg-[var(--studio-ink)] px-3 py-1.5 text-sm text-[var(--studio-bg)]"
          : "border border-[var(--studio-line)] bg-white px-3 py-1.5 text-sm"
      }
    >
      {label}
    </button>
  );
}

function statusLabel(status: string) {
  if (status === "PUBLISHED") return "No ar";
  if (status === "ARCHIVED") return "Arquivada";
  return "Rascunho";
}
