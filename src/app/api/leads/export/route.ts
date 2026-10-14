import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function cell(value: unknown) {
  const text = String(value ?? "").replaceAll('"', '""');
  return /^[=+\-@]/.test(text) ? `"'${text}"` : `"${text}"`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Não autorizado", { status: 401 });
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { page: { select: { clientName: true, slug: true } } },
  });
  const lines = ["data,cliente,slug,nome,email,telefone,mensagem"];
  for (const lead of leads) {
    const payload = lead.payload as { name?: string; email?: string; phone?: string; message?: string };
    lines.push(
      [lead.createdAt.toISOString(), lead.page.clientName, lead.page.slug, payload.name, payload.email, payload.phone, payload.message]
        .map(cell)
        .join(","),
    );
  }
  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=leads.csv",
    },
  });
}
