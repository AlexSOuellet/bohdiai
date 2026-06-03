/**
 * shot.mjs — capture screenshots of any local URL with Playwright.
 *
 * Scrolls the page one viewport at a time and shoots each screen, so
 * on-scroll reveals / animations actually fire before capture. Useful for
 * eyeballing brainstorm mockups (companion server) or the real dev server.
 *
 * Usage:
 *   node scripts/shot.mjs <url> [outDir] [--w 1280] [--h 800] [--wait 1200] [--max 8]
 *
 * Output: <outDir>/shot_01.png, shot_02.png, ...  (default outDir: .tmp-shots)
 */
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const url = args[0];
if (!url) {
  console.error('usage: node scripts/shot.mjs <url> [outDir] [--w N --h N --wait ms --max N]');
  process.exit(1);
}
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? Number(args[i + 1]) : def;
};
const outDir = args[1] && !args[1].startsWith('--') ? args[1] : '.tmp-shots';
const W = flag('w', 1280), H = flag('h', 800), WAIT = flag('wait', 1200), MAX = flag('max', 8);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await page.waitForTimeout(WAIT + 800); // let hero load-animation settle

const total = await page.evaluate(() => document.body.scrollHeight);
const steps = Math.min(MAX, Math.max(1, Math.ceil(total / H)));
const pad = (n) => String(n).padStart(2, '0');

for (let i = 0; i < steps; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * H);
  await page.waitForTimeout(WAIT); // let reveals fire
  const file = path.join(outDir, `shot_${pad(i + 1)}.png`);
  await page.screenshot({ path: file });
  console.log(file);
}

await browser.close();
console.log(`done — ${steps} screen(s) in ${outDir}`);
