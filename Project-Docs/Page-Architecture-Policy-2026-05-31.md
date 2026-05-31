# Page Architecture & Navigation Policy

**Date:** 2026-05-31
**Status:** Worked out in conversation with Alex this session. DECIDED items are his calls and stand; OPEN items still need a decision. This is Master-Spec-level policy and should be reconciled into the Master Spec / Phase-1 Decisions Log (and checked there for conflicts) — captured here first so it doesn't slip.

---

## The core principle (DECIDED)

**Every storefront page is per-tenant. There are no hardcoded, shared pages and no dead chrome.**

Two axes, which are NOT the same thing:

- **Per-tenant** — every page belongs to the tenant and is themed to their store. This applies to *everything*, including functional surfaces. Nothing should look like a generic platform bolt-on.
- **Editable** — the maker can change it. This applies to **content pages only**, not functional surfaces.

### Content pages — per-tenant AND editable
Home, About, Shop, legal (Privacy/Terms), Events, Calendar, and any custom pages a build produces. The maker owns the content *and* the layout: copy, images, price, product descriptions, arrangement.

### Functional surfaces — per-tenant in look, platform-owned in behavior, NOT editable
The cart, checkout, and the add-to-cart action. The maker never edits how these work (editing them could break commerce). But they are still themed to the tenant so they feel part of the store.

### Product detail — a normal editable page with a fixed functional control
Not a special case. Price, description, photos, copy, and layout are all editable content the maker owns. The add-to-cart button is a platform-owned functional control the maker can *place* but not *rewire*. That's the only non-editable thing on the page.

### "Editable" is a later feature, but it constrains the model now
The maker-facing editor (dashboard) is future work. We do **not** build it now. But the data model must support it now — meaning: **stop building any page that can't later be edited.** No new hardcoded pages. Every page must exist as a per-tenant, editable-shaped record (i.e., a layout tree).

This is the **direction** the engine is built toward. It does NOT mean every page must be converted before the next candles test.

---

## Navigation policy (DECIDED)

- **Navbar:** Shop, About, Contact — always required, every site. Plus any build-generated primary pages (Events, Calendar, etc.).
- **Home is NOT in the navbar.** Home is reached via the wordmark / logo.
- **Footer:** Home, Privacy, Terms. Privacy and Terms are footer-only — never in the navbar.

How nav membership works under the hood (already true in code): nav membership is a flag on each page (`is_in_nav`), with a label and order. Bohdi just places a "nav goes here" marker; the navbar fills from the flagged pages. So the engine controls membership, not Bohdi.

### OPEN — page classification mechanism
When a build generates pages, the engine needs to tell a navbar page (Events) from a footer-only page (Privacy). Both are just "pages" today.
- **Recommended:** a short known-list of footer-only kinds (Home, Privacy, Terms, and obvious aliases); everything else a build creates defaults to the navbar. Less for Bohdi to get wrong.
- **Alternative:** Bohdi explicitly tags each page's placement as he builds it. More flexible, more room for error.

**This is the one decision blocking a correct, general navbar fix.** (The required three — Shop/About/Contact in, Home out — are settled regardless.)

---

## Legal pages (DECIDED)

- The **same default Privacy and Terms ship on every site** — platform-provided starter templates (today: `content/legal/*.md`). Good for legal copy; we don't let the AI improvise terms of service.
- **Tenant responsibility / "not legal advice"** language lives in **BohdiAI.com's own Terms of Service** (the marketing-site Terms, `app/terms/page.tsx`), which a maker agrees to at signup. **NOT** a disclaimer on the public tenant page (that would read as unfinished to customers).
- Per the core principle, the per-tenant legal pages must become **seeded-then-editable**: seeded from the platform default at onboarding (consistent, correct on day one), stored per tenant, editable later. "Same on every site" becomes "same starting point."

---

## Known follow-ups this policy creates (NOT yet done)

These are consequences to track, not work authorized today:

1. **Legal pages are currently hardcoded and orphaned.** `app/storefront/privacy|terms` render via `LegalPage.tsx` + `lib/legal.ts`, pull the **legacy block chrome** (empty for layout-engine tenants), and nothing links to them. They need to become per-tenant seeded editable pages, rendered with the layout-engine header/footer, linked from the footer.
2. **Footer reliability.** The layout-engine footer is currently Bohdi-authored and does not reliably contain Home/Privacy/Terms. Making the footer dependable is its own piece of work (separate from the navbar fix).
3. **Hardcoded routes migrate to the per-tenant model over time** — product detail, collections, etc. become per-tenant layout trees. Cart/checkout stay platform-owned in behavior but themed per tenant.
4. **Add the responsibility clause to bohdiai.com Terms.** Copy task, not engine work.
5. **Dashboard editing surface** for all content pages — later feature.
   - **UX guardrail (Alex, this session):** the flexibility lives in the data model, NOT in the maker's face. These are makers, not web admins — a dashboard that asks them to "configure navigation" will scare them off. The store must arrive with everything already placed correctly (Shop/About/Contact in the menu, Home/Privacy/Terms in the footer) so the maker never has to decide. If they want to change it, it's a plain-language toggle on the page itself ("show this page in the top menu"), not a placement control they must understand. Most makers should be able to ignore it entirely. Mirrors the banked principle: the store arrives done; personalizing is optional and gentle, never homework.

---

## What this does NOT change

The immediate navbar fix (flagging Shop/About/Contact into the nav, Home out) is small and unaffected by the larger principle. The principle is the frame around it, not a prerequisite pile to clear first. The only thing the navbar fix waits on is the OPEN classification-mechanism decision above.
