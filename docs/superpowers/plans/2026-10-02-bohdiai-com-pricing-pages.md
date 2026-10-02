# bohdiai.com Pricing Pages (Step A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public prices on bohdiai.com — two doors on the home page, `/makers` and `/contractors` pricing pages with plan cards and a competitor comparison; "Get started" goes to the contact form with the plan noted (Stripe checkout is Step B, after staging).

**Spec:** `docs/superpowers/specs/2026-10-02-bohdiai-com-pricing-design.md` (Step A) + `2026-10-02-tiers-and-pricing.md`.

**Architecture:** One data module (`lib/site/plans.ts`) holds the four plans and the two comparison tables; pages and components only render it. Shared pricing components live in `components/pricing/`. The inquiry form gains an optional `plan` (validated against the plan ids) read from `?plan=` on the page, and the plan appears in Alex's email.

**Tech stack:** Next.js 16 App Router (server components; client only where state is needed), Tailwind with the existing marketing tokens, Vitest + Testing Library, zod.

**Branch:** `site/pricing-pages` (main tree, no worktree).

---

## File map

| File | Responsibility |
|---|---|
| `lib/site/plans.ts` (new) | Plan ids, prices, includes, audience copy; comparison rows with `checked` date and sources |
| `lib/site/plans.test.ts` (new) | Data invariants (yearly ≈ 10× monthly, ids unique, every audience has Lite + Full, comparison ends with BohdiAI, checked dates present) |
| `lib/inquiry/request.ts` | `plan` optional field (enum of plan ids) in schema + email row |
| `components/InquiryForm.tsx` | `plan` field: chips for the audience's plans + "Not sure yet", preset from `?plan=` |
| `components/Contact.tsx` | Props: `kind?`, `audience?`; new promises; Suspense around the form |
| `components/pricing/BillingToggle.tsx` + `PlanCards.tsx` (new, client) | Monthly/Yearly toggle and the two cards |
| `components/pricing/Comparison.tsx` (new) | The comparison table |
| `components/pricing/PricingPage.tsx` (new) | Shared page body: hero, cards, comparison, work, contact |
| `components/Doors.tsx` (new) | Home page's two doors + charity line |
| `components/Header.tsx` | Makers / Contractors links; anchors become `/#…` so they work off the home page |
| `components/HowItWorks.tsx` | New step copy |
| `components/Work.tsx` | Export `ClientSpread` / samples block for reuse, filter by audience |
| `app/makers/page.tsx`, `app/contractors/page.tsx` (+ tests) | The pages + metadata |
| `app/page.tsx`, `app/page.test.tsx` | Doors on home; tests updated |
| `app/sitemap.ts` | Add both pages |

## Data (verified 2026-10-02)

Competitor figures, checked on 2026-10-02:
- Wix (wix.com/plans): Light $17.77/mo, Core $29.77/mo (yearly billing).
- Squarespace (squarespace.com/pricing): Basic $25/mo monthly ($19 yearly); Core $39 monthly ($29 yearly).
- Shopify (shopify.com/pricing): Basic $39/mo monthly ($29 yearly); 2% extra per sale with outside payment providers.
- Etsy (fee guides citing etsy.com/legal/fees): $0.20 per listing, 6.5% transaction fee, 3% + $0.25 payment processing (US).
- Web designer (industry price guides): freelancers about $500–$5,000, typical small-business site $2,000–$8,000.
- Angi / Thumbtack (contractor lead-cost guides): roughly $15–$100+ per lead, leads usually shared with several pros.

Page wording uses rounded, defensible forms ("$2,000 and up", "about $18–$39 a month") and the `checked` date is stored with the data.

## Tasks

### Task 1: Plan data module
- [ ] Write `lib/site/plans.test.ts` asserting: four plans with ids `maker-lite`, `maker-full`, `contractor-lite`, `contractor-full`; prices 14.99/149, 19.99/199, 14.99/149, 29.99/299; `plansFor('maker')` returns Lite then Full, makers only; each comparison table's last row is BohdiAI and every row has `cost` and `you` text; `COMPARISON_CHECKED === '2026-10-02'`; `isPlanId` accepts ids and rejects others.
- [ ] Run → fails (module missing).
- [ ] Implement `lib/site/plans.ts`: types `Audience = 'maker' | 'contractor'`, `PlanId`, `Plan { id, audience, tier: 'lite'|'full', name, forWho, monthly, yearly, includes: readonly string[] }`, `PLANS`, `plansFor(audience)`, `isPlanId`, `PLAN_IDS`, `ComparisonRow { name, cost, you, ours?: true }`, `COMPARISON: Record<Audience, readonly ComparisonRow[]>`, `COMPARISON_CHECKED`, `formatPrice(n)` (`$14.99`, `$149`).
- [ ] Run → passes. Commit.

### Task 2: Inquiry carries the plan
- [ ] Extend `lib/inquiry/request.test.ts`: a valid `plan` is kept and appears in the email ("Plan: Maker Lite"); an unknown plan is dropped (not an error — a stale link must not block a message); no plan → the row reads "Plan: Not chosen".
- [ ] Run → fails.
- [ ] Schema: `plan: z.string().optional().transform(v => v !== undefined && isPlanId(v) ? v : undefined)`; `parseInquiry` passes `record['plan']`; email row `['Plan', plan ? PLANS name : 'Not chosen']`.
- [ ] Run → passes. Commit.

### Task 3: Form plan chips + Contact props
- [ ] Extend `components/InquiryForm.test.tsx`: with `audience="maker"` the form shows "Which plan?" chips Maker Lite / Maker Full / Not sure yet; preset from `initialPlan`; the POST body includes `plan`; without `audience`, no plan chips (home page unchanged); `initialKind` presets the business-kind chip.
- [ ] Run → fails.
- [ ] `InquiryForm` props `{ audience?: Audience; initialPlan?: PlanId; initialKind?: InquiryKind }`. `Contact` props `{ audience?: Audience }`; a small client wrapper `ContactFormWithPlan` reads `useSearchParams().get('plan')`, keeps it only when `isPlanId` and of that audience, and renders `InquiryForm` keyed by it; Contact wraps it in `<Suspense fallback={<InquiryForm … />}>`.
- [ ] Promises become `['Built free. You pay nothing until your site is live', 'I never take a cut of your sales']`.
- [ ] Run → passes. Commit.

### Task 4: Pricing components (invoke frontend-design first)
- [ ] Tests `components/pricing/PlanCards.test.tsx`: renders both cards' names, "Built free", monthly price by default; clicking "Yearly" shows `$149` / `a year`; each "Get started" links to `?plan=<id>#contact`. `Comparison.test.tsx`: renders every row, BohdiAI row marked, checked date shown as "Prices checked October 2, 2026".
- [ ] Run → fails.
- [ ] Build `BillingToggle`, `PlanCards`, `Comparison` in the marketing look (tokens/classes only, no inline styles).
- [ ] Run → passes. Commit.

### Task 5: Pages
- [ ] Tests `app/makers/page.test.tsx` / `app/contractors/page.test.tsx`: h1 "A real web developer for less than a site builder"; maker page has no `$29.99`/Contractor names and vice versa; shows the right client (Penny / Cut-Pro); has `#contact form`; no AI talk.
- [ ] Run → fails.
- [ ] `PricingPage` (Scene, Header, hero, PlanCards, Comparison, audience work, Contact audience) + the two `page.tsx` with metadata; Work exports reused, filtered by audience (`category === 'Maker'` + samples for makers; `Contractor` for contractors).
- [ ] Run → passes. Commit.

### Task 6: Home page
- [ ] Update `app/page.test.tsx`: two doors linking `/makers` and `/contractors`; charity line links `#contact`; header has Makers / Contractors links; old "know the full price before I start" gone, new "Built free" promise present; How it works step 1 "Pick your plan".
- [ ] Run → fails.
- [ ] `Doors.tsx`, header links (`/makers`, `/contractors`, anchors → `/#work` etc.), HowItWorks copy, page wiring, sitemap entries.
- [ ] Run → passes. Commit.

### Task 7: Verify
- [ ] `npx tsc --noEmit`, `npm run lint`, full `npx vitest run` (note the known flaky SectionEditor test).
- [ ] Headless render check of `/`, `/makers`, `/contractors` at desktop and phone widths; screenshots to Alex.
- [ ] Alex reviews wording on the running page; adjust; then commit, merge to main, push, live check, delete branch.
