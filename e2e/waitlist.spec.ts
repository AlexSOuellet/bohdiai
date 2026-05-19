import { test, expect } from '@playwright/test';

test.describe('Waitlist form', () => {
  test('submit button is disabled until email is valid', async ({ page }) => {
    await page.goto('/');
    const submit = page.getByRole('button', { name: /claim my founder spot|notify me at launch/i });

    await expect(submit).toBeDisabled();

    const email = page.getByLabel('Email address');
    await email.fill('not-an-email');
    await expect(submit).toBeDisabled();
    await expect(email).toHaveAttribute('aria-invalid', 'true');

    await email.fill('alex@example.com');
    await expect(submit).toBeEnabled();
    await expect(email).toHaveAttribute('aria-invalid', 'false');
  });

  test('successful submit shows the confirmation state', async ({ page }) => {
    await page.route('**/api/waitlist', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, already: false, type: 'founder' }),
      });
    });

    await page.goto('/');
    await page.getByLabel('Email address').fill('alex@example.com');
    await page.getByRole('button', { name: /claim my founder spot|notify me at launch/i }).click();

    await expect(page.getByRole('heading', { name: /almost there/i })).toBeVisible();
    await expect(page.getByText(/check your email to confirm/i)).toBeVisible();
  });

  test('already-registered response shows the "you’re already on the list" state with resend', async ({ page }) => {
    await page.route('**/api/waitlist', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, already: true, type: 'notify' }),
      });
    });

    await page.goto('/');
    await page.getByLabel('Email address').fill('repeat@example.com');
    await page.getByRole('button', { name: /claim my founder spot|notify me at launch/i }).click();

    await expect(page.getByRole('heading', { name: /already on the list/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /resend the confirmation link/i })).toBeVisible();
  });

  test('server error renders the alert message', async ({ page }) => {
    await page.route('**/api/waitlist', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false, message: 'Something went wrong. Please try again.' }),
      });
    });

    await page.goto('/');
    await page.getByLabel('Email address').fill('alex@example.com');
    await page.getByRole('button', { name: /claim my founder spot|notify me at launch/i }).click();

    // Scope to the waitlist section to avoid Next's route announcer (also role=alert).
    await expect(
      page.locator('#waitlist').getByRole('alert'),
    ).toContainText(/something went wrong/i);
  });
});
