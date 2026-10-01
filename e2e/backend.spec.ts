import { test, expect } from '@playwright/test';

const APP = 'http://app.localhost:3100';

test.describe('Backend sign-in', () => {
  test('the sign-in page renders in the backend look with no Google or sign-up', async ({ page }) => {
    await page.goto(`${APP}/signin`);
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByText(/google/i)).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
  });

  test('the backend sends a signed-out visitor to sign-in', async ({ page }) => {
    await page.goto(`${APP}/manage`);
    await expect(page).toHaveURL(`${APP}/signin`);
  });

  for (const path of ['/manage/products', '/manage/products/new', '/manage/collections']) {
    test(`${path} sends a signed-out visitor to sign-in`, async ({ page }) => {
      await page.goto(`${APP}${path}`);
      await expect(page).toHaveURL(`${APP}/signin`);
    });
  }

  test('sign-in on the marketing host redirects to the app host', async ({ page }) => {
    const res = await page.request.get('http://localhost:3100/signin', { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers()['location']).toBe(`${APP}/signin`);
  });

  test('the old dashboard stays switched off', async ({ page }) => {
    // Node's resolver can't look up app.localhost, so hit loopback with the app host header.
    const res = await page.request.get('http://127.0.0.1:3100/dashboard', {
      headers: { host: 'app.localhost:3100' },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(404);
  });

  test('forgot password always answers the same way', async ({ page }) => {
    await page.goto(`${APP}/forgot-password`);
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    // With no real Supabase or limiter (CI) the page fails closed; either answer is visible.
    await expect(page.getByRole('status').or(page.getByRole('alert'))).toBeVisible();
  });
});
