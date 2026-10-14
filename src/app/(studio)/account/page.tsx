import { Suspense } from "react";
import { AccountPanel } from "@/components/account-panel";
import { requireAdmin } from "@/lib/admin";

export default function AccountPage() {
  return (
    <Suspense fallback={<p className="p-8">Carregando a conta…</p>}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  const user = await requireAdmin();
  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
      <h1 className="text-4xl tracking-tight">Conta</h1>
      <p className="text-sm">{user.email}</p>
      <AccountPanel enabled={user.totpEnabled} />
    </main>
  );
}
