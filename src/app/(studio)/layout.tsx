import Link from "next/link";
import { Suspense } from "react";
import { BrandMark } from "@/components/brand-mark";
import { requireAdmin } from "@/lib/admin";

export const instant = false;

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8">Abrindo o estúdio…</p>}>
      <StudioShell>{children}</StudioShell>
    </Suspense>
  );
}

async function StudioShell({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div>
      <header className="flex h-14 items-center justify-between border-b border-[var(--studio-line)] bg-[color-mix(in_srgb,var(--studio-bg)_92%,white)] px-4">
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="shrink-0" aria-label="Enerpages · início">
            <BrandMark size="sm" />
          </Link>
          <Link href="/nova" className="text-[color-mix(in_srgb,var(--studio-ink)_72%,transparent)] hover:text-[var(--studio-ink)]">
            Nova página
          </Link>
          <Link href="/briefing" className="text-[color-mix(in_srgb,var(--studio-ink)_72%,transparent)] hover:text-[var(--studio-ink)]">
            Briefing IA
          </Link>
          <Link href="/intakes" className="text-[color-mix(in_srgb,var(--studio-ink)_72%,transparent)] hover:text-[var(--studio-ink)]">
            Briefings
          </Link>
          <Link href="/leads" className="text-[color-mix(in_srgb,var(--studio-ink)_72%,transparent)] hover:text-[var(--studio-ink)]">
            Leads
          </Link>
          <Link href="/account" className="text-[color-mix(in_srgb,var(--studio-ink)_72%,transparent)] hover:text-[var(--studio-ink)]">
            Conta
          </Link>
        </nav>
        <span className="text-xs uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--studio-ink)_55%,transparent)]">
          {user.email}
        </span>
      </header>
      {children}
    </div>
  );
}
