import { BriefingForm } from "@/components/briefing-form";
import { prisma } from "@/lib/db";
import { intakeToBriefing, intakeSchema } from "@/lib/intake/schema";
import { normalizeSlug } from "@/lib/slug";
import type { Briefing } from "@/puck/schema";

export default async function BriefingPage({
  searchParams,
}: {
  searchParams: Promise<{ intake?: string }>;
}) {
  const { intake: intakeId } = await searchParams;
  let initial: Briefing | undefined;
  let intakePayloadJson: string | undefined;

  if (intakeId) {
    const invite = await prisma.intakeInvite.findUnique({
      where: { id: intakeId },
      include: { submission: true },
    });
    if (invite?.submission) {
      const parsed = intakeSchema.safeParse(invite.submission.payload);
      if (parsed.success) {
        initial = intakeToBriefing(parsed.data, normalizeSlug(parsed.data.clientName));
        intakePayloadJson = JSON.stringify(parsed.data);
      }
    }
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em]">Novo cliente</p>
        <h1 className="text-4xl tracking-tight">Briefing</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6">
          {intakeId
            ? "Formulário preenchido com as respostas do cliente. Gere propostas e abra no Puck."
            : "A geração usa a cota gratuita. Se ela acabar, o estúdio monta as propostas com os arquétipos do segmento, sem repetir o mesmo desenho."}
        </p>
      </div>
      <BriefingForm initial={initial} intakeId={intakeId} intakePayloadJson={intakePayloadJson} />
    </main>
  );
}
