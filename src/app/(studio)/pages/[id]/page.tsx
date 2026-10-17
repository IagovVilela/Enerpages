import { Suspense } from "react";
import { notFound } from "next/navigation";
import { previewLink, updatePageMeta } from "@/actions/studio";
import { StudioEditor } from "@/components/studio-editor";
import { prisma } from "@/lib/db";
import { pageDataSchema } from "@/puck/schema";
import { publicOrigin } from "@/lib/tenant";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8">Abrindo o editor…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await prisma.page.findUnique({
    where: { id },
    include: { versions: { orderBy: { version: "desc" }, take: 20 } },
  });
  if (!page) notFound();
  const current = page;
  const parsed = pageDataSchema.safeParse(current.draftData);
  if (!parsed.success) {
    return <p className="p-8">O rascunho desta página está inválido e não pode abrir no editor.</p>;
  }
  const token = await previewLink(current.id);

  async function saveMeta(formData: FormData) {
    "use server";
    await updatePageMeta(current.id, {
      clientName: String(formData.get("clientName") || current.clientName),
      slug: String(formData.get("slug") || current.slug),
      customDomain: String(formData.get("customDomain") || ""),
    });
  }

  return (
    <div>
      <form action={saveMeta} className="flex flex-wrap items-center gap-2 border-b border-[var(--studio-line)] px-4 py-2 text-sm">
        <input className="border px-2 py-1" name="clientName"           defaultValue={current.clientName} />
        <input className="border px-2 py-1" name="slug" defaultValue={current.slug} />
        <input className="border px-2 py-1" name="customDomain" placeholder="dominio próprio (futuro)" defaultValue={current.customDomain || ""} />
        <button className="border px-2 py-1" type="submit">Salvar endereço</button>
        <a href={`/preview/${token}`}>Pré-visualizar</a>
        {current.status === "PUBLISHED" ? <a href={publicOrigin(current.slug)}>Site no ar</a> : null}
      </form>
      <StudioEditor
        pageId={current.id}
        clientName={current.clientName}
        slug={current.slug}
        segment={current.segment}
        status={current.status}
        previewUrl={`/preview/${token}`}
        publicUrl={publicOrigin(current.slug)}
        initial={parsed.data}
        versions={current.versions.map((version) => ({
          id: version.id,
          version: version.version,
          label: version.label,
          source: version.source,
          createdAt: version.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
