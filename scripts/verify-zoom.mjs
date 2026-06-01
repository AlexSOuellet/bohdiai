// Throwaway: does the spotlight image actually scale over time? Measure the
// computed transform of the hero <img> once a second in a real browser. Delete after.
import { chromium } from 'playwright';

const url = 'http://localhost:3000/moment-probe/spotlight';

async function measure(reduced) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(reduced ? { reducedMotion: 'reduce' } : {});
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('[data-spotlight-zoom]');
  const samples = [];
  const t0 = Date.now();
  while (Date.now() - t0 < 7000) {
    const info = await page.evaluate(() => {
      const el = document.querySelector('[data-spotlight-zoom]');
      const cs = getComputedStyle(el);
      return { transform: cs.transform, animationName: cs.animationName, animationDuration: cs.animationDuration };
    });
    samples.push([Date.now() - t0, info.transform]);
    if (samples.length === 1) console.log(`  ${reduced ? 'REDUCED' : 'NORMAL'} animationName=${info.animationName} duration=${info.animationDuration}`);
    await page.waitForTimeout(1000);
  }
  await browser.close();
  return samples;
}

for (const reduced of [false, true]) {
  console.log(`=== ${reduced ? 'REDUCED' : 'NORMAL'} motion ===`);
  const s = await measure(reduced);
  for (const [t, tf] of s) console.log(`  ${t}ms: ${tf}`);
}
