# Session Brief — BohdiAI

**Last updated:** 2026-05-22 afternoon (Master Spec reconciled with decisions, widgets concept added as D13, niches moved from files to a database table per D17, niche-writer skill built with audit script, launch queue of ~260 niches assembled in priority order)

**Update at the end of every session.**

---

## Picking up tomorrow

The planning side of Phase 1 is in good shape. The Master Spec, Decisions Log, and Tech Arch Spec are reconciled — a fresh reader can move through them without hitting contradictions. The niche-writer skill is built and tested. The launch queue of candidate niches is assembled in priority order. The remaining open items are mostly downstream creative work (the mood vocabulary, the launch scope for blocks and widgets) and the actual implementation kickoff (Supabase migrations).

What's left before the spec is fully build-ready:

1. The mood list — the curated vocabulary customers pick from at onboarding. Examples exist in the decisions log ("dark and stormy," "rustic," "warm and cozy," "summer afternoon," "autumn landscape") but the full launch list hasn't been defined.

2. The blocks and widgets launch scope — which of the many possible variants ship at launch. This needs the implementation phase to start before it gets pinned down.

3. The agent runtime — Cowork agents that work through the niche-writer queue don't exist yet. The skill is ready; the dispatcher / agent loop infrastructure isn't built.

4. Implementation kickoff — Supabase migrations for every table in the Tech Arch Spec. Alex's call on when to start. Niches table is what unblocks the agent queue; everything else can come in parallel.

Natural next move is either starting implementation (database migrations) or finishing the remaining creative scoping (mood list, launch block/widget scope). Alex's call.

---

## Required reading at session start

Do not skip any of these. The cite-or-shut-up rule in CLAUDE.md requires it.

1. `CLAUDE.md` at the project root — orientation, the cite-or-shut-up rule, and the plain-English-in-chat rule.
2. `project-docs/SESSION-BRIEF.md` — this file.
3. `project-docs/BohdiAI-Master-Spec.md` — the product spec, in full. Today's session reconciled it with the decisions log; sections §2, §6.2, §6.3, §6.4 (new widgets section), §6.6, §6.7, §8, and §17 were rewritten. The contents list was updated. It should now read consistently end-to-end.
4. `project-docs/BohdiAI-Roles-Workflow.md` — roles and process.
5. `project-docs/Phase-1-Decisions-Log.md` — seventeen decisions now (D1–D17). Several added or amended this session — D11 was split (blocks half stands, niches half superseded by D17), D13 (widgets), D14 (niche files anchor against the full range, tenants add inspiration on top), D15 (novel-product onboarding branch), D16 (Other-path adjacent-niche route), D17 (niches live in a database table).
6. `project-docs/Tech-Arch-Spec.md` — the full database design. Section 6 was rewritten this session as the niches table; section 7 was updated to cover both blocks and widgets libraries; the tenants table gained `secondary_niche`, `niche_description`, `specializations`, `specialization_notes`, `niche_from_list`, and `inspiration_urls` columns.
7. `.claude/skills/niche-writer/SKILL.md` — the niche-writer skill, complete with research / synthesize / draft / audit / disposition phases.
8. `content/niches/_queue.yaml` — the launch queue of ~260 candidate niches in priority order.
9. `content/niches/candles.md` — the reference niche file the niche-writer skill copies from.

---

## What we accomplished today

This was a long, dense session. The major work clusters:

### Master Spec reconciliation

Five sections of the Master Spec were contradicted by the decisions log entries from yesterday. All were rewritten this morning, plus a new section was inserted later to introduce widgets.

- **§2 (Target Audience).** Reframed around the Seller / Doer / hybrid model. Service providers are no longer "future" — they're in Phase 1.
- **§6.2 (AI-Generated Variation).** Replaced "niche boundaries constrain design" with mood-driven design plus customer assets.
- **§6.3 (Modular Component Assembly).** Removed the "3-4 variants per section" placeholder language; reframed as many variants over time with Cowork agents replicating the pattern. Mood drives block selection and order, not just within-section variants.
- **§6.4 (Widgets — the functional layer).** New section introducing widgets as the functional pieces that thread into block slots, distinct from blocks as visual containers. Subsections renumbered downstream (Vibe Slider became §6.5, Claude Vision §6.6, Build Approach §6.7).
- **§8 (Niche Specialization).** Heavy rewrite. Removed the structured niche schema framing. Seller-defined variations per D4. Niche content as AI input data per D5. File-based architecture per D11 (now superseded by D17 — niches live in a database table; the §8 framing of the content remains accurate, just the storage moved).
- **§17 (Phasing Summary).** Rewrote the Phase 1 bullet list to reflect Doer listings, customer accounts, reviews, gift cards, promos, content pages, analytics, social links, and shipments-from-day-one — the full launch scope per D9.
- Contents list updated.

### Widgets decision (D13)

The Master Spec talked about blocks as if they handled everything visual and functional. Today we surfaced that the functional layer (booking calendars, contact forms, price displays, add-to-cart buttons, product cards) is a distinct concept from blocks. Blocks are visual containers with declared slots. Widgets are the functional pieces that fill the slots. The AI picks blocks for visual feel and threads widgets into the slots for function.

Block content schemas declare slots with shapes (`primary`, `cta`, `inline`, etc.). Widgets declare what slot shape they fit. Compatibility is shape-based, not enumerated — a new widget with `slot_shape: cta` automatically fits every block declaring a `cta` slot. Cowork agents can add blocks and widgets independently with no cross-coupling.

The Tech Arch Spec section 7 was renamed to "Blocks and widgets libraries" and gained subsections describing widget meta exports, the build-time manifest script, and how blocks and widgets connect via shape-based slots.

### Onboarding decisions (D14, D15, D16)

The candles niche file got rewritten multiple times this session as we worked out the bias-avoidance framing. The end state:

- **D14.** Niche files anchor against the full range of the category by naming real brand exemplars across different positionings. The bias to avoid is the monolithic generalization ("most candle makers are X," "the genre has converged on Y," "the typical buyer is Z"). The platform does the research; the tenant adds their flavor on top via mood pick, inspiration URLs, and their own assets. Tenants table gained `inspiration_urls` (text[], max 3).

- **D15.** Truly novel products (where research returns nothing usable) trigger a different onboarding flow. Plain-English language acknowledges the situation, the maker is asked two targeted grounding questions (the 30-second pitch and what they don't want it to feel like), and the resulting site is framed as a preliminary draft for collaborative refinement. Concierge help is the safety valve behind it.

- **D16.** The Other-path has two routes. Most Other-pickers identify a closest secondary niche from the list and type a description — the AI uses the secondary niche file as grounding plus their description as specialization. A maker who genuinely can't find a closest secondary takes the D15 novel-product branch. Tenants table gained `secondary_niche` (text) and `niche_description` (text).

### Niches storage decision (D17)

Alex pushed back on D11's call to keep niche content in markdown files. The original reasoning was sound for blocks (component-plus-metadata stay in sync) but didn't apply to niches (pure content, no code coupling). D11 was split — blocks half stands, niches half is superseded by D17.

D17 moves niches to a database table. Schema is in Tech Arch Spec §6 — slug as primary key, status workflow (draft / in_review / approved / retired), body_markdown column, version-history subtable, and the Other-path interaction baked in. The founder admin can add and edit through a form, Cowork agents can write directly via the Supabase API, the chicken-and-egg problem for Other-path niches has a clean solution, and the niche library can grow without per-niche deploys.

### Specializations mechanism

For collapsed niches (Music Teacher covering all instruments, Tutor covering academic subjects, Photographer covering wedding/newborn/family/etc.), the maker needs a way to specify their sub-area at onboarding. The mechanism uses the niche file's `Common specializations and variations` section as the chip source — the maker ticks chips that fit them and adds free text for anything not in the chips. Both feed AI generation.

Tenants table gained two more columns: `specializations` (text[] of structured picks) and `specialization_notes` (text, free-form). The niche-writer skill template was updated to make the section dual-purpose (product variations for Sellers, sub-specializations for Doers, both for hybrids) and explicit that the section feeds the chip picker.

### Niche-writer skill

Lives at `.claude/skills/niche-writer/`. Contents:

- `SKILL.md` — the main instruction set. Describes the three phases (research → synthesize → draft) plus the audit phase that runs the bundled checker, plus the single-write disposition step (pass writes to niches destination, fail writes to a review folder with the audit report alongside). Includes the bias-avoidance rules, the section template, and a self-check pass for the judgment rules the audit can't enforce.
- `scripts/audit.py` — Python checker that reads a niche markdown file (path arg or stdin) and reports whether it meets the rules. Validates frontmatter shape, checks all ten template sections are present and ordered, scans for the forbidden bias patterns, counts brand exemplars, checks the visual-direction section frames a range with mood-override language, flags stub-length sections. Returns JSON, exits 0 on pass / 1 on fail. Tested against the candles file — caught one real issue (stale `status: active` value) and passes clean once fixed.
- `references/candles-example.md` — the candles niche file as a finished reference for agents to copy from.
- `references/section-checklist.md` — the judgment-rule checklist to run before triggering the audit.

The skill bundles the audit script (rather than relying on agents to remember the rules) and uses a single-write disposition (rather than draft-then-move) to avoid the file-shuffling Alex flagged as wasteful.

### Launch queue

`content/niches/_queue.yaml` holds the candidate launch list — roughly 260 entries in priority order. Built by combining Alex's 400-line `niche_categories.txt` reference with the queue I'd assembled earlier, plus the categories we surfaced as missing (digital products and creator economy, content creators, spiritual and alternative healing, food maker spectrum, pet products as maker niche, 3D printer, magnet maker), then cutting pure duplicates (~30), employee-only roles (~30, mostly hospitality kitchen/floor and front-desk staff), research-only academic specializations (~15), and archaic trades (~10). Borderline cases (rare-but-real specialty trades) were kept — the list is a vocabulary, not a gate.

Priority structure:

- **P0 (14 entries)** — must-have at launch. Spans the full audience. Candles (done) plus jewelry maker, baker, photographer, hair stylist, soap & bath maker, ceramicist, woodworker, tattoo artist, dog groomer, fine artist, florist, tutor, personal trainer.

- **P1 (~130 entries)** — high priority. Solid coverage across handcraft sellers, food and agriculture, personal care, wellness, music and instruction, trades, pet, creative services, events, professional services, real estate, digital products / creator economy.

- **P2 (~110 entries)** — nice-to-have. Specialty trades, rare artisan crafts, instruction specialties, wellness specialties, narrow service categories, edge identities.

A handful of late-session splits: Knitter and Crocheter separated (different techniques, different communities). Reiki Practitioner kept its scope while Sound Healer split off (different instruments and practice). Mentalist & Stage Magician added as P2 in the events cluster (entertainment-side, distinct from Spiritual Advisor reading-side). 3D Printer added as P1 (physical-product side). 3D Modeler bumped to P1 (digital-product side). Magnet Maker added as P1.

Most other "collapsed" entries (Photographer, Florist, Baker, DJ, Solo Medical Practice, Solo Dental Practice, Mental Health Practitioner, Music & Performing Arts Teacher, Tutor) stay collapsed. The specializations chip mechanism handles the within-niche differentiation at onboarding. As Alex put it: as long as the combined ones have a way to specify, we build out as we grow.

### Architectural guardrails Alex set this session

A few principles surfaced in pushback this session that shape future work:

**Plain English in chat, no exceptions.** Repeatedly flagged. The reflex toward section IDs, jargon, and bullet-heavy structure is a documentation habit that doesn't belong in conversation. Caught me multiple times this session reaching for "D14" or "scripts/" or "frontmatter" when conversational paragraphs would land better.

**Don't gatekeep by category.** The platform serves 1-5 person businesses — scale is the filter, not industry. A small restaurant, a solo therapist, a two-chair salon, a mobile mechanic, a CPA — all welcome. The "out of scope" list I'd had in the queue was bias and got removed. The list is a vocabulary, not a gate.

**Don't assume customers stay small.** "1-5 person business" is the design target, not a ceiling. Today's solo candle maker may be tomorrow's brand with a hundred employees. The platform should serve them well while they're with us and not pre-judge the trajectory.

**Push back on the lead developer reflex toward unnecessary steps.** Alex flagged the audit-then-shuffle file pattern as wasteful processing. The audit became a single-write disposition (pass writes directly to destination; fail writes directly to review folder with the report alongside). One write, not three.

**The list is a vocabulary, not a gate.** Applies to the niche queue, the chip picker, the onboarding flow. The platform trusts the maker's self-identification. If someone signs up as a "Cooper" (rare barrel maker) or a "Falconer" or a "Mentalist," that's a real business and they're welcome.

**Don't invent under pushback.** When Alex pushes back, acknowledge and wait for clarification rather than filling the gap with a new guess. Caught me multiple times in this session reaching for the next collapse or split when I should have paused.

**Critical eye and don't be conservative on the list.** When my initial list was ~145, Alex pushed it to ~260+ by surfacing the categories I'd missed (digital products, content creators, food maker spectrum, spiritual healing) and the bias I'd imported by excluding categories. More breadth, more granular identity, trust the maker.

---

## Where the queue stands

The launch queue at `content/niches/_queue.yaml` has roughly 260 entries grouped by:

- P0 — 14 must-haves (1 done, 13 pending)
- P1 — ~130 high-priority entries across handcraft, food, services, creative, professional, digital products
- P2 — ~110 specialty and nice-to-have entries

Status flags: `done` for candles, `pending` for everything else. Marking an entry `skip` removes it from the agent queue.

The queue uses person/identity language (Baker, not Bakery; Tattoo Artist, not Tattoo Studio) per Alex's framing — most makers identify themselves as the role they do, not as a business entity.

---

## Files modified this session

The list is long. Roughly:

**Decisions log** — five new decisions added (D13–D17), D11 amended to split into blocks-half (stands) and niches-half (superseded). Several intermediate drafts of D14 as we worked through the bias framing.

**Master Spec** — five sections rewritten (§2, §6.2, §6.3, §8, §17), new section inserted (§6.4 widgets), subsections renumbered downstream, contents list updated.

**Tech Arch Spec** — §6 entirely rewritten as the niches table with column-by-column rationale, status workflow, RLS sketch, version history sub-table, and Other-path interaction; §7 renamed to "Blocks and widgets libraries" with subsections added covering widget meta and shape-based slot matching; tenants table gained six new columns (`secondary_niche`, `niche_description`, `specializations`, `specialization_notes`, `niche_from_list`, `inspiration_urls`) with column-by-column rationale.

**Niche-writer skill** — new directory at `.claude/skills/niche-writer/`. `SKILL.md`, `scripts/audit.py`, `references/candles-example.md`, `references/section-checklist.md`. Section name `Common variations sellers use` renamed across all four files to `Common specializations and variations` to reflect the dual purpose (product-level variations for Sellers, identity-level specializations for Doers).

**Candles niche file** — new at `content/niches/candles.md`. Drafted by hand, rewritten three times this session (initial draft, neutral rewrite, brand-exemplar rewrite). Section name updated to match the skill template. Status set to `approved`.

**Niche launch queue** — new at `content/niches/_queue.yaml`. Roughly 260 entries in priority order. Built by combining Alex's reference list with the gaps we surfaced.

---

## Open items still ahead

The big ones, in rough order:

1. **Implementation kickoff** — Supabase migrations for the Tech Arch Spec tables, starting with the foundational ones (tenants, tenant_members, subscriptions, design_tokens, niches) and working outward. The niches table is the immediate blocker for agents working the queue.

2. **Mood vocabulary** — the curated list customers pick from at onboarding. Examples exist; the launch set doesn't.

3. **Block and widget launch scope** — which variants ship at launch. Foundation supports any number; launch scope needs picking once we're building.

4. **Cowork agent runtime** — the dispatcher / loop / orchestration infrastructure that lets agents work through the niche queue autonomously. Skill is ready; runtime isn't.

5. **Niches table seed** — the candles file becomes the seed row for the candles niche when the table goes live. Future niches written by agents land directly via API.

6. **Onboarding flow detail** — the three-path Other branch (adjacent / novel-product / list-picked) plus the chip picker that reads from the niche file. Design work that happens when we get to building onboarding.

---

## Local environment gap (still open)

The `.env.local` file still has the disabled legacy service_role Supabase key. Alex needs to update it (Supabase Dashboard → bohdi-ai → Project Settings → API Keys → copy the current Secret key into the `SUPABASE_SERVICE_ROLE_KEY=` line) before Claude can run admin scripts against production Supabase from this machine. Not blocking unless we hit direct database operations outside the app.

---

## Lessons banked this session

**Plain English is non-trivial when the work is documentation-shaped.** The reflex toward "D14" and "§6.2" and "scripts/" is strong when discussing platform architecture. Alex called this out multiple times. The fix is to actively suppress the reflex — talk about "the decisions log entry on novel-products" not "D15," "the audit script" not "scripts/audit.py," "the tags block at the top" not "frontmatter."

**Don't gatekeep by category.** I imported D2's "1-5 person business" target as a hard exclusion list of industries. Alex corrected — the scale is the filter, not the industry. Restaurants, salons, attorneys, CPAs, mechanics, and therapists are all welcome at the small-business scale. The platform serves; it doesn't decide who's allowed.

**Trust customer self-identification.** When someone types in their niche, that's their identity. The platform's job is to serve them, not to second-guess whether they really belong. Even rare or unusual identities (Cooper, Falconer, Thatcher, Mentalist) get the same trust.

**Conservatism on the list is bias too.** Starting at ~145 entries felt comprehensive until Alex pointed out I was being conservative. The actual universe of BohdiAI-fit small businesses is much bigger than what's documented in the obvious sources. Pushing to ~260 forced me to look at the categories I'd default-blind to — digital products, content creators, alternative healing, the food maker spectrum.

**Single-write disposition over multi-step shuffling.** The audit-then-move pattern I initially proposed was wasteful. Alex flagged it; I refactored to single-write based on audit result. Same principle applies elsewhere — every "and then we move it" step is worth questioning.

**Don't invent under pushback.** Multiple times this session when Alex pushed back, my reflex was to fill the gap with a new guess instead of pausing for the actual answer. The right move under pushback is to acknowledge, ask what he means, and wait for clarification.

**Document everything, every session, completely.** Alex flagged at the end that nothing was committed and the session brief wasn't updated. Without complete documentation, the next session starts blind because Claude has no memory across sessions. Today's lesson — the session brief update and the commit are not optional housekeeping. They're how continuity works on this project.

---

## Previous session summary (kept for context)

Yesterday: Tech Arch Spec drafted end-to-end (~25 tables across 20 sections), three decisions locked (D10 trial mechanics, D11 file-based niche and block storage, D12 shipments as a first-class table from day one), foundation audit complete.

Phase 0: marketing site live, double-opt-in waitlist working, founder cap behavior, full Next.js + Vercel + Supabase + Resend + Cloudflare stack, design system port from Claude Design output. Done and shipped.
