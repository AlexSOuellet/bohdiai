# Session 124 (2026-11-17)

**Go-Live step 3 ticked (the words-and-photos check skipped). Go-Live step 4, Square online checkout, built, merged and live. Waiting on Alex's Square notice setup, then the end-to-end test with a refund (Alex: tomorrow).**

## Go-Live step 3: the check on words and photos (skipped)
Alex: "i am concerned about us choosing what is not ok", then "skip it". Report this site and Suspend cover it; at launch Alex can look at each new site himself. Step 3 ticked.

## Go-Live step 4: Square online checkout (merged and live, not ticked)
Alex: "yes" to building it, "yes" to the sold-twice handling and its database change.

- **Paying:** on a Full site whose Square is connected (location picked), the cart's Pay button saves the order, has Square make its own checkout page for exactly our server's total (no tips, no shipping question, the shopper's email filled in), and sends the shopper there. The card is typed only on Square's page. `app/api/checkout/square/create/route.ts`, `lib/square/online.ts` (`startSquareCheckout`), `lib/square/api.ts` (`createPaymentLink`). If Square's total or currency differs from ours, nothing is charged and the order is cancelled.
- **Confirming:** an order counts as paid only when our server asks Square and the Square order carries our order's ID, the right location, currency and total, nothing still due, and every payment is a completed card payment on that order adding up to the total (`confirmSquareOrder`). It runs when the shopper comes back to `/cart?order=…` (`lib/storefront/square-return.ts`) and when Square's signed notice arrives (`app/api/square/webhook/route.ts`, `lib/square/notices.ts`; 503 makes Square retry while it's still settling). Recorded once; the maker gets one email (`lib/square/online-emails.ts`, approved look, both on the admin's Emails tab).
- **Sold twice (database change approved and applied, `20261117000001_online_sold_twice.sql`):** `record_online_payment` now locks the pieces and refuses (P0028) when a counted piece no longer has enough stock (made to order is never refused). Then Square gives every payment back on its own, `record_online_sold` records the order refunded, the shopper sees "it sold to someone else, your money's been given back", and the maker is emailed. If Square's refund fails, Alex is emailed and the order stays pending so a retry finishes it. Proven on the real database in a rolled-back transaction.
- **Refund in Orders** gives an online order's money back through Square (`refundAtSquare` in `lib/backend/orders/actions.ts`); paid-in-parts orders say to refund in Square.
- **Orders:** checkouts started but never paid don't show; paid ones say "Paid online by card".
- **Shopper words** in every site's `site_words`: `family.cart.*` (moods), `card.shoreline.cart.*` (Scenic), `nursery.cart.*` (Rose n' Cat): Pay securely, Taking you to checkout…, still being confirmed, sold to someone else, didn't add up. **Alex to read them.**
- **Getting paid → Square** says online payments and refunds go through the maker's Square when the cart is on. Square's permissions now include taking and refunding payments (ORDERS_WRITE, PAYMENTS_WRITE), so a shop connected before this would reconnect (none is connected today).
- **Also fixed:** the market app's card check always assumed US dollars; it now uses the shop's own currency.
- PayPal stays off; when Square is ready it wins, otherwise the old PayPal path (if switched on).
- Full suite 4662 tests green, coverage over the rule; GitHub test check and Workers Builds green on main.

## Mistakes to learn from
- **Every live cart page errored for about 15 minutes** after the merge: a plain helper (`returnedDone`) lived in a `'use client'` file and the server called it while drawing the page. Tests passed (they run in a pretend browser). Found by running the dev server and curling a cart with a Host header; fixed by moving it to `lib/storefront/checkout-return.ts`. Standing lesson added to the brief: open a changed page on the dev server before merging.

## Where we left off (pick up here tomorrow)
Nothing is connected to Square yet (`square_connections` is empty), so the new code is idle until a Full site connects. The test must run on the live site (Square's sign-in return address is registered there; `.env.local` has no Square settings).

**For Alex, before the test:**
1. Square developer dashboard → Webhooks: add a subscription for `payment.created` and `payment.updated`, sending to `https://bohdiai.com/api/square/webhook`.
2. Cloudflare (Worker's Variables and Secrets): `SQUARE_WEBHOOK_SIGNATURE_KEY` (the signature key Square shows for that subscription) and `SQUARE_WEBHOOK_URL` = `https://bohdiai.com/api/square/webhook`.
3. Say whether Square on BohdiAI (`SQUARE_ENV` in Cloudflare) is test (sandbox) or real money. Test: Square's fake cards. Real: a $1 order on Alex's own card, refunded after.

**Then the test (Claude walks it with Alex):** connect Square on a Full test site and pick a location; put a piece in the cart; Pay; pay on Square's page; check the cart says paid, the order is in Orders as paid online, the stock went down, the maker email arrived, and the notice reached `/api/square/webhook`; then Refund in Orders and check the money went back in Square. Optionally the sold-twice case with a one-of-a-kind piece in two carts. **When it passes, tick Go-Live step 4.** Next after that: step 5, Stripe for makers.

The dev server Claude started is still running in Alex's Terminal tab (c1); ask before stopping it.
