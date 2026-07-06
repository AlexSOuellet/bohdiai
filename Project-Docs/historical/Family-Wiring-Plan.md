# Family Wiring Plan

**Written:** 2026-07-04, end of Session 63
**Status:** the direction for Session 64 (tomorrow). Not code yet. Alex has NOT signed off on details — this is the plan I'll walk through with him before writing anything.

**Not-lost-track rule** (also saved as memory `project_mood_and_family_naming`):
- **Public term:** mood. The maker picks a mood at onboarding.
- **Internal term:** family. Same thing, different audience.
- **Bohdi authors CONTENT ONLY.** The renderer reads the family and picks every section variant from the family default. Bohdi does NOT pick treatments, ever.

---

## Why this doc exists

Session 63 (today) did a wall of cleanup — inline-styles sweep across 16 archetype components, hardcoded strings extracted to a `DEFAULT_STRINGS` map, LINK_TARGETS extended, collections DB persistence, copywriter prompt updates, fire-and-forget build runner fixed. All uncommitted. All valuable as prep. But **none of it wired the family layer.** Late in the session Alex called out that I'd lost the direction — I was interpreting his "keep working until I can run a full onboarding" as "keep cleaning" when the actual gate is the family layer.

The family layer is what makes a Cozy shop LOOK Cozy and a Modern shop LOOK Modern — different section variants, different section stacks, different type + material, all driven by which mood the maker picked. That layer has been designed for weeks (`Family-Layout-Model.md`, `Family-Style-Sheets.md`, `defaults-matrix.html`, `family-stacks-v2.html`) but no code binds it.

This doc names what has to be wired tomorrow.

---

## What exists today (the substrate)

- **All section treatments are BUILT** in `lib/archetypes/main-street/`:
  - 8 heroes: Story (MomentHero), Split (SplitHero L/R), Stacked, Typographic, Floating card, Editorial cover, Collage
  - 8 goods treatments: Marquee, Constellation (procession), Switcher, Slideshow, Module, Table, Index, Lookbook
  - 7 founder treatments: Quote, Portrait, Letter, Card, Workbench, Editorial, Signature
  - 6 collections bands: Cupboard (Cozy), Crates (Rustic), Portals (Dark), Chapters (Luxury), Color lanes (Cheerful), Cascade (Modern)
  - 4 reviews treatments: Rating, Pull-Quote, Guestbook, Texts
  - 6 find-us treatments: Board, Calendar, Passes, Next Stop, Itinerary, Season Poster
  - 4 nav registers: Standard, Split-center, Menu-reveal, CTA-forward
  - Marquee: one shape, all families (family varies stack position + on/off, not shape)
- **The section defaults per family are DOCUMENTED** in `Family-Style-Sheets.md` (the matrix). Locked for Hero, Goods, Collections, Reviews, Find-us. Open for Founder + Nav.
- **The type packages are DOCUMENTED** in `Family-Style-Sheets.md` — 12 fonts per family, 3 packages per family, one default package per family. No family shares a font. Total 72 faces.
- **The palettes are DOCUMENTED** — one default color combination per family (Cream & Ember for Cozy, Barnwood & Rust for Rustic, Ink & Ember for Dark, Ivory & Gold for Luxury, Confetti for Cheerful, Paper & Ink for Modern).
- **The textures + wallpapers are DOCUMENTED** — one default per family (linen, burlap, smoke, marble, confetti, concrete + matching wallpaper images generated in `tmp/mockups/img/`).
- **Cozy = Main Street** is settled. Main Street's current layout IS the Cozy family layout; we only need to formalize it as a family entry.

The mockups in `tmp/mockups/` show every family × section combination visually.

## What's NOT in code

- No family registry — no `families.ts` or equivalent.
- No mood → family mapping — moods (`lib/moods.ts`) live independent of families.
- No family field on the tenant / onboarding input. Onboarding stores `moodKey`; the tenant carries `mood_key` in the DB.
- No family → section defaults binding. The renderer picks section variants from what Bohdi authored (`content.goods.treatment` etc.) or from a dispatcher fallback (e.g. Reviews falls back to Rating).
- **The D48 dice-roll model still runs.** The pipeline rolls `goods` and `founder` treatments and hands them to the copywriter as his "starting draw." That whole path retires when the family layer picks.
- The copywriter still authors treatment fields the family should own (`goods.treatment`, `founder.treatment`, potentially `collections.treatment` and `findUs.treatment` even though they were added optional).
- The section stack + order in `MainStreet.tsx` is HARDCODED (hero → marquee → goods → collections → founder → find-us → reviews → close). No per-family stack.

---

## What to wire (tomorrow, in this order)

### 1. Family registry — `lib/archetypes/main-street/families.ts` (or similar)

The single source of truth for what each family IS. Every field the renderer needs to paint a family's site lives here. Six entries, one per family. Shape (proposed):

```ts
interface Family {
  key: 'cozy' | 'rustic' | 'dark' | 'luxury' | 'cheerful' | 'modern';
  label: string;                    // maker-facing "mood" name
  description: string;              // one-line mood description
  sectionDefaults: {
    heroVariant: HeroVariant;       // Story | Stacked | ... (from hero-catalog)
    goodsTreatment: GoodsTreatment; // marquee | switcher | ... (from goods.ts)
    collectionsShape: CollectionsShape; // cupboard | crates | ... (per family, six shapes)
    reviewsTreatment: ReviewsTreatment;
    findUsTreatment: FindUsTreatment;
    founderTreatment: FounderTreatment;
    navVariant: NavVariant;
    showMarquee: boolean;
    marqueePosition: 'below-hero' | 'mid-stack' | 'off';
  };
  sectionStack: SectionKey[];       // ordered list — what sections appear, in what order
  typePackage: {                    // one package per family; the editor can offer the other two later
    headers: string;                // font family name
    body: string;
    labels: string;
    accent: string;
  };
  palette: {
    bg: string;
    fg: string;
    fgMuted: string;
    accent: string;
    onAccent?: string;
    rule: string;
    contrastBg: string;
    contrastFg: string;
    contrastFgMuted: string;
  };
  texture: string;                  // named texture (linen, burlap, smoke, marble, confetti, concrete)
  wallpaper: string;                // path to wallpaper image
  imageryGrade: {                   // family grade applied dynamically to normalized images
    saturation: number;
    warmth: number;                 // shift toward warm / cool
    contrast: number;
    grain: number;
    tint?: string;                  // subtle overlay hue
  };
  fontHref: string;                 // Google Fonts URL for the four faces
}
```

All six entries seeded from `Family-Style-Sheets.md`. Two open picks (Founder + Nav) get real picks or documented "TBD" placeholders that the render code handles.

### 2. Mood → family map

The current `MoodKey` type (`lib/moods.ts`) lists seven moods. Six families. Need a one-to-one map — either collapse a mood (which one goes?) or add a seventh family. **Open — Alex decides.** Placeholder for tomorrow: mood keys = family keys, and any mood that doesn't map cleanly retires (Templated was already noted as a deliberate eighth built later per D51).

### 3. Persist the family on the tenant

Either:
- Add a `family_key` column to `tenants` (recommended, explicit), or
- Reuse `mood_key` since we're saying mood == family internally.

Second option is cheaper but couples the two forever. First option keeps them separable if we ever change the maker-facing picker.

The build writes `family_key` at tenant creation. The storefront resolver reads it. Envelope carries it.

### 4. Renderer reads family, not content

Everywhere `MainStreet.tsx` (and pages.tsx and product.tsx) reads a section variant from `content.<section>.treatment`, switch to reading from the family:

```ts
const family = getFamily(tenant.family_key);
const hero = resolveHero(family.sectionDefaults.heroVariant);
// GoodsBeat gets family.sectionDefaults.goodsTreatment, not content.goods.treatment
// CollectionsBeat gets family.sectionDefaults.collectionsShape
// ... etc
```

Preview params (`?goods=`, `?hero=`, `?about=`, `?collections=`, `?reviews=`, `?findus=`, `?nav=`, `?marquee=`) still override for dev, and family-swap in the editor works by temporarily rendering under a different family key.

### 5. Section stack from family, not hardcoded

`MainStreet.tsx` currently hardcodes: hero → marquee? → goods → collections? → founder → find-us? → reviews? → close. Replace that fixed order with:

```ts
family.sectionStack.map((section) => renderSection(section, content, family));
```

Where `sectionStack` for each family is what `family-stacks-v2.html` shows (Alex has proposed but not locked; discuss).

### 6. Copywriter authors CONTENT ONLY

Remove treatment picking:
- Delete `goods.treatment` from `CopywriterDraftSchema`.
- Delete `founder.treatment` from `CopywriterDraftSchema`.
- Delete the treatment-roll model in `pipeline.ts` (D48 retires).
- Remove `collections.treatment`, `reviews.treatment`, `findUs.treatment` from the archetype `MainStreetContent` schema (they were optional; delete the fields entirely).
- Update the copywriter prompt in `crew/copywriter.ts` to STOP telling Bohdi about treatments. No "you drew," no "keep your draw," no mention of goods.treatment options in the prompt.
- Copywriter keeps: shopName, identity (wordmark + nav labels/targets — see below), moment (media prompt + story + eyebrow + brand + sub + CTAs), goods.title + label + viewAllLabel, collections.title + label + viewAllLabel + items, marquee.voice, reviews.title + label + viewAllLabel + items + summary, founder.quote + attribution + eyebrow + heading + photo + aboutLabel + findUs (label + title + eventsLabel + rows), close, about, contact, products.

### 7. Nav — family default OR authored?

The nav VARIANT (Standard / Split-center / Menu-reveal / CTA-forward) is a family default. But the nav LINKS (which pages to include) — does the family default them (per-family stack determines which sections exist, so links follow) or does Bohdi author them? Alex's recent direction (`project_bohdi_no_longer_curates_structure`): family defaults + rules, not Bohdi's editorial pick. So: nav links are derived from the family's section stack (a family that stacks Testimonials includes Testimonials; a family that doesn't, doesn't). Bohdi doesn't author nav items at all. **Open — confirm with Alex.**

If confirmed, delete `identity.nav` from the copywriter schema too and derive nav from family + tenant data.

### 8. Type + palette + textures paint per family

The `skinVarsCss` function reads a "skin" today. Replace with reading a "family" — same CSS var emission machinery, but the values come from the family entry instead of the 29-skin catalog. The 29 skins retire (they were the "single template + skins" model that didn't work). Cozy's Ember skin becomes Cozy's default paint; other Cozy skins become editor variants. Same for the other families.

**OR — do we keep multiple skins per family** (e.g. Cozy has 3 skins the maker can flip between)? Alex's model memory `project_skin_family_relationship_open` says this is undecided. **Open — confirm tomorrow.**

### 9. Imagery grade (per-image, not fixed CSS filter)

Per `Family-Layout-Model.md` build requirement: read image → normalize exposure/WB → apply family grade. This is a real pipeline piece for the image seam (fal-generated hero + product photos + library photos). New work — probably a helper that wraps the URL with a query param or a server-side image processing step. **Can defer past onboarding-runnable** — a first cut without dynamic grading still ships coherent-enough builds; dynamic grade sharpens them.

### 10. Editor "try another family"

The editor's family-swap (mood-swap in the UI) re-renders the site under a different family key with the same content flowed in. Same code path as onboarding — just a different family key threaded through. Persists on save as `tenant.family_key` update. This is post-onboarding; the door 1 in `Editor-Design-Notes.md`.

---

## What of Session 63's uncommitted work stays

Session 63 did a wall of cleanup. Nothing committed. Some pieces align with the family layer, some are stale.

**Stays** (foundation the family layer needs):
- All class-only conversions in `lib/archetypes/main-street/*` — 16 files moved from inline styles to CSS classes in `skinVarsCss`. Families paint via CSS variables + classes; this cleanup is the prerequisite.
- `defaults.ts` with `DEFAULT_STRINGS` map for empty-state copy.
- Preview seeds moved to `__fixtures__/preview-findus.ts`.
- `LINK_TARGETS` extended with `collections` + `testimonials`.
- Reviews home band viewAll wired.
- Collections DB persistence in `build-archetype-store.ts` — this stays; the copywriter authoring `collections.items` is CONTENT (the maker's collection names), the DB write is correct.
- The build runner fire-and-forget fix (`after()`).

**Discard or rewrite** (stale under the family model):
- The copywriter prompt still tells Bohdi "you drew goods.treatment" and "you drew founder.treatment." Both retire when the family picks. The prompt update from today gets a second pass to strip these.
- Any `.treatment` field on the archetype content schema. Delete when we wire the family.

**Neutral** (harmless either way):
- The `moment.sub` requirement, `about` + `contact` heading + intro authoring, `findUs.title`, `reviews.viewAllLabel` — all content, correctly authored.

---

## Open questions for Alex tomorrow

1. **Mood ↔ family map.** Seven moods currently, six families. Which mood(s) collapse or retire? Or do we add a seventh family?
2. **Skins vs. family paint.** Retire the 29 skins entirely and paint from family palettes only, or keep skins as within-family variants?
3. **Section stack per family.** The proposed stacks in `family-stacks-v2.html` (Session 59) — lock them, or revisit? Sessions 57-62 all said "no family→default code wiring yet"; that's what changes.
4. **Nav authoring.** Bohdi authors nav labels + targets today (my memory `project_bohdi_no_longer_curates_structure` says structure comes from family + rules, not Bohdi). Delete `identity.nav` from the copywriter, derive from family?
5. **The two "open" section defaults** — Founder and Nav don't have per-family picks in `Family-Style-Sheets.md`. Do we lock picks tomorrow before wiring, or wire with placeholders and revise?
6. **Family key on tenant** — new `family_key` column vs. reuse `mood_key`. My recommendation: new column, keeps the maker-facing vocabulary and the internal registry key decoupled.

---

## What tomorrow's session probably looks like

1. Walk through this doc together, resolve the open questions.
2. Write `families.ts` (registry, six entries seeded from the style sheets).
3. Migrate: add `family_key` to `tenants` (if that's the call), backfill from `mood_key` where possible.
4. Rewire `MainStreet.tsx` + `pages.tsx` + `product.tsx` to read family, not content, for section variants.
5. Rewire `MainStreet.tsx` section composition to walk the family's stack, not the hardcoded order.
6. Strip treatment picks from copywriter schema + prompt.
7. Test suite update — every current test that assumes Bohdi picks treatments changes shape.
8. Live onboarding run with each of the six families to see how they land visually.

Almost certainly won't all fit in one session. The right stopping point is a runnable onboarding for at least ONE family (Cozy, since Cozy = Main Street already) with the others queued.

---

*End of plan.*
