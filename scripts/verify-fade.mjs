// Throwaway verification: does the moment's last headline actually FADE (opacity
// ramps over ~2.4s) or POP (instant)? Measured in a real browser, both with motion
// normal and with reduced-motion forced. Delete after.
import { chromium } from 'playwright';

const url = 'http://localhost:3000/moment-probe/candles-cinematic';

async function measure(reduced) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(reduced ? { reducedMotion: 'reduce' } : {});
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('[data-stage-reveal]');

  const meta = await page.evaluate(() => {
    const els = [...document.querySelectorAll('[data-stage-reveal]')];
    const el = els[els.length - 1];
    const cs = getComputedStyle(el);
    return { animationDuration: cs.animationDuration, animationName: cs.animationName };
  });

  // Sample the LAST beat (the button, animation-delay ~3.6s) from the Node side
  // every 250ms, so we watch it go from invisible → visible.
  const t0 = Date.now();
  const ramp = [];
  while (Date.now() - t0 < 6500) {
    const op = await page.evaluate(() => {
      const els = [...document.querySelectorAll('[data-stage-reveal]')];
      return Number(getComputedStyle(els[els.length - 1]).opacity).toFixed(2);
    });
    ramp.push([Date.now() - t0, op]);
    await page.waitForTimeout(250);
  }
  await browser.close();
  return { ...meta, ramp };
}

for (const reduced of [false, true]) {
  const r = await measure(reduced);
  console.log(`\n=== ${reduced ? 'REDUCED' : 'NORMAL'} motion ===`);
  console.log('animationDuration:', r.animationDuration, '| name:', r.animationName);
  console.log('opacity (ms → opacity):');
  console.log(r.ramp.map(([t, o]) => `${t}:${o}`).join('  '));
}
