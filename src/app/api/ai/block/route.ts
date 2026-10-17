import { auth } from "@/auth";
import { rewriteBlock } from "@/lib/ai/generate";
import { prisma } from "@/lib/db";
import { blockSchema, briefingSchema, SEGMENTS, type Briefing } from "@/puck/schema";

export const maxDuration = 30;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { pageId?: string; block?: unknown; mode?: string } | null;
  const block = blockSchema.safeParse(body?.block);
  if (!body?.pageId || !block.success || !["text", "style", "section"].includes(body.mode || "")) {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const page = await prisma.page.findUnique({ where: { id: body.pageId } });
  if (!page) return Response.json({ error: "Página não encontrada." }, { status: 404 });
  const briefing = briefingSchema.parse({
    clientName: page.clientName,
    segment: SEGMENTS.find((item) => item === page.segment) ?? "local",
    goal: "captar",
    slug: page.slug,
  });
  const next = await rewriteBlock(briefing, block.data, body.mode as "text" | "style" | "section");
  return Response.json({ block: next });
}
