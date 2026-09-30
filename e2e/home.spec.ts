import { test, expect, type Page } from '@playwright/test';
import { CLIENTS, SAMPLES } from '../lib/site/work';
import { CONTACT_METHOD_LABELS, INQUIRY_KIND_LABELS, PHONE_NEEDED_ERROR } from '../lib/inquiry/request';
import { SITE_CONTACT_EMAIL } from '../lib/site/contact';

/**
 * bohdiai.com's home page: the work section links out to every real client and
 * sample, and the project form validates, sends, and shows every failure.
 * /api/inquiry is stubbed with page.route() so nothing is emailed.
 */

const form = (page: Page) => page.locator('#contact form');
const alertIn = (page: Page) => form(page).getByRole('alert');
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sendButton = (page: Page) => page.getByRole('button', { name: /send it to me/i });

async function fillValid(page: Page): Promise<void> {
  await page.locator('#iq-name').fill('Test Maker');
  await page.locator('#iq-email').fill('maker@example.com');
  await form(page).getByText(INQUIRY_KIND_LABELS.maker, { exact: true }).click();
  await page.locator('#iq-message').fill('A shop for my candles.');
}

test.describe('Work section', () => {
  test('every client has a "Visit the site" link to its real address', async ({ page }) => {
    await page.goto('/');
    for (const client of CLIENTS) {
      const link = page.getByRole('link', { name: new RegExp(`^Visit the site.*${escape(client.name)}$`) });
      await expect(link).toHaveAttribute('href', client.url);
      await expect(link).toHaveAttribute('target', '_blank');
    }
  });

  test('every sample links to its shop and is labelled as a sample', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/sample shops made to show range, not real businesses/i)).toBeVisible();
    for (const sample of SAMPLES) {
      await expect(page.locator(`#work a[href="${sample.url}"]`)).toContainText(sample.name);
    }
  });
});

test.describe('Project form', () => {
  test('an empty submit says what is missing and sends nothing', async ({ page }) => {
    let posted = false;
    await page.route('**/api/inquiry', async (route) => {
      posted = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.goto('/');
    await sendButton(page).click();
    await expect(alertIn(page)).toHaveText('Please add your name.');
    expect(posted).toBe(false);
  });

  test('choosing call without a phone number asks for one', async ({ page }) => {
    await page.goto('/');
    await fillValid(page);
    await form(page).getByText(CONTACT_METHOD_LABELS.call, { exact: true }).click();
    await sendButton(page).click();
    await expect(alertIn(page)).toHaveText(PHONE_NEEDED_ERROR);
  });

  test('a good submit posts the fields and shows the thank-you', async ({ page }) => {
    let body: unknown = null;
    await page.route('**/api/inquiry', async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.goto('/');
    await fillValid(page);
    await sendButton(page).click();
    await expect(page.getByText('Thanks, it’s on its way')).toBeVisible();
    expect(body).toMatchObject({
      name: 'Test Maker',
      email: 'maker@example.com',
      kind: 'maker',
      contactBy: 'email',
      message: 'A shop for my candles.',
    });
  });

  test('a server refusal shows the server’s message', async ({ page }) => {
    await page.route('**/api/inquiry', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too many tries. Please wait a minute.' }),
      });
    });
    await page.goto('/');
    await fillValid(page);
    await sendButton(page).click();
    await expect(alertIn(page)).toHaveText('Too many tries. Please wait a minute.');
  });

  test('a network failure names the email address to use instead', async ({ page }) => {
    await page.route('**/api/inquiry', (route) => route.abort());
    await page.goto('/');
    await fillValid(page);
    await sendButton(page).click();
    await expect(alertIn(page)).toContainText(SITE_CONTACT_EMAIL);
  });
});
