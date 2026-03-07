// Re-run: node apps/mobile/scripts/generate-assets.js
// Requires: jimp ^0.22.12 (devDependency in apps/mobile/package.json)
// Fallback: if node-canvas cannot install (native deps), swap to `jimp` or raw PNG encoding
// (Using jimp — node-canvas requires Visual Studio on Windows)

const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

async function main() {
  // icon.png — 1024×1024
  const icon = new Jimp(1024, 1024, 0x111111ff);
  const font128 = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
  icon.print(font128, 0, 0, { text: 'R', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 1024, 1024);
  await icon.writeAsync(path.join(assetsDir, 'icon.png'));
  console.log('Written: apps/mobile/assets/icon.png');

  // adaptive-icon.png — 1024×1024 (transparent background)
  const adaptiveIcon = new Jimp(1024, 1024, 0x00000000);
  adaptiveIcon.print(font128, 0, 0, { text: 'R', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 1024, 1024);
  await adaptiveIcon.writeAsync(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('Written: apps/mobile/assets/adaptive-icon.png');

  // splash.png — 1284×2778
  const splash = new Jimp(1284, 2778, 0x111111ff);
  splash.print(font128, 0, 0, { text: 'Roam', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 1284, 2778);
  await splash.writeAsync(path.join(assetsDir, 'splash.png'));
  console.log('Written: apps/mobile/assets/splash.png');

  // favicon.png — 48×48
  const font32 = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const favicon = new Jimp(48, 48, 0x111111ff);
  favicon.print(font32, 0, 0, { text: 'R', alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 48, 48);
  await favicon.writeAsync(path.join(assetsDir, 'favicon.png'));
  console.log('Written: apps/mobile/assets/favicon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
