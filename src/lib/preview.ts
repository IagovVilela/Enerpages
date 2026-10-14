import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET ausente");
  return value;
}

export function signPreview(pageId: string) {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const body = `${pageId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readPreview(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [pageId, exp, sig] = parts;
  const expected = createHmac("sha256", secret()).update(`${pageId}.${exp}`).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  if (Number(exp) < Date.now()) return null;
  return pageId;
}
