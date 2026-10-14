import Link from "next/link";
import { Suspense } from "react";
import { archivePage, createPage, deletePage, duplicatePage } from "@/actions/studio";
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

  async function createBlank(formData: FormData) {
    "use server";
    const result = await createPage({
      clientName: String(formData.get("clientName") || "Nova página"),
      segment: String(formData.get("segment") || "local"),
      slug: String(formData.get("slug") || ""),
    });
    if (!result.ok) return;
    redirect(`/pages/${result.id}`);
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em]">Páginas</p>
          <h1 className="text-4xl tracking-tight">Clientes</h1>
        </div>
        <Link className="bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)]" href="/briefing">Gerar com briefing</Link>
      </div>
      <form action={createBlank} className="grid gap-3 border border-[var(--studio-line)] bg-white p-4 md:grid-cols-4">
        <input className="border px-3 py-2" name="clientName" placeholder="Nome do cliente" required />
        <input className="border px-3 py-2" name="slug" placeholder="subdominio" required />
        <select className="border px-3 py-2" name="segment" defaultValue="local">
          {["moda", "portfolio", "advocacia", "psicologia", "clinica", "restaurante", "barbearia", "infoproduto", "local"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <button className="border border-[var(--studio-ink)] px-3 py-2 text-sm" type="submit">Página em branco</button>
      </form>
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
                <p className="text-sm text-neutral-600">{page.segment} · editada {page.updatedAt.toLocaleString("pt-BR")}</p>
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
    </main>
  );
}

function label(status: string) {
  if (status === "PUBLISHED") return "Publicada";
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
