// Lays the raw screens from checkup-offer-shots.mjs into the three offer-card images
// (a laptop with a phone in front, on the checkup's ember background):
//   node scripts/checkup-offer-compose.mjs
// Writes public/checkup/offer-<showcase|market|full_shop>.webp. Look at each one after.
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const SHOTS = path.join(process.cwd(), 'tmp', 'offer-shots');
const OUT = path.join(process.cwd(), 'public', 'checkup');
mkdirSync(OUT, { recursive: true });

const dataUrl = (file) => `data:image/png;base64,${readFileSync(path.join(SHOTS, file)).toString('base64')}`;

const IMAGES = [
  { offer: 'showcase', desk: 'showcase-desk.png', phone: 'showcase-phone.png' },
  { offer: 'market', desk: 'salt-markets-desk.png', phone: 'salt-market-phone.png' },
  { offer: 'full_shop', desk: 'salt-shop-desk.png', phone: 'salt-product-phone.png' },
];

const W = 1200;
const H = 750;

const page = (desk, phone) => `<!doctype html><html><head><style>
  *{box-sizing:border-box;margin:0}
  body{width:${W}px;height:${H}px;overflow:hidden;
    background:
      radial-gradient(70% 60% at 50% 100%, rgba(243,201,122,.30), rgba(233,161,61,.10) 45%, transparent 75%),
      radial-gradient(90% 70% at 20% 0%, rgba(201,131,30,.14), transparent 60%),
      #0a0805}
  .laptop{position:absolute;left:70px;top:70px;width:860px}
  .lid{background:#1a1612;border-radius:18px 18px 6px 6px;padding:18px 18px 22px;
    box-shadow:0 40px 80px -30px rgba(0,0,0,.9),0 0 0 1px rgba(243,201,122,.18) inset}
  .lid img{display:block;width:100%;aspect-ratio:1440/900;object-fit:cover;object-position:top;border-radius:4px}
  .base{height:20px;margin:0 -46px;background:linear-gradient(180deg,#2a241d,#14110d);border-radius:0 0 22px 22px;
    box-shadow:0 30px 50px -20px rgba(0,0,0,.9)}
  .base:after{content:'';display:block;width:150px;height:8px;margin:0 auto;background:#0d0b08;border-radius:0 0 10px 10px}
  .phone{position:absolute;right:80px;bottom:40px;width:250px;padding:10px;background:#120f0c;border-radius:40px;
    box-shadow:0 50px 90px -30px rgba(0,0,0,.95),0 0 0 1.5px rgba(243,201,122,.25) inset;transform:rotate(3deg)}
  .phone img{display:block;width:100%;aspect-ratio:390/796;object-fit:cover;object-position:top;border-radius:31px}
  .phone:before{content:'';position:absolute;top:18px;left:50%;width:70px;height:18px;margin-left:-35px;background:#120f0c;border-radius:12px;z-index:1}
</style></head><body>
  <div class="laptop"><div class="lid"><img src="${desk}"></div><div class="base"></div></div>
  <div class="phone"><img src="${phone}"></div>
</body></html>`;

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
for (const img of IMAGES) {
  const p = await ctx.newPage();
  await p.setContent(page(dataUrl(img.desk), dataUrl(img.phone)), { waitUntil: 'load' });
  const png = await p.screenshot();
  await sharp(png).resize(W, H).webp({ quality: 82 }).toFile(path.join(OUT, `offer-${img.offer}.webp`));
  await p.close();
}
await browser.close();
process.stdout.write(`saved to ${OUT}\n`);
