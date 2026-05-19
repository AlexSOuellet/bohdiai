import { test, expect } from '@playwright/test';

test.describe('BrowserDemo storefront rotator', () => {
  test('clicking a dot jumps to that storefront', async ({ page }) => {
    await page.goto('/');

    const sourdoughDot = page.getByRole('button', { name: /show .*sourdough.* storefront/i });
    const tattooDot = page.getByRole('button', { name: /show iron & ash storefront/i });
    const booksDot = page.getByRole('button', { name: /show posy lane books storefront/i });

    await expect(sourdoughDot).toHaveAttribute('aria-pressed', 'true');

    // Dots sit at the bottom of the BrowserDemo block; scroll into view to
    // avoid the next section's overlap intercepting pointer events.
    await booksDot.scrollIntoViewIfNeeded();
    await booksDot.click();
    await expect(booksDot).toHaveAttribute('aria-pressed', 'true');
    await expect(sourdoughDot).toHaveAttribute('aria-pressed', 'false');

    await tattooDot.scrollIntoViewIfNeeded();
    await tattooDot.click();
    await expect(tattooDot).toHaveAttribute('aria-pressed', 'true');
    await expect(booksDot).toHaveAttribute('aria-pressed', 'false');
  });

  test('auto-cycles to the next storefront after the cycle interval', async ({ page }) => {
    await page.goto('/');

    const sourdoughDot = page.getByRole('button', { name: /show .*sourdough.* storefront/i });
    const tattooDot = page.getByRole('button', { name: /show iron & ash storefront/i });

    // Park the mouse far from the demo so hover-pause doesn't kick in.
    await page.mouse.move(0, 0);

    await expect(sourdoughDot).toHaveAttribute('aria-pressed', 'true');

    // CYCLE_MS in BrowserDemo.tsx is 6500. Allow generous slack for slow CI.
    await expect(tattooDot).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
  });
});
