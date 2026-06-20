#!/usr/bin/env node
/**
 * Screenshot a storefront sub-page, scrolling through first so motion/scroll
 * reveals fire (they don't in a perfectly still headless browser).
 *
 * Usage: node scripts/shot-page.mjs <url> <outfile> [full|viewport]
 */
import { chromium } from '@playwright/test';

const url = process.argv[2];
const out = process.argv[3] ?? 'tmp/hero-frames/page.png';
const mode = process.argv[4] ?? 'full';

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

// Walk down the page to trigger reveals, then back to top.
const height = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < height; y += 500) {
  await page.evaluate((yy) => { window.scrollTo(0, yy); window.dispatchEvent(new Event('scroll')); }, y);
  await page.waitForTimeout(180);
}
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(900);

if (mode === 'full') {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: out, fullPage: true });
} else {
  await page.screenshot({ path: out });
}
await browser.close();
console.log(`saved ${out}`);
