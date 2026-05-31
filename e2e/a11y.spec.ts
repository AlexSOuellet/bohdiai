import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Axe-core accessibility scan against WCAG 2.1 A + AA.
 * Fails on any serious or critical violation.
 *
 * "Best practices" rules are excluded because they're aspirational, not WCAG.
 *
 * `.store-frame` (the three demo storefronts inside BrowserDemo) is excluded
 * because those are decorative marketing art with intentionally low-contrast
 * aesthetics — cream-on-cream bakery, kraft-on-kraft kids books — that mirror
 * how those niches actually look in the real world. The content is also
 * `aria-hidden`, so screen readers skip it. Forcing it to WCAG would make
 * the marketing art visually wrong, and the demo's brand name + URL pill
 * outside the frame already meet contrast on their own.
 *
 * The real Phase 1 component variants (tenant-rendered storefronts driven by
 * the per-tenant token schema, Master Spec §6) WILL be scanned in full when
 * they exist — they're not marketing art, they're product surface.
 */
async function scan(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('.store-frame')
    .analyze();
}

function seriousOrCritical(results: Awaited<ReturnType<AxeBuilder['analyze']>>) {
  return results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
}

test.describe('Accessibility (axe-core, WCAG 2.1 A + AA)', () => {
  test('home page has no serious or critical violations', async ({ page }) => {
    await page.goto('/');
    const results = await scan(page);
    const blocking = seriousOrCritical(results);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('privacy page has no serious or critical violations', async ({ page }) => {
    await page.goto('/privacy');
    const results = await scan(page);
    const blocking = seriousOrCritical(results);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('terms page has no serious or critical violations', async ({ page }) => {
    await page.goto('/terms');
    const results = await scan(page);
    const blocking = seriousOrCritical(results);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});
