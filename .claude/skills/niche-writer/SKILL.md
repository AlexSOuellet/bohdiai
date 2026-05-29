---
name: niche-writer
description: Research and write a BohdiAI niche entry — the prose body plus the style sheet that grounds AI site generation for a category of small business. Use this skill whenever the user asks to write, draft, create, research, or add a niche (e.g., "write a niche file for tattoo artists", "research the bakery niche", "draft a niche for dog groomers", "add a candle niche"), or whenever a new niche needs to be created to support tenants in a category BohdiAI doesn't yet cover. This is the canonical process for producing a niche entry that meets the platform's quality and bias-avoidance rules — do not freelance the structure or skip the research phase.
---

# Niche Writer

## What a niche entry is

A BohdiAI niche entry is a pair of files:

1. **Prose body** at `content/niches/<slug>.md` — YAML frontmatter plus sectioned markdown. Read by Bohdi (the generation agent) as the material vocabulary of the category.
2. **Style sheet** at `content/style-sheets/niche-<slug>.json` — a structured list of raw visual materials (palette, fonts, wordmark fonts, textures). Read by Bohdi alongside the mood style sheet as the toolkit he assembles the design from.

Both files together. A prose body without a style sheet leaves Bohdi flying half-blind. A style sheet without prose leaves him without the material vocabulary. The skill produces both in one pass.

## The shape we are NOT producing

Past niche files included sections called "Visual direction range," "What tends to surface on the storefront," and "What to avoid." Those sections directed which moods, blocks, and aesthetics to use — that direction now belongs to the mood and to Bohdi's deliberation. **Do not include those sections.** Visual descriptors should also be scrubbed out of Brand exemplars — describe a brand's positioning, voice, and what makes them distinctive in their market, not what their site looks like.

## How you know which niche to write

The niche is always supplied by the operator. Inputs that are sufficient to start:

- A niche name (display name, slug, or free-text from a tenant's Other-path onboarding).
- Tenant type fit — `seller`, `doer`, or both. Infer if not supplied; if genuinely ambiguous, stop and ask.
- Optional context — the maker's typed description, inspiration URLs they pasted, a sentence of background.
- Optional related-niche hints.

If the input is so vague you can't run productive research from it, stop and ask. Producing a draft from misunderstood input wastes everyone's time.

## The process

Three phases: research → synthesize → draft. Don't skip research even when you think you know the category — the point of the niche file is that it's grounded in observable market data, not in priors.

### Phase 1: Research

**Step 1 — Surface the names.** Two parallel web searches:

- Top independent or notable brands/businesses in the category.
- Marketplace-side data — Etsy bestsellers, Shopify success stories, trade-publication roundups.

Capture five to eight names that span different positionings, not five names in the same direction. If everything coming back is premium D2C, search again with phrasing that surfaces budget, devotional, traditional, subcultural, or community-based players.

**Step 2 — Study the brands.** Fetch four or five names in parallel. For each, capture:

- Positioning and voice — what they say about themselves, how they describe their work.
- Pricing range.
- Product types, sizes, categories, and how they organize them.
- How products are described — vocabulary, naming strategy, material/feature language.
- Origin story or about-page voice.

You do NOT need to capture homepage layouts, color palettes, font usage, or any other visual specifics. Those belong to the mood the maker eventually picks, not to the niche file.

**Step 3 — Gather category vocabulary.** Search for:

- How buyers and makers talk about the products (genre-specific terms).
- Customer concerns and questions that recur in reviews.
- Variation conventions (sizes, materials, formats that have become standards).

### Phase 2: Synthesize

Identify what's consistent across the brands you studied: recurring vocabulary, customer concerns that surface in multiple sources. Those become facts in the body.

Identify what's *not* consistent: things one brand does that no other does. Those are individual choices, not category facts. Don't promote them into the body as if they were category-wide.

Identify the range of positionings you observed. The brand-exemplar section is where this lives. Make sure you can point to at least three distinct positionings (warm artisanal, traditional/devotional, subcultural, luxe storytelling, folk/vintage, minimal modern, etc.) and have a real brand anchoring each one. If you only found one positioning, your research was too narrow — search again.

### Phase 3: Draft both files

Write the prose markdown AND the style sheet. The style sheet rules are below; the prose template is right here.

## Prose section template (in order)

Every niche entry has these seven sections, in this order, with these names. Don't invent new sections or rearrange — consistency lets Bohdi consume entries reliably across the library.

1. **What this business does.** Two or three grounded paragraphs describing what makers in this category actually produce or do, how their operations typically look, and where they distribute. Descriptive, not aspirational.

2. **Brand exemplars across the range.** Three to eight real brands or business types, each anchoring a different positioning in the category. For each: a short paragraph capturing positioning, voice, pricing range, and what makes them distinctive in their market. **No visual descriptors** — no "warm earthy palette," no "letterpress feel," no font names, no layout descriptions. End the section with an explicit note that a tenant could land anywhere across this range, including places not on the list.

3. **Who their customers are.** Buyer types in the category (self-buyers, gift-buyers, functional buyers, collectors, subcultural buyers, niche-specific archetypes). One or two sentences per type on motivation. Then a paragraph on concerns and considerations that recur across most segments, with category-specific vocabulary. If price ranges have observable conventions, include them as ranges, not single numbers, with acknowledgment that positioning shifts them.

4. **How they talk about their products.** The vocabulary of the category. What kind of language recurs. The naming strategies makers use (descriptive, character/personality, place-based, intention/function, time-of-day, cultural reference) with examples from the brand exemplars. What phrasing tends to read flat. The role of the maker's story.

5. **Common specializations and variations.** The sub-identities and axes within this niche. For Seller niches this tends to be product-level variation axes (scent, size, wax type for candles; wood species, finish, food-safety status for woodworkers). For Doer niches this tends to be specializations (piano, guitar, voice for music teacher; wedding, newborn, portrait for photographer). For hybrid niches: both. Phrase as starting suggestions, never as a fixed schema. Each item short enough to surface as an onboarding chip.

6. **What customers ask before buying.** A short list of questions that recur in the category, framed as "the AI's job in product descriptions, FAQ, and storefront copy is to answer these without the customer having to ask." Pull from research on customer concerns.

7. **Adjacent niches.** Categories makers in this niche commonly expand into. Acknowledge content overlap with adjacent niche files.

## Bias-avoidance rules

The biggest mistake is the monolithic generalization — collapsing a wide category into a single profile. The file must never contain sentences shaped like:

- "Most <niche> makers are <demographic>..."
- "The genre has converged on <single aesthetic>..."
- "The typical buyer is <profile>..."
- "Successful <niche> brands all <do X>..."

Instead:

- Describe **ranges** with examples spread across positionings.
- Describe **buyer types** as plural archetypes, not one dominant frame.
- When citing brand exemplars, deliberately span positionings. Three premium D2C brands fails the rule — find a devotional maker, a folk shop, a subcultural brand, a minimalist modern maker.
- Never write aesthetic conventions as something the maker should conform to.

Two craft-quality rules also apply throughout:

- **Specifics over abstractions.** Real material names, real customer behaviors, real product sizes, real pricing ranges. "A relaxing scent" is dead copy; "bergamot, vetiver, and a thread of black pepper" is alive.
- **Tendencies over rules.** Anything visual or stylistic is out of scope for the prose entirely. Anything functional (vocabulary, customer concerns, variation axes) can be stated as category fact.

## Style sheet construction

The style sheet is a JSON file at `content/style-sheets/niche-<slug>.json`. It contains raw visual materials with no role assignments — Bohdi decides which color is background, which font heads, which texture appears where. The sheet is a toolkit, not a recipe.

### Schema

```json
{
  "kind": "niche-style-sheet",
  "slug": "<slug>",
  "note": "Raw materials for a <niche> site. Named only — no role assignments, no feel labels.",

  "palette": [
    { "name": "Specific Material Name", "hex": "#RRGGBB" },
    ...
  ],

  "fonts": [
    { "name": "Google Font Name", "category": "<structural category>" },
    ...
  ],

  "wordmark": [
    { "name": "Google Font Name", "category": "<display category>" },
    ...
  ],

  "textures": [
    "named-texture",
    ...
  ]
}
```

### Palette — 15 named colors

Each color named for a SPECIFIC material or thing from the niche's vocabulary. "Saddle Tan," "Espresso," "Antique Brass," "Walnut Hull" — not "warm brown 1," "warm brown 2." A color named after a real material has a job; a color named "secondary accent" doesn't.

Span the value range. Include at least two near-blacks, at least two near-whites, and a handful of mids. Include at least one or two unexpected anchors — pulls that break out of the obvious palette and give Bohdi options for surprise.

The 15 colors are a toolkit; Bohdi may use 6 or 8 of them on any given site. Don't constrain yourself to "the seven roles" — that's the schema's job, not the curation's.

### Fonts — at least 14 named with structural taxonomy categories

Each font is a real Google Font (verify it exists at fonts.google.com). The category is **structural**, not feel-based:

- `refined-serif`, `high-contrast-serif`, `slab-serif`, `old-style-serif`, `humanist-sans`, `geometric-sans`, `condensed-caps`, `typewriter`, `hand-marker`, `script`, `western-display`, `wood-type-display`, `blackletter`, `mono`

Never use feel words ("elegant," "rugged," "playful," "bold") as a category. Structural taxonomy lets Bohdi compose pairings without being told the answer.

Span the catalog. Don't ship 14 serifs and call it a niche.

**Display and heading fonts have to earn their place.** Headings carry character — they're where the site has voice. A utilitarian sans like Inter, Lato, Source Sans, Open Sans, Roboto, Nunito, Work Sans, Karla, DM Sans, or PT Sans is a fine body font; in a heading role it makes the page read as a template. Headings need a font with character — a distinctive serif with real contrast, an expressive sans with personality, a geometric display face, a careful condensed face. If a font would read as anonymous in a 64px hero headline, it's body-only. Never put one of the utilitarian sans-serifs above as the only serif/sans option for the niche — there must always be at least one character-forward display option and one character-forward heading option available.

### Wordmark — 4 to 6 display fonts specifically for wordmarks

These are heavier, more distinctive, more visually striking than the general fonts array. Wordmark fonts are typically things you'd never use for body or even heading at small sizes — they look ridiculous below 32px and ridiculous at body size. Distinct categories: heavy display, blackletter, oversized geometric, hand-tooled, deeply customized serifs with extreme contrast.

This array is what Bohdi reads when picking the wordmark font. He may also draw from the mood's wordmark options. Curate so the typographic wordmark for a site in this niche × mood has somewhere distinctive to land — not a default heading font played louder.

### Textures — 10 to 14 named material textures

Named for actual textures the niche works with or evokes. "Full-grain veg-tan," "saddle-stitch," "linseed-oil-wash," "kraft-paper" — not "rough texture," "natural feel." Bohdi reads these and decides which surface or accent they apply to.

### Curation rules

- **Specific names, not generic descriptors.** A color named after a real pigment outperforms a color named "primary."
- **No role assignments.** The schema decides which slot a color fills. The style sheet's job is to give Bohdi a vocabulary, not a recipe.
- **No feel words anywhere.** Categories are structural. Names are material. If you find yourself writing "moody" or "playful" or "sophisticated" — stop.
- **The bar is the leatherworker style sheet at `content/style-sheets/niche-leatherworker.json`.** Curate to that level of specificity or higher. Generic palettes get rejected.

## Self-check

Before writing the files, run this list:

**Prose:**
- Three distinct positionings (not three brands in the same direction) in Brand exemplars?
- No visual descriptors in Brand exemplars? (No font names, no palette descriptions, no layout language.)
- Variations described as starting suggestions, never a fixed schema?
- Price ranges, customer concerns grounded in observable data?
- Vocabulary specific to this category included?
- Brand exemplars cited as anchors, not targets?

**Style sheet:**
- 15 named colors, each named for a specific material or thing — never "primary," "accent," etc.?
- At least 14 named fonts, all with structural taxonomy categories, no feel words?
- 4–6 wordmark fonts that genuinely look ridiculous below 32px — heavy display, distinctive character?
- 10–14 named textures, each pulling from the niche's actual material vocabulary?
- Nothing in the sheet that reads as a role assignment or a recipe?
- At least one character-forward display font and one character-forward heading font (no niche where only utilitarian sans-serifs are available for the big type)?

A clean self-check is the readiness bar.

## Output

Two files, written once each in their final location:

- `content/niches/<slug>.md` — frontmatter + 7-section markdown.
- `content/style-sheets/niche-<slug>.json` — palette + fonts + wordmark + textures.

New niches always start at `status: draft` in the frontmatter. They're reviewed by a human before being promoted to `approved` and made visible in onboarding. Never set status to `approved` yourself.

If the niches table is the source of truth, the prose file can be synced to the table afterward (the runner reads the markdown and writes the body_markdown column). The style sheet stays on disk for now and is read by Bohdi at generation time.

## Notes for the operator

- Research time scales with how unfamiliar the category is. Familiar categories (candles, jewelry, baked goods) can be researched in a couple of focused passes with parallel fetches. Unfamiliar or niche categories may take longer or may legitimately produce a thinner entry.
- If a category is so novel that no useful research surfaces, this skill is the wrong tool. The novel-product onboarding branch handles those tenants differently. Stop and surface the issue rather than writing a low-quality entry.
- The canonical reference is `content/niches/leatherworker.md` paired with `content/style-sheets/niche-leatherworker.json`. Hold every new niche to that bar.
- The skill produces drafts. Style sheet curation in particular drifts toward safe and generic when authored quickly — review every output for genericness before it lands. "Moss green" is the failure mode; "Walnut Hull" is the bar.
