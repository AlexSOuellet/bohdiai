# Session 97 — 2026-10-07

**Headline:** Rose n' Cat became a working maker shop and the first Market POS. Cart, order requests, Orders, promotions, new arrivals, QR codes, Markets and the market shop are all LIVE and switched on for Renee's site (rose-n-cat.bohdiai.com). Renee was invited to the backend; she hasn't accepted yet. Alex worked remotely for much of it (Remote Control on, then off).

## What shipped (live, CI green)

- **Terms + Privacy** links in the nursery footer (the pages already existed, unlinked).
- **Cart** (`cart` switch): one first-party cookie of listing ids (`lib/storefront/cart.ts`), priced fresh from the catalog; Add to cart on each certificate, a Cart pill in the top bar (outside the phone menu), `/cart` in the nursery design (`renderCart` on the archetype spec). **No card payment**: the cart sends an **order request** (`/api/order-request` → `place_order_request`, pending order + email). Orders email **Alex** for now (Alex: "email stay with me for now").
- **Orders** screen (backend): New / Paid / Handed over / Canceled. `set_order_status` moves stock: paid takes it (one-of-a-kind → Adopted), cancel puts it back. New orders tile on the backend home.
- **Markets that run several days** (last day) — then superseded by Markets below.
- **QR code** page (`qr_codes` switch, on by default): home / shop / any product, PNG + SVG. Shared `app/manage/_components/QrCode.tsx`.
- **New arrival** tick on products (`listings.is_new`, `new_arrivals` switch) → nursery **"Just born"** section (birth-announcement cards under the bead bracelet) + Newborn ribbon on cards.
- **Promotions** (`promotions` switch): a sale (percent off everything, optional days; struck-through prices + sale banner) or codes (percent or dollars, optional days, use limit; typed in the cart). **Never stacked** — whichever saves more (`lib/storefront/promotions.ts`). Orders record `discount_cents` + `discount_label`; a code's use is counted under a lock.
- **Markets** (Market POS piece 1) replaced Market dates (`market_dates` switch, menu under Selling): days, hours, town, address (Directions link), booth, website, Canceled (shown, never dropped) — public; costs (`event_expenses`), organizer, notes, review (stars, go back, note) — private. `save_market` RPC. **Privacy fix:** dropped the old anon read policy on `events`.
- **Market shop** (Market POS piece 2, `market_shop` switch): **Getting paid** (Venmo / Cash App / Zelle / cash, each on/off; `payment_settings`), per-market "Your table" (babies she brings + the market's QR), buyer page `/market/<id>` in her design (market days only; first name, optional email, method, optional code → piece **held at once**; Venmo/Cash App pre-filled links, Zelle handle to copy, cash), **I paid**, and **Today** (phone view, refreshes every 8s: Confirm / Not received / Record a sale / takings by method). Market sales are orders with `source='market_mode'`, `event_id`, `payment_method`.
- Design: `docs/superpowers/specs/2026-10-07-market-pos-design.md`.

## Database (all applied)

Migrations `20261007000001`–`…008`: order requests, set_order_status (twice), is_new, promotions, markets, market shop, save_market listings, drop set_market_listings. Every money/stock step was exercised against the real DB as the owner, as a stranger and as anon, in rolled-back transactions.

## Lessons

- **Coverage gate:** CI requires 90% branch coverage on `lib/**/*.ts`. New server actions/queries without tests dropped it to 88% and failed CI after a push. Test the DB steps with a Proxy "any chain" Supabase fake (see `lib/market/market-db.test.ts`).
- **Bash heredocs choke** on some long multi-line Python/TS payloads in this environment ("unexpected EOF"); write the payload with the Write tool and run it from a file.
- **Typed routes:** new `/manage/...` pages need `npx next typegen` before tsc accepts `router.push`/`redirect`/`PageProps` for them.
- The SectionEditor conversation test is timing-sensitive under the full coverage run; its waits are now 5s.
- Alex said "don't go live yet" mid-session: hold pushes for visible changes until he says go.

## Open / next

- **Renee**: hasn't accepted the invite (sent 07:33 ET to her AOL; check spam, or resend with `scripts/invite-maker.ts`). Real baby names/prices still placeholders.
- **Getting paid** is empty — only cash shows on market pages until her Venmo/Cash App/Zelle are entered. No babies are ticked on any market yet.
- **Market POS piece 3**: results per market (sales, by method, what came home, sales minus costs beside her review). Own design pass first.
- **Analytics**: proposed our own cookieless counter (no keys) shown on her backend home; Alex hasn't answered. Privacy template still claims "a first-party analytics cookie" — correct it with whatever is built.
- **Square card** (cart checkout + market card): needs Square keys from Alex; build switched-off version or wait — unanswered.
- Offered a "Test market" dated today so Alex can try a buyer order end to end.
