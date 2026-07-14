# Niche Entry Self-Check

Run through this list before declaring a niche entry done. Both files — the prose markdown AND the style sheet JSON. If any answer is no or unsure, revise.

## Prose frontmatter

- [ ] `slug` is short, lowercase, underscore-separated, and stable.
- [ ] `display_name` is the customer-facing label that will appear in onboarding.
- [ ] `tenant_type_fit` is the right array — `[seller]`, `[doer]`, or `[seller, doer]` — based on what the business actually does.
- [ ] `aliases` includes the alternative names a maker in this category might actually use when picking from the onboarding list.
- [ ] `related_niches` lists adjacent categories the maker might grow into.
- [ ] `status` is `draft`. (Approval happens after human review, not in the skill.)

## Prose structure

- [ ] All seven body sections are present, in order, with exact names: What this business does / Brand exemplars across the range / Who their customers are / How they talk about their products / Common specializations and variations / What customers ask before buying / Adjacent niches.
- [ ] No "Visual direction range" section, no "What tends to surface on the storefront" section, no "What to avoid" section. Those are deliberately removed — visual direction belongs to the mood pick and Bohdi's deliberation.

## Prose — bias avoidance

- [ ] No sentences shaped like "Most <niche> makers are…", "The typical <niche> buyer is…", "The genre has converged on…", or "Successful brands all…".
- [ ] Buyer types are plural archetypes, not one dominant frame.
- [ ] The brand-exemplar section names at least three distinct positionings — not three brands in the same direction.
- [ ] At least one exemplar sits outside the obvious premium-D2C cluster (devotional, folk, subcultural, community-rooted).
- [ ] **No visual descriptors in brand exemplars.** No palette descriptions, no font names, no layout language, no aesthetic adjectives. Describe positioning, voice, pricing, what makes them distinctive in their market — not what their site looks like.

## Prose — craft

- [ ] Concrete specifics throughout — real material names, real customer behaviors, real product sizes, real ranges. No vague placeholders.
- [ ] Category-specific vocabulary captured (genre terms, naming strategies, common claims, material language).
- [ ] Price ranges (if included) are bands with positioning context, not single numbers.
- [ ] Variations are framed as starting suggestions, not a fixed schema.
- [ ] What-customers-ask is grounded in observable concerns (reviews, FAQ patterns) — not in priors.

## Style sheet — palette

- [ ] 15 named colors.
- [ ] Each named for a specific material or thing — never "primary," "accent," "secondary."
- [ ] At least two near-blacks and two near-whites; the rest span the value range.
- [ ] At least one or two unexpected anchors — pulls that break out of the obvious palette.
- [ ] No feel-word names ("moody," "playful," "sophisticated"). Names are material, not adjective.

## Style sheet — fonts

- [ ] At least 14 named fonts. All real Google Fonts (verify at fonts.google.com).
- [ ] Categories are structural (`refined-serif`, `slab-serif`, `humanist-sans`, `condensed-caps`, `typewriter`, `script`, `western-display`, etc.). No feel words.
- [ ] Spans the catalog — not 14 serifs and call it a niche.

## Style sheet — wordmark

- [ ] 4 to 6 wordmark fonts.
- [ ] Each is genuinely a display font — would look ridiculous at body size.
- [ ] Distinct from the heading fonts in the general fonts array.
- [ ] Includes character options beyond the obvious — heavy display, blackletter, oversized geometric, hand-tooled, extreme-contrast serif.

## Style sheet — textures (Editor Door 2 shelf feed)

> **⚠ REVISION PENDING (Session 72).** The direction below (photorealistic material-photography prompts per niche) is superseded. Alex clarified that textures should be NEUTRAL atmospheric surface overlays that pick up color from the maker's palette via blend modes, not photos of the niche's materials. Do not run this checklist's texture section until the direction lands. See `session-logs/session-72.md`.


- [ ] 3 to 5 texture directions — never fewer (not a shelf) and never more (turns the picker into a scroll).
- [ ] Each entry has `key` (kebab-case slug, becomes the filename), `name` (title-cased picker label), and `prompt` (self-contained generation prompt).
- [ ] Each direction is a **genuinely different material world** within the niche — not five variations on the same surface (no shipping five wood grains for a woodworker). If two would look the same at wallpaper opacity, one doesn't earn its slot.
- [ ] Each `name` is recognizable to someone in this trade — real material vocabulary, not "texture 1."
- [ ] Every `prompt` includes: specific material with its authentic details; even/diffuse lighting language (`evenly lit`, `no directional shadows`); no-text/no-watermark/no-border/no-vignette guard; a "fills the frame" or "close-up scan" framing hint; `Photorealistic. Real material.` (no illustration, no CGI, no 3D render).
- [ ] Each prompt is two or three sentences — specific but short enough that a downstream generator won't drift. Model-specific incantations (aspect ratios, "seamless tileable", generator flags) are NOT in the prompt; they belong to the ingestion pipeline.

## Final read

- [ ] Reading the prose, do you have a clear sense of who's in this category, how they vary, what their customers care about, and what vocabulary the AI should use?
- [ ] Reading the style sheet, can you picture how a leatherworker × dark site would differ from a leatherworker × cheerful site using the same materials?
- [ ] Would a maker reading the prose feel seen across the range of possible positionings, or pigeonholed into one?
- [ ] Does the style sheet match the woodworker reference's bar of specificity? If anything reads generic ("moss green," "sleek sans," "natural texture") — revise.
- [ ] Reading the three-to-five texture prompts, can you picture five different material worlds a maker could pick between in Editor Door 2? If two prompts would produce visually similar PNGs, revise or drop one.

If every box is checked, both files are ready for human review.
