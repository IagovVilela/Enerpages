import { auth } from "@/auth";
import { storeUpload } from "@/lib/storage";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Arquivo ausente" }, { status: 400 });
  try {
    const stored = await storeUpload(file);
    return Response.json(stored);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha no envio" }, { status: 400 });
  }
}
