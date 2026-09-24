# Session 86 — 2026-09-23/24 — Cut-Pro's site built by hand and LIVE

**Outcome:** https://cut-pro-lawncare.bohdiai.com is live and the family loves it. First real
client on the platform, built under the new direction (`Direction-2026-09-23.md`): hand-built,
no onboarding, no editor, no Bohdi authoring. The estimate form is proven end to end on
production (two live requests delivered). Branch `cutpro/brand-colors`, 14 commits, all local
(not pushed).

---

## What got built

### 1. Brand colors take over (platform feature, all archetypes can use it)
- Spec `docs/superpowers/specs/2026-09-23-brand-colors-takeover-design.md`, plan
  `docs/superpowers/plans/2026-09-23-brand-colors-takeover.md`.
- **Decision (Alex):** a client's brand colors REPLACE the mood's palette entirely (not a
  tint). The mood keeps fonts/layout/texture/motion. This settles the open "does color
  decouple from skins" question in `Editor-Design.md` Door 2 — for a shop with a brand palette,
  it does.
- `lib/color/oklch.ts` (in-house OKLCH, no dependency) + `lib/color/brand-palette.ts`:
  `deriveBrandPalette({base, accent, second?})` → full `ColorPair`, readability guaranteed
  (fg ≥7:1 where the surface allows, hard floor 4.5; accent ≥3:1 on both surfaces, shifted in
  lightness only; onAccent pure black/white). 5,000-case seeded property test.
- Stored at `layout_tree.root.brandPalette`; `lib/storefront/brand-palette.ts` parses it and logs
  + falls back to mood colors if malformed. Main Street wires it on all four render paths;
  family wallpaper switches off under a brand palette (it would wash the brand surface).
- `accentOverride` (the older accent-only tint, 2 test stores) left intact; brandPalette wins.
- Editor controls deliberately NOT built — hand-built clients never open the editor.
- `scripts/set-brand-palette.ts` — Claude's tool.

### 2. The contractor layout (new hand-built archetype)
- Alex reframed mid-session: Cut-Pro is **a one-page landing site with a request form, NOT
  the maker moods/formats.** Quality bar: better than the three references he picked —
  birchhilllandscape.com/lawn-installation (best), valleylandscaping.com hydroseeding page,
  atlanticlawnandgarden.com.
- `lib/archetypes/contractor/` — `schemas.ts` (content), `strings.ts` (all UI English),
  `styles.ts` (organizing idea: *the page is laid like sod* — soil-dark ground, seamed green
  strips that unroll on scroll, Anton/Barlow/Barlow Condensed, the flyer's green brush stroke
  behind the tagline in Permanent Marker), `ContractorLanding.tsx` (+ `ContractorShell`,
  `ContractorContentPage` for privacy/terms), `EstimateForm.tsx`, `VideoTile.tsx`,
  `SlowVideo.tsx`, `builder.tsx`.
- Sections: header w/ tap-to-call; hero (text + tall video slab); proof numbers; work wall;
  numbered services; reviews; crew; service-area states; estimate form; footer; phone thumb bar.
- Platform hooks: `ArchetypeBuildSpec.handBuilt` (never on Bohdi's onboarding menu) and
  `pages` (declared sub-pages; StorefrontPage 404s the rest — Cut-Pro has only home + legal).
- **Estimate request:** `lib/estimate/request.ts` (pure parse + email compose) +
  `app/api/estimate/route.ts` — name, phone/email (one required), town, state, services,
  details, up to 5 photos (sharp → ≤1800px JPEG attachments), honeypot, customer as reply-to.
  Every failure path surfaced. Route test runs in the node vitest environment (jsdom mangles
  uploaded File bodies — found while testing; not a production issue).
- Alex's design feedback applied: all videos autoplaying was too much → only the hero
  autoplays, work clips play on hover/tap; type "over the top" → display sizes down ~a third,
  marker font only on the tagline; phones → hero text before video, two-across work wall;
  "videos make me dizzy" → played at 0.6×.

### 3. Cut-Pro's store
- Tenant `bbadff3a-fe8c-432f-9eb9-5fb952cb6c52`, subdomain `cut-pro-lawncare`, business name
  "Cut-Pro Lawncare & Construction" (matches Facebook + flyer), tier basic, types [doer], active.
- Content: `scripts/sites/cut-pro-lawncare.ts` (Claude-drafted copy from their flyer tagline
  "Until we lay it down… the grass will always be greener on the other side", Facebook line
  "We listen to our customers and SHOW UP!", and six 2024 Angi reviews). Built/rebuilt by
  `scripts/build-contractor-site.ts cut-pro-lawncare --media <dir> [--contact-email x]`.
- Brand palette `#0b0b0b` + `#3dae3f` (black + grass green, from their flyer/truck).
- Media from Alex's shared Google Photos album (downloaded with his OK): 11 photos (black
  screenshot borders trimmed, EXIF/GPS stripped, WebP) + 5 clips (ffmpeg, 540/432 wide,
  crf 30-31, no audio). Stored in `tenant-media` under `tenant/<id>/site/`.
  Migration `20260923000001_tenant_media_allow_video.sql` lets tenant-media take mp4 (25MB).
- **Permanent copies:** `C:\Users\Bohdi\Documents\BohdiAi\Clients\cut-pro-lawncare\`
  (`media-web\` = what's uploaded; `originals\` = 321MB album downloads + URL list).
- Estimate requests currently go to **alexsouellet@gmail.com** (Alex's call, for now).
- Facebook page (Chris Bullock, owner, (401) 206-1566, cutprochris@gmail.com) has better,
  more recent reels (17) — not used; originals should come from their phones.

### 4. Deploy + email
- Live site had last deployed 2026-07-07. Deployed via `vercel --prod` from the working tree
  (Alex ran it — the auto-mode classifier blocks Claude from production deploys). Vercel CLI
  token had expired → Alex ran `vercel login`. All env vars the newer code needs were present.
- **Resend key was dead** ("API key is invalid", both Vercel and `.env.local`) — meaning the
  old contact form never could send. Alex made a new key (`Bohdidai_Production`, sending-only),
  put it in Vercel + `.env.local`, redeployed. bohdiai.com confirmed able to send.

---

## The machine crashes (root cause found)
Alex's PC (i7-6820HQ, 32GB) hit 100% CPU / 99% RAM and crashed twice. Cause: a **stale 859MB
Turbopack dev cache** (`.next/dev/cache`, last rebuilt 2026-07-28) made `next dev` balloon to
~all RAM on first compile. Deleting it: server peaks ~1.2-1.5GB, page loads in ~7s. Compounded
by heavy built-in-browser use (Facebook/Photos/landscaping sites) + running the full test
suite. Memory updated (`feedback_preview_does_not_work`): ask before starting the dev server,
never run it alongside the full suite, check that cache first if it chokes, run a free-memory
watchdog when testing.

## Mistakes this session (so they aren't repeated)
- Kept pulling Cut-Pro into the maker moods/menus after Alex had said "not using onboarding
  or editor" — he had to say "we are NOT using the regular bohdiai formats." Hand-built
  clients get their own layout.
- Stabilized the clips with ffmpeg vidstab and uploaded to the LIVE site without looking —
  output was smeared garbage after frame 0 (decoded with 0 errors). Reverted to clean
  encodes. Lesson saved: look at sampled frames of any processed media before uploading.
- Said "I gave you links" — those were from a morning session this session couldn't see.

## Open / next
1. Switch estimate email to cutprochris@gmail.com when the family is ready (re-run the
   build script with `--contact-email`).
2. Copy review by the family: who's in the crew photo (alt text says "Two of the Cut-Pro team
   in the truck"), confirm services (drainage/stonework/patios), "since 2009".
3. Better originals from their phones (the Facebook reels are stronger than the album);
   landscape-orientation clips for desktop; future before/after pairs (same spot, same angle).
4. Flaky test: `SectionEditor.test.tsx` "Write it up sends the conversation…" fails only under
   full-suite load; passes alone. Make it deterministic.
5. Push the branch (all 14 commits are local). Consider moving production to deploy-from-git
   (bring `main` current) — today prod deploys from the working tree.
6. Direction-doc items still open: the marketing site rebuild (samples + portfolio — Cut-Pro
   is the first portfolio entry), price, Vercel vs Cloudflare.
7. Privacy page on Cut-Pro uses the platform's store legal template — review wording for a
   contractor (it was written for shops).
