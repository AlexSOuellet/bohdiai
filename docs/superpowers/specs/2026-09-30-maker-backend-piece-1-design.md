# Maker Backend — Piece 1: Foundation and Catalog

**Date:** 2026-09-30 (Session 89)
**Status:** Agreed with Alex in brainstorming. Parent: `2026-09-30-maker-backend-overview.md`.
**Blueprint:** Penny's admin (`C:\Users\Bohdi\Documents\DecoupageDigital\Website\src\routes\admin\*`) — screens ported onto BohdiAI's multi-tenant data, never transplanted.

## Goal

A maker signs in at `app.bohdiai.com`, lands on a home screen for their shop, and keeps their catalog current — products and collections — without asking Alex. What they change shows on their live shop. Their domain's health is visible to them and to Alex.

## Scope

**In:** maker accounts and sign-in; feature switches (infrastructure + the switches piece 1 needs); the backend shell and home screen; products; collections; the domain status panel and the custom-domain plumbing behind it; the storefront changes needed so catalog edits render correctly.

**Out (later pieces):** cart, checkout, payments, orders, download delivery (piece 2); customer accounts (piece 3); testimonials, gallery, bundles, promos, quantity pricing, search, Facebook tool (piece 4); reports (piece 5); categories and standard pricing (later, switchable, for big-catalog sellers); Google sign-in (later, if asked).

## 1. Maker accounts and sign-in

- **No public sign-up.** Alex (by a script Claude runs, until Alex's admin exists) creates the maker's account: an auth user, a `tenant_members` row with `role = 'admin'` for their shop, and an invite email (sent through Resend, from BohdiAI) with a one-time link to set their password. The set-password step only ever runs through that emailed link — never a cold "type a new password" form, so knowing a maker's email is not enough to take the account.
- **Sign-in:** email + password at `app.bohdiai.com/signin`, with "forgot password" (emailed reset link). The existing sign-in code (`lib/auth/actions.ts`, `app/signin`, `app/auth/callback`) is the starting point; `signUpMaker` and the public sign-up path stay unreachable. Google sign-in (`lib/auth/oauth.ts`) stays off.
- **Access rule:** a signed-in user sees the backend for a shop only if they hold an active `admin` membership in `tenant_members` for it. Every server action re-checks that membership for the shop it writes to; the browser is never trusted with the tenant id. A user with several shops gets a shop picker.
- **Reaching it from the shop:** every shop gets a small "Shop owner sign-in" link (footer) to `app.bohdiai.com/signin`. The string goes through the renderer's defaults map like every other storefront string.
- **Sign-in is rate-limited** through the existing Workers Rate Limiting binding (fails closed), like the public forms.
- **Kept separate from customers:** nothing here assumes shoppers will share this sign-in. Customer accounts (piece 3) decide their own model later.
- **Switched-off surfaces:** `/signin` and `/auth` come off the dormant list. The old maker dashboard, the editor and the Make It Yours walk stay dormant; the new backend does not reuse their screens. (Route layout — reusing `/dashboard` or a new prefix — is a plan decision; whichever is chosen, the old editor/walk routes remain unreachable.)

## 2. Feature switches

- A per-shop record of which features the site has. New table `tenant_features (tenant_id, feature_key, enabled, updated_at)` with a unique `(tenant_id, feature_key)`; RLS so only the service role writes and a shop's admins can read their own.
- **Feature keys live in one typed list in code**, each with a default. A shop with no row for a key gets that default. Piece 1 defines the list and the keys it needs (`catalog`, `video`, `digital_products`, `custom_domain_panel`); later pieces add their own keys to the same list.
- **Nothing assumes a shop.** The catalog is a feature like any other, so a contractor or charity site simply does not have it. Each feature registers its own backend screen (nav entry), its own home-screen card and its own Needs-attention items; the backend is assembled from the features the site has. Piece 1 builds this registration so later features (gallery, notices, estimate inbox, donations…) plug in without touching the shell.
- **Alex controls the switches.** Until his admin exists, Claude flips them with a script (`scripts/set-feature.ts <shop> <feature> on|off`).
- **The maker never sees a switch.** A feature the shop lacks is absent from the backend and the storefront. Checks happen on the server for every screen and every write, not just by hiding buttons.
- **Tier-ready:** when tiers exist, a plan flips the same switches, and the backend can show a disabled feature as locked with an upgrade button. Nothing in piece 1 builds tiers.
- Home-page placement of features like testimonials and gallery is a **maker** setting, built with those features in piece 4 — not a feature switch.

## 3. The home screen

Same shape as Penny's `/admin` home, lighter until selling exists, and **built from the site's features** (each feature contributes its card and its Needs-attention items):

- the site's name and a **View my site** link (always);
- catalog card: product and collection counts (live / draft) — only when the catalog feature is on;
- a **Needs attention** strip, shown only when non-empty: from the catalog, products with no photo, products still in draft, live products that are sold out; from domains, a domain problem;
- the **domain status panel** (section 6, always).

Sales numbers and "orders to ship" join this screen in piece 2; charts and top products in piece 5.

## 4. Products

Ported from Penny's collection/item screens, generalised. Mapped onto tables that already exist: `listings`, `variation_attributes`, `variation_options`, `listing_variants`, `listing_collections`, `uploads`.

- **Basics:** name, short description, long description, price, several photos (the first is the main photo; the maker can reorder), and **one optional video**.
- **Options the maker defines:** any number of options (size, scent, colour, finish…), each with choices. Each combination can carry its own price and its own stock count (`listing_variants`). A product with no options is just its base price and stock.
- **Stock:** optional. Blank means made to order / not tracked. When the maker enters a quantity, it counts down as things sell (piece 2 does the counting). At zero the product (or that choice) shows **Sold out** on the shop and cannot be bought, and the maker is **emailed that it has sold out** (the email is sent by the sale that empties it, so it lands with piece 2; piece 1 builds the sold-out display and the Needs attention entry).
- **Kind:** physical (ships) or digital (a downloadable file). **Physical is the default and most makers never see the choice** — the digital option only appears for shops with the `digital_products` switch on. For those shops the kind is set **per choice**, so one product can be both — Penny's "print or download" is one option whose choices differ in kind. In piece 1 the maker uploads the file and it is stored privately; delivering it to buyers is piece 2.
- **Collections:** a product can sit in several (`listing_collections`).
- **Status:** draft (only the maker sees it), live, or archived (hidden, kept). Maps to `listings.status` `draft` / `active` / `archived`.
- **Duplicate product:** copies everything except the slug (made unique) and starts as draft.
- **Photos:** uploads shrink through the existing Images binding (`lib/images/shrink.ts`, 20MB max), same as the estimate form. Every failure shows the maker a message.
- **Video — Etsy's rules:** one per product, 5–15 seconds, up to 100MB, plays silent on the product page beside the photos. Processed by Cloudflare Stream (direct upload from the browser, so the Worker never carries the file), which produces a small streamable version. Clips outside the rules are refused with a clear message saying why. Cost is confirmed before building; expected around a dollar a month for a few hundred short clips. Requires the `video` switch.
- **One place for prices:** every price the app shows or charges comes from a single function (effective price of a product or a chosen combination). In piece 1 it returns the product's or the combination's own price. Standard pricing, promos and bundles later change only that function plus additive data.

## 5. Collections

- Name, short description, cover photo (the maker picks one; if not, the first product's photo is used), and the order the maker sets — for the collections themselves and for the products inside each (`collections.position`, `listing_collections.position`).
- Status: draft / live / archived, same meaning as products.
- A product can be in several collections. The storefront moves from the single `listings.primary_collection_id` to `listing_collections`; existing shops' `primary_collection_id` values are copied into `listing_collections` by a migration so nothing drops out of a collection.
- No categories/themes in this piece.

## 6. Custom domains and the status panel

**What the maker sees** — a panel on the home screen and in settings, read-only, one of four states:

| State | Message (gist) |
|---|---|
| No custom domain | "Your shop is at yourshop.bohdiai.com." Plus: talk to Alex if you'd like your own address. |
| Connecting | "Connecting yourshop.com — usually ready within a day. Your shop still works at yourshop.bohdiai.com." |
| Connected | "Your shop is live at yourshop.com." |
| Problem | "Your domain isn't reaching your shop right now. Alex has been notified." Plus the cause when it is on the maker's side (e.g. the domain has expired). |

Registrar forwarding/masking is not a state.

**What sits behind it:**

- `tenants.custom_domain` (exists, unused today) holds the domain; a new status field and last-checked time hold the state.
- **Connecting a domain** is a script Claude runs (`scripts/connect-domain.ts <shop> <domain>`): it adds the domain and `www.` as Cloudflare for SaaS custom hostnames on the bohdiai.com zone, records the domain on the shop, and prints the exact settings the maker's domain needs (for a Cloudflare-registered domain, the bare domain works through CNAME flattening).
- **Serving a custom domain:** the edge middleware resolves a shop by its custom domain as well as its subdomain (same active/not-deleted rules). `www.` redirects to the bare domain. Once connected, `yourshop.bohdiai.com` redirects to the custom domain so old links keep working.
- **Status checks:** a scheduled Worker job reads each custom hostname's status (routing + certificate) from the Cloudflare API and updates the shop's state. Any change into **Problem** emails Alex.
- **First real domain is a live test** before any client depends on it.

## 7. Storefront changes this piece needs

So that what the maker edits is what shoppers see:

- product pages show several photos and the video, the options as pickers (with each combination's price and sold-out state), and the right price from the one price function;
- draft and archived products and collections never render;
- collections read from `listing_collections`, in the maker's order;
- the "Shop owner sign-in" footer link.

All renderer rules hold: no hardcoded English (defaults map), no inline styles (CSS variables + classes), and content only — the family/layout still owns structure. The "Add to cart" behaviour stays as it is until piece 2.

## 8. Errors and security

- **No silent failures.** Every failed save, upload or check shows the maker what went wrong; both the `{ok:false}` branch and thrown errors are handled.
- **Tenant isolation:** every read and write is scoped to a shop the signed-in user administers, checked on the server. RLS stays on for every table touched.
- **Uploads** are type- and size-checked on the server, not just in the browser.
- **Secrets:** the Cloudflare API token (custom hostnames, Stream, status checks) lives in the Worker's runtime secrets, never in the bundle.

## 9. Testing

Tests are part of done, and the CI coverage gate holds (lib `.ts` ≥ 90%, `.tsx` ≥ 75%).

- **Unit:** feature-switch defaults and checks; the membership/access rule; the effective-price function; product and option saving (including the per-choice kind); collection ordering and multi-collection membership; the domain status mapping from Cloudflare's responses; video rule checks.
- **End to end:** sign in, add a product with options and photos, put it in two collections, see it on the shop; a user who is not the shop's admin is refused; the domain panel's four states.
- **Live checks before calling it done:** a real invite → set password → sign in; one real custom domain connected end to end; one real video processed and playing.
- **Alex's eyes gate visible work** — the backend screens and the storefront product page — before merge.
