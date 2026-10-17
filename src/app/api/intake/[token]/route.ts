import { prisma } from "@/lib/db";
import { emptyIntake, intakeSchema } from "@/lib/intake/schema";

async function loadInvite(token: string) {
  const invite = await prisma.intakeInvite.findUnique({
    where: { token },
    include: { submission: true },
  });
  if (!invite) return null;
  if (invite.status === "PENDING" && invite.expiresAt.getTime() < Date.now()) {
    return prisma.intakeInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
      include: { submission: true },
    });
  }
  return invite;
}

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const invite = await loadInvite(token);
  if (!invite) return Response.json({ error: "Link inválido." }, { status: 404 });

  const prefill = emptyIntake({
    clientName: invite.clientNameHint || "",
    segment: (invite.segmentHint as ReturnType<typeof emptyIntake>["segment"]) || "local",
  });

  return Response.json({
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
    prefill,
    submitted: Boolean(invite.submission),
  });
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const invite = await loadInvite(token);
  if (!invite) return Response.json({ error: "Link inválido." }, { status: 404 });
  if (invite.status === "EXPIRED") {
    return Response.json({ error: "Este link expirou. Peça um novo à equipe." }, { status: 410 });
  }
  if (invite.status === "SUBMITTED" || invite.status === "USED") {
    return Response.json({ error: "Este formulário já foi enviado." }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = intakeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dados incompletos. Revise as etapas e tente de novo.", issues: parsed.error.issues.slice(0, 8) },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.intakeSubmission.upsert({
      where: { inviteId: invite.id },
      create: { inviteId: invite.id, payload: parsed.data },
      update: { payload: parsed.data, submittedAt: new Date() },
    }),
    prisma.intakeInvite.update({
      where: { id: invite.id },
      data: { status: "SUBMITTED" },
    }),
  ]);

  return Response.json({ ok: true });
}
