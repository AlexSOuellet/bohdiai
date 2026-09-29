# bohdiai.com Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn bohdiai.com from a waitlist for an AI store builder into a web developer's site for makers, contractors and charities. It shows real work and ends in a contact form.

**Architecture:** Same Next.js app, same `Scene` atmosphere and Tailwind tokens, with the content swapped. One data module (`lib/site/work.ts`) feeds both the hero browser and the work section. The contact form posts JSON to a new `/api/inquiry` route that follows the estimate-route pattern: the rate limiter first, a pure parse/compose module, and a Resend send with the sender as Reply-To. The whole waitlist stack is deleted.

**Tech Stack:** Next.js 16 App Router, Tailwind, zod, Resend, the Workers Rate Limiting binding, vitest + Testing Library, headless Chrome + sharp (dev-only) for screenshots.

**Spec:** `docs/superpowers/specs/2026-09-29-bohdiai-com-rebuild-design.md`

**House rules that apply here:** no inline `style` props (Tailwind classes and CSS only); every failure path shows the visitor something; tests are part of done; **visual tasks are not committed until Alex has seen the running page**. Non-visual tasks commit as they land. Branch: `site/bohdiai-com-rebuild`.

---

## File map

| File | Responsibility |
|---|---|
| `lib/site/contact.ts` (new) | `SITE_CONTACT_EMAIL`, the one place the address lives |
| `lib/site/work.ts` (new) + test | The five sites: name, url, host, client/sample, category, blurb, features, screenshot path |
| `scripts/capture-work-shots.mjs` (new) | Re-captures `public/work/*.webp` with headless Chrome + sharp |
| `public/work/*.webp` (new) | The five screenshots |
| `lib/inquiry/request.ts` (new) + test | Pure: `parseInquiry(json)` and `composeInquiryEmail(fields)` |
| `app/api/inquiry/route.ts` (new) + test | Limiter → parse → send → `{ok:true}` / `{error}` |
| `lib/forms/rate-limit.ts` | `FormName` gains `'inquiry'`, loses the waitlist names |
| `components/InquiryForm.tsx` (new) + test | The client form with every status visible |
| `components/Contact.tsx` (new) | Section: price promises + `InquiryForm` |
| `components/WorkBrowser.tsx` (new) + test | Hero browser cycling real screenshots (replaces `BrowserDemo`) |
| `components/Work.tsx` (new) | Client spreads + samples shelf |
| `components/Hero.tsx`, `TradesMarquee.tsx`, `HowItWorks.tsx`, `Pledge.tsx`, `Header.tsx`, `Footer.tsx` | Rewritten content in the same look |
| `app/page.tsx` + `app/page.test.tsx` (new) | Assembly, JSON-LD, render test |
| `app/layout.tsx` | Metadata; drop storefront-only fonts |
| `app/opengraph-image.tsx` | New share image |
| `app/privacy/page.tsx`, `app/terms/page.tsx` | Contact-form wording instead of waitlist |
| **Deleted** | `components/{Waitlist,Community,BrowserDemo,Rotator}.tsx`, `components/storefronts/`, storefront CSS in `globals.css`, `app/api/waitlist/`, `app/confirm/`, `app/confirmed/`, `lib/emails.ts`, `waitlistSchema`, `FOUNDER_CAP` |

---

### Task 1: Site constants and the work list

**Files:** Create `lib/site/contact.ts`, `lib/site/work.ts`, `lib/site/work.test.ts`

- [ ] **Step 1: Write the failing test** — `lib/site/work.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { WORK, CLIENTS, SAMPLES } from './work';

describe('the work list', () => {
  it('has two clients then three samples', () => {
    expect(CLIENTS.map((w) => w.name)).toEqual(['Cut-Pro Lawncare & Construction', 'Decoupage Digital Designs']);
    expect(SAMPLES.map((w) => w.name)).toEqual(['Classic Loafs', 'Twilight to Darkness', 'Heavenly Scents']);
    expect(WORK).toEqual([...CLIENTS, ...SAMPLES]);
  });

  it('gives every site an https url whose host is what the address bar shows', () => {
    for (const w of WORK) {
      expect(new URL(w.url).protocol).toBe('https:');
      expect(new URL(w.url).host).toBe(w.host);
    }
  });

  it('has a screenshot on disk for every site', () => {
    for (const w of WORK) expect(existsSync(path.join(process.cwd(), 'public', w.shot))).toBe(true);
  });

  it('never mentions follower counts', () => {
    for (const w of WORK) expect(w.blurb).not.toMatch(/follower|thousand|\d+k/i);
  });
});
```

- [ ] **Step 2: Run** `npx vitest run lib/site/work.test.ts`. Expect FAIL (module not found).

- [ ] **Step 3: Implement**

`lib/site/contact.ts`:
```ts
/** Where bohdiai.com's own contact form and footer point. Forwards to Alex. */
export const SITE_CONTACT_EMAIL = 'alex@bohdiai.com';
```

`lib/site/work.ts`:
```ts
/**
 * The sites bohdiai.com shows: real clients first, then labelled samples.
 * One list feeds the hero browser and the work section, so they can't drift.
 * Screenshots live in public/work/ — re-capture with scripts/capture-work-shots.mjs.
 */
export type WorkKind = 'client' | 'sample';

export type WorkEntry = {
  slug: string;
  name: string;
  url: string;
  host: string;
  kind: WorkKind;
  /** "Contractor", "Maker", or the sample's look ("Cozy"). */
  category: string;
  blurb: string;
  features: readonly string[];
  /** Path under public/. */
  shot: string;
};

export const CLIENTS: readonly WorkEntry[] = [
  {
    slug: 'cut-pro-lawncare',
    name: 'Cut-Pro Lawncare & Construction',
    url: 'https://cut-pro-lawncare.bohdiai.com',
    host: 'cut-pro-lawncare.bohdiai.com',
    kind: 'client',
    category: 'Contractor',
    blurb:
      'Sod, grading and drainage across Rhode Island, Massachusetts and Connecticut. A bold one-page site built around their own job photos, with an estimate form that lets customers send pictures of their yard.',
    features: ['One-page site', 'Job photos & video', 'Estimate form with photos'],
    shot: '/work/cut-pro-lawncare.webp',
  },
  {
    slug: 'decodigitaldesigns',
    name: 'Decoupage Digital Designs',
    url: 'https://decodigitaldesigns.com',
    host: 'decodigitaldesigns.com',
    kind: 'client',
    category: 'Maker',
    blurb:
      'Penny’s decoupage designs, in a full online shop with collections, a gallery, a cart and checkout, on her own domain.',
    features: ['Online shop', 'Collections & gallery', 'Own domain'],
    shot: '/work/decodigitaldesigns.webp',
  },
];

export const SAMPLES: readonly WorkEntry[] = [
  {
    slug: 'classic-loafs',
    name: 'Classic Loafs',
    url: 'https://classic-loafs.bohdiai.com',
    host: 'classic-loafs.bohdiai.com',
    kind: 'sample',
    category: 'Cozy',
    blurb: 'A small-town bakery',
    features: [],
    shot: '/work/classic-loafs.webp',
  },
  {
    slug: 'twilight-to-darkness',
    name: 'Twilight to Darkness',
    url: 'https://twilight-to-darkness.bohdiai.com',
    host: 'twilight-to-darkness.bohdiai.com',
    kind: 'sample',
    category: 'Dark',
    blurb: 'Hand-poured candles',
    features: [],
    shot: '/work/twilight-to-darkness.webp',
  },
  {
    slug: 'heavenly-scents',
    name: 'Heavenly Scents',
    url: 'https://heavenly-scents.bohdiai.com',
    host: 'heavenly-scents.bohdiai.com',
    kind: 'sample',
    category: 'Modern',
    blurb: 'A floral studio',
    features: [],
    shot: '/work/heavenly-scents.webp',
  },
];

export const WORK: readonly WorkEntry[] = [...CLIENTS, ...SAMPLES];
```

- [ ] **Step 4: Run the test.** The first three cases PASS; the screenshot case FAILS until Task 2. That's expected, so leave it failing and go straight to Task 2 before committing.

### Task 2: Screenshots

**Files:** Create `scripts/capture-work-shots.mjs`, `public/work/*.webp`

- [ ] **Step 1: Write the script**

```js
// Re-capture the bohdiai.com work screenshots: node scripts/capture-work-shots.mjs [slug]
// Headless Chrome at 1440x900, cropped to the top 1440x760 (above cookie banners), saved as WebP.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const SITES = {
  'cut-pro-lawncare': 'https://cut-pro-lawncare.bohdiai.com',
  decodigitaldesigns: 'https://decodigitaldesigns.com',
  'classic-loafs': 'https://classic-loafs.bohdiai.com',
  'twilight-to-darkness': 'https://twilight-to-darkness.bohdiai.com',
  'heavenly-scents': 'https://heavenly-scents.bohdiai.com',
};
const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
].find((p) => p && existsSync(p));
if (!CHROME) throw new Error('Chrome not found; set CHROME_PATH');

const only = process.argv[2];
const work = mkdtempSync(path.join(tmpdir(), 'shots-'));
for (const [slug, url] of Object.entries(SITES)) {
  if (only && only !== slug) continue;
  const png = path.join(work, `${slug}.png`);
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1440,900',
    '--virtual-time-budget=8000', `--user-data-dir=${path.join(work, 'profile')}`,
    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
    `--screenshot=${png}`, url,
  ], { stdio: 'ignore' });
  await sharp(png).extract({ left: 0, top: 0, width: 1440, height: 760 }).webp({ quality: 80 })
    .toFile(path.join('public', 'work', `${slug}.webp`));
  console.log(`captured ${slug}`);
}
rmSync(work, { recursive: true, force: true });
```

- [ ] **Step 2: Run** `mkdir -p public/work && node scripts/capture-work-shots.mjs`. Expect "captured …" ×5.
- [ ] **Step 3: Look at all five images** (Read each). Each one must show that site's real hero, with no cookie banner or blank reveal-hidden sections. Classic Loafs gets re-captured after its cleanup (Task 15).
- [ ] **Step 4: Run** `npx vitest run lib/site/work.test.ts`. Expect PASS.
- [ ] **Step 5: Commit** `git add lib/site scripts/capture-work-shots.mjs public/work && git commit -m "feat(site): work list + screenshots for bohdiai.com"`

### Task 3: Inquiry parse + compose (pure)

**Files:** Create `lib/inquiry/request.ts`, `lib/inquiry/request.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { parseInquiry, composeInquiryEmail } from './request';

const good = { name: 'Pat Doe', email: 'pat@example.com', kind: 'maker', message: 'I make candles and need a shop.', link: 'https://instagram.com/pat' };

describe('parseInquiry', () => {
  it('treats a filled honeypot as spam', () => {
    expect(parseInquiry({ ...good, company: 'ACME' })).toEqual({ kind: 'spam' });
  });
  it('rejects a body that is not an object', () => {
    expect(parseInquiry(null).kind).toBe('invalid');
    expect(parseInquiry('hi').kind).toBe('invalid');
  });
  it('requires name, a valid email, a kind and a message', () => {
    expect(parseInquiry({ ...good, name: ' ' })).toEqual({ kind: 'invalid', error: 'Please add your name.' });
    expect(parseInquiry({ ...good, email: 'nope' })).toEqual({ kind: 'invalid', error: 'That email doesn’t look right.' });
    expect(parseInquiry({ ...good, kind: 'plumber' })).toEqual({ kind: 'invalid', error: 'Pick what kind of business you are.' });
    expect(parseInquiry({ ...good, message: '' })).toEqual({ kind: 'invalid', error: 'Tell me a little about what you need.' });
  });
  it('caps lengths', () => {
    expect(parseInquiry({ ...good, message: 'x'.repeat(5001) }).kind).toBe('invalid');
  });
  it('accepts a link without a scheme and drops a blank one', () => {
    const a = parseInquiry({ ...good, link: 'facebook.com/pats-candles' });
    expect(a.kind === 'ok' && a.fields.link).toBe('https://facebook.com/pats-candles');
    const b = parseInquiry({ ...good, link: '  ' });
    expect(b.kind === 'ok' && b.fields.link).toBeUndefined();
  });
  it('rejects a link that is not http(s)', () => {
    expect(parseInquiry({ ...good, link: 'javascript:alert(1)' })).toEqual({ kind: 'invalid', error: 'That link doesn’t look right.' });
  });
});

describe('composeInquiryEmail', () => {
  it('labels every answer and names the kind of business in the subject', () => {
    const r = parseInquiry(good);
    if (r.kind !== 'ok') throw new Error('expected ok');
    const e = composeInquiryEmail(r.fields);
    expect(e.subject).toBe('New project: Pat Doe (Maker)');
    expect(e.text).toContain('Email: pat@example.com');
    expect(e.text).toContain('Link: https://instagram.com/pat');
    expect(e.text).toContain('I make candles and need a shop.');
  });
  it('escapes what the visitor typed in the html', () => {
    const r = parseInquiry({ ...good, name: '<b>Pat</b>', message: '<script>x</script>' });
    if (r.kind !== 'ok') throw new Error('expected ok');
    const { html } = composeInquiryEmail(r.fields);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;b&gt;Pat&lt;/b&gt;');
  });
});
```

- [ ] **Step 2: Run** `npx vitest run lib/inquiry`. Expect FAIL (module not found).
- [ ] **Step 3: Implement** `lib/inquiry/request.ts`

```ts
/**
 * bohdiai.com project inquiries — parse the JSON the contact form posts and
 * compose the email Alex receives. Pure: no IO. The route (app/api/inquiry)
 * does the limiting and the send.
 */
import { z } from 'zod';

export const INQUIRY_KINDS = ['maker', 'service', 'charity', 'other'] as const;
export type InquiryKind = (typeof INQUIRY_KINDS)[number];
export const INQUIRY_KIND_LABELS: Record<InquiryKind, string> = {
  maker: 'Maker',
  service: 'Service business',
  charity: 'Charity or cause',
  other: 'Something else',
};

const link = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v === undefined || v === '' ? undefined : /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`))
  .refine((v) => {
    if (v === undefined) return true;
    try {
      const u = new URL(v);
      return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.');
    } catch {
      return false;
    }
  }, 'That link doesn’t look right.');

export const InquirySchema = z.object({
  name: z.string().trim().min(1, 'Please add your name.').max(120),
  email: z.string().trim().toLowerCase().max(254).email('That email doesn’t look right.'),
  kind: z.enum(INQUIRY_KINDS, { errorMap: () => ({ message: 'Pick what kind of business you are.' }) }),
  message: z.string().trim().min(1, 'Tell me a little about what you need.').max(5000),
  link,
});

export type InquiryFields = z.infer<typeof InquirySchema>;
export type ParsedInquiry = { kind: 'spam' } | { kind: 'invalid'; error: string } | { kind: 'ok'; fields: InquiryFields };

/** A filled honeypot (`company`) is a bot: the caller answers "ok" and sends nothing. */
export function parseInquiry(body: unknown): ParsedInquiry {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return { kind: 'invalid', error: 'Please check the form.' };
  const record = body as Record<string, unknown>;
  const honeypot = record['company'];
  if (typeof honeypot === 'string' && honeypot.trim() !== '') return { kind: 'spam' };
  const parsed = InquirySchema.safeParse({
    name: record['name'] ?? '',
    email: record['email'] ?? '',
    kind: record['kind'],
    message: record['message'] ?? '',
    link: record['link'],
  });
  if (!parsed.success) return { kind: 'invalid', error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  return { kind: 'ok', fields: parsed.data };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The email Alex gets: every answer labelled, readable on a phone. Reply goes to the visitor (set by the route). */
export function composeInquiryEmail(f: InquiryFields): { subject: string; text: string; html: string } {
  const kind = INQUIRY_KIND_LABELS[f.kind];
  const subject = `New project: ${f.name} (${kind})`;
  const rows: Array<[string, string]> = [
    ['Name', f.name],
    ['Email', f.email],
    ['Business', kind],
    ['Link', f.link ?? '—'],
  ];
  const text = ['New project inquiry from bohdiai.com.', '', ...rows.map(([k, v]) => `${k}: ${v}`), '', 'What they need:', f.message].join('\n');
  const html = `
    <p>New project inquiry from bohdiai.com.</p>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows.map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v)}</td></tr>`).join('')}
    </table>
    <p><strong>What they need:</strong><br />${escapeHtml(f.message).replace(/\n/g, '<br />')}</p>
  `;
  return { subject, text, html };
}
```
(The `style` attribute here is inside an email body string, not a React inline style. Email clients need it, and the estimate email does the same.)

- [ ] **Step 4: Run** `npx vitest run lib/inquiry`. Expect PASS. If the installed zod's `z.enum` signature rejects `errorMap`, check `node_modules/zod/package.json` for the version and use that version's custom-message form (`{ message }` on v4).
- [ ] **Step 5: Commit** `git add lib/inquiry && git commit -m "feat(inquiry): parse + compose bohdiai.com project inquiries"`

### Task 4: `/api/inquiry` route

**Files:** Create `app/api/inquiry/route.ts`, `app/api/inquiry/route.test.ts`; Modify `lib/forms/rate-limit.ts:4`, `app/api/form-limits.test.ts`

- [ ] **Step 1: Write the failing test** — `app/api/inquiry/route.test.ts`

```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.fn();
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/resend', () => ({ resend: () => ({ emails: { send } }), fromEmail: () => 'BohdiAI <site@example.com>' }));
const formLimitResponse = vi.fn();
vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: (...a: unknown[]) => formLimitResponse(...a) }));

const { POST } = await import('./route');

const good = { name: 'Pat', email: 'pat@example.com', kind: 'charity', message: 'We run a dog rescue.' };
const post = (body: unknown) =>
  POST(new Request('https://bohdiai.com/api/inquiry', { method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) }));

describe('POST /api/inquiry', () => {
  beforeEach(() => {
    send.mockReset().mockResolvedValue({ data: { id: 'e1' }, error: null });
    formLimitResponse.mockReset().mockResolvedValue(null);
  });

  it('emails Alex with the visitor as reply-to', async () => {
    const res = await post(good);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const msg = send.mock.calls[0]?.[0] as { to: string; replyTo: string; subject: string };
    expect(msg.to).toBe('alex@bohdiai.com');
    expect(msg.replyTo).toBe('pat@example.com');
    expect(msg.subject).toBe('New project: Pat (Charity or cause)');
  });

  it('answers ok to a bot and sends nothing', async () => {
    expect((await post({ ...good, company: 'x' })).status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it('returns the first problem for a bad form', async () => {
    const res = await post({ ...good, email: 'nope' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'That email doesn’t look right.' });
  });

  it('rejects a body that is not JSON', async () => {
    expect((await post('not json')).status).toBe(400);
  });

  it('reports a failed send with the address to write to instead', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'domain not verified' } });
    const a = await post(good);
    expect(a.status).toBe(502);
    expect(((await a.json()) as { error: string }).error).toContain('alex@bohdiai.com');
    send.mockRejectedValue(new Error('network'));
    expect((await post(good)).status).toBe(502);
  });
});
```

Add to the `ROUTES` array in `app/api/form-limits.test.ts`:
```ts
  { name: 'inquiry', load: () => import('./inquiry/route'), shape: { error: 'slow down' } },
```

- [ ] **Step 2: Run** `npx vitest run app/api/inquiry app/api/form-limits.test.ts`. Expect FAIL (module not found).
- [ ] **Step 3: Implement**

`lib/forms/rate-limit.ts:4`:
```ts
export type FormName = 'estimate' | 'contact' | 'inquiry' | 'waitlist' | 'waitlist-resend' | 'notify-interest';
```
(The waitlist names come out in Task 11.)

`app/api/inquiry/route.ts`:
```ts
import { NextResponse } from 'next/server';
import { resend, fromEmail } from '@/lib/resend';
import { logger } from '@/lib/logger';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { parseInquiry, composeInquiryEmail } from '@/lib/inquiry/request';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SEND_FAILED = `That didn’t send. Please try again, or email me at ${SITE_CONTACT_EMAIL}.`;

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    logger.error('inquiry route fatal', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: SEND_FAILED }, { status: 500 });
  }
}

async function handle(req: Request) {
  const turnedAway = await formLimitResponse(req, 'inquiry', (message) => ({ error: message }));
  if (turnedAway !== null) return turnedAway;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'That didn’t come through. Please try again.' }, { status: 400 });
  }

  const parsed = parseInquiry(body);
  if (parsed.kind === 'spam') return NextResponse.json({ ok: true });
  if (parsed.kind === 'invalid') return NextResponse.json({ error: parsed.error }, { status: 400 });

  const email = composeInquiryEmail(parsed.fields);
  try {
    const result = await resend().emails.send({
      from: fromEmail(),
      to: SITE_CONTACT_EMAIL,
      replyTo: parsed.fields.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    if (result.error) {
      logger.error('inquiry: resend send error', { error: result.error.message });
      return NextResponse.json({ error: SEND_FAILED }, { status: 502 });
    }
  } catch (err) {
    logger.error('inquiry: resend fatal', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: SEND_FAILED }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run** `npx vitest run app/api/inquiry app/api/form-limits.test.ts lib/forms`. Expect PASS.
- [ ] **Step 5: Commit** `git add app/api/inquiry app/api/form-limits.test.ts lib/forms/rate-limit.ts && git commit -m "feat(inquiry): /api/inquiry sends project inquiries to Alex"`

### Task 5: InquiryForm component

**Files:** Create `components/InquiryForm.tsx`, `components/InquiryForm.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InquiryForm } from './InquiryForm';

const fetchMock = vi.fn();
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

async function fill() {
  const u = userEvent.setup();
  await u.type(screen.getByLabelText(/your name/i), 'Pat');
  await u.type(screen.getByLabelText(/email/i), 'pat@example.com');
  await u.click(screen.getByLabelText(/charity/i));
  await u.type(screen.getByLabelText(/what do you need/i), 'A donate page');
  await u.click(screen.getByRole('button', { name: /send/i }));
}

describe('InquiryForm', () => {
  it('posts JSON and shows the thank-you', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    render(<InquiryForm />);
    await fill();
    expect(await screen.findByRole('status')).toHaveTextContent(/thanks/i);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/inquiry');
    expect(JSON.parse(String(init.body))).toMatchObject({ name: 'Pat', email: 'pat@example.com', kind: 'charity', message: 'A donate page' });
  });

  it('shows a missing-field problem without sending', async () => {
    render(<InquiryForm />);
    await userEvent.setup().click(screen.getByRole('button', { name: /send/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/name/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the server’s message when it refuses', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'Please wait a minute and try again.' }), { status: 429 }));
    render(<InquiryForm />);
    await fill();
    expect(await screen.findByRole('alert')).toHaveTextContent('Please wait a minute and try again.');
  });

  it('shows the email fallback when the network fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'));
    render(<InquiryForm />);
    await fill();
    expect(await screen.findByRole('alert')).toHaveTextContent('alex@bohdiai.com');
  });
});
```

- [ ] **Step 2: Run** `npx vitest run components/InquiryForm.test.tsx`. Expect FAIL.
- [ ] **Step 3: Implement** `components/InquiryForm.tsx`: a `'use client'` form in the site's look (dark inputs on `bg-white/[0.03]`, `border-white/10`, honey focus ring, pill submit in `bg-text text-bg`), styled with Tailwind classes only. Fields: name (`autoComplete="name"`), email, a radio group "What kind of business?" with the four `INQUIRY_KIND_LABELS`, textarea "What do you need?", optional "Link to your Facebook, Instagram or current site", and a hidden honeypot `company` (visually hidden wrapper, `tabIndex={-1}`, `aria-hidden`). The `Status` union is `idle | sending | sent | error(message)`. The client check mirrors the server's required fields and messages. Submit does `fetch('/api/inquiry', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(fields) })`. `res.ok` → sent. Otherwise it reads `{error}` and falls back to `Something went wrong. Please try again, or email me at ${SITE_CONTACT_EMAIL}.`, and a thrown fetch gets the same fallback. Errors render in `role="alert"`, and the thank-you renders in `role="status"` ("Thanks, I’ll be in touch within a couple of days") with a "Send another" button. The button is disabled with the text "Sending…" while sending.
- [ ] **Step 4: Run** the test. Expect PASS.
- [ ] **Step 5: Commit** `git add components/InquiryForm.* && git commit -m "feat(site): inquiry form with every status visible"`

### Task 6: Hero + WorkBrowser (visual — no commit until Alex has seen it)

**Files:** Create `components/WorkBrowser.tsx`, `components/WorkBrowser.test.tsx`; Modify `components/Hero.tsx`, `tailwind.config.ts` (a `shot-in` keyframe if needed)

- [ ] **Step 1: Failing test** — `components/WorkBrowser.test.tsx`

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkBrowser } from './WorkBrowser';

describe('WorkBrowser', () => {
  it('starts on the first client with its real address and a live link', () => {
    render(<WorkBrowser />);
    expect(screen.getByText('cut-pro-lawncare.bohdiai.com')).toBeInTheDocument();
    expect(screen.getByText('Client · Cut-Pro Lawncare & Construction')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /visit the live site/i })).toHaveAttribute('href', 'https://cut-pro-lawncare.bohdiai.com');
  });
  it('labels samples as samples when you jump to one', async () => {
    render(<WorkBrowser />);
    await userEvent.setup().click(screen.getByRole('button', { name: /show twilight to darkness/i }));
    expect(screen.getByText('Sample · Twilight to Darkness')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show twilight to darkness/i })).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 2: Run** it. Expect FAIL.
- [ ] **Step 3: Implement** `WorkBrowser` from the approved mockup (`scratchpad/mockup.template.html`, `.browser-wrap` block), reusing the existing `BrowserDemo` frame classes: bob animation, bar, dots, the URL pill with 🔒, and the pager. The frame content is `next/image` of `entry.shot` (`fill`, `sizes="(max-width: 980px) 100vw, 980px"`, `alt={entry.name + ' home page'}`) inside an `aspect-[1440/760]` box, keyed by slug so it re-mounts and fades in. The left tag is `${kind === 'client' ? 'Client' : 'Sample'} · ${name}`, and the right tag is an `<a target="_blank" rel="noopener noreferrer">` saying "Visit the live site ↗". It auto-advances every 5000ms, pauses on hover and focus-within, and respects `prefers-reduced-motion` (no auto-advance). It keeps `UrlTypewriter`: move it from `BrowserDemo.tsx` into `WorkBrowser.tsx` unchanged.
      `Hero.tsx`: the badge reads "Websites for makers, contractors & charities" (drop "Beta opening"). h1: `<span className="text-text">If you make it, bake it,</span> fix it or fund it,<br/><span className="inline-block animate-pulse-glow text-honey-warm">we build it for you</span>`. Sub: "A real website for your shop, your trade or your cause. You tell me about your work, I build the site, and every dollar your customers pay goes straight to you." Buttons: "Tell me about your project →" → `#contact`, "See the work" → `#work`. Then `<WorkBrowser />`. Drop the `Rotator` import.
- [ ] **Step 4: Run** the test. Expect PASS.

### Task 7: Work section (visual)

**Files:** Create `components/Work.tsx`

- [ ] **Step 1:** Build from the mockup's `.work` block using `CLIENTS`/`SAMPLES`. `<section id="work">`, `SectionKicker` "The work", h2 "Real sites for <em>real businesses</em>" in `TradesMarquee`'s h2 classes, and the lede "Every one is different, because every business is. Here’s who I’ve built for so far." Client spreads: a `md:grid-cols-[1.35fr_1fr]` grid, alternating with `md:[&>*:first-child]:order-2` on odd rows, the shot tilted `-rotate-[1.2deg]`/`rotate-[1.2deg]` and straightening on `group-hover`. The mini browser bar shows the host. The copy column has the tag "Client · {category}", an h3, the blurb, feature chips, and "Visit the site ↗" (`target="_blank" rel="noopener noreferrer"`). Samples: kicker "Samples", h2 "A few <em>looks</em> to get you thinking", a dashed note "These are sample shops made to show range, not real businesses", then a fan of three cards on `md+` (absolute, rotated ±7°, the middle one on top; hover lifts, straightens and dims siblings through `group/shelf` + `group-hover/shelf:brightness-[.55]` + `hover:brightness-100`) that stacks into a single column below `md`. Captions read "{name}" / "{category} · {blurb}". All images use `next/image` with `sizes`. No inline styles.
- [ ] **Step 2:** Check the render (Task 13's page test covers the text; the look is gated by Alex in Task 14).

### Task 8: Who it's for — the trades strip (visual)

**Files:** Modify `components/TradesMarquee.tsx`

- [ ] **Step 1:** Rename the kicker to "Who I build for". The h2 becomes "Makers, <em>trades</em> and good causes" (the slogan moved to the hero). The sub becomes "Your site should look like your business, not a template. Here are some of the people I build for." Three rows (reverse alternating): **makers**, a trimmed version of the current `TRADES_ROW_1` + `ROW_2` (keep ~20, featured: Candle maker, Sourdough baker, Jewelry maker, Decoupage artist); **service trades**: Lawn care, Landscaper, Hardscaping & patios, Sod & grading, Tree service, Snow removal, House cleaning, Handyman, Painter, Power washing, Pet grooming, Photographer, Mobile detailing, Junk removal, Pool service, Fencing (featured: Lawn care, Landscaper, House cleaning); **charities & causes**: Animal rescue, Food pantry, Church, Youth sports league, PTA / PTO, Veterans group, Community garden, Library friends, Arts council, Shelter, Scholarship fund, Motorcycle club charity ride, Historical society, Fire department auxiliary (featured: Animal rescue, Food pantry). Remove the "97 more business types" line and replace it with "Don’t see yours? <a href="#contact">Tell me what you do</a>."

### Task 9: How it works, Pledge, Header, Footer, Contact (visual)

**Files:** Modify `components/HowItWorks.tsx`, `components/Pledge.tsx`, `components/Header.tsx`, `components/Footer.tsx`; Create `components/Contact.tsx`

- [ ] **HowItWorks:** keep the `Step` layout and connecting line, and swap the three visuals for simple honey-glow icons (chat bubble, browser, live dot) drawn as inline SVG with `currentColor`. Kicker "How it works", h2 "Three steps. <em>No tech</em> on your end." Steps: 01 "Tell me about your business", "Fill out the form or send a message. What you do, who buys from you, what you need the site to do." 02 "I build it and show you", "You see the real site before it goes live, and we change what isn’t right." 03 "You go live", "Your site goes up on the web. Need a change later? Just ask, and I handle it." Delete `PromptCard`, `Chip`, `Orb`, `LiveBadge`, `CRAFT_CHIPS`, `MOOD_CHIPS`.
- [ ] **Pledge:** keep the layout. Items: "I’ll <b>never take a cut</b> of what you sell. Your customers pay you direct, through your Stripe, your Square, your bank." / "I’ll <b>never lock you in</b>. Your words, your photos and your customer list are yours, any time you ask." / "I’ll <b>never sell your data</b> or your customers’. What’s on your site stays yours." Signature "Alex Scott", role "BohdiAI".
- [ ] **Header:** the logo chip stays (honey dot until Alex's logo file arrives), then nav chips Work (`#work`) / About (`#who`) / Contact (`#contact`), then the right pill "Start a project →" → `#contact`.
- [ ] **Contact.tsx:** `<section id="contact">`, kicker "Contact", h2 "Tell me about <em>your project</em>", and two promise lines with honey dots: "You’ll know the full price before I start" and "I never take a cut of your sales". Then `<InquiryForm />` in a glass card (`border-white/10 bg-white/[0.03] backdrop-blur-[20px] rounded-[20px]`), then the line "Or email me at {SITE_CONTACT_EMAIL}".
- [ ] **Footer:** tagline "Websites for makers, contractors and charities. You keep 100% of what you sell." Columns: "Site" (Work, How it works, Our pledge, Contact) and "Contact" (the `SITE_CONTACT_EMAIL` mailto). Remove `SKOOL_URL`, `YOUTUBE_URL` and the Community column. Keep the © line and Privacy/Terms.

### Task 10: Page assembly + metadata

**Files:** Modify `app/page.tsx`, `app/layout.tsx`

- [ ] **page.tsx:** drop the founder query, `supabaseAdmin`, `serverEnv` and `force-dynamic` (the page is now static). Order: `Header`, `Hero`, `Work`, `TradesMarquee`, `HowItWorks`, `WhoBehind`, `Pledge`, `Contact`, `Footer`. JSON-LD becomes `@type: 'ProfessionalService'`, name BohdiAI, url, description "Websites for makers, contractors and charities in Rhode Island and beyond.", `founder: { '@type':'Person', name:'Alex Scott' }`, `email: SITE_CONTACT_EMAIL`, `areaServed: 'US'`.
- [ ] **layout.tsx:** title "BohdiAI · Websites for makers, contractors and charities"; description "If you make it, bake it, fix it or fund it, we build it for you. Real websites for small makers, local service businesses and charities, and you keep every dollar of your sales."; OG/Twitter to match. Remove `UnifrakturCook`, `Bebas_Neue`, `Fredoka`, `Caveat` and their variables **after** `grep -rn "font-gothic\|font-bebas\|font-fredoka\|font-caveat\|--font-gothic\|--font-bebas\|--font-fredoka\|--font-caveat" app lib components tailwind.config.ts` shows they're used only by the deleted storefronts. If anything else uses one, keep that one.

### Task 11: Delete the waitlist stack and the fake stores

- [ ] **Step 1:** `git rm -r components/Waitlist.tsx components/Community.tsx components/BrowserDemo.tsx components/Rotator.tsx components/storefronts app/api/waitlist app/confirm app/confirmed lib/emails.ts`. Before that, `grep -rn "Typewriter" components app` to confirm whether `components/Typewriter.tsx` is still used, and delete it too if it's orphaned.
- [ ] **Step 2:** In `app/globals.css`, delete the storefront block (the `/* ===== Storefronts` comment at ~line 259 through the end of the `.sf-*` and wordmark sections) **after** `grep -rn "sf-\|wm-\|store-frame\|\"build" app lib components --include=*.tsx` confirms that nothing outside the deleted storefronts uses those classes. Keep anything still referenced.
- [ ] **Step 3:** `lib/validation.ts`: delete `waitlistSchema` / `WaitlistInput` and their cases in `lib/validation.test.ts`. `lib/env.ts:20`: delete `FOUNDER_CAP`. `lib/forms/rate-limit.ts`: `FormName = 'estimate' | 'contact' | 'inquiry' | 'notify-interest'`. `app/api/form-limits.test.ts`: remove the two waitlist entries. `lib/forms/rate-limit.test.ts` and `lib/proxy-security.test.ts`: remove or retarget the waitlist references (read each hit and swap `'waitlist'` for `'inquiry'` where it's only standing in for "some form"). `vitest.config.ts`: remove the `lib/emails.ts` coverage exclusion. `app/robots.ts`: disallow only `['/api/']`. `app/sitemap.ts`: check it doesn't list `/confirmed`.
- [ ] **Step 4:** Run `npm run typecheck && npm run lint && npx vitest run`. Expect clean and green; fix any import that still points at a deleted file.
- [ ] **Step 5: Commit** (non-visual) `git commit -m "chore(site): remove the waitlist, founder counter, Skool section and fake stores"`

### Task 12: Share image + legal pages

**Files:** Modify `app/opengraph-image.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`

- [ ] **OG image:** a dark `#0a0805` background with a radial honey glow at the bottom (a `backgroundImage` radial-gradient in the ImageResponse style object; `next/og` requires style objects, so this is the one sanctioned exception). Top line: honey dot + "BOHDIAI · WEBSITES FOR MAKERS, CONTRACTORS & CHARITIES". Headline in two lines, "If you make it, bake it, fix it or fund it," in `#f3ede0` and "we build it for you" in `#f3c97a`. Footer "bohdiai.com". `alt` = "BohdiAI: If you make it, bake it, fix it or fund it, we build it for you". Every multi-child div gets `display:'flex'` (the Session 87 bug).
- [ ] **Privacy:** rewrite the waitlist paragraphs: bohdiai.com collects only what you type into the contact form (name, email, kind of business, message, optional link). It's emailed to Alex, isn't stored in a database, and is never sold or shared. Cloudflare sees normal request data (IP) for security and rate limiting. Keep the plain-English voice and the page structure. Drop "emailed to people on the waitlist" and say changes will be posted on this page.
- [ ] **Terms:** rewrite from "a waitlist for an upcoming product" to terms for using bohdiai.com and its contact form. Sending a message doesn't create a contract, and project terms and price are agreed in writing before work starts. Metadata description: "The terms for using bohdiai.com. Short, plain English."
- [ ] Alex reviews both pages' wording in Task 14.

### Task 13: Homepage render test

**Files:** Create `app/page.test.tsx`

- [ ] **Step 1:**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/image', () => ({ default: (p: { alt: string }) => <img alt={p.alt} /> }));
const { default: HomePage } = await import('./page');

describe('bohdiai.com home', () => {
  it('leads with the slogan and ends in the contact form', () => {
    const { container } = render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('If you make it, bake it, fix it or fund it, we build it for you');
    expect(container.querySelector('#work')).not.toBeNull();
    expect(container.querySelector('#contact form')).not.toBeNull();
  });
  it('says nothing about the waitlist, beta, Skool or founders', () => {
    const { container } = render(<HomePage />);
    expect(container.textContent).not.toMatch(/waitlist|beta|skool|founder spot|reserve your shop|built by ai|live in minutes/i);
  });
  it('labels the samples as samples', () => {
    render(<HomePage />);
    expect(screen.getByText(/not real businesses/i)).toBeInTheDocument();
  });
});
```
(If `HomePage` stays `async`, render `await HomePage()`.)
- [ ] **Step 2:** Run `npx vitest run app/page.test.tsx`. Expect PASS.

### Task 14: Alex sees it, then commit the visual work

- [ ] **Step 1:** `npm run typecheck && npm run lint && npx vitest run`. All clean.
- [ ] **Step 2:** Ask Alex before starting the dev server (standing rule). Start it, then check at desktop and 375px widths: no horizontal scroll, the fan stacks, the form works end to end on local (a real send needs Resend keys in `.env.local`; the rate limiter fails closed without the Cloudflare binding locally, so a local submit shows the "can't send right now" message, which is itself a visible-failure check).
- [ ] **Step 3:** Hand Alex the URL. He reviews the page, the wording, and the Privacy/Terms text. Apply his changes.
- [ ] **Step 4: Commit** `git add -A components app tailwind.config.ts && git commit -m "feat(site): bohdiai.com rebuilt as a web developer site"`

### Task 15: Classic Loafs cleanup (before merge)

- [ ] **Step 1:** Read the DB: the `classic-loafs` tenant row and its `store_versions` and try-on-related rows. List what try-on testing changed against what a clean sample looks like (compare with `twilight-to-darkness`). Show Alex the list. **Don't change anything until he says go.**
- [ ] **Step 2:** Apply the fix Alex approves, then run `node scripts/capture-work-shots.mjs classic-loafs`, look at the new image, run the test suite, and commit.

### Task 16: Ship

- [ ] **Step 1:** Merge to `main` (fast-forward) and push. Workers Builds deploys. Watch the build.
- [ ] **Step 2:** Production checks: https://bohdiai.com renders; www redirects; all five "visit" links open; `/opengraph-image` renders; `/api/waitlist` and `/confirmed` 404.
- [ ] **Step 3:** Send one real inquiry on production. Alex confirms it arrived and that Reply goes to the sender.
- [ ] **Step 4:** Delete the branch. Update `SESSION-BRIEF.md` (current state + next actions), write `session-logs/session-88.md`, and commit to `main`.
