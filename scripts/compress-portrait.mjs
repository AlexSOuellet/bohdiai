import sharp from 'sharp';
import { writeFileSync, statSync } from 'node:fs';

const SRC = 'C:/Projects/BohdiAI/public/alex-portrait.png';
const OUT_PNG = 'C:/Projects/BohdiAI/public/alex-portrait.png';
const OUT_WEBP = 'C:/Projects/BohdiAI/public/alex-portrait.webp';

// Original metadata
const img = sharp(SRC);
const meta = await img.metadata();
console.log(
  `Original: ${meta.width}x${meta.height}, ${(statSync(SRC).size / 1024 / 1024).toFixed(2)}MB`,
);

// Target: ~1600px wide max (4:5 portrait = 2000 tall), good for retina display at 50% page width.
// Reduce dimensions while keeping aspect ratio.
const TARGET_WIDTH = 1200;

const webpBuffer = await sharp(SRC)
  .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
  .webp({ quality: 82, effort: 6 })
  .toBuffer();

writeFileSync(OUT_WEBP, webpBuffer);
console.log(`WebP:     ${TARGET_WIDTH}px wide, ${(webpBuffer.length / 1024).toFixed(1)}KB`);

// Also re-encode the PNG smaller as a fallback (some browsers + previews still want PNG)
const pngBuffer = await sharp(SRC)
  .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true })
  .toBuffer();

writeFileSync(OUT_PNG, pngBuffer);
console.log(`PNG opt:  ${TARGET_WIDTH}px wide, ${(pngBuffer.length / 1024).toFixed(1)}KB`);
