#!/usr/bin/env node
/**
 * Burst-screenshot a storefront hero across its intro so we can pick the frame
 * where a given line (e.g. the eyebrow) is on screen. One page load, a shot
 * every interval into tmp/hero-frames/burst-NN.png.
 *
 * Usage: node scripts/shot-hero-burst.mjs <url> [count] [intervalMs]
 */
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'https://soul-splatter.bohdiai.com/';
const count = Number(process.argv[3] ?? '16');
const interval = Number(process.argv[4] ?? '800');

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });

for (let i = 0; i < count; i++) {
  await page.waitForTimeout(interval);
  const n = String(i).padStart(2, '0');
  await page.screenshot({ path: `tmp/hero-frames/burst-${n}.png` });
  const t = ((i + 1) * interval) / 1000;
  console.log(`burst-${n}.png @ ~${t}s`);
}
await browser.close();
