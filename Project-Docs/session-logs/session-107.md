# Session 107 — 2026-10-17

**Alex reset the priority order; Scenic and Spotlight became real families (nine families now, all live); a Scenic site's background is its own photo, clip or a generated scene from a searchable library; every Scenic build makes its own photos; bohdiai.com/looks shows Classic Loafs in every mood; bohdiai.com splits into a parent and two marketing arms (decided, not built).** Everything built is merged to `main` and live. `main` is the only working branch (two old parked branches remain: `feat/maker-checkup`, `fix/auth-link-24h`).

## Priority order (Alex) — in `Open-Work.md`
Scenic + Spotlight first; then the bohdiai.com samples (now: Classic Loafs as the one all-moods sample) and the bohdiai.com rework; maker-backend screens (with try-on for Full); Alex's admin; Stripe + Square card payments (online and the market app); the market app done right; plans; delete old samples after testing; added sections; Cut-Pro onto the homes; intake automation later (Alex builds sites by hand first); old-code clean-up; the rest. Decided along the way: maker saves go live at once; no Unpublish (cancelling takes a site down; Showcase is an option offered when cancelling, never automatic); the top-of-page line is never edited from About (settled — don't raise it); design switching for makers dropped, then **try on a look, Full only**, came back for the maker backend (a maker who steps down from Full keeps the look).

## Scenic and Spotlight (live)
- Built like Vintage: own section styles in the family engine (`ScenicPieces.tsx`, `SpotlightPieces.tsx`, `scenic-styles.ts`, `spotlight-styles.ts`), family entries, mood words, intake tiles ("Your work floating over a photo of a place." / "Big photos and bold color, like a show reel.").
- Scenic: name on the open sky (reads the moment only), matted prints, frosted about pane, framed collections, tide-table markets, paper-note reviews. Spotlight: name slammed over the opening photo, work two to a row, color-panel about, collection billboards, big-quote reviews, a dates ticker.
- Skins (Alex liked them all): Scenic = Saltmarsh (new) + Porcelain, Conservatory, Celestine, Atelier; Spotlight = Reel (new) + Hearthstone, Anvil, Nightshade, Marquee, Broadside.
- Saltmarsh and Paper & Patina stay on their own designs (open: does Paper & Patina move onto Spotlight?).

## The photo behind a Scenic page
- `site_scenes` (Alex approved): a library scene or the site's own upload; `tone` light/dark (dark turns the opening's lettering light and dims a clip); `video_upload_id` (a short muted clip loops over the still; phones in battery saver and motion-off visitors get the still).
- Alex rejected the marsh as default ("too specific") and the opening close-up as background. **Every Scenic build makes its own photos** (`scripts/intake-to-site.ts --build`, three or `--scenes 2-4`): Claude plans calm wide places from the maker's words, quiet across the top (`lib/build/scene-art.ts`, no sample wording), fal.ai paints + enlarges 2x (`lib/build/scene-painter.ts`), measured light/dark, stored in `generated-images/scenes/`, added to the **scene library** — the `scenes` table, tagged and searchable by any word (Alex). `scripts/make-scenes.ts <site> [--use]` does it for an existing site. The marsh is only the family's preview picture now.
- Classic Loafs (Alex picked): its own clip, dimmed, light lettering. Four Classic Loafs scenes in the library (counter, wheat field, pantry, kitchen wall).

## Classic Loafs
- The maker is **Christina**; About in first person; review and subscription piece updated. No "Dominique" left.
- Alex: Classic Loafs is the one sample for every mood (same bread, subtle differences show). **bohdiai.com/looks is live**: the real site in a window, one row of the nine moods (each with a color strip), a Computer/Phone switch; not linked yet. bohdiai.com may now frame shops.
- Preview addresses (`?previewMood=…&previewLook=…`) work for anyone and change nothing; try-on for Full needs them locked to the owner.

## bohdiai.com split (decided, not built) — discussed one at a time
- Alex: focus makers, don't rule out service. **bohdiai.com = parent; makers.bohdiai.com (pushed hard first) and service.bohdiai.com (complete, quiet until pushed)** as marketing arms. Reserve "makers" and "service" so no shop takes them.
- **Nothing service comes off bohdiai.com** — Alex meant emphasis off service, not removal (docs corrected; Halfmoon and True Coat were never to be taken down; nothing was deleted).
- Parent top stays: the headline "If you make it, bake it, fix it or fund it…" kept as is; the sample window cycles samples only, nothing real, alternating **Classic Loafs → Halfmoon Roofing → Paper & Patina → True Coat Painting → Saltmarsh** (Classic Loafs never shown twice); doors **"I make things" / "I fix things"**, each to its arm.
- **Open, next question:** below the doors (work, trades list, how it works, your story, pledge, contact) — which stay on the parent and which move into the arms (Claude's suggestion: story, pledge, contact stay; work, trades, how-it-works move; catch: work is the parent's only real-client proof). Also flagged: retire /samples (Ember & Pine is on it), fix the FAQ answer that offers Maker Market on cancel (should be Showcase).

## Corrections Alex made (in memory)
- **Mazzone is NOT a site** — never list it as a site, client, work or proof; only Cut-Pro is real contractor work.
- **Skool is dropped** for good.
- Say "buttons and labels" and "section headings", never "site words"/"section words".
- Hold a reasoned view in discussion; concede only what was actually wrong (Alex: "I give you one pushback and you fold?").
- AI assistants, not Google, are how people find things now: focused single-audience pages matter more than the address.
