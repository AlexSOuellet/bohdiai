-- Seed the photo_magnet_maker niche row. Approved on insert because Alex
-- explicitly requested this niche for the Rhody Strong onboarding test and
-- needs it to appear in the niche picker. Status downgraded to draft later
-- if review surfaces issues. The body_markdown matches the new 7-section
-- shape (no Visual direction range, no What tends to surface, no What to
-- avoid sections — those sections are intentionally retired).

INSERT INTO niches (
  slug, display_name, tenant_type_fit, aliases, related_niches,
  body_markdown, status, approved_at,
  created_by, last_updated_by, approved_by
) VALUES (
  'photo_magnet_maker',
  'Photo Magnet Maker',
  array['seller'],
  array['photo magnets', 'custom photo magnets', 'magnet maker', 'photo magnet shop', 'event photo magnets'],
  array['wedding_stationer', 'print_shop', 'photographer', 'pet_portrait_artist'],
  $body$
# Photo Magnet Maker

## What this business does

A photo magnet maker turns customer photographs into small, flat magnetic prints meant to live on a refrigerator, a school locker, a metal toolbox, an office filing cabinet, or pinned to a guest's hand at the end of an event. The maker takes uploaded images, lays them out at the chosen size with optional text or framing, prints them onto magnet-backed stock, finishes the surface, trims to shape, and ships or hands them over. The product is small, gift-ready, and tactile in a way digital photos can't be.

Operations vary widely. A solo Etsy shop may print on a home photo printer onto adhesive-backed magnetic sheets, trim with a guillotine, and ship same-week. A mid-sized D2C company runs printer-cutters in a small warehouse and offers same-day shipping. An on-site event vendor brings a roaming photographer plus a portable printer-trimmer rig to the wedding or party and produces magnets in three to five minutes per guest. Big-box mass-market players (Shutterfly, Snapfish, VistaPrint) treat photo magnets as one SKU in a larger personalized-photo-products catalog. Small specialty makers focus tightly on one positioning — wedding save-the-dates, pet portraits, polaroid-style framed magnets, or multi-piece photo magnet puzzles where six, nine, or twelve magnets together form a single image.

Distribution channels include the maker's own online shop, Etsy or other handmade marketplaces, wholesale to gift shops and pet-supply stores for niche specialists, in-person sales at craft fairs and markets, and on-site event work where the maker travels to weddings, corporate events, or festivals to produce magnets live. Many makers run two or three of these channels in combination — Etsy and craft fairs for product line revenue, plus on-site event bookings for higher-margin weekend work.

## Brand exemplars across the range

**FoxPrint.** Utah-based premium D2C maker, in business since 2012. Single core product (3×3 photo magnets at around $3 apiece) with a "real photo quality" positioning — they describe the magnets as "substantial," contrasted against cheap promotional magnets. Voice is conversational and emotionally direct ("turn your fridge into a wall of memories"). 240K+ orders, 4.9 review score, Made in USA. Their differentiation is that each magnet feels like a printed photo, not a sticker.

**Shutterfly.** Mass-market personalized photo retailer. Photo magnets are one product line among invitations, cards, photo books, mugs, calendars, blankets. Many sizes and materials (standard, metal, acrylic, clip-on, calendar-combination magnets) ranging from about $8 to $17. Voice is warm and accessible, gift-positioned for graduations, Mother's Day, Father's Day, weddings. The strength of the positioning is breadth — you go to Shutterfly to get all the personalized photo gifts in one cart.

**Truly Engaging.** Wedding save-the-date specialist. Voice is couples-focused and stationery-traditional. Positioning leans on industry credentials — Knot's Best of Weddings 2024, Wedding Wire Couples' Choice Award. Customers are engaged couples planning weddings; the magnet is one piece of a multi-touch wedding stationery suite. Pricing is per-card-equivalent, often sold in quantities of 50, 75, 100, 150. Differentiation comes from design library curation and trust signals (awards, sample packs, real-couple testimonials).

**Flash Magnets.** On-site event vendor. Sells hourly packages (Silver / Gold / Platinum at two, three, and four hours of coverage) for weddings, bar/bat mitzvahs, corporate events, quinceañeras, fundraisers. A "professional photographer" mingles with guests; a "magnet manager" runs the printer-trimmer station; finished magnets land on a "stainless steel magnet board" for guests to find and grab. Voice is celebratory and exclamation-heavy, positioned as "so much better than a photo booth" because every guest goes home with something tangible. Differentiation is the on-site experience — instant gratification, branded keepsake, no app to download.

**Magnisimo.** Another on-site event vendor (California-based) running a broader event-experience business (photo magnets, photo booth, 360 booth, glam booth). Tagline "Capture Moments with Photo Magnets, Photo Booths & More." Same hourly-package model as Flash Magnets, but bundled into a wider event-services menu. The positioning is "premium event experiences" rather than a standalone magnet vendor.

**Etsy artisan shops (UchuuDigital, SomethingFunDesigns, hundreds of similar one-person operations).** Made-to-order custom photo magnets handled through Etsy's messaging — the customer sends photos and details, the maker confirms specs, ships in a few days to two weeks. Voice is personal and conversational. Specializations vary: hand-drawn pet portraits printed as magnets, polaroid-style framed photo strips, multi-photo collage magnets, hand-lettered wedding save-the-dates. Pricing is $10–$40 depending on customization. Differentiation comes from the maker's personal touch and the willingness to handle one-off requests big retailers won't.

**Magnets.com / VistaPrint / 4over (B2B promotional magnet makers).** Industrial-volume custom magnet printers serving real-estate agents, sports teams, restaurants, schools, and any business that wants branded magnets in bulk. Heavy magnetic stock (20 mil, 30 mil), UV coating, full-color printing, sometimes with a personalization layer (wedding couples buy from this category too when they want low cost). Voice is functional and trade-oriented. Differentiation is volume pricing, in-house design help, fast turnaround at scale.

A tenant joining this category could land anywhere across this range, including in positionings not listed here — children's-art-into-magnets shops, magnetic poetry kits, magnet-board kit makers, vintage-photo-restoration magnets, military-deployment keepsake magnets, fundraiser-merch magnets. The mood pick and the maker's own catalog choose the direction.

## Who their customers are

**Gift-buyers** are the largest segment for most consumer-facing makers. They're shopping for a partner, parent, grandparent, or friend and want something personal that won't sit unused. Photo magnets work because they go on the fridge and get seen every day. Recurring concerns: how the printed photo will look (will it be sharp? will the colors match?), how durable the magnet is, whether they can add a name or date, and how fast it will arrive.

**Self-buyers** print their own photos for their own homes — vacation memories, family pictures, kids' artwork, pet photos. Smaller average order but higher repeat rate; many self-buyers come back seasonally (after a trip, after the holidays, after a milestone). They care about the photo quality, the size options, and getting the orientation right (a portrait photo cropped to a square crops out the subject).

**Engaged couples** for save-the-date magnets. Predictable order shape — 50 to 150 units, designed around an engagement photo and a wedding date six to ten months out. This segment is highly time-sensitive (the save-the-date has to land before the wedding invitation cycle) and design-conscious. Save-the-date magnets compete with paper save-the-date cards; the magnet's argument is that it goes on the fridge and won't be lost in a junk-mail pile.

**Event clients** book on-site magnet vendors for weddings, corporate parties, mitzvahs, fundraisers, and conferences. The buyer is typically the event planner or the host, not the guests. They're buying a guest experience — every guest goes home with a magnet of themselves at the party. Concerns: how many guests can be served per hour, whether the photographer is professional or a hobbyist with a smartphone, what the on-site setup requires (table, power, square footage), and what branding can be added to the magnet (couple's names, event date, company logo).

**Pet owners** buy custom pet portrait magnets — usually a single magnet of their dog or cat, often as a gift for another family member. Subcategory of self-buyer with niche-specific concerns: how the photo background gets handled (cropped out, replaced with a solid color, kept), whether the maker can work from a blurry phone photo, whether multi-pet magnets are an option.

**Businesses** buy promotional magnets in bulk — real-estate agents (refrigerator-magnet business cards), restaurants (takeout-menu magnets), sports teams, schools, churches. Different sales motion entirely — quote-based, large minimum orders, often 500 to 5,000 units. Concerns: per-unit price at quantity, lead time, color matching against existing brand assets, magnetic stock thickness (a 20 mil magnet feels cheap; 30 mil reads as serious).

Recurring concerns across most segments: photo quality and color accuracy, magnetic stock thickness and hold strength, finish (matte vs. high-gloss UV), turnaround time, ability to add custom text/dates/names, what happens with low-resolution photos, and whether the printed image will fade in direct sunlight (most modern magnets won't, but customers ask).

Price ranges vary by positioning. Single mass-market magnets run \$3–\$10. Multi-packs (5-pack, 10-pack) on premium D2C run \$15–\$40 total. Wedding save-the-date magnets typically run \$1.50–\$4 per unit at quantities of 50–150. On-site event packages run \$800–\$3,500 depending on hours of coverage and guest count. Pet portrait custom magnets run \$10–\$40. B2B promotional bulk runs \$0.50–\$1.50 per unit at quantities above 250.

## How they talk about their products

The vocabulary of this category is part photography, part print production, part packaging. Buyers and makers reference real production terms — sometimes correctly, sometimes loosely.

**Sizes and shapes.** Standard sizes include 2×2, 2×3, 2.5×2.5, 3×3, 3×5, 4×4, 4×6, 5×7, and photo-strip (2×6). Common shapes: rectangle, square, circle, oval, hexagon, photo-strip. "Polaroid-style" or "instax-style" describes a framed-border format. "Full-bleed" describes a magnet where the photo extends to the edge with no border.

**Magnetic stock vocabulary.** Stock is measured in mil (thousandths of an inch). 12, 15, and 20 mil are common consumer thicknesses; 30 mil is used for higher-end promotional and refrigerator-business-card magnets. "Magnetic photo material," "magnet-backed cardstock," "17pt magnet stock" are typical product-page phrases. Buyers asking "will it actually stick" are responding to past experiences with thin promotional magnets that slid down the fridge door.

**Finishes.** UV coating (high gloss, durable), soft matte, satin, glossy, laminated. Higher-end shops emphasize matte; mass-market emphasizes UV gloss. "Soft-touch" finish is a premium upgrade.

**Construction details.** Rounded corners (the default for consumer magnets), square corners (more graphic, more "card" feeling), die-cut to shape (irregular shapes like state outlines, pet silhouettes, custom contour). "Full-bleed printing" means the photo runs edge to edge. "Photo border" or "frame border" means there's a printed white or colored border around the photo.

**Photo handling.** "Upload photo," "crop and enhance," "auto-orient," "single image" vs "collage layout," "photo strip" (4 photos stacked vertically). Customers ask about resolution requirements — most makers ask for at least 1000×1000 pixels for a small magnet, more for larger sizes.

**Naming strategies makers use.** Descriptive ("Custom Photo Magnets," "Save the Date Magnets," "Polaroid-Style Magnet Set"). Format-anchored ("Photo Strip Magnets," "6-Piece Magnet Puzzle"). Aspirational or memory-coded ("Memories That Stick," "Wall of Memories," "Capture the Moment"). Punned (Magnisimo, Mag-nificent, Flash Magnets, Sticky9). Place-based for regional makers (Rhody Strong, plus a long tail of small state-themed shops).

**Phrases that read flat in this category.** "Personalize your space." "Make any room special." "High-quality printing." "Premium materials." "Perfect for any occasion." Generic personalized-product e-commerce language. Buyers tune it out because every printer says it.

**The maker's story.** For boutique and Etsy makers, the maker behind the shop matters — what they make on a kitchen table or in a home studio, why they started, the first photo they ever printed onto a magnet (often a pet or a child). For event vendors the story is about events worked — the wedding where 200 guests left with magnets of themselves, the corporate gala where the magnet board emptied in an hour. For mass-market the maker's story is absent by design; the brand is a feature catalog.

## Common specializations and variations

**Product format.** Standard photo magnet, polaroid-style framed magnet (printed frame border around the image), multi-piece photo magnet puzzle (6, 9, or 12 magnets forming a grid), photo strip magnet (four-photo vertical strip), collage magnet (multiple photos arranged into one), die-cut shape magnet (cut to the photo's subject or a custom contour), business-card-format magnet.

**Size.** 2×2, 2×3, 2.5×2.5, 3×3, 3×5, 4×4, 4×6, 5×7, photo strip (2×6), and custom dimensions for puzzle grids.

**Stock and finish.** Magnetic stock thickness (15 mil, 20 mil, 30 mil), surface finish (UV high-gloss, soft matte, satin, soft-touch), corners (rounded, square, die-cut).

**Photo handling.** Single photo, multi-photo collage, photo strip layout, with-text-and-date layout (save-the-date format), with-name-and-monogram, background-removed (pet portraits, product shots).

**Channel and delivery.** Online ship-direct, online with local pickup, on-site event production, in-person craft fair or market sales, wholesale to gift shops.

**Volume and pricing.** Single-magnet purchase, multi-pack tier (5-pack, 10-pack), bulk order with quantity discounts, hourly event packages with guest-count targets.

**Specialization angles.** Wedding save-the-dates (couples, paper alternative), pet portraits (with or without background removal), polaroid-style framed (vintage gift aesthetic), event-vendor work (on-site at weddings/parties), business promotional (real estate, restaurants, schools), kids' artwork into magnets, vacation photo specialists (travel-themed), military deployment keepsakes, memorial portraits.

**Add-on services.** Photo restoration on old photos before printing, background removal/replacement, hand-lettering or calligraphy added to the magnet, gift wrapping and gift messaging, custom packaging.

## What customers ask before buying

The AI's job in product descriptions, FAQ, and storefront copy is to answer these without the customer having to ask:

- How sharp will the printed photo look — will the colors match what I uploaded?
- How thick is the magnet and how well does it actually stick? Will it hold a thick stack of papers or just paper itself?
- What's the matte or gloss finish like — does it glare under kitchen lights?
- Can I add my name, date, or a short caption to the magnet?
- What's the turnaround time, and can I get it faster for a save-the-date deadline?
- What if my photo is blurry or low-resolution — will you fix it or tell me before printing?
- How small can the photo go before it looks bad?
- For multi-pack pricing, can I mix different photos in the same order?
- For pet portraits — can you remove or change the background of my photo?
- For events — how many guests can your team produce magnets for per hour, and what does the setup take?
- Will the magnet fade if it's in direct sunlight or on a south-facing fridge?
- Can I return or remake a magnet if I'm not happy with the print quality?

## Adjacent niches

Photo magnet makers commonly expand into adjacent custom-print products: photo prints (paper, framed, canvas), photo books, photo cards (save-the-date paper cards, holiday cards, thank-yous), custom mugs and tumblers, photo coasters, photo keychains, photo ornaments, and stickers. On the event-vendor side, adjacent work includes photo booths, 360-video booths, on-site polaroid printers, and broader event-experience services. The shared vocabulary across all these is photo handling, customer-upload flows, color management, and personalization — niche files for those adjacent categories should lean on this one for the photo-magnet-specific parts and focus on what's distinct about their own format.
$body$,
  'approved',
  now(),
  NULL,
  NULL,
  NULL
);
