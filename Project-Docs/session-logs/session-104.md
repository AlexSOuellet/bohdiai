# Session 104 — 2026-10-14

**Nothing is written into the code any more; Saltmarsh polished; the demo keeps its weekdays.** Everything below is merged to `main` and live.

## No words in the code (the big one)
- Alex: "NOTHING should EVER be written into the code … buttons too. A maker may want to change them. Separate them but do NOT create an admin screen for them right now." This replaces the 2026-10-13 site-vs-platform line (platform words used to stay in code). CLAUDE.md and memory (`feedback_no_words_in_code`) carry the new rule.
- **`site_words`** (migration `20261014000002`): one row per spot per site (`card.form.send` → "Send message"; blanks are named, "Order {n}"). Alex chose ONE table: no per-design master list; a site's words are written when it's built.
- **`lib/site-words`**: `WordShape`, `Words`, `wordsFrom`, `fill`, `keyWords` (test words = their own keys), `getSiteWords` (a spot with no word shows blank and is logged).
- Every design names its spots only (`<design>/words.ts`, every leaf blank) and reads the site's words: card/one-pagers (`card`, 181 spots), nursery (`nursery`, 152), contractor (`contractor`, 81), family (`family`, 67), plus the shared shop pieces: page titles, search titles, sample strip, cart/subscription stubs (`shop`, 48). Old strings files deleted; `DEFAULT_STRINGS`/`DEFAULT_COUNTS`/`DATE_LOCALE` gone (`REFERENCE_LABELS` stays: internal mood/family/skin names, never on a storefront).
- All 51 sites got their words with `scripts/site-words.ts load` (and `copy <from> <to> <prefix>` for a new site), each checked spot for spot. Live vs local pages compared word for word across all four groups: identical (the only differences were an invisible React marker beside a quote mark).
- `lib/archetypes/modular-rules.test.ts` now fails on any word in a design's spot list or typed into a page; the site/platform register is gone.
- Dev logs no longer print server-action arguments (Alex's password showed in the terminal).
- **Still in code, "fine for now" (Alex):** privacy/terms templates, server error messages, payment app names (Venmo, Cash App, Zelle), symbols (signature dash, discount minus, arrows). In Open-Work.
- The conversion was done by four helper agents in parallel (one per design group, plus card tests and the shop pieces), checked and finished by Claude.

## About you (backend), then a stop
- About you got the founder quote, who it's from, the portrait (saves on pick) and up to 12 marquee phrases, with "Some designs show this" notes.
- Alex edited the short line on the About screen and it didn't show on the family hero: the line above the name and the sentence under it have two homes (About you for the newer designs, the moment for family designs). Alex: **"The ABOUT page should NOT change the hero."** Claude's fixes went back and forth; Alex: "This is being way over complicated", "WHY are we being bogged down right now in the edit screens. The site needs to look good first", "I DO not want to do this site by site". The two-homes fix was reverted and is open in Open-Work (talk it through before touching it). Backend screens wait; looks first.

## Saltmarsh (Alex's design review, all six items + both bugs)
- Lena's portrait (generated, "at her bench", navy-and-rose bottle) is her About you portrait, pinned to the story card in the same weathered frame as her pieces, on the home page and About.
- Prices in the plain lettering; names keep the handwriting.
- Phones: one-line menu under the name, slim sale strip. Collection buttons get a solid back. Shorter gaps (phone page ~500px shorter).
- First screen: tried a product card in the sky, then three small pieces; Alex: **"it is a DEMO"** — the opening shows prospects what a site can be, not a shop chasing sales. Back to the name on the sky, plus a "Visit the shop" button, with only as much sky as needed so the shelf follows close.
- Visitors see markets not marked finished (`listVisitorMarketDates`, every design), so today's market leads "Find me at".
- **Saturday fairs stay on Saturdays** (migration `20261014000003`, Alex approved): new `tenants.demo_week_day`; the timeline moves by whole weeks; today's market (with its sales, holds, costs, pieces) moves to today daily. Applied once, it put Saltmarsh's existing fairs on their nearest Saturday; `demo-reset` now places fairs on Saturdays (`lib/backend/demo-days.ts`). Proof: `node scripts/check-demo-keeps-weekdays.mjs` (rolled back). Saltmarsh is the only demo site.
- Today's market renamed "Market on the Common" (it's always today).
- `BohdiAI-Briefing-for-Chat.md` brought up to date and committed.

## Lessons
- **Show, don't argue, and keep it short.** Alex lost patience with long option lists and explanations; when he says "STOP complicating this", give the plain answer and wait.
- **Ask before reading a remark as a direction.** "it is a DEMO" had several readings; asking saved a wrong build.
- **Node's fetch drops the Host header** (undici); compare local shop hosts with curl. Git Bash rewrites a bare "/" argument into a Windows path: `MSYS_NO_PATHCONV=1`.
- **Phone review:** Alex can't open localhost on his phone; send phone-size screenshots, or push when he says so.
- Shell heredocs with quotes still break: write edit scripts to files.

## Still open (next)
- The top-of-page line's two homes (About you vs the moment): talk it through with Alex first.
- Backend screens for the moment and section words (waiting; looks first).
- Words still in code (above); build scripts writing new sites' words; a words screen (not now).
- Rustic Rhody's hero; the public demo (personal copies, welcome page, simulated payments, Learn).
