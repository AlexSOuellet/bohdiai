import { test, expect, type Page } from '@playwright/test';
import { SITE_CONTACT_EMAIL } from '../lib/site/contact';

/**
 * bohdiai.com, the maker site (Session 117): the old arms forward to it, the
 * service page is switched off, Free is priced beside the paid plans, and the
 * question box at the end (on the home page and the questions page) sends.
 * /api/inquiry is stubbed with page.route() so nothing is emailed.
 */

const form = (page: Page) => page.locator('#contact form');
const alertIn = (page: Page) => form(page).getByRole('alert');
const ask = (page: Page) => page.getByRole('button', { name: 'Send my question' });

test.describe('The maker site', () => {
  test('leads with the pitch and the looks, and starts on the sign-up form', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your work online');
    await expect(page.getByRole('heading', { name: 'One shop, every mood' })).toBeVisible();
    await expect(page.locator('#contact a[href="/start"]')).toBeVisible();
  });

  test('shows Free at $0 beside the paid plans, with no button', async ({ page }) => {
    await page.goto('/');
    const free = page.getByRole('article', { name: 'Maker Free' });
    await expect(free).toContainText('$0');
    await expect(free.getByRole('link')).toHaveCount(0);
    await expect(page.getByRole('article', { name: 'Maker Showcase' })).toContainText('$5');
  });

  // makers.localhost and service.localhost can't forward on this computer (Next
  // shortens the redirect to a bare path); lib/site/arms.test.ts covers them.
  test('the service page is switched off: its old address lands on the maker site', async ({ page }) => {
    await page.goto('/contractors');
    await expect(page.getByRole('article', { name: 'Contractor Full' })).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe('/');
    await page.goto('/makers');
    expect(new URL(page.url()).pathname).toBe('/');
  });
});

for (const path of ['/', '/faq']) {
  test.describe(`The question box on ${path}`, () => {
    test('an empty send says what is missing and sends nothing', async ({ page }) => {
      let posted = false;
      await page.route('**/api/inquiry', async (route) => {
        posted = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      });
      await page.goto(path);
      await ask(page).click();
      await expect(alertIn(page)).toHaveText('Please add your name.');
      expect(posted).toBe(false);
    });

    test('a good send goes as a maker question and thanks them', async ({ page }) => {
      let body: unknown = null;
      await page.route('**/api/inquiry', async (route) => {
        body = route.request().postDataJSON();
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      });
      await page.goto(path);
      await page.locator('#qf-name').fill('Jamie Lund');
      await page.locator('#qf-email').fill('jamie@example.com');
      await page.locator('#qf-message').fill('Can I sell candles and soap on one site?');
      await ask(page).click();
      await expect(page.getByText('Thanks, it’s on its way')).toBeVisible();
      expect(body).toMatchObject({ name: 'Jamie Lund', kind: 'maker', contactBy: 'email', message: 'Can I sell candles and soap on one site?' });
    });

    test('a network failure names the email address to use instead', async ({ page }) => {
      await page.route('**/api/inquiry', (route) => route.abort());
      await page.goto(path);
      await page.locator('#qf-name').fill('Jamie Lund');
      await page.locator('#qf-email').fill('jamie@example.com');
      await page.locator('#qf-message').fill('Can I sell candles and soap on one site?');
      await ask(page).click();
      await expect(alertIn(page)).toContainText(SITE_CONTACT_EMAIL);
    });
  });
}
