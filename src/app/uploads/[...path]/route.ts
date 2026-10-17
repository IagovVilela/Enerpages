import { readUpload } from "@/lib/storage";

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await context.params;
  const key = parts.map((part) => decodeURIComponent(part)).join("/");
  if (!key || key.includes("..")) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const file = await readUpload(key);
    return new Response(new Uint8Array(file.data), {
      headers: {
        "content-type": file.mimeType,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
