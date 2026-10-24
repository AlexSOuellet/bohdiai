# Session 113 — 2026-10-24

**Session 112's work merged and live; a new product starts with no stock choice; Saltmarsh's stock set to a realistic mix; main's failing test check fixed (Square payment code tests). Then Alex brought in the Maker's Toolkit he built with claude.ai, which led to a Free plan and the tools in the backend, built on `feat/backend-tools` (pushed, NOT merged). Alex's verdict at the end: the backend is "utterly underwhelming... it does NOT flow", and the Free build "is no better and in some ways worse". Picked up next session.**

## Merged and live

- **Stock (Alex):** makers are mostly small batches ("I have some"), then true one-offs ("One of a kind"); pure made to order is the smallest group, usually a few pieces beside finished stock. So **a new product starts with no stock choice**; it can't be saved until she picks (downloads and products with options unchanged; each option combination still starts on made to order, to spare a 12-scent candle 12 clicks; Alex can say if those should start blank too). Commit `8f25a38`.
- **Saltmarsh's stock** (data only, shared database): 11 small batches with counts, 5 one of a kind, Midnight garden tray one of a kind and sold (shows Sold), Lemon blossom board made to order with one ready, Hydrangea serving board made to order with none (the only Order only).
- **`feat/market-orders` merged** (Session 112's refunds, Events area, market pages, stock kinds). Workers Builds succeeded; bohdiai.com, makers arm, Saltmarsh, Cut-Pro (`cut-pro-lawncare`), app sign-in all 200.
- **Main's test check had failed since 2026-10-21** (the Square work): every test passed, but `lib/` branch coverage was 88.27% (rule: 90%). Nobody noticed because Cloudflare deploys regardless. Tests added for the Square connection (keys scrambled, renewed near the end), the card-sale checks (Square's word, each sale once, line by line) and the backend's Square actions (locations, disconnect, starting a card sale). Coverage 90.89%, CI green (`2dc6b28`). No behaviour changed.

## The Maker's Toolkit and the Free plan (discussion, decided by Alex)

Alex built a free money toolkit in claude.ai (`Downloads/bohdiai/makers-toolkit.html` + `toolkit-handoff.md`): **Cost to make**, **Price it**, **Market day**, with his agreed maths (don't change it without asking). Example numbers: an 8 oz soy candle at CandleScience prices; Etsy 9.5% + $0.45.

- **The "do you need a site" app** (the maker checkup, `feat/maker-checkup`, unmerged since 2026-10-12) belongs beside the toolkit.
- **Free plan (Alex):** a dashboard only. Makers sign up free, add products only for analysis (running the tools), and save results on their own products and events instead of downloading them. Alex rejected my first argument against a free plan ("your argument is weak": an account is a marketing tool; Free fits the tiers with limits). Conceded: plans are switches, so Free is one more set.
- **The ladder (Alex):** each tier keeps everything below and adds one capability. Free = know your numbers (dashboard + tools); Showcase = a one-page site ("one page", not "generic": it's in their chosen look); Market = the market app; Full = selling online.
- **Products come from the tools, not the other way round (Alex):** a Tools menu not tied to a product; a product is saved out of a tool.
- **Suggested price sits next to her own price** (my recommendation, Alex agreed by asking for it): her price is a decision, the tool is advice; one tap uses the suggestion; a price below break-even says so plainly; a product with no price starts at the suggested one.
- **More tools (Alex: "all of them"):** is this market worth applying to (before), monthly goal, shipping cost, taxes to set aside (estimate, not advice), which pieces actually earn (paid, needs sales), what to bring (Market, from How it sold), and a **description writer** with competition help. Etsy: the toolkit's search buttons are fine (they open Etsy in her browser); our server must never fetch Etsy results (their rules); comparison works from what she pastes or the low/high she typed. On the makers arm, no AI talk: "help writing your descriptions".
- **A video** will be needed to explain the ladder; film the free toolkit first, the full ladder once Free is real.
- **Flagged, not changed:** the toolkit's "Other costs for one" hint includes booth and card fees, then Etsy and website prices add card fees again and charge booth share to online sales (about $1–2 on a candle after the markup). Alex's call.

## Built on `feat/backend-tools` (pushed, NOT merged)

Commits `7d87a7a` (Tools) and `0d085c5` (Free).

- **Tools menu on every plan:** Cost to make, Price it, Market day (`/manage/tools/*`), maths moved unchanged into `lib/tools/maths.ts`; what she types carries between tools (state in the Tools layout); a strip across the top shows each tool's answer; the answer sits on a kraft hang tag (`.bk-hangtag`); the moving bar widths use CSS custom properties set from a ref (no inline styles).
- **Save as a product / Save as an event:** open a new product or event filled in through the address (`lib/tools/handoff.ts`), saved through the screen's own rules.
- **Database (Alex approved, applied to the shared database; migration `20261024000001_free_plan_tools.sql`):** Free added to `tenants.plan` and `plan_next` (not the same as `plan_comp` 'free', which gives a paid plan away); **`product_costs`** (one per product: pieces per batch, batch hours, hourly pay, other costs, markup) and **`product_cost_items`** (the supply list: batch supplies with what was paid and batches it lasts, and what every piece gets); **`event_takings`** (Market day's own numbers: sales, card share and fee, materials, hours at the market and driving/packing, hourly pay). Note: materials wasn't in the list I showed Alex; it's needed for take-home and I told him after.
- **Free in code:** `AccountPlan` = 'free' + the paid plans; Free's switches = catalog, market_dates, market_records (Tools and Contact support are on every plan); not on the pricing pages.
- **Costs on a product:** saved with a new product from the tools; the product page shows what it costs, the suggested price, "Use the suggested price", a warning when below cost, and "Change the costs" (reopens it in Cost to make, "Save to <product>").
- **Market day on an event:** the After tab's Market day section, live as she types; on Market and Full the till counts the sales, so nothing typed is kept there.
- **Free's Home:** "Know your numbers" (four steps, one lit), "Your numbers" (priced too low, last market, best market), and "Your pieces are ready to show" with Showcase's price from the plan list.
- **Products list:** "Below what it costs you" under the price; on Free, "Price a new piece" leads and there are no site ticks.
- **Preview site:** **Juniper Hollow Candles** (`juniper-hollow`, draft, owned by alexsouellet@gmail.com, on Free). Made directly in the database as a preview (said plainly as a shortcut; Alex OK'd it).
- Checks: 3502 tests, `lib/` branch coverage 91.30%, type check (without `.next`) and lint clean.

## Alex's verdict (the open problem)

- On the whole backend: **"utterly underwhelming... it does NOT flow"; "nothing seems intuitive... just menu names and contents. no flow".** My read, which Alex didn't dispute: it was built one screen per place content is stored, so the menu reads like where things are kept, not what a maker is doing; nothing leads to the next step.
- What I proposed: Home that leads (a path for new makers, what matters this week for running ones); every save points to the next thing; edit the site on the site (click a part to change it, as the spec's click-to-edit had it), replacing Headline, About you, Scrolling line, Contact and Socials; events as before / the day / after; a menu of jobs (Home, Your work, Events, Your site, Money, then Settings and Contact support).
- Alex: **break it down by plan** (Free steps, Showcase steps, Market, then Full). Laid out (see Plan-Backends.md, "The ladder"). Alex: yes; build Free first.
- After seeing the Free build: **"this is no better and in some ways worse."** Not yet said what. **Next session starts by asking Alex what felt worse, before touching anything.**

## Things that went wrong (lessons)

- **Main's tests failed for three days unseen.** Cloudflare deploys whatever the tests say; check the `test` check run as well as Workers Builds after every push.
- **Closed the dev server while Alex was using it** (his Terminal showed him on Price it) to run the full suite. Read the server tab's last lines before stopping it, and tell Alex first.
- **First dev server tab closed by itself** after a turn ended; restarted in a new tab. If it keeps happening, Alex runs `npm run dev` in his own tab.
- **Showed a list of database changes that missed a field** (materials on the market's numbers). Check the list against the code that will use it before showing it.
- **Built a large flow in one go and it missed.** Free's build was a lot of screens before Alex saw any of it.

## Next (Session 114)

1. **Ask Alex what felt worse** about the Free build and the backend's flow; don't guess.
2. Decide the fate of `feat/backend-tools` (rework, keep parts, or drop). The database changes are already applied and harmless if unused (new empty tables; Free as a plan value).
3. Juniper Hollow Candles: keep as the Free preview or delete.
4. Still open from before: the public toolkit page (`makers.bohdiai.com/tools`, Alex's question on its home and the header link), the checkup branch, the Other costs double count (Alex), the pricing cards, the Cloudflare analytics key (Alex), define Full, paying at sign-up (top priority).
