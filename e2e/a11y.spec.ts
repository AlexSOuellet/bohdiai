import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Axe-core accessibility scan against WCAG 2.1 A + AA.
 * Fails on any serious or critical violation.
 *
 * "Best practices" rules are excluded because they're aspirational, not WCAG.
 */
async function scan(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
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

  test('backend sign-in page has no serious or critical violations', async ({ page }) => {
    await page.goto('http://app.localhost:3100/signin');
    const results = await scan(page);
    const blocking = seriousOrCritical(results);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test('backend forgot-password page has no serious or critical violations', async ({ page }) => {
    await page.goto('http://app.localhost:3100/forgot-password');
    const results = await scan(page);
    const blocking = seriousOrCritical(results);
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});
