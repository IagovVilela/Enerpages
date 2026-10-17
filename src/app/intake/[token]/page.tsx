import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { IntakeWizard } from "@/components/intake-wizard";
import { prisma } from "@/lib/db";
import { emptyIntake } from "@/lib/intake/schema";
import { SEGMENTS } from "@/puck/schema";

export const instant = false;

export default async function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.intakeInvite.findUnique({
    where: { token },
    include: { submission: true },
  });
  if (!invite) notFound();

  let status = invite.status;
  if (status === "PENDING" && invite.expiresAt.getTime() < Date.now()) {
    await prisma.intakeInvite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
    status = "EXPIRED";
  }

  const segmentHint =
    invite.segmentHint && (SEGMENTS as readonly string[]).includes(invite.segmentHint)
      ? (invite.segmentHint as (typeof SEGMENTS)[number])
      : "local";

  const prefill = invite.submission
    ? emptyIntake(invite.submission.payload as Parameters<typeof emptyIntake>[0])
    : emptyIntake({
        clientName: invite.clientNameHint || "",
        segment: segmentHint,
      });

  const locked = status !== "PENDING";
  const lockMessage =
    status === "EXPIRED"
      ? "Este link expirou. Peça um novo link à equipe."
      : status === "USED"
        ? "Este briefing já foi usado para montar a página."
        : status === "SUBMITTED"
          ? "Você já enviou este formulário. A equipe está montando a página."
          : undefined;

  return (
    <main className="min-h-svh bg-[var(--studio-bg)] px-4 py-10 text-[var(--studio-ink)] sm:py-14">
      <div className="mx-auto mb-8 max-w-3xl">
        <BrandMark size="sm" />
        <p className="mt-3 text-sm text-neutral-600">
          Preencha com calma — suas escolhas guiam o visual e o conteúdo da página.
        </p>
      </div>
      <IntakeWizard token={token} initial={prefill} locked={locked} lockMessage={lockMessage} />
    </main>
  );
}
