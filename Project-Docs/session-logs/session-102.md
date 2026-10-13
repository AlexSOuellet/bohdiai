# Session 102 — 2026-10-13

**A business and design discussion that turned into a structural reckoning.** Nothing was shipped to main. Out of it came `Modular-Plan.md` (the operative plan from here) and `Open-Work.md` (every open item).

## Business discussion (Alex asked for business-analyst and web-designer views on merit)
- **Plans:** Showcase and Market will be the most popular, and Full the smallest. Seasonality shows up as January cancellations more than as plan switching. Answer: offer Showcase at cancel ("drop to Showcase for the winter, keep everything"), and push yearly plans before the fall season.
- **Gallery:** built from the catalog plus other photos. Showcase shows unlimited work as a gallery with no prices (a short hand-picked set inline, "see all" opens the rest), and sold pieces stay. Market and Full get the same gallery, where tapping a for-sale piece opens its page.
- **Downgrade rules:**
  - settle open orders and holds first
  - QR codes land on the home page
  - promotions pause
  - all data is kept and hidden
- **Ecosystem:** Alex means his own training and promotion, not marketing tools inside makers' sites. In-site marketing tools come eventually, not now.
- **Market app research:** `Project-Docs/research/Maker market app competitors.md` (notes in `Project-Docs/research/notes/`). No product combines a site, booth POS, QR self-serve with a hold, and per-market profit. The closest are BoothBrain, TallyTill and Marketspread.
- **Market app decisions:**
  - holds become baskets, with one open basket per phone
  - a 10-minute hold timer, which the maker can change
  - Paid stops the clock
  - the maker can release and sell in one tap
  - offline Market POS goes into the plan
- **Site reviews:** Saltmarsh (Alex loves it; design notes and two bugs in Open-Work), Rustic Rhody (the hero is the problem) and Rose n' Cat.

## Rustic Rhody experiment (branch `explore/bulletin-scene-look`, not merged)
- Photo scene behind the page (`?look=shop|tools`): Alex liked it better than the fake barn wood.
- Carved-sign hero drawn in CSS: Alex said it "looks like a cartoon, no realism." Lesson: real beats drawn.
- Alex: "this is not about redesigning Rustic Rhody." The branch is throwaway. Delete it.

## The structural finding (checked against code and database)
- The summer family builder saved every section's content in one page record (`content_pages.layout_tree.root.content`): moment, about, founder, reviews, find-us dates, marquee and more. The newer backend tables (`site_profiles`, `events`, `site_testimonials`, `gallery_items`) don't hold any of it. That's why family designs can't use the backend and why a site can't move between designs.
- **The contractor sites repeat the same mistake.** Cut-Pro was built before the backend existed, and Halfmoon, True Coat and Mazzone were copied from its script on 10-06. Their estimate requests are emailed and never saved.
- **The newer maker sites store content correctly,** but their section headings are hardcoded in code.
- Alex expected every editable piece to have its own home from day one. Claude designed it otherwise; that was Claude's mistake.

## Decisions (Alex)
- **"Modular" means the content.** Every piece has its own home. The design is a fixed shape that the content takes, so a site built in cozy can switch to modern and everything lands in its section. Each design keeps its own order.
- **Makers never switch designs.** Alex might.
- **No site ever requires custom work.** A request becomes a feature for all sites: an added section built once, taking on any design's look, sitting in the design's plug-in spots, switched off by default. Turning it on is seamless. Every site can add sections.
- **Families:** Saltmarsh's design becomes the **Coastal** family. Rose n' Cat's becomes a family (Claude suggested **Sweet**; not yet confirmed). The static photo behind the page is a **background setting** any family can use: a family texture, a scene from the library or the maker's own photo. There is no default background.
- **Build by hand first** (family plus background plus content through the screens), then automate step by step. Curation is only at the start. Eventually a maker signs up and pays the same day, so "Alex approves" is a switch, and appropriate-content checks are in the plan.
- Old family samples are never moved; they're kept as reference and deleted at the end.
- **Permanent rule:** never offer "not urgent / we can do it later" for agreed plan work.

## Lessons
- Answer from the real code and database, never from memory. Every contradiction this session came from answering without checking. Every checked answer held.
- A written rule didn't stop the mistake. Safeguards that don't depend on Claude are in the plan: an approval gate on database changes, a database rule that pages hold settings only, and tests.
- Don't guess at what Alex means. Ask, or restate exactly what he said.
- Plain words. The "backend vs front end" and "words" framing confused rather than helped. Show the actual table and rows when asked.
