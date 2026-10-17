import type { IntakeStatus } from "@prisma/client";
import Link from "next/link";
import { Suspense } from "react";
import { IntakeInviteForm } from "@/components/intake-invite-form";
import { prisma } from "@/lib/db";
import { intakePublicUrl } from "@/lib/intake/token";

export default function IntakesPage() {
  return (
    <Suspense fallback={<p className="p-8">Carregando briefings…</p>}>
      <IntakesList />
    </Suspense>
  );
}

async function IntakesList() {
  const invites = await prisma.intakeInvite.findMany({
    orderBy: { createdAt: "desc" },
    include: { submission: true, page: { select: { id: true, clientName: true, slug: true } } },
    take: 100,
  });

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em]">Intake</p>
        <h1 className="text-4xl tracking-tight">Briefings do cliente</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Crie um link, envie ao cliente e use as respostas para montar a página no studio.
        </p>
      </div>

      <IntakeInviteForm />

      <div className="grid gap-3">
        {invites.length === 0 ? (
          <p className="border border-dashed border-[var(--studio-line)] bg-white/60 p-8 text-center text-sm text-neutral-600">
            Nenhum convite ainda.
          </p>
        ) : null}
        {invites.map((invite) => {
          const name =
            (invite.submission?.payload as { clientName?: string } | null)?.clientName ||
            invite.clientNameHint ||
            "Sem nome";
          const url = intakePublicUrl(invite.token);
          return (
            <article key={invite.id} className="grid gap-2 border border-[var(--studio-line)] bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl">{name}</h2>
                  <StatusBadge status={invite.status} />
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  {invite.segmentHint || "—"} · criado {invite.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                  {invite.submission ? ` · enviado ${invite.submission.submittedAt.toISOString().slice(0, 16).replace("T", " ")}` : ""}
                </p>
                <p className="mt-1 break-all text-xs text-neutral-500">{url}</p>
                {invite.page ? (
                  <p className="mt-1 text-sm">
                    Página:{" "}
                    <Link className="underline" href={`/pages/${invite.page.id}`}>
                      {invite.page.clientName}
                    </Link>
                  </p>
                ) : null}
              </div>
              <Link className="border px-3 py-2 text-center text-sm" href={`/intakes/${invite.id}`}>
                Abrir
              </Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: IntakeStatus }) {
  let label: string;
  switch (status) {
    case "PENDING":
      label = "Aguardando";
      break;
    case "SUBMITTED":
      label = "Recebido";
      break;
    case "USED":
      label = "Usado";
      break;
    case "EXPIRED":
      label = "Expirado";
      break;
    default: {
      const _exhaustive: never = status;
      label = _exhaustive;
      break;
    }
  }
  return <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{label}</span>;
}
