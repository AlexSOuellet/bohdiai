import { test, expect, type Page } from '@playwright/test';
import { CLIENTS } from '../lib/site/work';
import { CONTACT_METHOD_LABELS, INQUIRY_KIND_LABELS, PHONE_NEEDED_ERROR } from '../lib/inquiry/request';
import { SITE_CONTACT_EMAIL } from '../lib/site/contact';

/**
 * bohdiai.com, the parent: the work strip links out to every real client, the
 * doors open the two arms, and the "Need something else" box sends. The full
 * project form now lives on the questions page (and the service arm), and is
 * tested there. /api/inquiry is stubbed with page.route() so nothing is emailed.
 */

const PORT = 3100;
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
  test('the client slideshow reaches every client, each with a "Visit the site" link to its real address', async ({ page }) => {
    await page.goto('/');
    for (const [i, client] of CLIENTS.entries()) {
      if (i > 0) await page.getByRole('button', { name: 'Next client' }).click();
      const link = page.getByRole('link', { name: new RegExp(`^Visit the site.*${escape(client.name)}$`) });
      await expect(link).toHaveAttribute('href', client.url);
      await expect(link).toHaveAttribute('target', '_blank');
    }
  });

  test('shows no sample shelf: the samples live on the arms', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#work')).toBeVisible();
    await expect(page.getByText(/sample shops made to show range, not real businesses/i)).toHaveCount(0);
  });
});

test.describe('The doors and the arms', () => {
  test('each door opens its arm on this computer', async ({ page }) => {
    await page.goto('/');
    const doors = page.getByRole('navigation', { name: /choose your path/i });
    await expect(doors.getByRole('link', { name: /I make things/ })).toHaveAttribute('href', `http://makers.localhost:${PORT}`);
    await expect(doors.getByRole('link', { name: /I fix things/ })).toHaveAttribute('href', `http://service.localhost:${PORT}`);
  });

  test('the makers arm leads with the looks and starts on the sign-up form', async ({ page }) => {
    await page.goto(`http://makers.localhost:${PORT}/`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your work online');
    await expect(page.getByRole('heading', { name: 'One shop, every mood' })).toBeVisible();
    await expect(page.locator('#contact a[href="/start"]')).toBeVisible();
  });

  test('the old /makers address moves to the makers arm', async ({ page }) => {
    await page.goto('/makers');
    expect(new URL(page.url()).host).toBe(`makers.localhost:${PORT}`);
  });

  test('the service arm shows its plans and its full form', async ({ page }) => {
    await page.goto(`http://service.localhost:${PORT}/`);
    await expect(page.getByRole('article', { name: 'Contractor Full' })).toBeVisible();
    await expect(page.locator('#iq-name')).toBeVisible();
  });
});

test.describe('Need something else', () => {
  const ask = (page: Page) => page.getByRole('button', { name: /send it to me/i });

  test('an empty send says what is missing and sends nothing', async ({ page }) => {
    let posted = false;
    await page.route('**/api/inquiry', async (route) => {
      posted = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.goto('/');
    await ask(page).click();
    await expect(alertIn(page)).toHaveText('Please add your name.');
    expect(posted).toBe(false);
  });

  test('a good send goes as "something else" and thanks them', async ({ page }) => {
    let body: unknown = null;
    await page.route('**/api/inquiry', async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.goto('/');
    await page.locator('#qf-name').fill('Food Pantry');
    await page.locator('#qf-email').fill('pantry@example.com');
    await page.locator('#qf-message').fill('A site for our food drive.');
    await ask(page).click();
    await expect(page.getByText('Thanks, it’s on its way')).toBeVisible();
    expect(body).toMatchObject({ name: 'Food Pantry', kind: 'other', contactBy: 'email', message: 'A site for our food drive.' });
  });

  test('a network failure names the email address to use instead', async ({ page }) => {
    await page.route('**/api/inquiry', (route) => route.abort());
    await page.goto('/');
    await page.locator('#qf-name').fill('Food Pantry');
    await page.locator('#qf-email').fill('pantry@example.com');
    await page.locator('#qf-message').fill('A site for our food drive.');
    await ask(page).click();
    await expect(alertIn(page)).toContainText(SITE_CONTACT_EMAIL);
  });
});

test.describe('Project form (on the questions page)', () => {
  test('an empty submit says what is missing and sends nothing', async ({ page }) => {
    let posted = false;
    await page.route('**/api/inquiry', async (route) => {
      posted = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.goto('/faq');
    await sendButton(page).click();
    await expect(alertIn(page)).toHaveText('Please add your name.');
    expect(posted).toBe(false);
  });

  test('choosing call without a phone number asks for one', async ({ page }) => {
    await page.goto('/faq');
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
    await page.goto('/faq');
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
    await page.goto('/faq');
    await fillValid(page);
    await sendButton(page).click();
    await expect(alertIn(page)).toHaveText('Too many tries. Please wait a minute.');
  });

  test('a network failure names the email address to use instead', async ({ page }) => {
    await page.route('**/api/inquiry', (route) => route.abort());
    await page.goto('/faq');
    await fillValid(page);
    await sendButton(page).click();
    await expect(alertIn(page)).toContainText(SITE_CONTACT_EMAIL);
  });
});
