# Traditional Craft Niche Batch — Locked 2026-06-17

The 43 traditional-craft niches Alex approved on Session 45, in order of approximate maker-population size (largest first). Build starts next session.

## The batch

1. wedding_stationery
2. resin_artist
3. embroiderer
4. calligrapher
5. macrame_artist
6. pins_patches
7. cake_decorator
8. chocolatier
9. stained_glass_artist
10. doll_plush — display name **Plush & Doll Maker**
11. toy_maker
12. glass_artist
13. mosaic_artist
14. knife_maker
15. frame_maker
16. rug_maker
17. honey_producer
18. coffee_roaster
19. hot_sauce
20. jam_preserves
21. pyrography_artist
22. cheesemaker
23. antique_dealer
24. weaver
25. woodcarver
26. wood_turner
27. pen_maker
28. spice_blender
29. tea_blender
30. lapidary
31. ferments
32. sculptor
33. stamp_maker
34. confectioner
35. religious_devotional
36. engraver
37. basket_weaver
38. incense_maker
39. paper_maker
40. wigmaker
41. clockmaker
42. stone_carver
43. cooper

## How this list got made

Started from the ~298 pending entries in `_queue.yaml`. Filtered out service trades (hair stylists, plumbers, dog groomers, tutors, etc.), most food service (restaurants, cafes, food trucks, caterers), digital services (graphic designers, web developers), healthcare, and trades. Kept maker-at-the-bench handmade goods AND pantry/food-craft makers (jam, honey, hot sauce, cheese, etc.) where the maker is producing a physical good.

Alex's strikes during the build:
- **Round 1 strikes:** apparel_designer, blacksmith, bookbinder, cobbler, upholsterer, polymer_clay, furniture_restorer, illustrator, journal_planner_maker
- **Round 2 strikes:** milliner, dressmaker, perfumer
- **Round 4 strikes:** knitwear_designer, sailmaker, brewer, distiller, vintner, cosplay_maker, conservator
- **Round 5 strikes:** silversmith, gilder, enameler, dyer, felter, spinner, letterpress_printer, punch_needle

Some categories were left off as intentional non-fits (illustrator, conservator, etc.) and may belong on a separate creative-services or restoration-services list later.

## Note: bookbinder agent

A bookbinder niche-writer agent fired in error during the strikes (round 1) — its output if it produced any will need to be discarded before this batch is built.

## Note: in-flight agents

Six niche-writer agents from this list went out before the list was finalized:
- embroiderer, calligrapher, wedding_stationery, stained_glass_artist (batch 1)
- glass_artist, sculptor (batch 2)

These should produce valid output that lines up with the approved list. The remaining 37 are pending dispatch.

## Build approach for next session

Run the niche-writer skill in parallel batches of 5–6 agents at a time to control concurrent agent load. Each agent writes:
- `content/niches/<slug>.md` (7-section prose body, status: draft)
- `content/style-sheets/niche-<slug>.json` (15 colors / 14+ fonts / 4–6 wordmark / 10–14 textures)

Match the canonical bar: `content/niches/leatherworker.md` and `content/style-sheets/niche-leatherworker.json`.

All entries land at `status: draft`. Alex reviews and promotes to `approved` before they go into onboarding.

After all 43 land, sync the prose bodies to the `niches` table in Supabase via the existing seeder so the runtime picks them up.

---

## Queue breakdown (the other 255 pending entries)

Total queue: 306 entries · 8 done · 298 pending · **43 approved on this list** · **255 left in the queue**.

Rough categorization of the remaining 255, ahead of triage. **Many of these will be eliminated completely** — they're in the queue from the original brain-dump but don't match BohdiAI's launch audience (kitchen-table makers selling physical goods + a few service-trade exceptions like tattoo/photographer).

- **Pure service trades** — ~145
  Hair stylists, massage therapists, dog groomers, music teachers, life coaches, personal trainers, plumbers, electricians, movers, locksmiths, pet sitters, dog trainers, mobile vets, drivers' ed instructors, sports coaches, fitness instructors, wellness practitioners, etc.

- **Healthcare practitioners** — ~22
  Chiropractor, naturopath, optometrist, occupational therapist, physical therapist, speech pathologist, hypnotherapist, etc.

- **Creative / digital services** — ~35
  Graphic designer, brand designer, web designer, videographer, photo editor, voice actor, copywriter, podcaster-editor, video editor, motion designer, etc.

- **Food service** — ~12
  Restaurant, cafe, food truck, caterer, personal chef, pastry chef, sommelier, mixologist, bartender, etc.

- **Farming / harvesting** — ~8
  Mushroom grower, microgreens, orchardist, rancher, farmer, fisherman, fishmonger, butcher.

- **Retail / curation / dealers** — ~8
  Crystal seller, art print seller, bookseller, tobacconist, plant seller, art dealer, etc.

- **Info products / content creators** — ~10
  YouTube creator, podcaster, course creator, Patreon creator, newsletter writer, printables/templates/patterns seller, self-published author.

- **Maker-adjacent Alex already struck or could revisit** — ~25
  Blacksmith, bookbinder, cobbler, upholsterer, conservator, gunsmith, taxidermist, ice sculptor, sneaker customizer, model maker, 3d printer, brewer, distiller, vintner, perfumer, milliner, dressmaker, illustrator, journal/planner maker, knitwear designer, sailmaker, cosplay maker, silversmith, gilder, enameler, dyer, felter, spinner, letterpress printer, punch needle, polymer clay, resin artist (kept), furniture restorer (struck).

  Most of these are real makers; they were excluded for launch focus, not because they aren't crafts. Worth a second pass before launch in case any of them belong.

### Triage rule for the 255

The launch audience is **makers who sell physical goods + a handful of service-trade exceptions that the audience overlaps with strongly** (tattoo, photographer, florist). Anything that doesn't fit that audience should be **deleted from the queue entirely**, not parked. Carrying 255 unsorted entries forward means the queue stops being a usable tool. Better to have a queue of 50 real candidates than 298 unsorted noise.

Next session triage approach:
1. Walk the 255 with Alex.
2. For each: keep (real maker for launch), defer (post-launch real maker), or **delete** (out of audience).
3. Update `_queue.yaml` in-place — entries marked `status: skip` get removed entirely.

