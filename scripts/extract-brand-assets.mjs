import fs from "node:fs";
import sharp from "sharp";

/** Fontes:
 *  - Captura 140111 → ícone claro / monograma limpo (Enerpages)
 *  - Prancha t70848 → wordmark, ícone escuro, cores
 *  (Ignorar Captura 140034 e prancha wvdrq1 — são Gestor Consulta)
 */
const iconShot = "Logos/Captura de tela 2026-10-17 140111.png";
const sheet = "Logos/Gemini_Generated_Image_t70848t70848t708.jpg";
const outDir = "public/brand";
fs.mkdirSync(outDir, { recursive: true });

async function paperToAlpha(inputBuf, { soft = true } = {}) {
  const { data, info } = await sharp(inputBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 210 && r > 200 && g > 190 && b > 175) {
      data[i + 3] = 0;
      continue;
    }
    if (soft && lum > 185 && r > 175 && g > 165 && b > 150) {
      const t = Math.min(1, (lum - 185) / 40);
      data[i + 3] = Math.round(data[i + 3] * (1 - t));
    }
  }
  return sharp(Buffer.from(data), {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

function isInk(r, g, b) {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  if (lum < 120) return true;
  if (r > 90 && r > g + 15 && r > b + 20 && lum < 160) return true;
  return false;
}

async function bboxOfInk(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (data[i + 3] < 16) continue;
      if (!isInk(data[i], data[i + 1], data[i + 2])) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX) return null;
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function padBox(box, pad, maxW, maxH) {
  const left = Math.max(0, box.left - pad);
  const top = Math.max(0, box.top - pad);
  return {
    left,
    top,
    width: Math.min(maxW - left, box.width + pad * 2),
    height: Math.min(maxH - top, box.height + pad * 2),
  };
}

// --- Ícone claro + monograma a partir da captura limpa ---
await sharp(iconShot).resize(512, 512, { fit: "cover" }).png().toFile(`${outDir}/icon-light.png`);
await sharp(iconShot).resize(512, 512, { fit: "cover" }).png().toFile(`${outDir}/app-icon-light.png`);

const iconRaw = await sharp(iconShot).resize(512, 512, { fit: "cover" }).png().toBuffer();
const markAlpha = await (await paperToAlpha(iconRaw)).toBuffer();
const markBox = await bboxOfInk(markAlpha);
if (!markBox) throw new Error("Mark ink not found in screenshot");
const markMeta = await sharp(markAlpha).metadata();
await sharp(markAlpha)
  .extract(padBox(markBox, 28, markMeta.width, markMeta.height))
  .png()
  .toFile(`${outDir}/mark.png`);

// --- Ícone escuro + wordmark a partir da prancha Enerpages ---
const meta = await sharp(sheet).metadata();
const W = meta.width ?? 2752;
const H = meta.height ?? 1536;
const midX = Math.floor(W / 2);
const midY = Math.floor(H / 2);

const trBuf = await sharp(sheet)
  .extract({ left: midX, top: 0, width: midX, height: midY })
  .png()
  .toBuffer();
const { data, info } = await sharp(trBuf).raw().ensureAlpha().toBuffer({ resolveWithObject: true });

function cream(r, g, b) {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 205 && r > 195 && g > 185 && b > 170;
}

const mask = new Uint8Array(info.width * info.height);
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 4;
    if (!cream(data[i], data[i + 1], data[i + 2])) mask[y * info.width + x] = 1;
  }
}

const mid = Math.floor(info.width / 2);
let rightMin = info.width;
let rightMax = 0;
let top = info.height;
let bot = 0;
for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    if (!mask[y * info.width + x]) continue;
    top = Math.min(top, y);
    bot = Math.max(bot, y);
    if (x >= mid) {
      rightMin = Math.min(rightMin, x);
      rightMax = Math.max(rightMax, x);
    }
  }
}

const darkBox = {
  left: Math.max(0, rightMin - 28),
  top: Math.max(0, top - 28),
  width: Math.min(info.width - Math.max(0, rightMin - 28), rightMax - rightMin + 56),
  height: Math.min(info.height - Math.max(0, top - 28), bot - top + 56),
};
const darkBg = { r: 28, g: 25, b: 21, alpha: 1 };
await sharp(trBuf)
  .extract(darkBox)
  .resize(512, 512, { fit: "contain", background: darkBg })
  .png()
  .toFile(`${outDir}/icon-dark.png`);
await sharp(trBuf).extract(darkBox).png().toFile(`${outDir}/app-icon-dark.png`);

const sx = midX / 800;
const sy = midY / 447;
const wm = {
  left: Math.max(0, Math.floor(157 * sx) - 24),
  top: Math.max(0, Math.floor(178 * sy) - 36),
  width: Math.min(midX - 40, Math.ceil((743 - 157) * sx) + 48),
  height: Math.min(midY - 40, Math.ceil((294 - 178) * sy) + 72),
};
const wordRaw = await sharp(sheet).extract(wm).png().toBuffer();
const wordAlpha = await (await paperToAlpha(wordRaw)).toBuffer();
const wordBox = await bboxOfInk(wordAlpha);
if (!wordBox) throw new Error("Wordmark ink not found");
const wordMeta = await sharp(wordAlpha).metadata();
await sharp(wordAlpha)
  .extract(padBox(wordBox, 12, wordMeta.width, wordMeta.height))
  .png()
  .toFile(`${outDir}/wordmark.png`);

const markFile = await sharp(`${outDir}/mark.png`).metadata();
const wordFile = await sharp(`${outDir}/wordmark.png`).metadata();
const markH = 128;
const markW = Math.round(((markFile.width || 128) / (markFile.height || 128)) * markH);
const wordH = 64;
const wordW = Math.round(((wordFile.width || 400) / (wordFile.height || 64)) * wordH);
const gap = 28;
const lockW = markW + gap + wordW;
const lockH = Math.max(markH, wordH) + 8;

await sharp({
  create: { width: lockW, height: lockH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([
    {
      input: await sharp(`${outDir}/mark.png`).resize(markW, markH, { fit: "contain" }).png().toBuffer(),
      left: 0,
      top: Math.round((lockH - markH) / 2),
    },
    {
      input: await sharp(`${outDir}/wordmark.png`).resize(wordW, wordH, { fit: "contain" }).png().toBuffer(),
      left: markW + gap,
      top: Math.round((lockH - wordH) / 2),
    },
  ])
  .png()
  .toFile(`${outDir}/logo.png`);

await sharp(`${outDir}/icon-light.png`).resize(32, 32).png().toFile(`${outDir}/favicon-32.png`);
await sharp(`${outDir}/icon-light.png`).resize(180, 180).png().toFile(`${outDir}/apple-touch-icon.png`);
fs.copyFileSync(`${outDir}/icon-light.png`, "src/app/icon.png");
fs.copyFileSync(`${outDir}/apple-touch-icon.png`, "src/app/apple-icon.png");
fs.copyFileSync(sheet, `${outDir}/identity-sheet.jpg`);

console.log("Brand assets updated from clean screenshot + Enerpages sheet");
console.log(fs.readdirSync(outDir).filter((f) => f.endsWith(".png") || f.endsWith(".jpg")));
