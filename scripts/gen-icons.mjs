// Generates PWA PNG icons with no external dependencies.
// A white ascending bar-chart glyph on an indigo background.
//   node scripts/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function pngFromRGBA(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const bg = [0x63, 0x66, 0xf1, 0xff]; // indigo
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = bg[0];
    rgba[i * 4 + 1] = bg[1];
    rgba[i * 4 + 2] = bg[2];
    rgba[i * 4 + 3] = bg[3];
  }

  const white = [255, 255, 255, 255];
  const safe = size * 0.62;
  const left = (size - safe) / 2;
  const barW = safe / 5;
  const gap = barW / 2;
  const baseY = left + safe;
  const heights = [0.45, 0.72, 1.0];

  function rect(x0, y0, x1, y1, col) {
    x0 = Math.max(0, Math.floor(x0));
    y0 = Math.max(0, Math.floor(y0));
    x1 = Math.min(size, Math.ceil(x1));
    y1 = Math.min(size, Math.ceil(y1));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * size + x) * 4;
        rgba[i] = col[0];
        rgba[i + 1] = col[1];
        rgba[i + 2] = col[2];
        rgba[i + 3] = col[3];
      }
    }
  }

  let x = left + gap;
  for (const h of heights) {
    rect(x, baseY - safe * h, x + barW, baseY, white);
    x += barW + gap;
  }

  return pngFromRGBA(size, rgba);
}

for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), makeIcon(size));
  console.log("wrote public/" + name, `(${size}x${size})`);
}
