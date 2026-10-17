import { readUpload } from "@/lib/storage";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
};

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await context.params;
  const key = parts.map((part) => decodeURIComponent(part)).join("/");
  if (!key || key.includes("..")) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const data = await readUpload(key);
    const ext = key.split(".").pop()?.toLowerCase() || "";
    return new Response(data, {
      headers: {
        "content-type": TYPES[ext] || "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
