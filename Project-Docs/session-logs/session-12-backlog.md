## Session 12 test results — backlog (most items closed in session 13)

The first candles canary generated successfully in session 12 (cathys-candles, 7:41 build, $0.75, 14 turns). Two production bugs were fixed during that test (StepBuild AbortController teardown in Strict Mode; MAX_TOKENS bumped 4096→16000). Alex's eye on the live result produced 11 backlog items. State of each as of end of session 13:

1. **Hero scrim when text on image.** ✅ DONE session 13. Overlap got a `scrim: 'none' | 'light' | 'dark' | 'auto'` field; default auto injects a gradient sibling between image and layered text.

2. **Marquee works great.** No action needed.

3. **Bohdi invents URLs.** ✅ DONE session 13. Layout-engine system prompt now enumerates the canonical routes (`/`, `/about`, `/shop`, `/listings/{slug}`, `/collections`, `/collections/{slug}`, `/subscriptions`, `/cart`, `/contact`, `/#events`). Button tool description repeats the list at the point of decision. Did NOT change Button to format hrefs from a pattern — kept free-text so external URLs and anchors still work; the prompt + tool description is the constraint.

4. **Collection cards collapse when no image.** ✅ DONE session 13. CollectionGrid + FeaturedCollection render text-only card with palette background + foreground when resolved collection has no `imageUrl`. Underlying gap (collections table has no `image_url` column) still applies — would still need a column + dashboard upload to give collections real images.

5. **Bands too wide.** ✅ DONE session 13. Band gained `contentWidth: 'narrow' | 'normal' | 'wide' | 'full'`; default normal (~max-w-5xl, 1024px) centered. `'full'` opts out for true full-bleed. Outer section still bleeds for backgrounds; inner div caps content.

6. **Mobile text scrunched.** ✅ DONE session 13. Text node gained `mobile: { role? }`. Default behavior: auto-step one role down on mobile (headline→sub, sub→body, body→caption). Explicit mobile.role wins.

7. **Still feels stacked.** OPEN. Bohdi reaches for vertical band stack as the safe geometry. Three real forks pending Alex's direction: art-director second-agent pass; prefab partial-tree patterns Bohdi can study; lean harder in the prompt only. Session 13 did NOT touch this — needs Alex's call.

8. **Speed/cost (tools gated by niche).** ✅ DONE session 13. `toolsForNiche(slug)` in `lib/bohdi/tools.ts` filters the tools list. Layout-engine niches no longer see set_tokens / set_home_page / set_secondary_pages_copy / set_about_page / set_hero_image / set_about_image. Should cut several turns and a chunk of token cost per candles build. Needs a fresh canary to measure the actual win.

9. **Drop voice onboarding step.** ✅ DONE session 13. StepVoice deleted; onboarding is 6 steps; voiceBoothPitch / voiceNegativeSpace removed from every layer; Bohdi writes the about from niche + mood + shop name. About page still ships.

10. **Replace build ticker + personalized status copy.** OPEN. Alex doesn't like the rotating tip ticker or the "Sarah, choosing your colors…" personalized status. My lean is "show the real work as it lands" — palette swatches appear as authored, fonts appear with sample text, product images pop in as fal returns them. Pending Alex's call on direction.

11. **CI Test workflow failing.** ✅ DONE session 13. Coverage gate failed for most of the project's history at ~13% lines / 9% branches. Wrote 28 new test files; final coverage 99.73% lines / 96.93% branches / 100% funcs / 99.45% stmts. Also widened `.github/workflows/test.yml` to trigger on all branch pushes (was main-only, which is why feature branches couldn't prove green). The fix surfaced and was banked as `feedback_tests_are_part_of_done.md` — tests are part of done from this session forward, not a follow-up.

## Open at end of session 13

- Items #7 (monotonic stacking) and #10 (build screen UX) — both need Alex's direction before more code.
- Database is empty (cathys-candles wiped). Next candles canary should be run against the session-13 build to measure the speed/cost win from item #8 and verify the renderer fixes (#1, #4, #5, #6) look right in a real generation.
- CI ran for the first time on a feature branch when session 13's commits pushed. Confirm the workflow is actually green on `session-12/layout-engine` before merging to main.
- Branch `session-12/layout-engine` carries both session 12 and session 13 work. Naming is now misleading — eventually rebranch or just merge to main and drop it.

