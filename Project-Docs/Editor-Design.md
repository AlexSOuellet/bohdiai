# Editor Design — the maker's store-shaping editor

**Status:** Door 1 ("try a feeling") is **BUILT** (Session 50) — the maker dashboard shell plus the live re-skin editor. Live-testing it surfaced a bigger finding that **reframed the editor's direction** — see the Session-50 section at the bottom ("The catalog is the weak link; the editor as the place you make it yours"). The three-door framing below still holds as the entry model, but the editor's ambition has grown past it. Cross-cutting principles live in `Editor-Design-Notes.md`; the editor's place in the product is in the `feedback_editor_equal_diligence` memory + the Session Brief standing lessons.

This doc is the concrete design. The Session-50 section at the bottom is the current direction; the door-by-door material above it is the original plan that door 1 shipped against.

---

## Why this matters

The core promise is two halves: "we build you a workable, nicely designed, unique site, then YOU edit it to fit YOU better." The generator (archetype + skin + crew) delivers the first half. **The editor delivers the second half**, and it has been under-built relative to the generator. It gets the same diligence: design → build → test → get it right.

## Build approach — ONE door at a time (Alex, Session 49)

We do **not** design all three doors and then build them together. We take one door all the way — design it, build it, test it on a real store, get it right — *then* move to the next. Door 1 ("change mood") is first. Colors and products wait until the mood door is real and good.

This is a deliberate ship-complete-not-partial discipline: three half-built doors is worse than one finished one.

---

## The entry model — a three-door choice

The editor opens by asking the maker **what they want to do**, and lets them choose. We don't force one path, because different makers reach for different things first (a strong-brand maker wants their colors; a proud maker wants their products in; an explorer wants to try looks). The choice itself reinforces "you're in control."

The three doors:

1. **Try a different feeling** ("change mood") — see your store re-rendered in a different feeling, same content. *Designed this session; first to build.*
2. **Use my own colors** — put your brand colors on your site. *Defined, not yet designed.*
3. **Add my products** — swap the stand-in products for your real work and photos (Listings / inventory). *Defined, not yet designed.*

All three must be complete for the B beta (a maker builds it, stocks it, and takes real money — so inventory and selling both matter). They just get built sequentially, door 1 first.

> History worth keeping: door 3 was originally "try different formats" meaning different **archetypes** (the Shop / Counter / Find / Body of Work). That was cut because only Main Street is built — trying on archetypes means building three more whole storefronts, which dwarfs the editor and isn't a beta blocker. It was reframed to "try different **moods**," which is buildable today (we have the feelings + skins) and is now door 1. When other archetypes exist, door 1 can grow from "try a mood" into "try a shape" without changing the maker's mental model — it's still "try a different version of my store."

---

## Door 1 — "Change mood" / try a different feeling (DESIGNED)

### What it is — and what it is NOT

It does exactly one thing: **show the maker what their existing site would look like if they'd picked a different mood at onboarding.** It is not a deep customization tool. Content is never touched. It's "try on a different look on the same body."

### Behavior

- The maker sees the **seven feelings as radio buttons**: Dark, Rustic, Cozy, Modern, Elegant, Cheerful, Industrial. Their current feeling is marked.
- Under the selected feeling, its **paired skins** appear, each shown as a **full style sheet** — the skin's whole palette *and* its fonts, together, with the fonts rendered in the real typefaces. The maker judges colors and type as one package, because the font is part of the decision (they might love the colors but bail on the font, or take the whole thing).
- Picking a feeling + skin **re-renders the maker's site** in that look.
- **Content never changes.** Same products, same copy, same photos, same everything — only the look changes, exactly as if they'd chosen that mood at onboarding. This is a pure **renderer re-skin**: no AI runs, nothing is regenerated or re-written, so content provably cannot drift. It's instant.
- **Fonts ride bundled with each skin here.** The maker does not pick fonts separately on this screen. If they like a skin's colors but not its font, they take the look and change the font later in a **custom edit** — a separate, later tool, not this door.
- **Commit:** trying on changes nothing live until the maker clicks **"Use this look."** It's reversible anytime after.

### Layout — split screen (Alex's call)

Controls on the **left** (feeling radios, then the style-sheet cards for the selected feeling, plus "Use this look"); the maker's **actual, full, scrollable site on the right**, updating live as they choose. Not a thumbnail — the real site, scrollable top to bottom (hero, product procession, the Meet-the-maker beat, footer), because a section that sings in Cozy might be the thing that loses them in Industrial. Live preview beside the controls is the magic of a try-on — watch your own store transform — and it's why "select then click to view" was rejected.

The dashboard is desktop-first, so split screen has the room; on a phone it stacks (controls, then preview).

### Production note

In the real editor the previews render in the **actual skin fonts** loaded live. The Session-49 mock used look-alike web fonts and a single placeholder site, so final judgment on the look waits until it's built on a real store (Sheri's is the test case).

### Why this door is cheap to build

A look-swap is just structure + tokens (+ the skin's fonts) over the **same content and the same images** — the "swap the structure, keep the content, don't rebuild" idea. No crew run, no image regeneration. That's what makes the live, instant, content-safe preview possible.

### Still to confirm (only by seeing it built)

Alex can't fully judge from a mock. Build it on a real store, look at it, then refine. Nothing about the door is "nagging" yet — it's locked enough to build.

---

## Door 2 — "Use my own colors" (DEFINED, not yet designed)

The maker puts their brand colors on their site, applied safely (balanced, readable, can't-break-your-site) over whatever feeling/skin they're on. We may already have their colors (pulled from their logo at onboarding; `brand_colors` exist on the tenant).

**Open questions for when we design this:**

- When the maker uses their colors, what happens to the skin's colors? Their colors **take over** the palette (maker's lean from Claude), or **blend** into the skin's existing palette as a tint? — NOT decided.
- **Whether color decouples from skins at all is an OPEN question, not a ratified decision.** Today a skin bundles color + fonts + structure + treatment together. The "pull color out into its own maker-controlled layer" idea is a *proposal* in the notes, not something Alex has decided (he corrected this explicitly in Session 49). Door 2 is where that call actually has to be made.
- How a feeling's color *character* (Dark really is dark) reconciles with the maker's own colors — the derivation/"balanced palette" work.

## Door 3 — "Add my products" (DEFINED, not yet designed)

Listings / inventory: add and edit products and digital products, organize into collections, photos with Claude Vision auto-fill (title/description/price suggestions). More conventional product-management UI than doors 1–2; the post-onboarding logo upload also lives here. Designed after doors 1 and 2.

---

## Pointers

- Cross-cutting editor rules: `Editor-Design-Notes.md` (single source of truth / no liar toggles; subjective intent → curated levers, never freehand; sync the derived, never silently rewrite the authored).
- The editor's priority and "equal diligence" framing: `feedback_editor_equal_diligence` memory + Session Brief standing lessons.
- Archetype/skin/feeling background: Decisions D32, D35, D41, D51, D56, D58.

---

## 2026-06-21 (Session 50) — The catalog is the weak link; the editor as the place you make it yours

Door 1 got built and live-tested this session. The build is sound and the editor does exactly what it should. But seeing real stores re-skin live, side by side, exposed a problem the tool was honest enough to reveal: **changing the feeling barely changes the look.** This section is the direction we landed on in response. It supersedes the door-by-door framing above as the editor's trajectory (door 1 still shipped against that framing).

### What got built (door 1)

- A real **maker dashboard shell** on the app host (`app.bohdiai.com`) and **on each shop's own subdomain** — a maker signs in on their own site and lands in that shop's dashboard there (Alex's call: makers log in on their own site, not only a central host). Sidebar nav (Home, My Website, and honest "Soon" tags on Listings/Orders/Settings), shop header, sign-out. The bare app root redirects to the dashboard.
- The **"My Website" editor** = door 1: the seven feelings as radio chips, the selected feeling's skins as **full style-sheet cards** (each painted in its own palette and set in its real fonts), and a **live preview iframe** of the maker's real store that re-skins as they click. **Use this look** commits — a pure renderer re-skin (no AI, no regeneration), stashing the prior look for revert. Gated behind an `editor` feature flag (off in prod, on in dev) and shop-ownership.
- Frame protection moved into the proxy so a storefront can be framed only by our own dashboard (the preview) and nobody else; dashboard/marketing/admin stay un-frameable.

### The finding — measured, not vibes

Backgrounds are the loudest signal on a page, and almost the whole shelf lives in one cream-to-white band. Measuring background luminance (0–255):

- **Cozy** — all six skins L 219–243 (every one a warm pale).
- **Elegant** — all four L 234–248 (all pale).
- **Cheerful** — all six L 239–250 (all cream/white; the accents vary and saturate, but the grounds don't).
- Only **Dark** (and the dark half of Industrial/Modern/Rustic) leaves the band.

So flipping Cozy → Elegant → Cheerful barely moves the dominant color; the accent and font do change, but they're the quiet part, so the whole impression clusters. We built most of the shelf in the exact cream-and-pastels register that reads as "another AI builder" — the thing we explicitly position against. Fonts compound it: the shelf is **serif-heavy** (a dozen-plus refined serifs), so two skins side by side read as cousins, and there is **not a single script face**, which a lot of makers reach for.

**The editor is fine. The shelf it reveals is the weak part.**

### The direction

**Spine (agreed):** onboarding builds a safe, good, general store (Main Street, as today); the **editor is where the maker makes it truly theirs.** This is the second half of the core promise, restated — not a new idea, but now the centre of gravity.

**Floor — genuinely expressive parts (do regardless):** the skins must actually express the feeling they belong to. The light moods have to *leave the cream band* (Cozy genuinely dim-and-warm, Elegant deep or jewel-toned, Cheerful on saturated grounds). The font shelf needs real range and boldness, **including script** — placed as a display/wordmark voice on the skins where it fits, never as body or tiny labels (legibility). This is the raw material everything else mixes; bland parts make even the best editor look flat.

**Ceiling — curated mix-and-match:** grow the editor from "try a feeling" into "**mix and match your own**" — pick this hero or that hero, this section order or that, this treatment or that. The hard rule that frames it: **the maker can never break their store** (Master Spec §6.5; `Editor-Design-Notes.md`). So it is **curated Lego, not a blank canvas** — a set of pre-designed parts where *every combination is guaranteed to compose*. Free-form drag-anything is explicitly out; that reintroduces the broken-page risk the whole archetype engine exists to prevent.

**Section order varies by feeling:** within Main Street, a feeling should change *which sections lead and in what order* (Rustic leading with the maker's story, Cozy leading with goods), not just the paint. This is the original Master Spec §6.3 promise that Main Street never implemented, and it partly reopens the earlier call that treatment/layout isn't tied to mood (D49) — so it's a real decision, taken deliberately, with a **hand-designed composition per feeling** (not free reshuffling) so it always stays composed.

### The open strategic fork (NOT decided)

How we get stores to look genuinely different from each other:

- **(a) One rich archetype** — make Main Street expressive enough (color + font + section order) that feelings really differ on the same shape. Cheaper; no onboarding archetype-assignment problem; but every store is still fundamentally the same shape.
- **(b) A small library of distinct shapes** — build the other archetypes we designed but never shipped (the Counter "what's fresh this week" baker — *June's Sourdoughs*; the Find; the Body of Work) and let makers try them on. Genuinely different looks *and* business fit (the Counter's rotating-stock/pickup model Main Street can't express). Bigger commitment; each is a whole storefront; reopens "how does a maker end up on the right shape" (D35's reason for one-at-launch).

Trying to make one archetype shape-shift through moods is half-fighting the reason archetypes exist. Claude's lean is (b) is the stronger differentiation bet, but it's the bigger build and changes what "next" is. **This is Alex's call and is not yet made.** The existing plan already assumes makers try on other shapes *after* the safe build (D35) — we just never built the shapes to try on.

### Proposed sequence (one piece at a time, show-don't-tell)

1. **Re-ground the skins for real expressiveness** — tonal range out of the cream band + a bolder font shelf including script + fewer serifs. Bring specimens to react to before locking (the show-don't-describe rule for visible-output decisions). Needed under either fork.
2. **Section-order-by-feeling** within Main Street — curated, hand-designed composition per feeling.
3. **Grow the editor toward curated mix-and-match** — swappable, always-composing parts.
4. **Decide the one-rich-archetype vs. library-of-shapes fork** — and if (b), build the Counter next and stand up the "try a different shape" flow.
