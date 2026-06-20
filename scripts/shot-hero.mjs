#!/usr/bin/env node
/**
 * Screenshot a live storefront hero as it actually renders — header, wordmark,
 * eyebrow, and the video background composited together — for use as the OG
 * share card. Parks the hero video on a vivid mid-clip frame so the card isn't
 * a near-black opening frame.
 *
 * Usage:
 *   node scripts/shot-hero.mjs <url> [outfile] [videoSeconds]
 *   node scripts/shot-hero.mjs https://soul-splatter.bohdiai.com/ tmp/hero-frames/hero-shot.png 3
 */
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'https://soul-splatter.bohdiai.com/';
const out = process.argv[3] ?? 'tmp/hero-frames/hero-shot.png';
const videoSeconds = Number(process.argv[4] ?? '3');
const settleMs = Number(process.argv[5] ?? '11000');

const browser = await chromium.launch({
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({
  viewport: { width: 1200, height: 630 }, // OG share-card aspect
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

console.log(`loading ${url} …`);
await page.goto(url, { waitUntil: 'domcontentloaded' });

// The hero's eyebrow/brand/CTA are revealed by scroll/motion observers that
// don't fire in a headless browser left perfectly still. Nudge the scroll a few
// times to wake Lenis + IntersectionObserver so the text animates in.
for (let i = 0; i < 5; i++) {
  await page.mouse.wheel(0, 60);
  await page.waitForTimeout(120);
  await page.mouse.wheel(0, -60);
  await page.evaluate(() => { window.scrollTo(0, 0); window.dispatchEvent(new Event('scroll')); });
  await page.waitForTimeout(120);
}

// Let the Moment intro play out and settle on the full resting hero.
await page.waitForTimeout(settleMs);

// Park the background video on a vivid frame instead of its opening (near-black) one.
await page.evaluate((t) => {
  const v = document.querySelector('video');
  if (v) {
    v.pause();
    try { v.currentTime = t; } catch { /* ignore */ }
  }
}, videoSeconds);
await page.waitForTimeout(800);

await page.screenshot({ path: out });
await browser.close();
console.log(`saved ${out}`);
