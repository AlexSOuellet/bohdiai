# Session 106 — 2026-10-16

**The maker intake form is live and turns into a site with one command; the big push landed (every family sells, the one builder, Spotlight trial, Vintage); makers make their account on the form and publish their own site; free sites; old samples converted in place; search details come from the homes.** Everything is merged to `main` and live. `main` is the only working branch (two old parked branches remain: `feat/maker-checkup`, `fix/auth-link-24h`).

## The intake form (bohdiai.com/start) — live
- Alex: the first list was "too much, people will walk". Final form: the plan they signed up on (filled in from the pricing page; they can change it), name, business, email, **a password they choose**, what they make (one sentence), **5 to 10 pieces, one photo each** (name, price or blank for "ask me", optional line), a few sentences about them, an optional photo of them, and a **mood**.
- Mood = one tile per family, read from the family list in code, so every family present and future appears on its own (Alex: "It should all present and future"). Today seven (Vintage included); Scenic and Spotlight appear when they become families. Each tile shows its family's background.
- Photos are shrunk on the maker's phone, then again to WebP, stored in the **private `intake-photos` bucket**. Saved to `intakes` (+ `user_id`, `plan`, `billing`, `family`) and `intake_pieces`; all or nothing. Alex is emailed (no photos in the email: "they are still in the db").
- Every word lives in `intake_words` (`scripts/intake-words.ts load tmp/intake-words.json [--update] [--prune]`; the json is in tmp, gitignored). The modular-rules test scans the form.
- The pricing page's maker buttons now say "Start your site" and open the form with `?plan=…&billing=…`. Contractor plans still go to the contact form.
- Account on the form (Alex rejected invites: "not a viable option"): a new email gets a confirmed account; an email with an account must use that account's password, never changed. A failed send removes an account it made.

## From submission to site
- `scripts/intake-to-site.ts <intake-id> --subdomain <s> --skin <skin> [--family <f>] [--niche] --build [--live] [--no-email]`: saves their photos, **Claude (claude-opus-5-5) drafts the words the maker didn't give** from their words and photos (`lib/build/intake-drafts.ts`; no sample wording in the prompt; the quote must be their own sentence word for word; checked whole by the builder, problems sent back once), lays it out (`lib/build/from-intake.ts`; Showcase pieces become the gallery), builds with the one builder, makes the maker the owner, emails them "your site is ready, sign in at app.bohdiai.com", marks the intake built. Buttons/labels copied from a family site with all of them.
- **Publish button** on the maker's backend home while the site is private: "View my site" (link made on the live site, so it opens) + Publish (asks once). Alex: taking a site offline again is temporary-missing, still to build.
- Builder fixes: a button can't point at a page the plan lacks (Showcase has no shop); **Markets and Gallery follow the plan, never the content** (Alex: "there is not a single scenario" for Markets off).
- Tested end to end on `claude-test-decoupage` (Vintage, Playbill; Saltmarsh's photos, a made-up about). Found: Vintage's opening breaks a long name mid-word on phones; the about card shows an empty frame with no maker photo.
- Not automatic yet: Claude runs the command; Alex picks the skin (and the family on "you pick").

## The big push (merged, live)
Spotlight trial, every family sells, the one builder, Vintage. Fixed on the way: Showreel shop links (typed routes), the editor's feeling list test. Alex on Vintage: "it is NOT going to be what I imagined.. and probably doesn't need to be" → shipped.

## Free sites
`tenants.plan_comp`: `free` (nothing on any plan: Cut-Pro, Mazzone, Rose n' Cat) or `showcase` (Showcase free; Market/Full at their normal price, e.g. the maker offered a free Showcase as marketing). Set with `scripts/plan-comp.ts`. "Your plan" says "Free for you" / "Nothing to pay"; renewals and moving up charge right. Alex: later maybe a one-month Market trial or a percent off.

## Clean-up
- Contractor sites stay (Alex): they only come off bohdiai.com for now.
- No private sites, no copies of non-real sites (Alex: "you make more work than is necessary, and clutter the database"). Change samples in place. Also: don't start building while Alex is still discussing.
- Old family samples **converted in place, on Full** (`scripts/convert-family-sample.ts <s> --plan full`, replaces the copy tool): classic-loafs (Alex likes it, the Cozy sample), aurora-candles, walnut-and-oak, twilight-to-darkness, living-beauty, soul-splatter, knotty-knits, cleanme, heavenly-scents. Every page's words matched except the cart; shop order kept (the old samples had tied timestamps). heavenly-scents lost the made-up "4.9 out of 5" line (reviews kept); soul-splatter's weekday-only markets didn't move. The written search titles/descriptions in their old page records were lost.
- Removed (marked deleted): sheris-dips, soul-splatter-bright, lenticular-lumens, estate-sales-of-new-england, aurora-candles-homes, classic-loafs-homes. **Alex runs the purge** (`scripts/purge-deleted-sites.ts --yes`; Claude can't permanently delete): removes every deleted site and everything that was theirs (34 now).
- The sample strip ("Market sample") is gone from every site.
- Search details for every newer-format site now come from the homes (`lib/storefront/seo-homes.ts`): title from what they make, description from the line under their name, share picture from the opening photo or first piece. Real sites only matter here (Alex).

## Still open
- New bohdiai.com samples, one per family (Classic Loafs is Cozy); the work page switches to them; contractor entries off the page.
- The intake build starting on its own; skin/family picking; an Unpublish button; Vintage's phone name break; the empty about frame.
- Preview links printed by the build scripts don't open live (secret mismatch); makers use "View my site" instead.
- Contractor sites need homes before they can convert (database change, plain list first).
- Test drafts still live as drafts: `paper-and-patina-trial`, `aurora-built`, `vintage-test`, `claude-test-decoupage` (and its intake).

## Lessons
- Keep it short; Alex cuts scope hard ("this cannot be this much"). Don't stretch to find shortcuts when asked "no shortcuts right?".
- Don't make copies or private sites for non-real sites; act in place.
- When Alex is discussing, don't run tools that change things. Finish talking, then build on his go.
- A conversion can drop data no reader shows (search details): check every reader of the page record, not only what the page shows, before clearing it.
- Write shell edits as script files on Windows (heredoc quoting broke several times).
