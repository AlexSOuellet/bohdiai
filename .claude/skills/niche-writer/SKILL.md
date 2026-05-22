---
name: niche-writer
description: Research and write a BohdiAI niche entry — the prose body and metadata that grounds AI site generation for a category of small business. Use this skill whenever the user asks to write, draft, create, research, or add a niche (e.g., "write a niche file for tattoo artists", "research the bakery niche", "draft a niche for dog groomers", "add a candle niche"), or whenever a new niche needs to be created to support tenants in a category BohdiAI doesn't yet cover. This is the canonical process for producing a niche entry that meets the platform's quality and bias-avoidance rules — do not freelance the structure or skip the research phase.
---

# Niche Writer

## What a niche is

A BohdiAI niche is a database row (per Tech Arch Spec §6) that holds reference content the AI consumes when generating storefronts, product copy, and design tokens for tenants in a category. One niche row covers one broad category of small business — `candles`, `tattoo_artist`, `dog_groomer`, `bakery`. The row has structured metadata (slug, display name, tenant types, aliases, related niches, status) and a body of markdown prose that the AI reads.

The point of a niche entry is to give the AI grounding it can use to generate sites that feel built for *this kind of business*, while leaving room for individual tenants to express their own voice via mood pick, inspiration URLs, and their own assets.

## When you write a niche entry

Most often you write a niche entry because:

- A new launch-list niche is being added to the platform and an agent or the lead developer is producing the first version.
- An Other-path tenant identified a niche we don't have yet, and the platform is producing a draft entry from the captured signal.
- An existing niche entry is being refreshed because the category has shifted or the original was thin.

In every case the output is the same shape — metadata fields plus body_markdown — and the process below applies.

## How you know which niche to write

The skill does not pick the niche for you. The niche to write is always supplied by the operator (the human, the calling agent, or the upstream pipeline) when the skill is invoked.

What you should expect to receive as input:

- **A niche name.** Either a proposed display name ("Dog Groomers", "Bakery", "Tattoo Artists"), a slug ("dog_groomers"), or the free-text input a tenant typed during onboarding when picking Other ("estate sale organizer", "lullabies pressed onto vinyl from voicemail recordings").
- **Tenant type fit.** Whether the niche is `seller`, `doer`, or both. If the operator did not supply this, infer it from the niche name and confirm it in the frontmatter — a baker is seller, a plumber is doer, a tattoo artist is both. If genuinely ambiguous, stop and ask.
- **Optional context.** When the niche came from an Other-path tenant, the operator may supply the maker's typed description and any inspiration URLs they pasted. Use this material as a starting input to the research phase — it tells you something about the niche you wouldn't have known from the name alone.
- **Optional related-niche hints.** The operator may name niches they consider adjacent. Use these to inform your research starting points and your `related_niches` frontmatter field, but don't treat them as authoritative — your research may surface different adjacencies.

If the input you received is just a niche name with no other context, that's fine. Treat the name as the only input and run the process below.

If the input is ambiguous, contradictory, or so vague you can't run productive research from it (a one-word slug that could mean three different things, or a description that conflicts with the niche name), stop and ask the operator for clarification rather than guessing. Producing a draft from misunderstood input wastes everyone's time.

The operator typically invokes the skill with a sentence or short brief. Examples of inputs that are sufficient to start:

- "Write a niche for dog groomers."
- "Draft a niche for bakeries that handle both retail and wedding cakes."
- "An Other-path tenant typed 'estate sale organizer' and described their work as 'helping families clear out homes after a death or downsize, including pricing, staging, and running the sale weekend'. Write a draft niche for them."
- "Refresh the candles niche — the original was thin on devotional and ritual positionings."

## Output format

Produce a single markdown file (this becomes the seed for a row in the `niches` table) with YAML frontmatter for the metadata and a body following the section template below.

```markdown
---
slug: candles
display_name: Candle Maker
tenant_type_fit: [seller]
aliases:
  - candle making
  - soy candles
  - candle company
related_niches:
  - soap
  - bath_and_body
status: draft
---

# Candles

## What this business does
...

## Brand exemplars across the range
...

(remaining sections per template below)
```

New entries always start at `status: draft`. They are reviewed by a human (or designated approver) before being promoted to `approved` and made visible in onboarding. Never set status to `approved` yourself.

## The process

Work in three phases in order: research, synthesize, draft. Do not skip the research phase even when you know something about the niche. The point of writing the niche file is that the file is grounded in observable market data, not in priors.

### Phase 1: Research

Goal: build a grounded picture of the category from real sources.

**Step 1 — Surface the names.** Run two parallel web searches:

- One for top independent or notable brands/businesses in the category. Use phrasing like "top independent <niche> brands", "best <niche> small business", "notable <niche> brands".
- One for marketplace-side data — Etsy bestsellers, Shopify success stories, or trade-publication roundups for the category.

The two angles together surface names from different parts of the market. Capture five to eight names that span different positionings, not five names that all look the same. If everything coming back is premium D2C, search again with phrasing that surfaces budget, devotional, traditional, subcultural, or community-based players.

**Step 2 — Study the brands.** Fetch four or five of the names in parallel, asking each fetch to capture:

- Voice and visual style
- Homepage structure (what sections appear in what order)
- How products are described — vocabulary, naming strategy, scent/material/feature language
- How they describe themselves (about page, origin story)
- Product types, sizes, categories, and how they organize them

If a fetch fails or returns empty, retry with the redirected URL or move on — don't get stuck on one source. Aim to study three to five sites that span the positioning range, not five sites in the same direction.

**Step 3 — Gather category vocabulary.** Search for:

- How buyers and makers talk about the products (genre-specific terms — "hot throw" for candles, "lead time" for woodworking, "lot tracking" for skincare, etc.).
- Common customer concerns, complaints, and questions in reviews.
- Variation conventions in the market (sizes, materials, formats that have become standards).

This phase produces the raw material for the body sections that follow. If you're moving fast, run the brand-name search, the brand-study fetches, and the vocabulary searches in overlapping parallel rather than strictly in series.

### Phase 2: Synthesize

Goal: distill the research into patterns that hold across multiple sources.

Identify what's consistent across the brands you studied: vocabulary that recurs, structural patterns shared across sites, customer concerns that show up in multiple sources. Those become facts in the body.

Identify what's *not* consistent: things one brand does that no other does. Those are individual choices, not category facts. Don't promote them into the body as if they were category-wide.

Identify the range of positionings you observed. The brand-exemplar section is where this lives. Make sure you can point to at least three distinct positionings (warm artisanal, design-forward, traditional/devotional, occult/ritual, folk/vintage, subcultural, luxury storytelling, minimal modern, etc.) and have a real brand or business type to anchor each one. If you only found one positioning, your research was too narrow — go back and search again with different angles.

### Phase 3: Draft

Write the markdown file following the section template below. Apply the bias rules throughout (next section).

## Section template (in order)

Every niche entry has these sections, in this order, with these names. Don't invent new sections or rearrange — consistency lets the AI consume entries reliably across the library.

1. **What this business does.** Two or three grounded paragraphs describing what makers in this category actually produce or do, how their operations typically look, and where they distribute. Stay descriptive, not aspirational.

2. **Brand exemplars across the range.** Name three to eight real brands or business types, each anchoring a different positioning in the category. For each one, give a short paragraph capturing their positioning, voice, visual signature, and what makes them distinctive. These are anchors for what a polished version of each direction looks like — not targets the maker must imitate. End the section with an explicit note that a tenant could land anywhere across this range, including places not on the list, and that the mood pick and inspiration URLs are what choose direction.

3. **Who their customers are.** Describe the buyer types in the category (self-buyers, gift-buyers, functional buyers, collectors, subcultural buyers, and any niche-specific archetypes). For each, a sentence or two on motivation. Then a paragraph or two on concerns and considerations that recur across most segments (with category-specific vocabulary). If price ranges have observable conventions, include them as ranges, not single numbers, with a clear acknowledgment that positioning shifts them.

4. **How they talk about their products.** The vocabulary of the category. What kind of language recurs (perfumery notes for candles, "from the studio" framing for ceramics, lead times for commissioned work). The naming strategies makers use (descriptive, character/personality, place-based, intention/function, time-of-day, cultural reference, etc.) with examples drawn from the brand exemplars. What kind of phrasing reads flat (corporate language almost always reads flat in handcraft categories). The role of the maker's story.

5. **Common specializations and variations.** The sub-identities and axes that exist within this niche. For Seller niches this tends to be product-level variation axes (scent, size, wax type for candles; wood species, finish, food-safety status for woodworkers) — the dimensions makers vary across their catalog. For Doer niches this tends to be specializations — the sub-areas a practitioner works in (piano, guitar, voice, drums for music teacher; wedding, newborn, family portrait, headshot, brand for photographer; math, science, languages, SAT prep for tutor). For hybrid niches the section covers both. Phrase entries as starting suggestions that the maker picks from, never as a fixed schema. This section is read by the onboarding chip picker, so each distinct item should be short and self-contained enough to surface as a checkbox option. Include any common bundle, collection, or subscription patterns observed.

6. **What customers ask before buying.** A short list of questions that recur in the category, framed as "the AI's job in product descriptions, FAQ, and storefront copy is to answer these without the customer having to ask". Pull from the research on customer concerns and reviews. End with a one-line note that storefronts that answer these clearly tend to outperform ones that don't.

7. **Visual direction range.** Five to eight distinct visual sensibilities observed in the category, each named and briefly described. Tag each with the positioning it tends to come from. Lead the section with an explicit statement that the category contains a wide range of visual sensibilities — not a single dominant aesthetic — and that the mood pick and inspiration URLs are what choose among them. Close with anything that holds true across visual directions (e.g., photography conventions that work regardless of mood).

8. **What tends to surface on the storefront.** Blocks and widgets the AI should weigh when composing a tenant's storefront in this category. Lead with a note that the mood pick and inspiration URLs drive the layout — this section just lists what tends to be useful. Each item is a short paragraph: name the block or widget, briefly explain why it tends to help in this category.

9. **What to avoid.** Negative examples specific to the category. Stock imagery, vague descriptions, inflated claims, generic positioning, hiding the maker, jargon without context. Five or six items as a bulleted list with brief explanations.

10. **Adjacent niches.** Categories makers in this niche commonly expand into. Acknowledge that some content in this file will share with the adjacent niche files. End with guidance for whoever writes those adjacent files later — lean on this one for the shared parts, focus on what's specific.

## Bias-avoidance rules

The biggest mistake in writing a niche file is the monolithic generalization — collapsing a wide category into a single profile and tilting every storefront the AI generates toward that profile. Per D14, never make blanket claims about who the makers are, what aesthetic the category prefers, or what demographic the buyers belong to.

Specifically, the file must never contain sentences shaped like:

- "Most <niche> makers are <demographic>..."
- "The genre has converged on <single aesthetic>..."
- "The typical buyer is <profile>..."
- "Successful <niche> brands all <do X>..."

Instead:

- Describe **ranges** with examples spread across positionings. "The visual direction range in this category includes warm artisanal, minimal modern, luxe ornate, dark and occult..."
- Describe **buyer types** as plural archetypes, not one dominant frame. Self-buyers, gift-buyers, functional buyers, etc.
- When citing brand exemplars, deliberately span positionings. If you cite three premium D2C brands, you've failed the rule — find a devotional maker, a folk/vintage Etsy shop, an occult or ritual brand, a subcultural brand, and so on.
- Frame visual and stylistic tendencies as **tendencies that the mood pick overrides**, never as conventions the maker should conform to.

The customer's inputs at onboarding — mood, inspiration URLs, their own assets — add to the research in this file, they don't replace it. The platform does the heavy lifting of grounding each niche in the full range of the category; the tenant adds their flavor on top. The file should describe the territory; the tenant chooses the direction.

Two craft-quality rules also apply throughout:

- **Specifics over abstractions.** Real scent notes, real material names, real customer behaviors, real product sizes, real pricing ranges. The AI generates better copy when fed concrete inputs. "A relaxing scent" is dead copy; "bergamot, vetiver, and a thread of black pepper" is alive.
- **Tendencies over rules.** Anything visual or stylistic is framed as a tendency the mood pick overrides. Anything functional (vocabulary, customer concerns, variation axes) can be stated as category fact.

### Phase 4: Audit

Goal: catch mechanical and bias-rule violations before the entry lands anywhere.

The skill bundles an audit script at `scripts/audit.py`. Pipe your draft markdown into it; it returns a JSON report and exits 0 on pass or 1 on fail.

```bash
python scripts/audit.py path/to/draft.md
# or
echo "$draft_markdown" | python scripts/audit.py
```

The audit checks frontmatter shape (required fields present, valid values for slug, tenant_type_fit, status), all ten template sections present and in the right order, no forbidden sentence patterns (the monolithic generalizations from the bias-avoidance rules), at least three brand exemplars in the brand-exemplar section, the visual-direction section frames a range with mood-pick override language, and no stub-length sections.

The audit report looks like this:

```json
{
  "pass": false,
  "issues": [
    {
      "severity": "error",
      "rule": "monolithic_makers_buyers_claim",
      "detail": "Sentence flattens the category — 'most makers/buyers...'. Rewrite as a range or as plural archetypes. Offending sentence: \"Most candle makers gravitate toward warm tones.\""
    }
  ]
}
```

If the audit returns `"pass": true`, proceed to Phase 5.

If it returns `"pass": false`, you have two choices. Either fix the issues and re-run the audit until it passes (preferred — the issues are specific and addressable), or accept the failure and let Phase 5 route the entry to the review folder for a human to fix. Fixing in place is the right default; routing to review is the fallback when an issue can't be cleanly resolved from automated checks (a research gap, a structural call that needs judgment).

The audit catches mechanical and pattern-based issues. It does not catch subtle bias, voice that's off, or factually wrong claims about the niche. Passing the audit means the entry is structurally sound and bias-rule-clean — not that it's been judged for content quality.

### Phase 5: Disposition (single write)

Goal: write the entry once to its final location based on the audit result. Don't write to an intermediate location and shuffle.

If the audit passed: write the entry to its niches destination. Today, before the niches database table is built, that means writing the markdown file to `content/niches/<slug>.md` — these files become the seed for the database when it exists. Once the niches table is live, write the entry directly via the Supabase API at `status: draft` (the row exists but is not reachable from onboarding until human approval moves it to `status: approved`).

If the audit failed and you chose to route to review rather than fix: write the entry to `content/niches/_review/<slug>.md` along with a sibling file `content/niches/_review/<slug>.audit.json` holding the audit report. The review folder is the inbox for human eyes — every entry there is waiting for a fix or a judgment call.

Either way it's a single write. The agent does not write to a draft location and then move; the audit result determines the destination before the first write.

## Self-check pass

The audit covers the mechanical rules. This list covers the judgment rules the audit cannot enforce. Run through it before triggering the audit:

- Does the entry name at least three distinct *positionings* (not three brands in the same direction) in the brand-exemplar section?
- Is everything visual or stylistic framed as a tendency the mood pick overrides, not as a rule?
- Are the variations described as starting suggestions rather than a fixed schema?
- Are price ranges and customer concerns grounded in observable data, not in priors? If you can't point to a source for any specific claim, either ground it or remove it.
- Does the file include vocabulary specific to this category that the AI should know (genre-specific terms, naming conventions, common claims)? If not, more research is probably needed.
- Are brand exemplars cited as anchors and not as targets? Is it explicit that the tenant could land anywhere across the range?

A clean self-check plus a passing audit is the readiness bar.

## Notes for the operator (the human or agent driving this skill)

- Research time scales with how unfamiliar the category is. Familiar categories (candles, jewelry, baked goods) can be researched in two to four minutes with parallel fetches. Unfamiliar or niche categories (estate sale organizing, devotional candle makers, haptic memory products) may take longer or may legitimately produce a thinner entry.
- If a category is so novel that no useful research surfaces, this skill is the wrong tool. The novel-product onboarding branch (D15) handles those tenants differently and does not produce a niche entry. Stop and surface the issue rather than writing a low-quality entry.
- The reference file `references/candles-example.md` shows a finished niche entry following these rules.
- The reference file `references/section-checklist.md` is a quick checklist to use during the self-check pass.
