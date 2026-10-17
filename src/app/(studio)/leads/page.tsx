import Link from "next/link";
import { Suspense } from "react";
import { formatBrPhoneNational } from "@/lib/br-input-masks";
import { prisma } from "@/lib/db";

export default function LeadsPage() {
  return (
    <Suspense fallback={<p className="p-8">Carregando leads…</p>}>
      <Leads />
    </Suspense>
  );
}

async function Leads() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { page: { select: { clientName: true, slug: true } } },
  });
  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl tracking-tight">Leads</h1>
        <a className="text-sm underline" href="/api/leads/export">Exportar CSV</a>
      </div>
      <div className="overflow-x-auto border border-[var(--studio-line)] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3">Quando</th>
              <th className="p-3">Página</th>
              <th className="p-3">Contato</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const payload = lead.payload as {
                name?: string;
                email?: string;
                phone?: string;
                message?: string;
              };
              const phone = payload.phone
                ? formatBrPhoneNational(payload.phone) || payload.phone
                : "";
              return (
                <tr key={lead.id} className="border-b">
                  <td className="p-3" suppressHydrationWarning>
                    {lead.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                  </td>
                  <td className="p-3"><Link href={`/pages/${lead.pageId}`}>{lead.page.clientName}</Link></td>
                  <td className="p-3">
                    {payload.name}
                    {payload.email ? ` · ${payload.email}` : ""}
                    {phone ? ` · ${phone}` : ""}
                    {payload.message ? (
                      <>
                        <br />
                        {payload.message}
                      </>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
