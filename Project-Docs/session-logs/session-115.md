# Session 115 — 2026-10-26

**Buyer accounts built for Full on `feat/buyer-accounts` (pushed, NOT merged): Account in every Full site's menu, sign in / make an account / forgot password, My account with orders, each order's page, Reorder; orders placed while signed in land there; the Buyers screen and the step-down count. Show / Hide on every password box. Alex: where things sit in the backend is a big concern and the backend needs a full redesign; he will design it himself and get back to us. The branch waits for that.**

## Decisions (Alex)

- **Logins before downloads.** Downloads need payments, which we aren't building.
- **Passwords, not emailed codes** ("people get so annoyed with this type of authentication").
- **One shared password across shops is fine.** A buyer at two BohdiAI shops uses the same password; their orders and details stay separate per shop.
- **Database change approved, "ONLY for full sites":** `tenants.buyer_accounts_on` (her own switch, starts on). It counts only on Full; below Full sign-in is closed and accounts are kept.
- **Show / Hide on all login screens.**
- **The backend needs a full redesign; Alex designs it.** Putting Buyers under Online shop "is not very intuitive for makers". Asking him to list menu names didn't work, nor did my six-group draft ("this conversation" doesn't work this way). Wait for his design; ask where any new screen goes.

## Built (`feat/buyer-accounts`, two commits)

- **On the site:** `/account` (sign in, or make an account), `/account/forgot`, `/account/reset` (the emailed link; the token is spent only when the new password is sent), `/account/orders/<number>`, Reorder on a paid order (puts the pieces back in the cart; the cart re-checks each). 404 unless the shop has `buyer_accounts` (Full) and her switch is on. Account in the menu of the families, Scenic's shoreline and the nursery; account pages in each design's own look (shared `ba-` layout, colours from the design).
- **Security:** the shared sign-in session is ended at once; the shop keeps only its own signed, httpOnly pass (`lib/buyers/pass.ts`, BACKEND_SESSION_SECRET, 30 days), good only on that shop. Rate-limited per visitor and per email, fails closed. Reset links are built from the shop's own name, never the request's Host. Accounts aren't email-verified at sign-up (quick for buyers; someone could squat an email, sees only their own orders, the owner takes it back with Forgot password).
- **Checkout:** both the order request and the PayPal checkout attach the signed-in buyer to the order (a failure to read the buyer places it as a guest's and logs it).
- **Backend:** Buyers (Online shop for now): her switch and her buyers (name, email, joined, orders, spend). The step-down screen says how many buyers lose sign-in.
- **Show / Hide** in every password box (owner sign-in and set-password; the shop's forms).
- Words: every site got the `shop.account.*` words (and `pages.account`); `buyer_accounts` switched on for the five Full sites (soul-splatter, rustic-charm, classic-loafs, twilight-to-darkness, heavenly-scents). Main's live code ignores both until merged.

## Found along the way

- Typed routes only know shop pages by `/storefront/...`; a redirect to `/account` or `/cart` needs `as Route` or the real build fails. The type check must include `.next/types` but leave out `.next/dev` and `next-env.d.ts` while the dev server runs.
- `site_words` keys can't hold underscores (`partially_refunded` reads the `partiallyRefunded` spot).
- Alex's shop sign-in "didn't work": the log showed `invalid_credentials` — a missing special character. Show / Hide found it.

## State

- `feat/buyer-accounts` pushed, not merged (waits for Alex's backend design: Buyers' place).
- Not checked by eye: the account pages in Scenic and the nursery (no Full site uses them); a signed-in order and Reorder (only Renée's site takes orders; covered by tests).
- Alex now has a buyer profile on Classic Loafs (his own sign-in). My test buyer was removed.
- Dev server left running in Alex's Terminal tab.

## Next

- **Alex:** his backend design. Then place Buyers where it says, merge, check live.
- Full still to do: PayPal on Getting paid for Market sites; downloads delivered (with payments).
