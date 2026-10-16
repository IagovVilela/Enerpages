import Link from "next/link";
import { Suspense } from "react";
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
      <header className="flex h-14 items-center justify-between border-b border-[var(--studio-line)] px-4">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="font-semibold tracking-tight">Studio</Link>
          <Link href="/nova">Nova página</Link>
          <Link href="/briefing">Briefing IA</Link>
          <Link href="/leads">Leads</Link>
          <Link href="/account">Conta</Link>
        </nav>
        <span className="text-xs uppercase tracking-[0.14em]">{user.email}</span>
      </header>
      {children}
    </div>
  );
}
