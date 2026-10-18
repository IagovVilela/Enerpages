/** Redimensiona e compacta imagens no browser antes do upload (evita estouro no layout). */

const MAX_EDGE_DEFAULT = 1600;
const MAX_BYTES_SKIP = 700_000;

export type PrepareImageOptions = {
  maxEdge?: number;
  quality?: number;
};

export async function prepareImageFile(file: File, options: PrepareImageOptions = {}) {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  const maxEdge = options.maxEdge ?? MAX_EDGE_DEFAULT;
  const quality = options.quality ?? 0.84;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maxEdge / longest);
  if (scale >= 1 && file.size <= MAX_BYTES_SKIP) {
    bitmap.close();
    return file;
  }

  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const preferWebp = typeof canvas.toBlob === "function";
  const blob = preferWebp
    ? await canvasToBlob(canvas, "image/webp", quality).catch(() => canvasToBlob(canvas, "image/jpeg", quality))
    : null;
  if (!blob) return file;

  const base = file.name.replace(/\.[^.]+$/, "") || "imagem";
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${base}.${ext}`, { type: blob.type, lastModified: Date.now() });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao compactar imagem"));
      },
      type,
      quality,
    );
  });
}
