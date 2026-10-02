# bohdiai.com FAQ page and About story — design

**Date:** 2026-10-02 (Session 91)
**Status:** agreed with Alex in conversation.
**Builds on:** `2026-10-02-bohdiai-com-pricing-design.md`, `2026-10-02-tiers-and-pricing.md`.

## Why

Prices are public now, and they raise questions — above all "why so cheap?" Alex wants that answered with who he is and The Bohdi Way: the goal is to empower small businesses, not to charge a fortune to grow his own wealth. "In empowering others, all of us are enriched."

## Decisions

- **One page, `bohdiai.com/faq`,** grouped by topic; maker-only and contractor-only groups near the end; custom sites last.
- **"Why are your prices so low?" leads** and gets more room: 30+ years in IT (corporate and his own business), mostly helping — training, support, service; retiring and finding the desire continued; the name; empowering others enriches all of us; plus the practical side (built carefully once, every site shares it). No AI talk (site rule).
- **The name:** "Bodhi means awakening. To me, it means empowering: the moment someone realizes they can do the thing they were sure they couldn't." Accurate about the word; Alex's meaning on it. (Bodhi: Sanskrit/Pali "awakening", root *budh*, "to awaken, to know".)
- **Build time answer:** most plan sites are ready in 2 to 5 days; custom sites are different.
- **Custom sites:** anything beyond what a plan lists (special layout, a feature no plan has, a site outside BohdiAI — Penny's is the example) is quoted separately after a conversation. **In the FAQ only for now** — not on the pricing pages.
- **Voice:** first person ("I"), like the rest of the site. Copy is drafted in the build; Alex reviews it on the running page before it goes live.

## Questions

- **Why so cheap:** Why are your prices so low? · Does cheap mean it's not as good?
- **Getting started:** How does it work? · What do I need to have ready? · How long does it take?
- **Prices and billing:** What does "built free" mean? · When does billing start? · Monthly or yearly — can I switch? · Any other fees? Do you take a cut of my sales?
- **Your site:** Who owns my site, my customers and my money? · What's a fix, and what's an addition? · Can I use my own domain?
- **Changing plans or leaving:** Can I upgrade from Lite to Full? · What happens if I cancel? · Is there a contract?
- **For makers:** Do I have to sell online? · What does the point of sale do?
- **For contractors:** Where do estimate requests go? · Do I have to pay for leads?
- **Custom:** What if I need something the plans don't cover?

## Page

Same look as the rest of bohdiai.com. Header, a headline ("Questions, answered straight"), the price question open and larger, then the groups as tap-to-open questions (native `<details>`/`<summary>`: accessible, no script), then "Didn't see your question?" with the contact form, footer. FAQ structured data (`FAQPage` JSON-LD) on the page for search.

**Data:** one module, `lib/site/faq.ts` — groups, questions, answers (paragraphs), and each pricing page's top three question ids. Prices in answers come from `lib/site/plans.ts`, never typed twice.

## Links

- Footer on every marketing page.
- Each pricing page, under the comparison: its three top questions (same tap-to-open) and "More questions →" to `/faq`.
- Not in the header (full on phones). Sitemap entry.

## About section (home)

Add the name story between the career paragraph and The Bohdi Way, a few sentences: Bodhi means awakening; to Alex it means empowering; that is why the business exists and why the prices are what they are; "in empowering others, all of us are enriched." The FAQ carries the longer version.

## Testing

- `faq.ts` invariants: every group has questions, every answer has text, top-question ids exist, the price question is first.
- `/faq` renders every question, the price question open by default, valid FAQ JSON-LD with every question, the contact form, no AI talk.
- Pricing pages show their three top questions and the link to `/faq`; footer links `/faq`.
- Home About contains the name story.
- Alex's eyes on the page before it goes live.
