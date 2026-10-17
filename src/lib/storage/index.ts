import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"]);

export function assertUpload(file: { type: string; size: number }) {
  if (!ALLOWED.has(file.type)) throw new Error("Envie JPG, PNG, WEBP, GIF, MP4 ou WEBM.");
  const limit = file.type.startsWith("video/") ? 20 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > limit) throw new Error("Arquivo grande demais.");
}

/** Local disk root — prefer Railway volume via UPLOAD_DIR=/data/uploads */
export function uploadRoot() {
  return process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), "storage", "uploads");
}

export function resolveUploadPath(relativeKey: string) {
  const normalized = relativeKey.replace(/^\/+/, "").replace(/\.\./g, "");
  const full = path.resolve(/* turbopackIgnore: true */ uploadRoot(), normalized);
  const root = path.resolve(/* turbopackIgnore: true */ uploadRoot());
  const prefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (full !== root && !full.startsWith(prefix)) {
    throw new Error("Caminho de upload inválido.");
  }
  return full;
}

export async function readUpload(relativeKey: string): Promise<{ data: Buffer; mimeType: string }> {
  const key = relativeKey.replace(/^\/+/, "").replace(/\.\./g, "");
  const fromDb = await prisma.mediaAsset.findUnique({ where: { key } });
  if (fromDb) {
    return { data: Buffer.from(fromDb.bytes), mimeType: fromDb.mimeType };
  }

  const full = resolveUploadPath(key);
  const data = await readFile(/* turbopackIgnore: true */ full);
  const ext = key.split(".").pop()?.toLowerCase() || "";
  const TYPES: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    mp4: "video/mp4",
    webm: "video/webm",
  };
  return { data, mimeType: TYPES[ext] || "application/octet-stream" };
}

export async function storeUpload(file: File) {
  assertUpload(file);
  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const key = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const body = Buffer.from(await file.arrayBuffer());

  if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET) {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: file.type,
      }),
    );
    const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    if (!base) throw new Error("R2_PUBLIC_URL ausente");
    return { url: `${base}/${key}` };
  }

  // Fonte da verdade em produção: Postgres (sobrevive a redeploy).
  await prisma.mediaAsset.upsert({
    where: { key },
    create: { key, mimeType: file.type, bytes: body, size: body.length },
    update: { mimeType: file.type, bytes: body, size: body.length },
  });

  // Espelho em disco quando houver volume (cache local).
  try {
    const target = resolveUploadPath(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
  } catch {
    /* volume ausente / read-only — DB já salvou */
  }

  return { url: `/uploads/${key}` };
}
