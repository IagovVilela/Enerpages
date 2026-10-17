import Link from "next/link";
import { Suspense } from "react";
import { archivePage, deletePage, duplicatePage } from "@/actions/studio";
import { prisma } from "@/lib/db";
import { publicOrigin } from "@/lib/tenant";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="p-8">Carregando páginas…</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const pages = await prisma.page.findMany({
    orderBy: { updatedAt: "desc" },
    include: { analytics: true, leads: { select: { id: true } } },
  });

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--studio-ink)_55%,transparent)]">
            Páginas
          </p>
          <h1 className="font-[family-name:var(--font-brand-display)] text-4xl font-medium tracking-tight">
            Clientes
          </h1>
          <p className="mt-2 max-w-xl text-sm text-neutral-600">
            Escolha um modelo, abra o editor e publique quando estiver pronto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)]" href="/nova">
            Nova página
          </Link>
          <Link className="border border-[var(--studio-ink)] px-4 py-2 text-sm" href="/briefing">
            Gerar com briefing
          </Link>
          <Link className="border border-[var(--studio-line)] px-4 py-2 text-sm" href="/intakes">
            Link do cliente
          </Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {pages.map((page) => {
          const theme = readTheme(page.draftData);
          const views = page.analytics.reduce((sum, row) => sum + row.views, 0);
          return (
            <article key={page.id} className="grid gap-4 border border-[var(--studio-line)] bg-white p-4 md:grid-cols-[7rem_1fr]">
              <div className="grid min-h-28 content-end p-3" style={{ background: theme.background, color: theme.foreground }}>
                <span className="h-2 w-8" style={{ background: theme.primary }} />
                <strong className="mt-3 text-sm leading-tight">{page.clientName}</strong>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl">{page.clientName}</h2>
                  <span className="text-xs uppercase tracking-[0.14em]">{label(page.status)}</span>
                </div>
                <p className="text-sm text-neutral-600" suppressHydrationWarning>
                  {page.segment} · editada {page.updatedAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                </p>
                <p className="text-sm">{views} visitas · {page.leads.length} leads</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <Link href={`/pages/${page.id}`}>Editar</Link>
                  {page.status === "PUBLISHED" ? <a href={publicOrigin(page.slug)}>Abrir site</a> : null}
                  <form action={async () => { "use server"; redirect(`/pages/${await duplicatePage(page.id)}`); }}><button type="submit">Duplicar</button></form>
                  <form action={async () => { "use server"; await archivePage(page.id); }}><button type="submit">Arquivar</button></form>
                  <form action={async () => { "use server"; await deletePage(page.id); }}><button type="submit">Excluir</button></form>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!pages.length ? (
        <div className="border border-dashed border-[var(--studio-line)] bg-white/60 p-8 text-center">
          <p className="text-lg font-medium">Nenhuma página ainda</p>
          <p className="mt-2 text-sm text-neutral-600">Comece escolhendo um modelo de layout.</p>
          <Link className="mt-4 inline-block bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)]" href="/nova">
            Nova página
          </Link>
        </div>
      ) : null}
    </main>
  );
}

function label(status: string) {
  if (status === "PUBLISHED") return "No ar";
  if (status === "ARCHIVED") return "Arquivada";
  return "Rascunho";
}

function readTheme(data: unknown) {
  const colors = (data as { root?: { props?: { theme?: { colors?: { background?: string; foreground?: string; primary?: string } } } } })?.root?.props?.theme?.colors;
  return {
    background: colors?.background || "#f6f1ea",
    foreground: colors?.foreground || "#1c1410",
    primary: colors?.primary || "#8f3d2b",
  };
}
