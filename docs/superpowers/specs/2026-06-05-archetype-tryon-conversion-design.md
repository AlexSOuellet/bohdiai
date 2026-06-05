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

`convert(sourceSubdomain, targetArchetypeKey, newName)`:

1. Load the source tenant's home envelope → `sourceSpec.handOff(content)` → **PortableStore**.
2. `targetSpec.takeOn(portable, brief)` → authored target content + its media jobs.
3. **Media** — reuse what carries over (the maker photo, any existing product photos); generate only what the target needs that the source lacked (Main Street's hero; product photos when the source had none, capped at `MAX_PRODUCT_IMAGES` and recycled).
4. `writeArchetypeStorefront` under the new name / new subdomain as a **new tenant**. The source store is never modified.

Result: both stores exist, same maker, one per shape, open side by side.

## First cut (this build)

- Implement `Gallery.handOff` and `MainStreet.takeOn` only.
- Test maker: `abigails-custom-creations` (crocheter, simple) → a new Main Street tenant under a new name.
- Keep her brand voice and her 18 product names/prices; reuse her maker photo for the founder beat; generate the hero + ~5 product photos (hers have none).
- Judge by opening the Gallery original and the Main Street conversion side by side.

### Carries over vs regenerated

- **Carries:** identity/voice, maker story + photo, product names/prices/descriptions.
- **Regenerated:** the hero (Main Street has one, Gallery didn't); product photos only when missing.

## Out of scope (later)

- `handOff`/`takeOn` for every archetype (any-to-any try-on).
- The editor UI for try-on; the mood→palette layer; the broader skin-divergence work.
- Try-on *versions* under a single tenant (this cut writes a separate tenant).

## Testing

- **Unit:** `Gallery.handOff` produces a valid `PortableStore` from a content fixture; `MainStreet.takeOn` produces schema-valid Main Street content from a `PortableStore` fixture. The live-Bohdi author step and the media generation are seams, mocked in unit tests.
- **Proof:** the live Abigail conversion, run once, judged side by side against her Gallery.

## Open question carried in

This tool is also the lever for the bigger unresolved thread — that on the *same* archetype, a skin is a small dial, and the craft skins are cousins. Try-on lets a maker change the *shape* (the big lever) and, later, drive the skin from brand voice. Skin-divergence work is tracked separately; it is not part of this build.
