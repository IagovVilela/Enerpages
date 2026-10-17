import type { IntakeStatus } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { IntakeDetailActions } from "@/components/intake-detail-actions";
import { prisma } from "@/lib/db";
import { intakeSchema, type IntakePayload } from "@/lib/intake/schema";
import { intakePublicUrl } from "@/lib/intake/token";

export default function IntakeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8">Carregando convite…</p>}>
      <IntakeDetail params={params} />
    </Suspense>
  );
}

async function IntakeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invite = await prisma.intakeInvite.findUnique({
    where: { id },
    include: { submission: true, page: { select: { id: true, clientName: true, slug: true } } },
  });
  if (!invite) notFound();

  let status = invite.status;
  if (status === "PENDING" && invite.expiresAt.getTime() < Date.now()) {
    await prisma.intakeInvite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
    status = "EXPIRED";
  }

  const parsed = invite.submission ? intakeSchema.safeParse(invite.submission.payload) : null;
  const payload = parsed?.success ? parsed.data : null;
  const publicUrl = intakePublicUrl(invite.token);
  const canGenerate = status === "SUBMITTED" && Boolean(payload) && !invite.pageId;

  return (
    <main className="mx-auto grid max-w-4xl gap-8 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/intakes" className="text-sm text-neutral-600 underline">
            ← Briefings
          </Link>
          <h1 className="mt-2 text-4xl tracking-tight">
            {payload?.clientName || invite.clientNameHint || "Convite"}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Status: {statusLabel(status)} · expira {invite.expiresAt.toISOString().slice(0, 10)}
          </p>
        </div>
      </div>

      <IntakeDetailActions
        inviteId={invite.id}
        publicUrl={publicUrl}
        canGenerate={canGenerate}
        pageId={invite.pageId}
      />

      {invite.notes ? (
        <section className="border border-[var(--studio-line)] bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Notas internas</p>
          <p className="mt-2 text-sm whitespace-pre-wrap">{invite.notes}</p>
        </section>
      ) : null}

      {payload ? <IntakePayloadView payload={payload} /> : (
        <p className="border border-dashed border-[var(--studio-line)] bg-white/60 p-8 text-center text-sm text-neutral-600">
          Aguardando o cliente enviar o formulário.
        </p>
      )}

      {invite.page ? (
        <p className="text-sm">
          Página criada:{" "}
          <Link className="underline" href={`/pages/${invite.page.id}`}>
            {invite.page.clientName} ({invite.page.slug})
          </Link>
        </p>
      ) : null}
    </main>
  );
}

function statusLabel(status: IntakeStatus) {
  switch (status) {
    case "PENDING":
      return "Aguardando cliente";
    case "SUBMITTED":
      return "Recebido — pronto para gerar";
    case "USED":
      return "Usado";
    case "EXPIRED":
      return "Expirado";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function IntakePayloadView({ payload }: { payload: IntakePayload }) {
  const rows: [string, string][] = [
    ["Segmento", payload.segment],
    ["Público", payload.audience],
    ["Objetivo", payload.goal],
    ["Serviços", payload.services],
    ["WhatsApp", payload.whatsapp],
    ["Telefone", payload.phone],
    ["Instagram", payload.instagram],
    ["E-mail", payload.email],
    ["Endereço", payload.address],
    ["Personalidade", payload.personality],
    ["Cor primária", payload.primaryColor],
    ["Fundo", payload.backgroundColor],
    ["Fonte display", payload.fontDisplay],
    ["Fonte corpo", payload.fontBody],
    ["Arte de fundo", payload.bgArt],
    ["Tom", payload.tone],
    ["Diferenciais", payload.differentials],
    ["Referências", payload.references],
    ["Headline", payload.headline],
    ["Tagline", payload.tagline],
    ["Modelo", payload.templateId],
  ];

  return (
    <section className="grid gap-3 border border-[var(--studio-line)] bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Respostas do cliente</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows
          .filter(([, value]) => Boolean(value))
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</dt>
              <dd className="mt-0.5 text-sm whitespace-pre-wrap">{value}</dd>
            </div>
          ))}
      </dl>
      <div className="flex gap-2 pt-2">
        <span className="h-8 w-8 border" style={{ background: payload.primaryColor }} title="Primária" />
        <span className="h-8 w-8 border" style={{ background: payload.backgroundColor }} title="Fundo" />
      </div>
    </section>
  );
}
