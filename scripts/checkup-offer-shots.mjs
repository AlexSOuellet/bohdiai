// Captures the raw screens behind the maker checkup's offer-card images:
//   node scripts/checkup-offer-shots.mjs <saltmarsh-preview-token>
// Needs the local dev server on :3000 (the Saltmarsh demo is a draft; the token
// comes from `scripts/site-visibility.ts saltmarsh-and-lace link`).
// Writes PNGs to tmp/offer-shots/. Then run scripts/checkup-offer-compose.mjs.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const token = process.argv[2];
if (!token) throw new Error('usage: checkup-offer-shots.mjs <saltmarsh-preview-token>');

const OUT = path.join(process.cwd(), 'tmp', 'offer-shots');
mkdirSync(OUT, { recursive: true });
const SALT = 'http://saltmarsh-and-lace.localhost:3000';
const MARKET = '84de9791-10f5-40c4-9d5d-96cfd56a701b';
// The Next.js dev badge and the sample banner don't belong in the pictures.
const HIDE = 'nextjs-portal{display:none!important}';

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });

async function shot(context, url, file, clip) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.addStyleTag({ content: HIDE });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(OUT, file), ...(clip ? { clip } : {}) });
  await page.close();
}

const desk = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 };

// Showcase: a live sample showcase site, on a phone and a laptop (below its 48px sample banner).
const showPhone = await browser.newContext(phone);
await shot(showPhone, 'https://rustic-rhody.bohdiai.com', 'showcase-phone.png', { x: 0, y: 48, width: 390, height: 796 });
const showDesk = await browser.newContext(desk);
await shot(showDesk, 'https://rustic-rhody.bohdiai.com', 'showcase-desk.png', { x: 0, y: 48, width: 1440, height: 852 });

// Saltmarsh: open the draft once in each browser, then capture its pages.
const saltDesk = await browser.newContext(desk);
const saltPhone = await browser.newContext(phone);
for (const ctx of [saltDesk, saltPhone]) {
  const p = await ctx.newPage();
  await p.goto(`${SALT}/?preview=${token}`, { waitUntil: 'networkidle', timeout: 60000 });
  await p.close();
}
await shot(saltDesk, `${SALT}/events`, 'salt-markets-desk.png');
await shot(saltDesk, `${SALT}/shop`, 'salt-shop-desk.png');
await shot(saltPhone, `${SALT}/market/${MARKET}`, 'salt-market-phone.png');
await shot(saltPhone, `${SALT}/listings/the-lady-in-amber`, 'salt-product-phone.png');

await browser.close();
process.stdout.write(`saved to ${OUT}\n`);
