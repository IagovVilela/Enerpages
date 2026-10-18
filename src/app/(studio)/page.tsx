import Link from "next/link";
import { Suspense } from "react";
import { ClientsDashboard, type DashboardPageItem } from "@/components/clients-dashboard";
import { prisma } from "@/lib/db";
import { publicOrigin } from "@/lib/tenant";

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

  const items: DashboardPageItem[] = pages.map((page) => {
    const theme = readTheme(page.draftData);
    const views = page.analytics.reduce((sum, row) => sum + row.views, 0);
    return {
      id: page.id,
      clientName: page.clientName,
      slug: page.slug,
      segment: page.segment,
      tags: page.tags ?? [],
      status: page.status,
      updatedAt: `${page.updatedAt.toISOString().slice(0, 16).replace("T", " ")} UTC`,
      views,
      leads: page.leads.length,
      publicUrl: page.status === "PUBLISHED" ? publicOrigin(page.slug) : null,
      theme,
    };
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
            Filtre por tipo, marque identificadores e abra o editor quando estiver pronto.
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

      {items.length ? (
        <ClientsDashboard pages={items} />
      ) : (
        <div className="border border-dashed border-[var(--studio-line)] bg-white/60 p-8 text-center">
          <p className="text-lg font-medium">Nenhuma página ainda</p>
          <p className="mt-2 text-sm text-neutral-600">Comece escolhendo um modelo de layout.</p>
          <Link className="mt-4 inline-block bg-[var(--studio-ink)] px-4 py-2 text-sm text-[var(--studio-bg)]" href="/nova">
            Nova página
          </Link>
        </div>
      )}
    </main>
  );
}

function readTheme(data: unknown) {
  const colors = (
    data as {
      root?: {
        props?: {
          theme?: { colors?: { background?: string; foreground?: string; primary?: string } };
        };
      };
    }
  )?.root?.props?.theme?.colors;
  return {
    background: colors?.background || "#f6f1ea",
    foreground: colors?.foreground || "#1c1410",
    primary: colors?.primary || "#8f3d2b",
  };
}
