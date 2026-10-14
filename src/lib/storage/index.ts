import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"]);

export function assertUpload(file: { type: string; size: number }) {
  if (!ALLOWED.has(file.type)) throw new Error("Envie JPG, PNG, WEBP, GIF ou MP4.");
  const limit = file.type === "video/mp4" ? 20 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > limit) throw new Error("Arquivo grande demais.");
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

  const target = path.join(process.cwd(), "public", "uploads", key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, body);
  return { url: `/uploads/${key}` };
}
