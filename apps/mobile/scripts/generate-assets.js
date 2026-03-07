// Re-run: node apps/mobile/scripts/generate-assets.js
// Requires: jimp ^0.22.12 (devDependency in apps/mobile/package.json)
// Fallback: if node-canvas cannot install (native deps), swap to `jimp` or raw PNG encoding
// (Using jimp — node-canvas requires Visual Studio on Windows)

const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

// R glyph at ~55–60% of canvas (560–620px on 1024px). Source canvas 224×224 with 128px font
// yields ~587px when scaled to 1024. Bold effect via double-print offset.
const SOURCE_SIZE = 224;
const TARGET_ICON = 1024;

async function renderR(font, bgColor, boldOffset = 1) {
  const img = new Jimp(SOURCE_SIZE, SOURCE_SIZE, bgColor);
  const opts = { text: 'R', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE };
  img.print(font, -boldOffset, 0, opts, SOURCE_SIZE, SOURCE_SIZE);
  img.print(font, boldOffset, 0, opts, SOURCE_SIZE, SOURCE_SIZE);
  img.print(font, 0, -boldOffset, opts, SOURCE_SIZE, SOURCE_SIZE);
  img.print(font, 0, boldOffset, opts, SOURCE_SIZE, SOURCE_SIZE);
  return img;
}

async function main() {
  const font128 = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);

  // icon.png — 1024×1024, R at ~55–60%
  const iconR = await renderR(font128, 0x111111ff);
  const icon = iconR.resize(TARGET_ICON, TARGET_ICON, Jimp.RESIZE_BEZIER);
  await icon.writeAsync(path.join(assetsDir, 'icon.png'));
  console.log('Written: apps/mobile/assets/icon.png');

  // adaptive-icon.png — 1024×1024 (transparent background)
  const adaptiveR = await renderR(font128, 0x00000000);
  const adaptiveIcon = adaptiveR.resize(TARGET_ICON, TARGET_ICON, Jimp.RESIZE_BEZIER);
  await adaptiveIcon.writeAsync(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('Written: apps/mobile/assets/adaptive-icon.png');

  // splash.png — 1284×2778
  const splash = new Jimp(1284, 2778, 0x111111ff);
  splash.print(font128, 0, 0, { text: 'Roam', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 1284, 2778);
  await splash.writeAsync(path.join(assetsDir, 'splash.png'));
  console.log('Written: apps/mobile/assets/splash.png');

  // favicon.png — 48×48, R at ~55–60% (scaled from same source)
  const faviconR = await renderR(font128, 0x111111ff);
  const favicon = faviconR.resize(48, 48, Jimp.RESIZE_BEZIER);
  await favicon.writeAsync(path.join(assetsDir, 'favicon.png'));
  console.log('Written: apps/mobile/assets/favicon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
