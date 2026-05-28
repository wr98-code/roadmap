#!/usr/bin/env node
// generate-icons.mjs — Run this ONCE to generate PWA icons
// Usage: node generate-icons.mjs
// Requires: npm install sharp (sementara, bisa uninstall setelah generate)

import { readFileSync, mkdirSync, existsSync } from "fs";
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

// Main ones needed for manifest
console.log("");
console.log("✅ All icons generated in public/icons/");
console.log("✅ PWA manifest will reference icon-192.png and icon-512.png");
