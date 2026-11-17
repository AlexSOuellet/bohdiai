# Safety Checks — the plain list (go-live step 3)

Drafted 2026-11-16 for Alex's yes. Nothing is built until he says go. Four pieces, each below with what it does, what the maker sees, what Alex sees, and what's still his call.

---

## 1. Maker terms and what can't be sold

**What it does:** at bohdiai.com/start, under the password box, one tick box: "I agree to the maker terms and what can't be sold or shown" with both linked. Sign-up won't go on without it. The date they agreed is kept with their account, so there's proof if a site ever has to come down.

**Two new pages on bohdiai.com:**
- **Maker terms** — plain words, short: the site is yours and so is the work; you're responsible for what you sell, your prices, your taxes and your customers; BohdiAI never takes a cut; you can cancel or close any time (Free at term end, or Close my account); BohdiAI can take a site down that breaks the list below; your plan is billed by Stripe; no refunds for part of a term.
- **What can't be sold or shown** — weapons and ammunition; drugs, vapes and anything sold as medicine or a cure; adult sexual content; hate, threats or harassment; anything stolen, fake or counterfeit (fake brand names, someone else's characters or logos); other people's photos or art passed off as your own; live animals; scams (fake giveaways, asking shoppers to pay somewhere other than the site's own checkout or the maker's listed payment options); anyone's private details.

**Where the words live:** in the database with the rest of the sign-up form's words, so they can change without a deploy.

**Done 2026-11-16:** Alex approved the wording ("its good"); merged.

---

## 2. A check on words and photos

**Skipped (Alex, 2026-11-17, Session 124):** concerned about BohdiAI choosing what is not ok. Report this site and Suspend cover it; at launch Alex looks at each new site himself. Kept below in case bad sites start showing up.

**What it does:** Claude (the small, cheap model, the same one Describe it uses) reads the words and looks at the photos against the list above, and answers only "fine" or "held, because …".

**When it runs:**
- **When a site is built** from the site form: every piece's name, description and photo, the about, the headline. If anything is held, the site still builds, but **it can't be published** until Alex clears it.
- **When a maker saves something new** on a live site: a new or changed product (name, description, photos), the about, the headline, an event's words, a new opening photo or background. A held item is **saved but kept off the live site**; everything else carries on as now. Unchanged things aren't checked again.

**What the maker sees:** on the held item, one line: "This is waiting for a quick review before it shows on your site. Most are cleared the same day." No accusation, no reason shown (the reason goes to Alex).

**What Alex sees:** a **Held** tab in the admin: the site, the item, the photo or words, Claude's reason, and two buttons: **Allow** (it goes live) and **Remove** (it's taken off, with an email to the maker saying why, in the approved email look). Alex gets one email when something new is held.

**Honest limit:** the check catches the obvious (a gun, a slur, a famous cartoon character, a stock-photo watermark). It can't know whether a photo of a vase is really the maker's own vase. That's what "Report this site" is for.

**If the check itself fails** (the AI is down): the save goes through and the item is queued to be checked again later, so a maker is never stuck. Nothing fails silently: the admin shows anything still waiting.

**Alex's call:** whether a held item at **build** time should stop publishing the whole site (as above) or just keep that one piece off it.

---

## 3. "Report this site"

**What it does:** a small "Report this site" link at the bottom of every site, in every mood, plus Saltmarsh/Scenic's shoreline design and Rose n' Cat's nursery design. It opens a short page on bohdiai.com: the site's name already filled in, a choice of why (something illegal, hateful, a scam, my photos or work, other), a box for details, and an optional email for a reply. Rate-limited like the other forms.

**What Alex sees:** a **Reports** tab in the admin (site, reason, details, when), an email when one arrives, and from each report a button straight to that site's page in Act as a maker.

**Where the link's words live:** in each site's buttons and labels, like every other word on a site.

**Done 2026-11-16:** built and tried by Alex; merged. The link is in all 11 footers (every design); a site's /report shows the report page on the site's own address (a redirect to bohdiai.com looped on the dev server). `site_reports`, `/api/report-site`, the Reports tab. Also (Alex): the admin's Messages, Reports and Feedback tabs show how many came in since he last opened them (`founder_seen`).

---

## 4. Suspend a site

**What it does:** on a maker's page in Act as a maker, a **Suspend this site** button with a reason box. One press:
- visitors see the same "temporarily offline" page that exists today;
- the maker's backend shows one line at the top: "Your site has been suspended. Contact support to talk about it." and **Publish / Put it back online is blocked** (the maker can still sign in, see their numbers and close their account);
- the maker gets an email with the reason, in the approved look.

**Unsuspend** puts it back exactly as it was (online if it was online).

**Already in place:** the database already allows a "suspended" state for a site; it's just never used.

**Decided (Alex, 2026-11-16):** billing pauses while suspended ("i go with pause. no refunds in middle of month though"): Stripe skips the bills that come due and refunds nothing already paid. **Done 2026-11-16:** built and tried by Alex (suspended test-site-3 and unsuspended it); merged. A Suspend link sits on every row of Act as a maker.

**Found while building (fixed, Alex's yes):** a signed-in maker could change any part of their own site record straight through the database (make it free, give it Full, take another address). The record is now locked: the maker's login changes only the customer-accounts switch, the contact email and Publish / offline / back online, and those moves only draft→live, live↔offline, never while on Free or suspended (`20261116000002_lock_tenant_record_and_suspend.sql`).

---

## Database changes this needs (each needs Alex's yes before it's made)

1. **The date a maker agreed to the terms** — one date on their account.
2. **Held items** — one list: which site, which item, the reason, waiting / allowed / removed, when.
3. **Reports** — one list: which site, the reason, the details, the optional email, when.
4. **Why a site was suspended** — the reason and the date, on the site.

Plus the two pages' words and the report page's words added where the other words already live (no new place).

---

## Build order once Alex says go

Terms and the tick box first (nothing else matters until strangers agree to them), then Suspend (so there's a way to act), then Report this site, then the check. Each one merged when it's tested.
