# Session 99 — 2026-10-09

**Saltmarsh & Lace: the demo shop that moves between plans.** Spec: `docs/superpowers/specs/2026-10-09-saltmarsh-demo-design.md` (stages one to four).

- bohdiai.com footer + JSON-LD link Alex's Facebook page (branch `feat/site-facebook-link`, not pushed: Alex said hold the push).
- Built on `feat/saltmarsh-showcase`: a made-up maker (Lena Brightman, Bristol RI, decoupage on shells, bottles, boards, boxes, ornaments), the **shoreline** design (fixed ocean behind every page, weathered window frames, dusk-band headings), generated photos.
- Plans as switch sets (`lib/backend/plan/`): Your plan page, upgrade checkout (prorated, yearly → monthly turns unused time into credit), downgrade at renewal with no refund, Showcase picker (up to 12), gallery ↔ products conversion ("Ask for price" until priced). Demo-only: Skip to renewal, Billing switch.
- Lite/Full get real pages (Home, Shop, product pages, About, Markets, Contact, Testimonials), cart, sale banner, New tags, collections on the Shop page, social icons + Owner login in the footer.
- Markets by plan: Showcase dates only; Lite adds details + Sell at the table (POS); Full adds costs, reviews, results (this year against last).
- Testimonials table + backend screen. Photo limit (Lite 1, Full 12).
- `scripts/demo-reset.ts <site> showcase|lite|full` (Full = 19 priced pieces, download, sale + code, 4 collections, 9 markets, 5 orders, 4 testimonials). Demo login via `scripts/demo-login.ts` (password from env only).
- Lessons: a function passed from a server component to a client one crashed every Full page and only curl caught it; never reset or upgrade Alex's demo without asking (memory saved).

**Next (2026-10-10):** the public demo, spec stage four: personal copies, welcome page, Learn. Open question: one throwaway login per copy (recommended) or a label only.
