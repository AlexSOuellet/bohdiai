# bohdiai.com FAQ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** `/faq` page, top questions on each pricing page, footer link, and the name story in the home About.
**Spec:** `docs/superpowers/specs/2026-10-02-bohdiai-com-faq-design.md`.
**Architecture:** `lib/site/faq.ts` holds every question and answer (answers may read prices from `lib/site/plans.ts`); `components/faq/FaqList.tsx` renders groups as `<details>`; the page adds JSON-LD.
**Branch:** `site/faq`.

### Task 1: FAQ data
- [ ] `lib/site/faq.test.ts`: groups non-empty; every answer has ≥1 non-empty paragraph; ids unique; first question of first group is `why-so-low`; `TOP_QUESTIONS.maker/contractor` are 3 existing ids; answers mention "$14.99" via plans data; no "AI" (besides BohdiAI) in any text.
- [ ] Fail → implement `faq.ts` (`FaqItem {id, q, a: readonly string[]}`, `FaqGroup {title, items}`, `FAQ_GROUPS`, `TOP_QUESTIONS`, `faqItem(id)`, `faqJsonLd()`) → pass → commit.

### Task 2: FaqList component
- [ ] Test: renders every question of given items as a disclosure; `openFirst` opens the first; answers present.
- [ ] Fail → implement (marketing look, `<details>`/`<summary>`, honey marker, no inline styles) → pass → commit.

### Task 3: `/faq` page
- [ ] Test: h1, every question present, `why-so-low` open, JSON-LD `FAQPage` with every question, `#contact form`, no AI talk.
- [ ] Fail → implement page (Scene, Header, hero, featured price answer, groups, Contact, Footer) + metadata + sitemap → pass → commit.

### Task 4: links + About
- [ ] Tests: pricing pages show their 3 top questions + link `/faq`; footer has `/faq`; home About contains "Bodhi means awakening".
- [ ] Fail → `PricingPage` top-questions block, Footer link, WhoBehind name paragraph → pass → commit.

### Task 5: verify
- [ ] typecheck, lint, full suite; dev server look at desktop + phone; Alex reviews wording; merge, push, live check, delete branch.
