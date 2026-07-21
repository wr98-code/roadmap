#!/usr/bin/env node
// generate-icons.mjs — Run this ONCE to generate PWA icons
// Usage: node generate-icons.mjs
// Requires: npm install sharp (sementara, bisa uninstall setelah generate)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Check if sharp is available
let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.log("❌ sharp not installed. Run: npm install sharp");
  console.log("Then: node generate-icons.mjs");
  console.log("");
  console.log("Alternative: Go to https://realfavicongenerator.net");
  console.log("Upload your favicon.svg and download the icons package.");
  process.exit(1);
}

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = join(__dirname, "public", "icons");

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

const svgPath = join(__dirname, "public", "favicon.svg");
const svgBuffer = readFileSync(svgPath);

for (const size of SIZES) {
  const outputPath = join(iconsDir, `icon-${size}.png`);
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`✅ Generated icon-${size}.png`);
}

// ── favicon.ico (dirujuk index.html sebagai "alternate icon") ──────────────────
// sharp tidak bisa nulis .ico langsung; format ICO boleh membungkus PNG, jadi
// kita rakit header ICO minimal (1 entri 32x32) + payload PNG dari sharp.
const icoPng = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);   // reserved
header.writeUInt16LE(1, 2);   // type: 1 = icon
header.writeUInt16LE(1, 4);   // jumlah gambar
const dir = Buffer.alloc(16);
dir.writeUInt8(32, 0);                 // width (32)
dir.writeUInt8(32, 1);                 // height (32)
dir.writeUInt8(0, 2);                  // color palette
dir.writeUInt8(0, 3);                  // reserved
dir.writeUInt16LE(1, 4);               // color planes
dir.writeUInt16LE(32, 6);              // bits per pixel
dir.writeUInt32LE(icoPng.length, 8);   // ukuran data PNG
dir.writeUInt32LE(6 + 16, 12);         // offset ke data PNG
const icoPath = join(__dirname, "public", "favicon.ico");
writeFileSync(icoPath, Buffer.concat([header, dir, icoPng]));
console.log("✅ Generated favicon.ico");

// Main ones needed for manifest
console.log("");
console.log("✅ All icons generated in public/icons/");
console.log("✅ PWA manifest will reference icon-192.png and icon-512.png");
