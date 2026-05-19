// Rasterize app/icon.svg → 32x32 PNG → wrap in ICO header → app/favicon.ico.
// sharp can't write .ico directly, so we wrap the PNG bytes in a minimal
// ICONDIR + ICONDIRENTRY (22 bytes total) ourselves. Modern browsers also
// honor app/icon.svg; this exists for legacy clients and to close the
// /favicon.ico 404 that costs us a Lighthouse Best Practices point.
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SVG = path.join(ROOT, 'app', 'icon.svg');
const OUT = path.join(ROOT, 'app', 'favicon.ico');

const png = await sharp(SVG).resize(32, 32).png().toBuffer();

const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);            // reserved
header.writeUInt16LE(1, 2);            // type: 1 = ICO
header.writeUInt16LE(1, 4);            // image count
header.writeUInt8(32, 6);              // width
header.writeUInt8(32, 7);              // height
header.writeUInt8(0, 8);               // color palette
header.writeUInt8(0, 9);               // reserved
header.writeUInt16LE(1, 10);           // color planes
header.writeUInt16LE(32, 12);          // bits per pixel
header.writeUInt32LE(png.length, 14);  // image size in bytes
header.writeUInt32LE(22, 18);          // offset to image data

await fs.writeFile(OUT, Buffer.concat([header, png]));
console.log(`Wrote ${OUT} (${header.length + png.length} bytes)`);
