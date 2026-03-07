// Re-run: node apps/mobile/scripts/generate-assets.js
// Primary: canvas ^2.11.0 (devDependency). Fallback (used): @napi-rs/canvas when node-canvas native build fails.
// Alternative: jimp or raw PNG encoding via pngjs

const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

function createPngBuffer(width, height, bgColor, drawFn) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }
  drawFn(ctx, canvas);
  return canvas.toBuffer('image/png');
}

// Ensure assets directory exists
fs.mkdirSync(ASSETS_DIR, { recursive: true });

// icon.png (1024×1024)
const iconBuffer = createPngBuffer(1024, 1024, '#111111', (ctx) => {
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 600px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', 512, 512);
});
fs.writeFileSync(path.join(ASSETS_DIR, 'icon.png'), iconBuffer);
console.log('Written: apps/mobile/assets/icon.png');

// adaptive-icon.png (1024×1024) - transparent background
const adaptiveIconBuffer = createPngBuffer(1024, 1024, null, (ctx) => {
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 600px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', 512, 512);
});
fs.writeFileSync(path.join(ASSETS_DIR, 'adaptive-icon.png'), adaptiveIconBuffer);
console.log('Written: apps/mobile/assets/adaptive-icon.png');

// splash.png (1284×2778)
const splashBuffer = createPngBuffer(1284, 2778, '#111111', (ctx) => {
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 150px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Roam', 642, 1389);
});
fs.writeFileSync(path.join(ASSETS_DIR, 'splash.png'), splashBuffer);
console.log('Written: apps/mobile/assets/splash.png');

// favicon.png (48×48)
const faviconBuffer = createPngBuffer(48, 48, '#111111', (ctx) => {
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', 24, 24);
});
fs.writeFileSync(path.join(ASSETS_DIR, 'favicon.png'), faviconBuffer);
console.log('Written: apps/mobile/assets/favicon.png');
