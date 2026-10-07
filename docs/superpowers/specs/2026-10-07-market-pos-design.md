# Market POS — Design

**Date:** 2026-10-07 (Session 97)
**Status:** Agreed with Alex in chat. Piece 1 (Markets) designed in full below; pieces 2 and 3 are outlined and get their own design pass before they are built.
**First site:** Rose n' Cat (Renee). Built as switchable features so any maker site can have them.

## The idea

A maker who sells at craft fairs runs her market table from her phone. She keeps every market she does in one list, marks which pieces she is bringing, and buyers at the table scan a QR code, pick a piece and pay. Each sale is filed under that market and the website updates on its own. Afterwards she sees each market's results and her own review side by side, so she knows which shows to do again. This is Master Spec §9 (Market Mode), rebuilt for the hand-built era.

It lives inside the maker's backend (a phone-sized screen at `/admin` → Markets), with the same sign-in, nothing to install, and an "add to home screen" so it opens like an app (Alex chose this over a separate app).

## Three pieces, built in order

1. **Markets** — the Market dates screen becomes Markets, holding everything about each market. *Designed below.*
2. **The market shop** — per market, the owner ticks the pieces she is bringing. The market gets its own QR code. A buyer scans it, sees only those pieces, picks one and pays by Venmo, Cash App, Zelle or card. Venmo and Cash App open pre-filled with the owner's handle and the amount; Zelle shows her Zelle phone or email; card needs Square (waits on the Square keys, like checkout). None of Venmo, Cash App or Zelle tells us a payment arrived, so the buyer taps "I paid", the piece goes on hold, and the owner taps Confirm on her phone when she sees the money. Confirmed sales are orders with `source = 'market_mode'` and `event_id` set; inventory updates through the same paid step the Orders screen uses. *Own design pass before building.*
3. **Market results** — per market: what sold, the total, how buyers paid, what came home, sales minus costs, beside her review. *Own design pass before building.*

## Piece 1 — Markets

### What each market holds

| Detail | Who sees it | Stored in |
|---|---|---|
| Name | Site + backend | `events.name` (exists) |
| First day, last day | Site + backend | `events.event_date`, `events.end_date` (exist) |
| Hours (free text, "10am – 4pm") | Site + backend | `events.hours` (new) |
| Town | Site + backend | `events.location` (exists) |
| Address (tap opens maps) | Site + backend | `events.address` (new) |
| Booth or table number | Site + backend | `events.booth` (new) |
| The market's website | Site + backend | `events.url` (exists) |
| Canceled (shows "Canceled" on the site; never silently dropped) | Site + backend | `events.status = 'canceled'` (exists; otherwise `'upcoming'`) |
| Costs, as lines (booth fee $40, gas $15) | Backend only | `event_expenses` (exists) |
| Organizer name, phone, email | Backend only | `events.organizer_name/phone/email` (new) |
| Notes to herself | Backend only | `events.notes` (exists) |
| Her review: 1–5 stars, go back next year (yes / maybe / no), a short note | Backend only | `events.rating`, `events.go_back`, `events.review` (new) |

### Privacy fix

`events` has an `anon` select policy from the old public calendar widget. No code uses it (storefronts read with the service role), and once organizer contacts and reviews live on the row it would leak them. The migration drops it. `event_expenses` stays admin-only.

### The backend screen

- Menu item **Markets** (replaces Market dates; same `market_dates` switch).
- The list: upcoming markets soonest first; past markets (last day before today in the shop's time zone) in their own section below, newest first, each showing its stars when reviewed. The list shows the configured data; past/upcoming is only a grouping in the owner's own backend, never on the public site.
- **Add a market** opens an empty market page. Tapping a market opens its page: all details in sections (When and where, What shoppers see, Costs, Organizer, Notes, Your review), one Save at the top and bottom, Save returns to the list with a "Saved" line (the product editor's pattern). Remove sits on the market's page behind a confirm.
- Costs: add a line (what, amount), change, remove; the page shows the costs' total.
- Limits: 40 markets per site; 20 cost lines per market; text fields sized like the existing ones.
- Phone-first: one column, big tap targets, works at 375px.

### On the site

Visiting hours (nursery) and the card designs' date lines keep reading markets. The nursery shows hours, town, booth and a maps link for the address when filled; a canceled market shows "Canceled". Nothing private is ever read by the storefront query (it selects public columns only).

### Testing

Form rules (pure) with unit tests; the market editor and list with component tests; the storefront query asserted to select only public columns; the migration checked against the real database (anon can no longer read events).
