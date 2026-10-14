import { auth } from "@/auth";
import { generateProposals } from "@/lib/ai/generate";
import { briefingSchema } from "@/puck/schema";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const parsed = briefingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Briefing inválido." }, { status: 400 });
  const result = await generateProposals(parsed.data);
  return Response.json(result);
}
