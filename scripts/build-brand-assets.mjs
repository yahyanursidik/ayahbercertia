#!/usr/bin/env node
// Membuat aset logo dari brand/source/*.webp (latar putih) → versi transparan, versi terang,
// favicon, ikon aplikasi, dan gambar Open Graph. Jalankan ulang setiap kali logo sumber diganti:
//   npm run brand

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = new URL('../', import.meta.url);
const path = (p) => fileURLToPath(new URL(p, ROOT));

const SRC_WORDMARK = path('brand/source/logo-wordmark.webp');
const SRC_MARK = path('brand/source/logo-mark.webp');
const ASSETS = path('src/assets/brand');
const PUBLIC = path('public');

const CREAM = { r: 245, g: 240, b: 229 };
const WHITE = { r: 255, g: 255, b: 255 };

/**
 * "Color to alpha" terhadap latar putih: piksel putih → transparan, tepi anti-alias → semi-transparan
 * dengan warna asli dipulihkan, lalu dipotong rapat ke isi logo.
 */
async function knockOutWhite(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const rgb = [data[i], data[i + 1], data[i + 2]];
    const alpha = Math.max(...rgb.map((c) => (255 - c) / 255));
    // Sisa noise kompresi di latar dianggap transparan penuh.
    const a = alpha < 0.04 ? 0 : alpha;
    for (let c = 0; c < 3; c++) out[i + c] = a ? Math.round(Math.min(255, Math.max(0, (rgb[c] - 255 * (1 - a)) / a))) : 0;
    out[i + 3] = Math.round(a * 255);
  }
  return sharp(out, { raw: info }).png().trim({ threshold: 1 }).toBuffer();
}

/** Versi untuk latar gelap: bagian navy diganti krem, bagian emas sedikit dicerahkan agar kontras. */
async function lightVariant(png) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 2] > data[i]) {
      data[i] = CREAM.r;
      data[i + 1] = CREAM.g;
      data[i + 2] = CREAM.b;
    } else {
      for (let c = 0; c < 3; c++) data[i + c] = Math.min(255, Math.round(data[i + c] * 1.14 + 6));
    }
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

/** Logo di tengah kanvas persegi, opsional di atas petak berlatar dengan sudut membulat. */
async function squareIcon(markPng, size, { padding, background = null, radius = 0 }) {
  const inner = Math.round(size * (1 - padding * 2));
  const mark = await sharp(markPng).resize(inner, inner, { fit: 'inside' }).toBuffer();
  const base = background
    ? sharp(
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius * size}" fill="rgb(${background.r},${background.g},${background.b})"/></svg>`,
        ),
      )
    : sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  return base.composite([{ input: mark, gravity: 'center' }]).png().toBuffer();
}

/** ICO berisi beberapa PNG (didukung semua peramban modern). */
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function main() {
  await mkdir(ASSETS, { recursive: true });

  const wordmark = await knockOutWhite(SRC_WORDMARK);
  const mark = await knockOutWhite(SRC_MARK);
  const wordmarkLight = await lightVariant(wordmark);

  // Sumber untuk <Image> astro:assets (dioptimasi ke WebP/AVIF saat build).
  await writeFile(`${ASSETS}/logo-wordmark.png`, wordmark);
  await writeFile(`${ASSETS}/logo-wordmark-light.png`, wordmarkLight);
  await writeFile(`${ASSETS}/logo-mark.png`, mark);

  // Favicon: petak putih membulat agar tetap terlihat di tab bertema gelap.
  const tile = { background: WHITE, radius: 0.22 };
  const ico = await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, data: await squareIcon(mark, size, { padding: 0.08, ...tile }) })),
  );
  await writeFile(`${PUBLIC}/favicon.ico`, buildIco(ico));
  await writeFile(`${PUBLIC}/favicon-32.png`, await squareIcon(mark, 32, { padding: 0.08, ...tile }));
  // iOS membulatkan sendiri dan tidak mendukung transparansi.
  await writeFile(`${PUBLIC}/apple-touch-icon.png`, await squareIcon(mark, 180, { padding: 0.14, background: WHITE }));
  await writeFile(`${PUBLIC}/icon-192.png`, await squareIcon(mark, 192, { padding: 0.12, ...tile }));
  await writeFile(`${PUBLIC}/icon-512.png`, await squareIcon(mark, 512, { padding: 0.12, ...tile }));
  // Maskable: area aman 80% di tengah, latar penuh.
  await writeFile(`${PUBLIC}/icon-maskable-512.png`, await squareIcon(mark, 512, { padding: 0.2, background: WHITE }));

  // Gambar Open Graph bawaan (1200×630) untuk halaman tanpa thumbnail video.
  const ogLogo = await sharp(wordmark).resize(820, 400, { fit: 'inside' }).toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: CREAM } })
    .composite([{ input: ogLogo, gravity: 'center' }])
    .png()
    .toFile(`${PUBLIC}/og-default.png`);

  const meta = await sharp(wordmark).metadata();
  const markMeta = await sharp(mark).metadata();
  console.log(`✓ Aset logo dibuat (wordmark ${meta.width}×${meta.height}, mark ${markMeta.width}×${markMeta.height}).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
