# Session 98 — 2026-10-08

**Headline:** Renee is in her backend. BohdiAI has a new logo (the ember wordmark), live on bohdiai.com with a sticky header. New business cards, logo files and a Facebook cover/profile picture are in `Design files/`. The 24-hour invite link is built but parked until Alex changes the Supabase setting.

## What happened

- **Renee's invite had expired** (sent 2026-10-07 07:33, links last 1 hour, she was never confirmed). A fresh link went out 2026-10-08 08:31. Her account already existed, so it had to be a recovery token; it was sent with the invite wording ("your backend is ready") from a one-off script, not `scripts/invite-maker.ts` (which sends reset wording for an existing account). **She signed in at 08:44.**
- **Why invites fail:** the Supabase email link lasts 1 hour; makers open email later. Discussed: maker-started "First time here? Set up your account" (six-digit code, email must already be on a shop) — **Alex liked it, not built**. Temporary password from Alex — offered, not chosen.
- **24-hour links — parked on branch `fix/auth-link-24h`** (commit b082b1c): the email says "expires in 24 hours" (test guards "an hour" from coming back; an earlier commit 14aaf49 had deliberately set "an hour" to match Supabase). **Do not merge until Alex sets Supabase → Authentication → Sign In / Providers → Email → "Email OTP Expiration" = 86400.** No management token in `.env.local`, so Claude can't change it.

## What shipped (live, Cloudflare build green)

- **Ember wordmark** (`components/Wordmark.tsx`, tests): "Bohd" + dotless ı with a small solid flame as the dot + "AI" lighter. Uses Manrope via `var(--font-display)`; Manrope now loads `latin-ext` for the ı. In the header (22px), footer, privacy, terms. `Ember` = the flame with a b-round burned through (hollow); the tab icon `app/icon.svg` is that on the dark tile.
- **Sticky header** (`components/Header.tsx` + `HeaderBackdrop.tsx`, tests): `sticky top-3`; a solid full-width `bg-bg` strip fades in after 8px of scroll so content doesn't show between the pills (Alex: frosted/80% still read as "floating words"). `html, body { overflow-x: clip }` (was hidden — hidden made body its own scroller and sticky never stuck). FAQ items `scroll-mt-24`.

## Design files (not in git — `Design files/` is untracked)

- `logo/` — `logo-options.html` (the four directions: A ember, B hallmark — Alex disliked, C lit window, D wordmark; A+D chosen), wordmark light/dark PNG (~4466px) + PDF (vector, font embedded), `BohdiAI-ember` (hollow) SVG/PNG, `BohdiAI-flame` (solid) SVG/PNG, `BohdiAI-ember-tile` SVG/PNG. No outlined-SVG wordmark (would need the Manrope TTF).
- `business-card/business-cards.html` — the card page: preview + dark / light / mixed toggle + Print Avery 8371 sheet (fronts page, backs page). Exported: `BohdiAI-business-cards-ember-{dark,light,dark-front-light-back}-Avery-8371.pdf` and 600dpi faces `BohdiAI-card-ember-{dark,light}-{front,back}.png`. Old B cards kept. Claude recommended the mixed version; Alex to test-print.
- `facebook/` — `facebook-cover.html` → `BohdiAI-facebook-cover.png` (1640x624). All words in the top band and the middle ~556px: phones crop the sides and centre the round profile photo over the bottom middle. `BohdiAI-facebook-profile.png` (1080, ember on dark).
- Exports ran with Playwright + system Chrome (one launch, hard timeout) — fine this time.

## Lessons

- **Invites need time, not just a link.** A one-hour link to someone who checks AOL once a day fails. Prefer flows the person starts themselves.
- **Fonts in `tailwind.config` use literal family names** (`'Inter Tight'`, `'Manrope'`), but next/font registers hashed names — so the literal names may only match if installed locally. The wordmark uses `var(--font-display)` to be safe. The rest of the site was not checked; worth a look.
- **"Not sure I like it" → ask which part** before changing anything (menu sticking vs. what it looks like while sticking). Alex's answer pinned it: see-through.

## Open / next

- Alex: Supabase "Email OTP Expiration" = 86400 → then merge `fix/auth-link-24h`.
- Build the maker-started sign-up (six-digit code) — liked, not yet a go.
- Share image (`app/opengraph-image.tsx`) has the name as plain text, no ember yet — optional.
- Alex: upload Facebook cover + profile; test-print the cards.
- Facebook "notes" question unanswered — Alex to say where he sees them.
