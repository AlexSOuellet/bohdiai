# Archetype Try-On — converting a built store between shapes

**Date:** 2026-06-05 · **Status:** design approved, build next · **Branch:** `session-12/layout-engine`

## The problem

We want to see the same maker in different archetypes **side by side** — Abigail's crochet shop as both a Gallery and a Main Street, open in two tabs, to compare the shapes honestly.

Re-running onboarding doesn't give us that. It regenerates *different* content, and Bohdi may not even pick the archetype we want to look at. We need to take a store that already exists and re-express the *same maker* in a *chosen* archetype, leaving the original untouched.

This is the first real piece of the **try-on** editor feature (Session 22: content + branding live in a shared portable layer each archetype re-expresses; makers switch archetypes in the editor). Build it as a reusable mechanism, not an Abigail one-off.

## The model

A store is two layers:

- **The maker's content** — who she is, her voice, her catalog, her photos. Archetype-neutral.
- **The archetype's expression** — the shape it's poured into (Gallery wall vs Main Street four-beat).

Try-on swaps the second and keeps the first.

The thing in the middle is a **PortableStore** — an archetype-neutral bundle:
`identity` (wordmark, tagline, voice), `maker` (name, story, photo), `catalog` (products: name / price / description / photo), `niche`, `mood`, and any reusable media URLs.

Each archetype's build spec gains two capabilities:

- **`handOff(content) → PortableStore`** — pull the portable layer out of *this* archetype's stored content. (Gallery hands off its wall products + maker + identity.)
- **`takeOn(portable, brief) → { content, mediaJobs }`** — author *this* archetype's content **from** a PortableStore. This is Bohdi **re-expressing the same maker** in the new shape — filling the archetype-only slots (Main Street's hero story, goods framing, founder, close, and the hero prompt) grounded in her existing voice and her real product names. He is NOT inventing a new maker.

## The conversion flow

`convert(subdomain, targetArchetypeKey, label)` — all on the **one** tenant:

1. Load the tenant's **live** envelope → `sourceSpec.handOff(content)` → **PortableStore**.
2. `targetSpec.takeOn(portable, brief)` → authored target content + its media jobs.
3. **Media** — reuse what carries over (the maker photo, any existing product photos); generate only what the target needs that the source lacked (Main Street's hero; product photos when the source had none, capped at `MAX_PRODUCT_IMAGES` and recycled).
4. Save the result as a **new version row** on the same tenant (not live). The live store is never modified.

Result: the one tenant now holds two versions — the live Gallery and the new Main Street — viewable side by side under one subdomain (`/` for live, `/?v=<label>` for the try-on). Same maker, same wordmark, so **no new name is needed**.

## Storage — versions under one tenant

A new `store_versions` table holds try-on variants (drafts): `id`, `tenant_id`, `label` (e.g. `mainstreet`), `envelope` (the archetype payload `{kind:'archetype', archetypeKey, lookKey, mood, catalogSize, content}` plus its product rows), `created_at`.

- The **live** store stays where it is — the tenant's `content_pages` home. No migration needed for the first cut.
- The bare subdomain renders the live store, exactly as today.
- `…/?v=<label>` renders that draft version from `store_versions` instead — the in-place preview.
- **Make live** (the editor's publish, later) copies a chosen version's envelope into the live `content_pages` home. Out of scope for this cut.
- **Security:** preview-by-param is fine for us now; for real makers, gate `?v=` to the authenticated owner so customers can't surf someone's unpublished drafts.

The storefront resolver (`StorefrontPage` / `renderArchetypeStore`) gains one branch: if a `v` param is present (and owned), render that `store_versions` envelope; otherwise render the live home as today.

## First cut (this build)

- Implement `Gallery.handOff` and `MainStreet.takeOn` only.
- Add the `store_versions` table + the resolver `?v=` branch.
- Test maker: `abigails-custom-creations` (crocheter, simple). Her Gallery stays the live store; the conversion writes a `mainstreet` version on the same tenant.
- Keep her brand voice and her 18 product names/prices (same wordmark, same maker); reuse her maker photo for the founder beat; generate the hero + ~5 product photos (hers have none).
- Judge by opening the live Gallery (`/`) and the Main Street version (`/?v=mainstreet`) side by side.

### Carries over vs regenerated

- **Carries:** identity/voice, maker story + photo, product names/prices/descriptions.
- **Regenerated:** the hero (Main Street has one, Gallery didn't); product photos only when missing.

## Out of scope (later)

- `handOff`/`takeOn` for every archetype (any-to-any try-on).
- The editor UI for try-on; the mood→palette layer; the broader skin-divergence work.
- The **make-live / publish** action (copying a version into the live home) — versions are written and previewable now; promoting one is a later editor action.
- Owner-gating of `?v=` previews (noted under Security) — deferred past the first cut.

## Testing

- **Unit:** `Gallery.handOff` produces a valid `PortableStore` from a content fixture; `MainStreet.takeOn` produces schema-valid Main Street content from a `PortableStore` fixture. The live-Bohdi author step and the media generation are seams, mocked in unit tests.
- **Unit:** the resolver renders the live home when no `v` param is present, and the matching `store_versions` envelope when `?v=<label>` is present (missing label falls back to live).
- **Proof:** the live Abigail conversion, run once, judged side by side — live Gallery at `/`, Main Street at `/?v=mainstreet`.

## Open question carried in

This tool is also the lever for the bigger unresolved thread — that on the *same* archetype, a skin is a small dial, and the craft skins are cousins. Try-on lets a maker change the *shape* (the big lever) and, later, drive the skin from brand voice. Skin-divergence work is tracked separately; it is not part of this build.
