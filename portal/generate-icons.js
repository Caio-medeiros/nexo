/**
 * NEXO Portal — PWA icon generator.
 *
 * The PNGs in /portal/icons/ are already committed, so you only need this
 * to regenerate them. Requires the native `canvas` module:
 *
 *   npm install canvas --save-dev
 *   node portal/generate-icons.js
 *
 * (On this machine `canvas` would not compile, so the committed icons were
 *  produced with an equivalent Pillow script — same output: dark background,
 *  "NEXO." centred inside the maskable safe zone.)
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Full-bleed dark background (maskable icons are masked by the OS, so the
  // background must reach the edges; keep content within the centre ~80%).
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, size, size);

  const fontSize = size * 0.20;
  ctx.fillStyle = '#F0F0F0';
  ctx.font = `700 ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NEXO', size / 2, size / 2);

  // Brand dot, just right of the word.
  const dotSize = size * 0.064;
  const dotX = size / 2 + ctx.measureText('NEXO').width / 2 + dotSize * 0.5;
  const dotY = size / 2 + fontSize * 0.34;
  ctx.beginPath();
  ctx.arc(dotX, dotY, dotSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#F0F0F0';
  ctx.fill();

  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
  console.log(`Created ${outputPath}`);
}

const iconDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true });

[96, 192, 512].forEach((size) =>
  generateIcon(size, path.join(iconDir, `icon-${size}.png`))
);
