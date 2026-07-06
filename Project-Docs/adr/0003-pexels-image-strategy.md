# ADR 0003 — Placeholder Product Image Strategy (Pexels + Supabase Cache)

**Date:** 2026-05-25
**Status:** SUPERSEDED — Pexels was replaced by fal.ai FLUX Pro image generation during Bohdi crew work (Session 40 era). The AI Image Studio in Phase 2 remains fal.ai-based. Preserved for the reasoning trail.

## Context

At onboarding, the AI generates placeholder product listings. Each listing needs a product image so the storefront looks real. Options considered:

1. **No images** — placeholders only. Storefronts look empty and unconvincing.
2. **Unsplash** — requires attribution on free tier. Unacceptable for a maker's storefront.
3. **Pexels** — free, no attribution required, generous API limits.
4. **AI image generation (fal.ai / Higgsfield)** — ~$0.05–0.10/image, adds 10–30s to generation time. Deferred to Phase 2 Dashboard AI Image Studio.
5. **BohdiAI proprietary library** — possible long-term via Higgsfield batch generation, but not at Phase 1 launch scale.

## Decision

Use Pexels for onboarding placeholder images. Each AI-generated listing includes a `pexels_query` field (2–4 words). The query is used to fetch a matching photo from Pexels, which is then downloaded and cached in Supabase Storage under `placeholder-images/{niche-slug}/{photo-id}.jpg`.

On subsequent onboardings in the same niche, the cache is checked first to avoid redundant Pexels API calls and speed up generation.

Image URLs are stored in `listings.metadata.image_url` (JSONB), not in `listings.media_ids` (which is a `uuid[]` column for internal storage references).

## Consequences

- Zero cost for placeholder images at current scale.
- Cache warms per-niche: the first generation fetches from Pexels, subsequent ones serve from Supabase Storage.
- If Pexels API fails, generation continues — `image_url` is `null` and the block shows "Photo coming soon."
- Makers replace placeholder images with their own in the Phase 2 dashboard.
- AI-generated proprietary images are a Phase 2 feature via Dashboard AI Image Studio.

## Alternatives considered

Unsplash was rejected due to the attribution requirement. AI generation was deferred because it materially increases onboarding time and cost without a proportional quality gain at Phase 1.
