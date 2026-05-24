-- Seed niches batch 2: jewelry_maker, baker, soap_and_bath, ceramicist, woodworker, fine_artist, vintage_reseller
-- All rows inserted at status='approved' (reviewed and passed self-check this session).
-- created_by / last_updated_by / approved_by are NULL — platform seed, no user.

INSERT INTO niches (
  slug, display_name, tenant_type_fit, aliases, related_niches,
  body_markdown, status, approved_at,
  created_by, last_updated_by, approved_by
) VALUES

-- ============================================================
-- jewelry_maker
-- ============================================================
(
  'jewelry_maker',
  'Jewelry Maker',
  array['seller'],
  array['jewelry', 'handmade jewelry', 'artisan jewelry', 'silversmith', 'goldsmith', 'jewelry designer', 'beaded jewelry', 'wire wrapped jewelry', 'polymer clay jewelry', 'resin jewelry', 'gemstone jewelry', 'hand-stamped jewelry', 'personalized jewelry'],
  array['gemstone_dealer', 'metal_art', 'beading_supplies', 'fashion_accessories', 'gifts_and_personalization'],
  $body$
# Jewelry Maker

## What this business does

A jewelry maker designs and produces wearable pieces — necklaces, earrings, rings, bracelets, pendants, cuffs, anklets — and sells them directly to buyers. Operations span a wide range: a single maker working out of a home studio with basic hand tools; a small team running a dedicated metalsmithing bench; a polymer clay artist working from a kitchen table with a toaster oven; a wire-wrapping specialist who sources gemstones and assembles exclusively by hand. Most fall somewhere in that span, and many expand their setup gradually as the business grows.

Materials define the subcategory more than anything else. Metalsmithing makers work in sterling silver, gold-filled, solid gold, copper, or brass and use techniques like sawing, filing, soldering, hammering, stamping, and setting stones. Beadwork makers string, weave, or stitch seed beads, semi-precious stones, glass, shell, or wood into finished pieces. Polymer clay makers condition, shape, and cure clay into lightweight earrings and pendants, often in painterly or sculptural forms. Resin makers pour and cast pigmented or inclusion-filled resin into molds. Wire wrappers coil, weave, and wrap wire — commonly copper, sterling, or gold-filled — around stones and forms. Hand-stampers emboss text, symbols, or patterns into metal sheet before finishing. Many makers combine two or more of these in their catalog.

Distribution is mostly direct: Etsy (the dominant marketplace for this category), the maker's own website, craft fairs, farmers markets, pop-up events, and occasionally wholesale into boutiques. Personalization and custom orders are a significant revenue stream in this niche — name pieces, initial jewelry, birthstone selections, and engraved dates are among the highest-converting product types on Etsy. Lead time, clarity, and maker trust matter more when a buyer is commissioning something custom.

## Brand exemplars across the range

These are real brands and business types cited as anchors for what a polished version of different positionings looks like in this category. They are not targets the maker should imitate — they show what the high-water mark of a given direction looks like. A tenant could land anywhere across this range, including places not on this list. The mood pick and the tenant's own inspiration URLs at onboarding choose the direction.

**CaitlynMinimalist (personalized dainty, D2C and Etsy dominant).** The highest-volume Etsy jewelry shop, with over 3.7 million sales as of 2026. Dainty name plates, custom script bracelets, engravable pendants, birthstone stacking rings. Voice is warm and gifting-forward: "made for you, or someone you love." Pieces are presented on clean white backgrounds; lifestyle photography leans into unboxing and gift moments. Sterling silver and gold-filled metals, accessible price points ($30–$120), and heavy personalization make this the template for the gift-driven, everyday-wear positioning.

**Catbird (fine artisanal, New York indie).** Brooklyn-based fine jewelry studio with an in-house team of artisans. Thin stacking rings, constellation chains, and delicate pendants in solid gold and recycled silver. Voice is poetic, specific, and a little literary — copy lingers on material origin and handcraft detail. Prices run from ~$50 for a simple silver charm to several hundred for solid gold rings. Strong community identity; pieces feel like badges for a specific design-literate customer.

**Bario Neal (ethical fine jewelry, values-led).** Women-owned Philadelphia studio using fairmined gold and reclaimed precious metals. Their about story is central to the brand — material sourcing, environmental commitment, and the fact that pieces are crafted in-house. Voice is earnest and education-forward: buyers are choosing both the piece and the supply-chain story behind it.

**Oklahoma Thirty-Nine / Juniper Dreams by April (Indigenous beadwork, cultural).** Native-owned makers producing intricately beaded earrings, cuffs, and accessories rooted in cultural tradition. Beading is technique-specific and culturally meaningful — the craftsmanship communicates differently than fashion jewelry. Price points typically $50–$350. Buyers are often buying into the cultural narrative, the maker's identity, and support of Indigenous-owned business as much as the piece itself.

**Ouray Silversmiths (Southwest silversmith, place-based).** Handcarved and hand-engraved silver jewelry inspired by plants and animals of southwestern Colorado. Turquoise, coral, and natural stone cabochons set in bezels and prong settings. Voice is grounded in place — the landscape, the tradition, the handwork. Heavier pieces, traditional forms, distinctly regional aesthetic.

**Wolf & Moon (geometric fashion, design-forward).** London-based brand that began at weekend markets and scaled into 200+ stockists worldwide. Signature laser-cut acrylic and hand-assembled geometric earrings, bold color combinations, graphic visual identity. Voice is playful and contemporary. Shows that handmade jewelry can occupy a fashion-forward, design-object positioning without using precious metals at all.

**Polymer clay Etsy makers (sculptural, painterly, trend-driven).** A broad and active segment of Etsy jewelry. Lightweight earrings in abstract, floral, or minimalist forms. Often 2–4 colors per piece, sometimes hand-painted or marbled. Pieces tend toward low-to-mid prices ($12–$50), with fast-moving seasonal and trend-responsive designs. Voice is casual and friendly; photography often flat-lay on textured surfaces.

**Devotional and spiritual jewelry makers (intention-led, symbol-rich).** Makers producing pieces for religious practice (cross pendants, saint medals, rosary-style bracelets), spiritual practice (chakra stones, evil eye, hamsa, moon phases), or wellness intention (birthstone healing sets, mantra-stamped cuffs). Vocabulary draws from the belief system — "protection," "abundance," "cleansing." Buyers are often shopping from a belief framework, not a fashion one.

## Who their customers are

Buyer types in this category span a wide range of motivations.

**Gift-buyers** are the single largest driver of purchase in this category. Birthday gifts, graduation gifts, holiday gifts, "just because" gifts, Mother's Day, Valentine's Day, best-friend presents, bridesmaid gifts, and push presents all funnel gift traffic into jewelry. Gift-buyers are often less confident shoppers — they lean on bestseller labels, curated collections, and the maker's own recommendations. They care about packaging, lead time before the event date, and whether gift-wrapping is available.

**Self-buyers** treating themselves to a piece that marks a moment, fits a daily stack, or expresses an identity. These buyers tend to browse longer, read more detail, and compare more carefully. They often know more about metal types and care than a gift-buyer would.

**Custom and commission seekers** who want a specific name, date, stone, or engraving. A meaningful portion of Etsy jewelry traffic is specifically searching for personalized pieces. These buyers need clear communication about lead time, proof process, and what exactly can be customized.

**Collectors and followers** of a specific maker — buyers who have bought before and return. Often the base for email lists, new-drop announcements, and limited editions.

**Cultural and community buyers** for whom the piece signals identity or supports a maker they believe in: Indigenous-owned, women-owned, LGBTQ-owned, local-to-their-region. The purchase decision includes a values dimension that the product description alone does not capture — it comes through in the maker's story and brand.

**Occasion-specific buyers** — bridal and wedding party shoppers, new-baby celebrants, anniversary shoppers. These buyers are often on a timeline and willing to pay more for certainty, speed, and presentation.

Across most segments, several concerns recur. Metal sensitivity is one: around 15% of the population has some reaction to nickel, and buyers who have had reactions in the past ask about it explicitly. Whether a piece is nickel-free, hypoallergenic, sterling silver (92.5% silver, alloyed typically with copper), 14-karat gold (58.3% gold), or gold-filled (a thick mechanical bond of gold over base metal, more durable than plating) is information shoppers need to buy with confidence. Tarnishing is another: buyers in the sterling silver and gold-filled segments want to know whether their piece will stay bright with normal care.

Sizing is the third: rings require more friction than earrings or necklaces, because a wrong size means a return. Makers who include a size guide and a ring sizer option in their listings convert better than those who don't. For adjustable pieces, clarity about the adjustable range matters.

Pricing varies as much as the techniques and materials. Polymer clay earrings commonly run $12–$40. Sterling silver minimalist pieces run $20–$120. Beadwork earrings run $30–$200 depending on complexity and cultural context. Fine gold pieces start around $100 and run into the thousands. Custom and one-of-a-kind pieces carry a premium across every segment.

## How they talk about their products

Jewelry vocabulary is its own language and varies sharply by technique. Knowing which terms belong to a maker's segment lets the AI write copy that sounds fluent rather than generic.

**Metal and material terms** that recur in product descriptions: sterling silver (or 925 silver), gold-filled (GF), solid gold, 14k, 18k, 24k, karat (purity of gold), copper, brass, oxidized silver, antiqued finish, hammered finish, brushed finish, mirror polish, argentium, fine silver, rose gold, yellow gold, white gold.

**Gemstone and setting terms**: cabochon (polished dome, flat back — common in bezel settings), faceted, raw or rough cut, tumbled, semi-precious, precious, conflict-free, ethically sourced. Setting types: bezel (a rim of metal encircling the stone — secure, clean), prong (metal claws that grip the stone — maximizes sparkle), tube setting, flush/gypsy setting, wire wrap (stone wrapped in coiled wire rather than set). Stone names common in this category: turquoise, labradorite, moonstone, opal, garnet, amethyst, citrine, rose quartz, malachite, tiger's eye, pyrite, chalcedony.

**Beadwork terms**: seed beads (tiny glass beads, often Miyuki or Toho brand), Peyote stitch, brick stitch, herringbone, loom beading, woven, strung, knotted, freshwater pearl, gemstone chip, Czech glass.

**Polymer clay terms**: Sculpey, Fimo, Kato, Cernit (specific clay brands), conditioning, curing, marbled, translucent, metallic, matte, satin finish.

**Craft-positioning language** that recurs across sellers: one-of-a-kind (OOAK), handmade to order, made in small batches, soldered by hand, forged, formed, fired, kiln-annealed, hand-stamped. Hypoallergenic, nickel-free, lead-free, tarnish-resistant, water-safe all appear frequently as trust signals.

Naming strategies vary widely. **Descriptive material names** are common in the silversmith and fine jewelry segments — "Labradorite Crescent Moon Pendant" tells the buyer exactly what they're getting. **Feeling and occasion names** appear in the personalized segment — "Forever in My Heart Name Necklace," "Birth Month Birthstone Ring." **Place or nature names** are common in Southwest, boho, and nature-inspired work — "Desert Bloom Cuff," "Cascades Ring." **Character or mood names** appear in fashion-forward and polymer clay segments — bold, short, evocative.

What reads flat across the category regardless of price tier: "beautiful," "stunning," "gorgeous" used as descriptors without specifics. These words do no work. A description that says "hand-formed in sterling silver, finished with a hammered texture that catches light across the curve of the band" is alive. "A gorgeous sterling silver ring" is not.

The maker's story carries significant weight in this category. Buyers who know who made the piece — their training, their location, what drew them to the material, what they were building toward — are more likely to buy and more likely to return. Storefronts that surface the maker tend to outperform ones that keep the maker invisible.

## Common specializations and variations

These are variation axes that exist in the jewelry market. The seller defines their own variations per product — these are starting suggestions, not a fixed schema.

**Technique.** The foundational sub-identity. Metalsmithing (silversmith, goldsmith), wire wrapping, beadwork (seed bead weaving, stringing, macramé), polymer clay, resin casting, hand stamping, chainmaille, forging, electroforming. Some makers specialize in one; others combine several.

**Metal type.** Sterling silver, gold-filled, solid gold (10k / 14k / 18k), copper, brass, rose gold. Each carries different price, durability, tarnish behavior, and customer expectation. Nickel-free and hypoallergenic designations matter to a significant share of buyers regardless of the metal type.

**Stone and inclusion type.** Natural gemstones, lab-created stones, freshwater pearls, glass, crystals (Swarovski, Czech). Cabochon vs. faceted. Raw/rough vs. polished. Specific stone families (turquoise, labradorite, moonstone) attract their own search audiences.

**Personalization options.** Name or word engraving, initial stamping, birthstone selection, date or coordinate engraving, custom text, monogram. This is one of the highest-converting variation axes in the category — any maker who offers personalization should surface it prominently.

**Jewelry type.** Earrings (studs, dangles, hoops, huggies, threaders, ear climbers), necklaces (pendants, chains, lariats, chokers, layering pieces), rings (stackable, statement, band, adjustable), bracelets (cuffs, chains, beaded, bangles, charm), anklets, brooches and pins, body jewelry, hair jewelry.

**Finish.** Polished, hammered, brushed, oxidized/antiqued, matte, textured. Within metalsmithing, finish is both a choice and a care implication — oxidized silver is darker and more rustic but requires different care than bright-polished silver.

**Sizing.** Ring sizing is the most friction-heavy variable in the category. Common approaches: standard sizes listed, with or without a "please measure before ordering" note; adjustable designs; half-size availability; ring sizer tools sold or offered as inserts. Clear size charts reduce returns and reviews about fit.

**Weight and scale.** Dainty/delicate vs. statement vs. chunky. Matters especially for earrings (lightweight for all-day wear is a specific selling point) and cuffs. Polymer clay earrings specifically market lightness as a feature.

**Collections and themes.** Seasonal drops (holiday, autumn, summer), nature-themed sets, celestial (moon, star, constellation), botanical, birth-month sets, zodiac, cultural or spiritual themes. Limited-edition drops and one-of-a-kind listings are common formats in metalsmithing and beadwork.

**Bundle patterns.** Stacking ring sets, earring trios, necklace and earring pairings, gift sets with packaging included.

## What customers ask before buying

The AI's job in product descriptions, FAQ, and storefront copy is to answer these before the customer has to ask.

- What metal is this made from, and is it hypoallergenic / nickel-free?
- Will it tarnish? How do I care for it?
- What size is this? Is it adjustable? Do you offer a size guide?
- Can I personalize it? What information do I provide, and how?
- How long does it take to make and ship? (Especially critical for custom orders near an event date.)
- What does it look like on a person? (Scale and proportion are hard to read from product photos alone — lifestyle shots and a size reference help.)
- Is the stone real / natural / ethically sourced?
- What is your return / exchange policy on personalized pieces?
- Is gift wrapping available? Will it arrive ready to give?
- Is it water-safe / sweat-safe / shower-safe?

A storefront that answers these questions clearly in the product listing tends to outperform one that leaves them for the buyer to ask in a message.

## Visual direction range

The jewelry category contains a wide range of visual sensibilities. The mood pick at onboarding and the tenant's inspiration URLs are what choose among them — not any assumption about what the category prefers.

Directions observed across the brand exemplars and the broader market:

- **Dainty minimalist:** White or ivory backgrounds, clean sans-serif type, close-up macro photography showing fine chain and delicate detail. Common in personalized everyday-wear and Etsy-volume sellers. Lifestyle shots lean into unboxing and gifting moments.
- **Artisanal fine:** Rich but restrained photography — dark surfaces, natural light, tactile materials. Serif type with generous whitespace. Voice is precise and material-specific. Common in studio-made fine jewelry and ethical fine jewelry brands.
- **Boho / nature-inspired:** Warm earth tones, natural texture backgrounds (wood, stone, linen), photography outdoors or in natural light. Loose serif or hand-lettered type. Common in gemstone, wire-wrapped, and Southwest silversmith makers.
- **Fashion-forward / design-object:** Bold palettes, graphic patterns, product-as-character branding. Often sans-serif or distinctive display type. Common in acrylic, geometric, or polymer clay fashion jewelry. The piece is presented as a design object.
- **Luxe or editorial:** Dark, high-contrast photography. Gold accents, deep jewel tones, dramatic lighting. Common in luxury positioning and statement jewelry.
- **Cultural and traditional:** Imagery, motifs, and color palettes drawn from the specific cultural tradition. Common in Indigenous beadwork, Southwest silversmithing, South Asian gold jewelry, and devotional or religious pieces. Visual identity is inseparable from cultural identity.
- **Dark and apothecary:** Deep palettes, moonlit or candlelit imagery, gothic or apothecary-inflected type. Common in spiritual, occult, or intention-led makers — crystal healing, rune symbols, moon-phase designs.
- **Soft and romantic:** Blush, cream, and dusty palettes. Soft natural light. Common in bridal and wedding-adjacent sellers, birth-month jewelry, and pieces marketed to emotion (love, grief, celebration).

What holds across most directions: jewelry photographs best close up and on the body. A piece on a neck, a wrist, or an earlobe reads scale and proportion in ways that a flat lay on a background cannot. The AI should encourage at least one lifestyle or on-body shot per product across whatever aesthetic direction the tenant has chosen.

## What tends to surface on the storefront

Blocks and widgets the AI should weigh when composing a jewelry maker's storefront. The mood pick and inspiration URLs drive the layout — this section identifies what tends to be useful for buyers in this category.

**A personalization call-out or section.** If the maker offers any form of customization — name engraving, birthstone, initial — this should be surfaced high and clearly. Personalization is one of the top purchase drivers in the category, and buyers often search for it specifically.

**A bestsellers or featured-products section.** Jewelry selection is overwhelming across the category. Gift-buyers especially benefit from a maker's own "start here" curation. Featuring three to five pieces is often more effective than presenting a flat grid.

**A collections or category grid.** Organized by jewelry type (earrings, necklaces, rings), by theme or material (turquoise, moonstone, celestial), or by occasion (gifts, bridal, everyday). Multiple organization schemes can coexist — earrings is a type; birthstone sets is an occasion; the buyer may approach from either direction.

**A size guide or ring sizing tool.** For any maker who sells rings, a clearly placed size guide reduces friction, returns, and frustrated messages.

**A maker story or about section.** Buyers in this category are buying from a person, not a factory. The maker's background, training, what drew them to the material, and where they work all carry purchase weight. A visible maker differentiates a small studio from a reseller on a crowded marketplace.

**A metal and care guide.** A short guide (even a paragraph per metal type) on how to clean and store the pieces, what to avoid, and what to expect over time. This reduces complaints about tarnishing and positions the maker as an authority rather than just a vendor.

**A gift finder or curated gift sets section.** Given how much jewelry is purchased as gifts, a "gifts for her," "under $50," or occasion-based curated section serves gift-buyers who are not confident choosing on their own.

**A custom orders or commission section.** If the maker accepts custom work, it should be findable — not buried. A short explanation of the process (how to request, what information to provide, typical lead time) removes the friction that stops buyers from asking.

## What to avoid

- **Stock or catalog imagery.** Buyers in this category are comparing makers, not products. Generic jewelry photography — the kind that could have come from a wholesale catalog — signals that the maker is a reseller rather than a craftsperson. Even simple close-up photography of the maker's actual hands and bench reads more authentically than polished stock imagery.
- **Vague material descriptions.** "Silver" without specifying sterling (925), sterling with no mention of alloy content, "gold" without specifying karat or fill vs. solid — these omissions are a trust gap for buyers who have been burned before. Specificity builds confidence. "Sterling silver (.925) with a brass clasp, nickel-free" tells the buyer everything.
- **"Beautiful" and "stunning" as descriptors.** These words do no work in a category where every listing uses them. The description's job is to say what the piece is made of, how it's constructed, what the stone is, how it was finished, and how it wears. Sensory and specific beats aspirational and vague every time.
- **Hiding the maker's process.** Terms like "handmade," "hand-forged," "hand-stamped," and "kiln-fired" are meaningful in this category and belong in product descriptions — not as filler, but because buyers who care about craft seek them out. Omitting process language removes a real differentiator.
- **Unclear lead time on custom pieces.** Custom orders are the highest-value and highest-friction segment. A buyer who doesn't know their personalized necklace takes 10 business days to make will leave a negative review when it doesn't arrive in time for the birthday. Lead time should be prominent, specific, and repeated on every custom listing.
- **Underselling the weight and scale.** Earring weight matters for comfort; ring width matters for stacking. Buyers who order without knowing get surprised when the piece arrives. Listing dimensions in millimeters and weight in grams for heavier pieces prevents this.

## Adjacent niches

Jewelry makers commonly expand into or cross over with several adjacent categories. Gemstone and crystal sellers occupy nearby territory — some makers source stones wholesale and sell both finished jewelry and loose stones side by side. Fashion accessory makers (hair clips, bag charms, keychains, brooches) often start or end up in jewelry. Bead suppliers and jewelry-making supply sellers sometimes emerge from the community of makers.

The wedding and bridal accessories niche overlaps significantly: many jewelry makers produce specifically for bridal parties, with custom bridesmaid sets, wedding hair pieces, and floral-pressed resin bridal jewelry being distinct product lines within the maker's catalog.

On the spiritual and wellness side, crystal and gemstone sellers and intention jewelry makers share buyer audiences and vocabulary — the line between a gemstone shop and a crystal-healing jewelry maker is often thin.

When those adjacent niche files are written, authors should lean on this file for the shared vocabulary (material terms, sizing concerns, hypoallergenic questions, gift-buyer behavior) and focus their own sections on what's specific — the storage and display conventions of crystal sellers, the ceremony-specific timeline concerns of bridal accessories, the sourcing and grading vocabulary of the gemstone trade.
$body$,
  'approved', now(), NULL, NULL, NULL
),

-- ============================================================
-- baker
-- ============================================================
(
  'baker',
  'Baker',
  array['seller', 'doer'],
  array['bakery', 'cottage baker', 'cottage food baker', 'home bakery', 'home baker', 'custom cakes', 'custom cake maker', 'sourdough baker', 'artisan bread', 'microbakery', 'custom cookies', 'decorated cookies', 'wedding cakes', 'celebration cakes', 'pastry', 'baked goods'],
  array['cake_decorator', 'chocolatier', 'jam_and_preserves', 'farmers_market_vendor', 'cooking_instructor'],
  $body$
# Baker

## What this business does

A baker produces and sells baked goods, teaches baking, or does both. The operation can look entirely different from one baker to the next. A cottage food baker works from a licensed home kitchen, selling shelf-stable goods directly to consumers — loaves of sourdough at the farmers market, decorated sugar cookies for baby showers, banana bread on a neighborhood pickup schedule. A microbakery may rent commercial kitchen time on weekends and ship nationwide. A custom cake designer takes commissions for one-of-a-kind wedding and celebration cakes, operating more like a studio than a shop. A sourdough specialist maintains a live culture, shapes and scores loaves by hand, and builds a following around the flavor depth that long fermentation produces. Some bakers teach — weekend bread classes in their home kitchen, virtual sourdough workshops, hands-on pastry sessions at local culinary centers.

What nearly all bakers in this category share is a one- or two-person operation running out of a home, a rented space, or a small commercial kitchen, with distribution through farmers markets, local pickup, direct-to-consumer orders, pop-up events, and increasingly through their own website. Cottage food laws in all 50 states allow home bakers to sell shelf-stable, non-potentially-hazardous goods — items like breads, cookies, cakes, granola, and muffins — directly to consumers, typically with annual revenue caps and labeling requirements that vary by state. In states that have passed food freedom or TCS (Time/Temperature Control for Safety) legislation, bakers can also sell refrigerated items like cheesecakes and cream-filled pastries from home kitchens. The regulatory picture is part of the operating context for every baker in this niche.

The category is wide. The same niche covers a one-person sourdough operation with a 40-loaf weekly subscription list, a cottage baker selling custom royal-iced cookies at $74–$82/dozen, a wedding cake designer charging $6–$12 per serving for fondant-finished showpieces, and a baker who offers a weekly lineup of croissants, cinnamon rolls, and seasonal tarts for local pickup. The maker's positioning shapes voice, pricing, product vocabulary, and customer almost completely.

## Brand exemplars across the range

These are real brands and business types cited as anchors showing what a polished version of different positionings looks like in this category. They are anchors for what a maker leaning in a given direction could aspire toward — not targets the tenant must imitate. A tenant could land anywhere across this range, including places not represented here. The mood pick and inspiration URLs at onboarding are what choose direction.

**Bread Artist (Venice, FL — artisan sourdough, process-forward).** Organic ingredients, long fermentation, small batch. Copy emphasizes patience and intentionality: "every loaf is shaped by hand, guided by intuition, patience, and artistry — never rushed." Process vocabulary (fermentation time, hydration, scoring) is surfaced as part of the product story rather than buried in a FAQ. The baker themselves is central to the brand.

**Wild Yeast Bakehouse (Pennsylvania — microbakery, community-anchored).** A locally based microbakery specializing in small-batch, naturally-leavened sourdough using locally sourced and organic ingredients. Operates on a subscription and pre-order model, communicating through a newsletter and social media. The storefront functions as an order window, not a browse-and-buy experience. Voice is warm and conversational; the community connection is explicit.

**Southern Sugar Bakery (Raleigh, NC — custom decorated cookies, event and corporate).** Custom decorated sugar cookies priced at $74–$82 per dozen, positioned as a premium artisanal product for events, corporate gifting, and weddings. Each cookie is piped by hand. The brand spans personal celebrations and B2B gifting, with logo cookies as a revenue line. Voice is polished but warm; the product photography does most of the selling.

**Ana Parzych Cakes (Connecticut — luxury wedding and celebration cakes).** Stunning custom cakes for Newport mansion weddings, Manhattan events, and high-end gatherings. Design vocabulary draws from floristry, sculpture, and couture. Every commission begins with a consultation. Pricing in this tier can run from $800 to $3,000+ depending on guest count, design complexity, and sugar work. Voice is editorial; the portfolio is the storefront.

**BROTworkshop (Killingworth, CT — cottage food operation with classes, dual seller/doer).** A licensed cottage food operation that bakes orders on demand for curbside pickup on weekends and offers sourdough starter creation workshops, multi-flour bread baking sessions, and Bavarian pretzel classes in the home kitchen. The business model blends retail and education, and the regulatory framework (Connecticut cottage food law) is part of the public-facing story. Voice is accessible and personal.

**Bull Butter Co. (cottage bakery, farmstand model, rural-anchored).** A thriving cottage bakery that grew from a side operation into a community fixture using a mobile farmstand and self-serve purchasing system. The brand leans into locality and the "made from home" story. Low overhead, direct community distribution, and a practical voice that talks to neighbors, not strangers.

**Crazy Confections LLC (made-to-order cottage bakery, celebration-focused).** Specialty sugar cookies, DIY cookie kits, cakepops, chocolate-covered pretzels, and custom cakes. Positioning emphasizes made-to-order, celebration occasions, and the personal touch of a small operation. Revenue comes from both custom orders and recurring local event commissions.

**Cultural and traditional bakers (diverse, community-specific).** Bakers rooted in a specific culinary tradition — Puerto Rican quesitos and mallorcas, Filipino pandesal, Mexican conchas and tres leches, Haitian pain patate, Taiwanese pineapple cakes — operate within entirely different visual and voice conventions. The product vocabulary, the customer, and the cultural context are specific to the tradition. This is one of the widest sub-ranges in the category and the AI should treat it as its own positioning territory.

## Who their customers are

Buyer types in the baker category vary significantly by product and positioning. Several archetypes recur across the market:

**Celebration and occasion buyers** are the largest single group across most baker positionings. They are buying for a birthday, wedding, baby shower, graduation, holiday, corporate event, or "I want to say thank you" moment. These buyers often have a hard deadline, a specific design or flavor in mind, and a budget they've partially thought through. They need to understand lead time before anything else.

**Subscription and weekly-order regulars** are especially common in the sourdough and artisan bread segment. These customers have made a commitment to this baker's product — they know the baker's schedule, they've tasted the bread, and they're building their kitchen routine around it. For this buyer, reliability and communication matter as much as the product itself.

**Gift buyers** who want something more personal than a store purchase are a consistent segment, especially for custom cookies, decorated cakes, and gift boxes. These buyers often need guidance — a best-seller list, a curated box, a baker's recommendation — because they're choosing for someone else's taste.

**Self-indulgers** who buy for themselves, especially in the pastry and croissant segment and the sourdough segment. These buyers know what they want and are often looking for something that isn't available at the grocery store.

**Class-seekers and learners** are the buyer type for the doer side of this niche. They want to learn a specific technique — sourdough starter maintenance, pie crust lamination, royal icing flooding — and they may buy a class as a standalone experience or as a step toward buying the baker's products more regularly. Class pricing observed in the market ranges from $65 to $125 per person for hands-on sessions of 2–3 hours; virtual classes often run $25–$60.

**Corporate and institutional buyers** are most relevant for cookie and cake positionings that offer logo customization, branded boxes, and bulk orders. This is a recurring revenue stream for decorated cookie bakers and celebration cake makers.

Across most segments, a few recurring concerns show up regardless of what the buyer is purchasing:

**Lead time and ordering windows.** This is the first question for any custom or made-to-order product, and it's the most common source of friction in the category. "How far in advance do I need to order?" is a question that needs to be answered on the homepage, not buried in a contact form. Lead times across the category range from 48 hours for standard orders to 4–6 weeks for fully custom wedding cakes.

**Ingredients and allergens.** Gluten-free, nut-free, dairy-free, and egg-free requests are common across all segments. Cottage food labels are legally required to list allergens; storefronts should surface allergen information clearly without waiting to be asked. Custom bakers who don't accommodate specific allergens should say so plainly.

**Freshness and shelf life.** Buyers want to know when a product was baked, how long it keeps, and how to store it. Decorated cookies are often shelf-stable for 2–3 weeks; sourdough bread is best within 3–5 days; cream-filled items have much shorter windows.

**Pickup and delivery logistics.** Most cottage food bakers don't ship or deliver — they rely on local pickup or farmers market sales. Buyers need to know this before they fall in love with a product. Bakers who do ship need to explain packing, transit time, and what to do if something arrives damaged.

Price ranges observed in the market span a wide band. Cottage food breads and pastries often run $6–$18 per item. Custom decorated sugar cookies run $5–$10 per cookie individually, $60–$120 per dozen at the custom end. Celebration cakes range from $60 to $400+ depending on complexity and size. Wedding cakes typically price per serving at $4–$8 for buttercream and $6–$12 for fondant, with a starting minimum that many designers set at $500–$800. The same product costs different amounts in different brand directions and markets.

## How they talk about their products

Baker vocabulary divides roughly along product lines. Bread bakers, especially those in the sourdough and artisan space, use a technical-but-approachable vocabulary that buyers have learned to recognize and appreciate:

**Fermentation and process terms.** Hydration (the ratio of water to flour, often expressed as a percentage — 75% hydration, 80% hydration), autolyse (a rest period that begins gluten development before mixing), bulk fermentation (the first long rise, usually 4–8 hours depending on temperature), cold proof (the slow overnight retard in the refrigerator that deepens flavor), and scoring (the cuts made across the dough surface before baking, both functional and decorative). These terms appear on product pages and in bakers' social media captions because the process is part of the story.

**Crumb and texture terms.** The crumb is the interior structure of the bread — an open crumb has large, irregular holes and is associated with high hydration and proper fermentation; a tight crumb is uniform and dense. Oven spring is the rapid expansion a loaf undergoes in the first few minutes of baking — good oven spring means the scoring opened cleanly, steam was present, and fermentation was dialed in. The ear is the raised ridge that forms along a score line; a prominent ear signals a well-proofed loaf. Crust terms — crackle, caramel-dark, thin, thick, shattering — appear in tasting notes.

**Cake and pastry vocabulary.** Laminated (dough with butter folded in, as in croissants), piped (icing applied with a bag and tip, not a knife), fondant (a poured or rolled sugar coating), buttercream (whipped fat-and-sugar frosting, American-style or Swiss meringue or Italian meringue), ganache (a chocolate-cream emulsion used as filling, frosting, or glaze), tiers (stacked cake layers with structural supports), fresh flowers versus sugar flowers (a real pricing and preference question for wedding clients). For decorated cookies: royal icing (a drying icing used for floods and details), wet-on-wet (a technique for creating designs before the icing dries), flooding (filling in an outline with thinned icing), and dry time (the minimum waiting period before the next layer goes on).

Naming strategies across the range:

**Product-led names** that describe what's in the product — Jalapeño Cheddar Sourdough, Lemon Lavender Shortbread, Brown Butter Chocolate Chip — common in direct-to-consumer bakers selling a recurring lineup.

**Occasion-led names** — Wedding Cake, Birthday Smash Cake, Baby Shower Sugar Cookies — which organize the product by context rather than flavor.

**Flavor-story names** that string together the key components in a way that evokes rather than describes — Toasted Sesame & Miso Boule, Cardamom Rose Croissant, Honey Rye.

**Cultural-origin names** that anchor the product to its tradition — Pan de Muerto, Kouign-Amann, Sfogliatelle — especially in culturally-specific bakers where the tradition is the differentiation.

What reads flat across the category: "delicious," "mouthwatering," "baked with love," and "made from scratch" as the lead claim, without specifics to back it up. Buyers have developed strong filters for bakery-copy filler. What works is specificity — actual flavor notes, actual fermentation time, actual ingredients that matter. "72-hour cold ferment" says something; "made with care" says nothing.

The baker's own story carries real weight in this category. Buyers at farmers markets and on direct-order platforms are knowingly choosing a person's work over a grocery store product. The reason the baker started, the tradition they're working from, the thing they're obsessed with — these belong on the storefront.

## Common specializations and variations

These are the sub-identities and product variation axes that exist within the baker niche. For seller-mode bakers, these tend to be product-level variation dimensions. For doer-mode bakers running classes, they tend to be the topics taught. Most bakers in this niche sit somewhere on both axes. Treat these as starting suggestions the maker selects from, not a fixed schema.

**Bread and fermentation specialties.** Classic sourdough (country loaf, batard, boule); whole grain and ancient grain loaves (einkorn, spelt, emmer, rye); seeded loaves (sesame, sunflower, poppy, everything); flavored sourdough (jalapeño cheddar, olive and rosemary, cranberry walnut); sandwich loaves; enriched breads (brioche, milk bread, honey oat); naturally-leavened flatbreads; focaccia by the sheet or by the slice.

**Pastry and laminated dough.** Croissants, pain au chocolat, kouign-amann, morning buns, Danish pastries, puff pastry items. This sub-category requires skill in lamination and is often the calling card of a baker who trained in French or European technique.

**Custom celebration cakes.** Birthday cakes, anniversary cakes, baby shower cakes, graduation cakes, and the spectrum from simple to elaborate. Priced by the tier, the complexity, and whether decoration involves buttercream, fondant, fresh flowers, or hand-crafted sugar work.

**Wedding cakes.** A distinct commission category with its own lead time (typically 4–12 weeks), tasting consultation, contract, and delivery logistics. Often represents the highest per-order revenue in the category.

**Custom decorated cookies.** Royal-iced sugar cookies designed to match an event theme, corporate brand, or personal message. Priced by the dozen; customization drives the premium. Lead times of 1–3 weeks are standard.

**Pastries, tarts, and pies.** Fruit tarts, galettes, hand pies, full-sized pies (seasonal and year-round), quiches. Often sold as both individual servings and whole-format for pickup.

**Specialty and cultural baked goods.** Items specific to a culinary tradition — conchas, pan dulce, mallorcas, pandesal, pão de queijo, pain patate, pineapple cakes, sesame balls, baklava. The cultural tradition is the positioning and the vocabulary follows accordingly.

**Baking classes and workshops.** Sourdough starter creation; artisan bread baking (single session); multi-week bread series; croissant and laminated dough; pie and pastry fundamentals; decorated cookie technique (flooding, wet-on-wet, detailed piping); cake assembly and frosting; cultural baking traditions. Classes offered in-person (home kitchen, rented studio), virtually, or as a hybrid.

**Subscription and pre-order models.** Weekly bread subscriptions (2 loaves per pickup), seasonal pastry boxes, monthly cookie club boxes, CSA-style bake shares. These provide predictable demand that helps cottage bakers plan production.

**DIY kits and gift sets.** Cookie decorating kits (pre-baked cookies plus icing components), bread baking kits (starter plus flour plus instructions), curated gift boxes. A strong gift-season and corporate gifting revenue line.

## What customers ask before buying

The AI's job in product descriptions, FAQ, and storefront copy is to answer these before the customer has to ask:

- How far in advance do I need to order? (Lead time should be answered at the product level, not just in a generic FAQ.)
- What flavors are available, and can I customize?
- What are the ingredients? Are there common allergens?
- Do you accommodate gluten-free, nut-free, or dairy-free requests?
- How many people does this serve / how many cookies are in a dozen?
- How long does it keep and how should I store it?
- Can I pick up or do you deliver? If delivery, what's the radius and the cost?
- Do you ship? If so, how do you pack it, and what happens if something arrives damaged?
- For cakes and custom work: Do you do tastings? Is there a minimum order? What's the deposit and cancellation policy?
- For classes: What's included? What skill level is this for? What do I take home?

Storefronts that answer these clearly at the point of purchase outperform those that push buyers to a contact form.

## Visual direction range

The baker category contains a wide range of visual sensibilities, and no single aesthetic has claimed the category. The mood pick at onboarding and the tenant's inspiration URLs are what choose among them — the directions below describe what exists across the market, not what the AI should default to.

- **Warm farmhouse / cottagecore.** Linen textures, warm cream and sage palettes, hand-lettered or vintage-inspired type, lifestyle photography in natural light with wooden surfaces, flour-dusted hands, and wicker baskets. Common in cottage food bakers leaning into the homemade, pastoral angle.

- **Clean modern artisan.** White or off-white backgrounds, sans-serif type, clinical product photography on marble or stone, minimal props. Common in bakers positioning themselves as a premium alternative to mass-market bakeries without wanting to read as precious or rustic.

- **Luxe editorial.** Dark backgrounds or rich cream tones, serif or high-contrast typography, styled photography with dramatic lighting and close-ups of texture. Common in wedding cake designers and high-end pastry makers where the product is aspirational.

- **Playful and colorful.** Bold palette choices drawn from the product colors themselves — pink frosting, lemon yellow, mint green, chocolate brown — with expressive type and a cheerful, approachable voice. Common in celebration cake and custom cookie bakers appealing to kids' birthdays, baby showers, and party markets.

- **Process-forward / documentary.** Photography that emphasizes the making — hands shaping dough, scoring in progress, bread fresh from the oven, the interior crumb on a slice. Type is secondary; the images carry the authority. Common in sourdough and artisan bread bakers where the process is the story.

- **Cultural and traditional.** Palettes, typography, and photographic conventions drawn from the specific culinary tradition the baker works in. These rules are entirely different from the directions above.

- **Rustic market-stall.** Kraft paper tones, chalkboard aesthetics, hand-stamped type, market-table photography. Common in farmers market-primary bakers who build their brand around the stall-and-community model.

Across most visual directions in this category, close-up photography of texture earns its place. The cross-section of a sourdough loaf showing open crumb, the break point of a croissant revealing laminated layers, the surface detail of a flooded royal icing cookie — these shots convey craft in a way that full-table compositions cannot.

## What tends to surface on the storefront

Blocks and widgets the AI should weigh when composing a baker's storefront. The mood pick and inspiration URLs drive the layout — this section describes what tends to be useful in this category.

**A lead-time or ordering-window callout near the top.** The most common point of friction for custom and cottage bakers is buyers who discover the order lead time after they've already fallen in love with the product. A simple, visible callout — "Custom orders open 2 weeks out · Next pickup Saturday" — resolves this before it becomes a conversation.

**A product or specialty grid organized by occasion or product type.** Celebration buyers think in occasions (birthday, wedding, baby shower); bread buyers think in product type (loaves, pastries, weekly subscription). The right organizing axis depends on the baker's primary product mix.

**A featured product or hero item.** A single product photographed well and given primary placement tends to outperform a flat grid of equals, especially for first-time visitors.

**A class or workshop section (for doer-mode bakers).** If the baker teaches, the class offering should be a distinct, bookable section rather than an afterthought in the footer.

**A subscription or pre-order sign-up block.** For bakers with weekly or monthly subscription models, the sign-up call-to-action belongs near the top.

**A story-led about section.** The baker's story — why they started, what they're obsessed with, what tradition they're working from — belongs on the storefront.

**An allergen and diet callout.** A simple, visible block that communicates what the baker does and doesn't accommodate reduces pre-purchase questions and builds trust.

**A custom order inquiry or quote form.** For cake and cookie bakers, the path from "I want this" to an actual order often involves a conversation. A clear, low-friction inquiry form captures the lead at the right moment.

**A cottage food compliance block (for cottage food bakers).** A small, plainly-worded disclosure that the product was made in a home kitchen not inspected by a state agency is legally required in most states and builds trust when presented clearly.

## What to avoid

- **Generic bakery copy filler.** "Baked with love," "made from scratch," "delicious treats for every occasion" reads as background noise across the category. Specific is always better — actual flavor notes, actual fermentation time, actual ingredients that make this product what it is.
- **Burying the lead time.** Hiding the order window in a FAQ or leaving it out entirely creates frustrated buyers. Lead time belongs near the top of every custom product page.
- **Stock photography.** The baker category is built on visible craft. Stock food photography undercuts the "real person, real kitchen" positioning that differentiates cottage and small-batch bakers.
- **Collapsing all bakers into one aesthetic.** The farmhouse-linen aesthetic is prevalent but not universal. Luxury cake designers, cultural bakers, sourdough specialists, and corporate cookie bakers all have distinct visual territories.
- **Missing allergen information.** Legally required in cottage food states and expected by buyers in every segment.
- **Vague custom order paths.** "Contact me for custom orders" without explaining what information is needed, what the typical timeline is, and roughly what pricing looks like leaves buyers without enough to decide whether to reach out.
- **Ignoring the doer side.** Bakers who teach often undersell their classes on their storefront. Classes represent a distinct revenue stream, a community-building mechanism, and a pipeline to product customers.

## Adjacent niches

Bakers commonly expand or overlap with cake decorating (a sub-specialty with its own tools, vocabulary, and supply chain), chocolatiers and confectioners (a natural adjacent product line, especially for celebration bakers who dip pretzels, make truffles, or add bonbons to gift boxes), and jam and preserves makers (cottage food bakers often add shelf-stable spreads as complementary products). Farmers market vendors as a category overlap heavily with the cottage food baker positioning. Cooking and baking instructors as a separate niche share the doer-side mechanics of this file.

The cultural-baker sub-range within this niche could expand into its own niche files eventually — a Filipino bakery niche, a Mexican panadería niche, a Taiwanese pastry niche — each with its own brand exemplars, vocabulary, and visual conventions.
$body$,
  'approved', now(), NULL, NULL, NULL
),

-- ============================================================
-- soap_and_bath
-- ============================================================
(
  'soap_and_bath',
  'Soap & Bath Maker',
  array['seller'],
  array['soap maker', 'handmade soap', 'cold process soap', 'bath and body', 'bath bomb maker', 'body butter', 'natural soap', 'artisan soap'],
  array['candles', 'home_fragrance', 'skincare', 'herbalist', 'farm_stand'],
  $body$
# Soap & Bath Maker

## What this business does

A soap and bath maker produces handcrafted personal-care products — bar soaps, bath bombs, body butters, scrubs, salts, lotions, and related items — typically as a small operation running out of a home kitchen, a dedicated studio, a farm outbuilding, or a shared maker space. The work begins with sourcing base oils, butters, lye, fragrance, colorants, botanicals, and packaging, then combining those inputs into finished goods through processes that range from cold-process soapmaking to melt-and-pour, whipped body butter blending, and bath fizz formulation.

The category is meaningfully wider than it first appears. Some makers focus entirely on bar soap and build a catalog of dozens of scents and formulas. Others anchor on a hero product like the bath bomb and build complementary lines around it. Others run a full bath-and-body range that competes with small indie skincare brands. What unites them is handcraft at small or micro scale, direct-to-consumer or craft-fair distribution, and a product that buyers put on their bodies — which makes ingredient transparency and skin sensitivity recurring concerns across every positioning.

Distribution follows the same patterns as other handcraft categories: Etsy, craft fairs and farmers markets, the maker's own website, local boutiques and apothecary shops, and wholesale through platforms like Faire. Cold-process soap requires a minimum cure time of four to six weeks before it can be sold, which means production planning and inventory management matter more here than in most handcraft niches.

## Brand exemplars across the range

These are real brands cited as anchors for what a polished version of different positionings looks like in this category — not targets the maker should imitate. A tenant could land anywhere across this range, including places not on this list. The mood pick and the tenant's own inspiration URLs at onboarding are what choose direction.

**Witch Baby Soap (occult, dark, lifestyle-driven).** Witch-owned and intentionally irreverent. Products include coffin-shaped bath bombs, rune stone bath bombs, crystal body butters, and quarterly Spell Boxes organized around moon rituals. Scent names do atmospheric work: "Psychic Bath Bomb" is described as "an enchanting blend of lavender, black amber, and bourbon vanilla" with "psychic yarrow" and "clairvoyant amethyst." The brand voice pushes back explicitly on mainstream beauty norms. Vegan, cruelty-free, and free of parabens, phthalates, and sulfates. Featured in Allure, Bust, Buzzfeed.

**Little Flower Soap Co. (farm-to-bath, warm artisanal, heirloom).** Family-run, small-batch, on a two-acre lavender farm in Chelsea, Michigan. Soaps cold-processed using heirloom recipes with essential oils, botanicals, and minerals — organic rosemary, lavender flowers from their own farm, organic cocoa butter, shea butter. Voice is warm, local, and farm-specific. The farm origin is the story: the lavender they grow goes into the soap they sell.

**Sea Witch Botanicals (sustainability-first, B Corp, eco-positioned).** Named as a commitment to keeping waterways free of toxins. Uses only natural ingredients — essential oils, no synthetic fragrances or preservatives — and holds B Corp certification since 2018. Artisan soaps are superfatted for skin gentleness; each bar is hand-stamped. Voice emphasizes environmental transparency over self-care indulgence.

**Old Whaling Company (coastal lifestyle, accessible-premium, gift-forward).** Charleston-based, heritage-coded, built around nautical and coastal imagery. Voice is warm and story-led. Products include shea butter soap bars, body scrubs, and lotion, with collections organized by scent rather than format. Strong gift positioning — bundled sets, seasonal releases, clean presentation.

**Devotional and folk soap traditions (functional, traditional, faith-based).** A distinct sub-market that includes Castile soap made by old-world methods, lard or tallow soaps following homestead traditions, goat-milk soaps from small farms, and ritual soaps with specific spiritual intentions — uncrossing, money drawing, protection. These makers often sell at lower price points, use plainer packaging, and carry deep traditions that buyers are specifically seeking.

**Buff City Soap (modern mass-artisan, retail-driven, customization-led).** Customers can pick base, scent, and add-ins in-store or online. Voice is approachable, clean, and modern. Included here as the high-water mark for what the customization angle looks like at scale.

**Etsy-native single-maker shops (handcrafted-personal, story-led, accessible).** Warm earth tones, visible maker presence, products that often reflect a personal story or specific skin concern the maker was trying to solve. Price points typically lower than D2C brands. The most common positioning in the category on Etsy and at farmers markets.

## Who their customers are

Buyer types in the soap and bath category are varied. The most common archetypes include:

**Self-buyers** treating themselves to a small upgrade from drugstore soap, or managing a specific skin condition (eczema, psoriasis, dryness, sensitivity) that mass-market products don't address. This buyer often arrives with ingredient-first criteria — fragrance-free, unscented, high-superfat, goat milk, tallow.

**Gift-buyers** picking a product that feels more considered than a candle and more personal than a gift card. Bath bombs, soap sets, and body butter bundles over-index as gifts. This buyer leans heavily on best-seller lists, curated sets, and presentation quality.

**Wellness-oriented buyers** who see their bath or shower routine as a self-care ritual. They may buy from the same maker for years, rotate scents seasonally, and respond to product launches and limited editions.

**Clean-ingredient buyers** motivated by what's not in the product: no synthetic fragrance, no SLS, no parabens, no phthalates, no petroleum-derived anything. These buyers read INCI names and notice when a maker lists ingredients by common name only or is vague about fragrance sources.

**Ritual and spiritually motivated buyers** who use bath products as part of intentional practice — moon rituals, cleansing baths, intention-setting, spell work. This buyer is not looking for a pleasant scent; they're looking for a product built around a specific purpose.

**Farm and homestead buyers** attracted by traditional materials and methods — goat milk from the maker's own herd, tallow rendered from grass-fed beef, lard soap made from heirloom recipes.

Across most segments, a few concerns recur:

**Skin sensitivity and reaction.** This is the most common anxiety in the category. Buyers want to know if a product will irritate sensitive skin, whether it's tested for eczema or psoriasis, and whether essential oils or fragrance oils are the fragrance source. Cold-process soap retains glycerin, which mass-produced soap often removes, and many buyers specifically seek this quality.

**What's in it — and what isn't.** Buyers in this category read labels. INCI names, oil types, lye status (all true cold-process soap is made with lye; the lye converts fully during saponification and is not present in the finished bar), superfat percentage, and whether color comes from micas, oxides, or botanicals — these details matter to a meaningful share of buyers.

**Cure time and freshness.** Cold-process soap requires a minimum four-to-six-week cure period. Buyers who know the category ask how recently the batch was poured; they want a bar that's fully cured, not rushed.

Retail price ranges: single bar soaps typically fall between $6 and $18; bath bombs between $6 and $14 each; body butters (4–8 oz jars) between $12 and $28; scrubs between $12 and $24; gift sets between $20 and $65.

## How they talk about their products

The vocabulary of this category runs in two directions simultaneously: ingredient specificity on one side, and sensory or experiential language on the other.

Ingredient language recurs across positionings: cold-process, melt-and-pour, hot-process, saponification, superfat or lye discount, cure time, INCI names, castile, tallow, lard, goat milk, shea, cocoa butter, mango butter, castor oil, coconut oil, olive oil, avocado oil, argan oil, essential oils, fragrance oils, phthalate-free.

Sensory and experiential language layers on top. Scent descriptions follow perfumery conventions — top, middle, and base notes. Color descriptions reference botanicals and minerals: "naturally colored with French green clay," "tinted with rose kaolin," "swirled with activated charcoal." Texture language appears in scrubs and body butters: "whipped to a light mousse," "gentle sugar crystals melt on contact."

Naming strategies vary widely across the brand exemplars:

**Ingredient-descriptive names** — Lavender Honey, Charcoal Tea Tree, Calendula and Oat.

**Sensory or experience names** — Rain-Washed Pines, Morning Milk, Coastal Fog, Sunday Slow.

**Intention and ritual names** — Uncrossing, Money Drawing, Full Moon Cleanse, Psychic.

**Farm and origin names** — Homestead Tallow, Farm-Fresh Goat Milk, Lavender from Our Field.

What reads flat across positionings: vague "all natural" claims without ingredient detail; and corporate-sounding wellness language without a maker voice behind it.

## Common specializations and variations

These are variation axes and sub-identities in the soap and bath market. They are starting suggestions a tenant selects from, not a fixed schema.

**By format:** bar soap, liquid soap, bath bomb, bath salt, body butter, body scrub (sugar, salt, coffee), lotion, body oil, whipped soap, shampoo bar, conditioner bar, shaving soap or cream, lip balm, bath tea, shower steamer.

**By soapmaking method:** cold-process, hot-process, melt-and-pour, liquid soap.

**By base oil or fat identity:** olive-oil-heavy (castile), coconut-oil-dominant, tallow or lard, goat milk, shea butter or cocoa butter, triple-butter combinations.

**By skin concern:** sensitive/fragrance-free, eczema-formulated, psoriasis-gentle, acne (charcoal, tea tree), dry skin, oily skin, mature skin.

**By scent family:** floral, herbal, citrus, earthy, gourmand, fresh, unscented or fragrance-free.

**By colorant approach:** botanically colored (turmeric, spirulina, rose hip powder), mineral-colored (micas, iron oxides), activated charcoal, uncolored and natural.

**By positioning:** spa and self-care, farm and homestead, occult and ritual, clean and minimal, luxury gifting, seasonal or limited-edition drops.

Bundle and collection patterns: scent-matched sets, seasonal releases, skin-concern bundles, gift baskets, subscription boxes, and limited-edition cures.

## What customers ask before buying

The AI's job in product descriptions, FAQ, and storefront copy is to answer these without the customer having to ask:

- Is this safe for sensitive skin? Does it contain fragrance oils or essential oils? Is there a fragrance-free option?
- What's in it? Full ingredient list, oil base, colorant source, fragrance source, any potential allergens.
- Is there lye in the finished soap? (The answer is no — lye converts fully during saponification — but many buyers don't know this and will not buy a product that doesn't address their concern.)
- How long has it cured? Is this bar fresh off the mold or fully cured?
- How big is the bar? How long will it last?
- What does it smell like — and how strong?
- Is it vegan? Is the tallow or lard from a traceable source?
- How is it packaged? Will it survive shipping without melting or arriving crumbled?
- Can I use this on my face, or only body?
- Is it safe for kids? During pregnancy?

A storefront that answers these clearly outperforms one that doesn't, regardless of aesthetic direction.

## Visual direction range

The soap and bath category contains a wide range of visual sensibilities. The mood pick at onboarding and the tenant's inspiration URLs are what choose among them — there is no single dominant aesthetic in this category.

- **Warm botanical:** cream, sage, and terracotta palettes; close-in photography of cut soap bars showing swirl and texture; loose dried botanicals scattered in frame; serif or handwritten type.
- **Minimal clean:** white or off-white backgrounds; sans-serif type; product photography that emphasizes the geometric cut of the bar or the clean pour of the body butter.
- **Dark occult and apothecary:** near-black or deep jewel palettes (oxblood, midnight green, charcoal); gothic or apothecary typography; candlelit or shadow-heavy photography; crystal and botanical props.
- **Luxe gift-forward:** warm gold and cream; layered product styling; lifestyle photography emphasizing the unwrapping or the bathtub moment; ribbons and packaging as visual props.
- **Farm and homestead:** rough-hewn wood surfaces; mason jar props; kraft paper wrapping; hand-stamped labels; natural light.
- **Playful and colorful:** bold colors drawn from the soap itself; fun type; photography that leads with visual surprise.
- **Spa and wellness minimalist:** soft neutrals (sand, warm white, pale terracotta); eucalyptus or towel props; clean product-on-marble photography.

What holds true across visual directions: soap and bath products photograph best in close-up. The swirl cross-section of a cut cold-process bar, the fizz of a bath bomb dissolving, the whipped peak of a body butter — these shots carry more weight than flat lay overviews.

## What tends to surface on the storefront

**A format or category navigation.** Buyers come with a format in mind — "I want a bath bomb," "I need a body scrub." A clear top-level navigation by product type reduces friction.

**A skin concern or scent filter.** The second most common entry point is a concern or scent preference.

**A best-sellers or curated section.** First-time buyers are often overwhelmed by choice, especially if buying for a gift.

**A collections section.** Seasonal releases, skin-concern bundles, scent families, or ritual/intention collections give the AI a way to organize a line into coherent groups.

**A story-led about section.** The origin of the product — a skin condition the maker was trying to solve, a farm that supplies the goat milk, a grandmother's soap recipe — is load-bearing in this category.

**An ingredients or transparency section.** Where the maker has specific ingredient commitments, surfacing them clearly helps with the clean-ingredient and sensitive-skin buyer.

**A gift-finder or bundled-sets section.** A meaningful share of soap and bath purchases are gifts.

**A repeat-purchase or refill nudge.** Soap and bath products are consumable. Subscriptions and "if you liked X, try Y" suggestions play well.

## What to avoid

- **Vague "all natural" or "chemical free" claims without specifics.** All soap is made with lye, which is a chemical. Specifics earn credibility; blanket claims invite skepticism.
- **Unqualified "luxury" or "premium" language.** These words recur across the category to the point of meaninglessness. Specifics read as premium.
- **Ingredient lists by common name only.** Buyers who research ask for INCI names or at minimum a clear breakdown of what the base oils are.
- **Burying cure time or misrepresenting freshness.** Surfacing cure time as a feature rather than hiding it builds trust.
- **Ignoring the sensitive-skin buyer.** Fragrance is the most common irritant in handmade soap and bath products.
- **Stock imagery.** This category is built on visible handcraft — the swirl of the pour, the cut of the bar, the texture of the whipped butter.
- **Burying the maker.** Buyers in this category often specifically want to buy from a person with a story.

## Adjacent niches

Soap and bath makers commonly expand into candles (scent is a shared vocabulary, the customer overlaps heavily), room and linen sprays, reed diffusers, and other home-fragrance formats. They also commonly expand into skincare proper — facial bars, serums, balms — which is a different regulatory environment.

Farm-based soap makers overlap with the farm stand niche. Herbalist and apothecary makers overlap in the botanical-ingredients angle.
$body$,
  'approved', now(), NULL, NULL, NULL
),

-- ============================================================
-- ceramicist
-- ============================================================
(
  'ceramicist',
  'Ceramicist / Potter',
  array['seller', 'doer'],
  array['potter', 'pottery', 'ceramics', 'ceramic artist', 'ceramic studio', 'pottery studio', 'stoneware', 'porcelain artist', 'hand-built ceramics', 'wheel throwing'],
  array['candles', 'jewelry_maker', 'woodworker', 'fiber_arts', 'art_print'],
  $body$
# Ceramicist / Potter

## What this business does

A ceramicist makes objects from clay — functional pieces like mugs, bowls, plates, and planters; decorative pieces like vases, vessels, and sculptures; or commissions that fall somewhere between. The work involves forming clay by hand or on a wheel, drying and trimming, applying glaze or surface treatments, and firing in a kiln. Most small studios run one or two people and operate out of a home studio, a shared community kiln space, or a rented studio. Some ceramicists are primarily sellers; some are primarily teachers; many are both at once.

The category spans a wide range of scale and intention. At one end are solo Etsy sellers producing small-batch mugs and planters for the gift market. At the other are studio businesses with dedicated kiln space, institutional clients (restaurants, hotels, interior designers), and waitlists for custom commissions. The work ranges from entirely functional — dinnerware designed to be used every day — to entirely sculptural, made to be looked at. Most makers land somewhere in the middle and adjust the balance over time.

Distribution follows what the maker has built: craft fairs, farmers markets, local retail consignment, Etsy or their own direct site, wholesale to boutiques, and custom commissions fielded through email or a contact form. Some ceramicists add classes or workshops as a second revenue stream. Others build the class business first and treat the sale of their own work as secondary.

## Brand exemplars across the range

These are real brands cited as anchors showing what a polished version of different positionings looks like in this category — not targets a maker should imitate. A tenant could land anywhere across this range, including places not represented here. The mood pick and the tenant's own inspiration URLs at onboarding tell the AI which direction to lean.

**Farmhouse Pottery (Vermont, rustic-functional, heritage craft).** Founded by James and Zoe Zilian in Woodstock, Vermont. Stoneware designed to work hard and age beautifully. Their signature organic milk glaze leaves a band of raw clay at the base — visible craft, not hidden. Voice is grounded and intentional: "handmade pottery should earn its place by being used every day." Celebrates slow craft, simple forms, American-made materials.

**East Fork (Asheville, NC, values-led functional stoneware).** Founded by potters, certified B Corporation. Makes and sells contemporary ceramic dinnerware with regional materials in the Blue Ridge mountains. The voice is unusually direct about values — "We do not want to be a brand that feels generic and heartless." Product photography is clean and use-forward; copy is warm but confident.

**Heath Ceramics (California, heritage design-maker).** Founded in 1948, revived in 2003 by Robin Petravic and Catherine Bailey with a focus on design and handcrafted technique. Synonymous with California modernism — clean lines, muted glaze palettes, timeless forms. Forty craftspeople in Sausalito; showrooms in San Francisco and Los Angeles.

**Mud Australia (minimal modern, porcelain, design-objects).** Sydney studio founded in 1994 by Shelley Simpson. Handmade porcelain in 19 bespoke colors, with pigment tinted into the body — color is structural, not painted on. Voice is quiet and understated. Carried by Net-a-Porter. A model for makers whose work sits closer to design than to craft-fair.

**Jono Pandolfi Designs (New Jersey, fine dining / hospitality commission).** Makes handmade stoneware for Michelin-starred restaurants and hospitality groups — including Eleven Madison Park and Gramercy Tavern, and tableware featured on the TV show The Bear. Around 800 restaurant clients globally.

**Folk and earthy Etsy makers (single-maker, community-rooted, Etsy-native).** Price points typically $20–$60 per piece. Visual style is warm and personal — clay texture visible, sometimes rough, clearly made by one person. Voice is conversational and often tied to a place or a personal story. This is the largest volume segment on Etsy.

**Raku and alternative-firing artists (gallery-adjacent, sculptural, art-object).** Uses atmospheric firing methods — raku, saggar, horsehair, wood-fire, pit-fire — to produce surfaces that can't be replicated in a standard electric kiln. Work often sits closer to sculpture than to functional ware. A small segment by volume, but one with dedicated buyers.

**Community teaching studios (class-first, mixed revenue).** Studios built around access — selling wheel time, kiln space, classes, and memberships rather than primarily selling finished pots. The maker's own work may be on display and for sale, but the business model lives in teaching.

## Who their customers are

Buyer types in this category vary by what the maker sells, but several archetypes recur across most corners of the market.

**Gift-buyers** are a large share of the ceramics customer base. A handmade mug, bowl, or planter is a well-understood gift across occasions — housewarming, birthday, wedding, thank-you, host gift.

**Self-buyers treating themselves.** Buyers who collect handmade mugs, build out a handmade dinnerware set one piece at a time, or seek out work from specific makers they follow. Often the most loyal customer type.

**Functional buyers with a specific need.** A buyer who wants a planter in a specific size, a set of matching bowls, a pour-over dripper, a spoon rest.

**Interior design buyers and stylists.** Common in the design-adjacent and minimal-modern corners of the market. These buyers are sourcing ceramics for a project.

**Restaurant and hospitality buyers.** Relevant where the maker has positioned into institutional work.

**Workshop and class participants (doer side).** People signing up to learn pottery — beginners drawn by curiosity or a social experience, returning students building a skill, and dedicated practitioners seeking studio access and kiln time.

Across most segments, a few concerns recur. Food safety — whether glazes are food-safe, lead-free, and what "food-safe" actually means for a handmade piece — is the most common anxiety for first-time buyers. Dishwasher and microwave safety comes up constantly. Variation between pieces is a factor: wheel-thrown and hand-built work varies slightly piece to piece, which is a selling point for many buyers and a concern for buyers expecting machine consistency. Shipping fragility is real.

Pricing in this category varies widely. Common observed ranges: mugs $30–$85; small bowls $20–$45; dinner plates $40–$90; vases $30–$150; planters $25–$120; custom commissions priced per project.

## How they talk about their products

The vocabulary of this category is material and process-forward. Key vocabulary the AI should know and use correctly:

**Clay body types.** Stoneware fires at high temperature — durable, dense, non-porous when glazed, the most common body for functional ware. Earthenware fires at lower temperature — softer, often more colorful, more porous unless well-sealed. Porcelain is refined and translucent when thin — associated with delicacy, whiteness, fine detail.

**Forming methods.** Wheel-thrown: made on a spinning wheel, tends toward symmetrical round forms. Hand-built: made without a wheel using pinch, coil, or slab techniques — more variable, often more sculptural, may have visible seams or thumb marks that signal the hand.

**Surface and firing.** Glaze is the glass-like coating fired onto the surface — functional glazes seal the clay and make it food-safe. Firing methods include electric kiln (most common), gas kiln (often reduction-fired), wood-fired (produces flame marks, ash deposits), and atmospheric/alternative methods: raku, saggar, horsehair, pit-fire.

**Functional claims.** Food-safe means the glaze is non-toxic and sealed well enough that food contact is safe. Lead-free is a related claim. Microwave-safe and dishwasher-safe are claimed or disclaimed per piece.

Naming strategies range from entirely descriptive ("10 oz wheel-thrown stoneware mug, matte white glaze") to evocative and place-based to material-forward to purely aesthetic.

What reads flat across the category regardless of price tier: generic adjectives without grounding. What works across all positionings: specificity about materials, process, and use.

## Common specializations and variations

These are sub-identities and variation axes in the ceramics category. Framed as starting suggestions the maker picks from, not a fixed schema.

**Seller-side product axes:** Functional tableware (mugs, cups, bowls, plates, platters, pitchers, creamers, sugar bowls, butter dishes, pour-over drippers, spoon rests); planters and garden ware; vases and vessels; home objects (candle holders, incense holders, soap dishes, ring dishes, catch-all trays); decorative and sculptural work; custom commissions; wholesale and restaurant ware; alternative-fire specialties (raku, wood-fire, saggar, pit-fire).

**Clay body as a variation axis:** stoneware (most common), earthenware, porcelain.

**Glaze and surface as a variation axis:** matte, satin, glossy, speckled, reactive, ash glaze, slip-decorated, unglazed, textured, carved, stamped.

**Doer-side class and workshop types:** Beginner wheel-throwing class; multi-week wheel-throwing course; hand-building workshop; glaze and surface decoration workshop; open studio membership; drop-in studio time; private lessons; kids and family workshops; corporate and group events; alternative-fire workshops; kiln firing services; retreats.

## What customers ask before buying

The AI's job in product descriptions, FAQ, and storefront copy is to answer these without the customer having to ask:

- Is this food-safe? Is the glaze lead-free?
- Is it microwave-safe? Dishwasher-safe?
- How much does it hold? (Capacity in oz or ml matters for mugs, bowls, pitchers.)
- Will it match my other pieces?
- Does each piece look exactly like the photo, or will it vary?
- How do I care for it long-term?
- How is it packaged for shipping? Will it arrive intact?
- How long does a custom commission take? What's the deposit?
- For classes: what skill level is this for? What's included (clay, tools, glaze, firing)? When can I pick up finished work?

A storefront that answers these clearly outperforms one that doesn't, regardless of design direction.

## Visual direction range

This category contains a wide range of visual sensibilities. There is no single dominant aesthetic — the mood pick and the tenant's inspiration URLs are what choose among them.

- **Warm rustic craft.** Natural textures front and center — raw clay, visible hand marks, linen backdrops, wood surfaces. Earthy palettes: cream, terracotta, ochre, warm grey. Common in functional makers with a Vermont/farmhouse/artisanal positioning.
- **Minimal modern.** Clean product photography on solid or gradient backgrounds. Restrained palette — often white, bone, muted sage, slate. Common in design-object positioning.
- **Values-led narrative.** Warm but confident. Photography that shows people using the work. Copy that carries a mission alongside the product. Common in B Corp-style positioning.
- **Heritage and provenance.** Story of a place and a lineage. Photography that shows the studio, the team, the process.
- **Fine dining adjacent.** Clean, editorial, plated-food photography. The ceramics are featured in context rather than as isolated objects.
- **Dark and moody.** Deep palettes — charcoal, black, oxblood, aged bronze. Atmospheric lighting. Common in gallery-adjacent and sculptural positioning.
- **Folk and personal.** Bright or earthy accents, visible personality, photography that looks like someone's kitchen table.
- **Studio and process.** Photography leads with making — hands on the wheel, glaze pours, kiln loading.

What holds true across visual directions: ceramics photography rewards close-ups. The texture of a glaze, the thumb mark on a pulled wall, the speckle in stoneware under afternoon light — these details are what make handmade ceramics visually distinct.

## What tends to surface on the storefront

**A product grid organized by form or use.** Mugs, bowls, planters, vases — buyers often come with a form in mind.

**A featured product or hero piece.** One piece photographed beautifully, with a full description that models the depth of detail the maker brings.

**A process or story section.** Even a brief paragraph about how the work is made and where does consistent storefront work across every positioning.

**A commissions or custom work section.** A meaningful share of ceramics revenue comes from custom orders.

**A classes and workshops section (for doer-side tenants).** Class listings with clear descriptions of skill level, session length, what's included, what to expect, and how to book.

**Care instructions.** A brief block or FAQ about food safety, microwave and dishwasher safety, and long-term care.

**Shipping and fragility.** A clear note about how work is packaged and what the maker's policy is if something arrives broken.

**A gallery or lookbook section.** Ceramics photograph well in situ — on a table set for dinner, on a plant-filled windowsill, in a cafe.

## What to avoid

- **Generic claims without specifics.** "Beautiful handmade ceramics made with love" is dead copy in this category.
- **Hiding the variation.** Wheel-thrown and hand-built work varies slightly piece to piece. Addressing it directly turns a potential objection into a selling point.
- **Missing food-safety and care details.** These are the first questions buyers have.
- **Stock imagery of ceramics.** The category is built on hand-made work.
- **Treating every piece as sculptural when the work is functional.** Poetic copy about "capturing the essence of earth and fire" reads flat on a mug listing.
- **Treating every piece as functional when the work is sculptural.** Describing an art-object only in terms of "it holds 8 oz" misses what the buyer wants to know.
- **Burying the maker.** Across every positioning, the ceramics buyer wants to know there's a person behind the work.

## Adjacent niches

Ceramicists who teach also belong to the broader independent arts education category — potters who run their own studio programs share operational DNA with glassblowers, printmakers, and fiber artists who teach.

On the seller side, ceramicists commonly expand into candles (ceramic vessels are a natural move), jewelry (small ceramic pendants and earrings), and hand-poured concrete or plaster objects.

The home fragrance and home goods niches share a customer base with functional ceramics. Makers who sell both should be encouraged to set up distinct collections rather than mixing categories in one grid.
$body$,
  'approved', now(), NULL, NULL, NULL
),

-- ============================================================
-- woodworker
-- ============================================================
(
  'woodworker',
  'Woodworker',
  array['seller', 'doer'],
  array['woodworking', 'wood shop', 'woodcraft', 'woodworker shop', 'custom woodwork', 'woodturner', 'furniture maker', 'cabinetmaker', 'wood artist'],
  array['blacksmith', 'leather_goods', 'ceramics', 'home_decor', 'custom_furniture'],
  $body$
# Woodworker

## What this business does

A woodworker makes and sells things from wood — or takes commissions to make them. The range spans the size of a business card and the cost of a kitchen. On one end: cutting boards, turned bowls, small wall signs, coasters, toy trains, and wooden spoons sold in batches through Etsy or a farmers market table. On the other: custom dining tables, cabinetry, built-ins, bed frames, and furniture commissions priced in the thousands, sold through direct relationship, a portfolio site, or a small showroom.

Most independent woodworkers are one- or two-person operations running out of a garage shop, a rented bay in a shared maker space, or a small standalone workshop. Work is seasonal in some cases (farmers markets, holiday gift rush), commission-driven in others, or some combination of both. Distribution runs across in-person craft fairs and markets, Etsy and similar marketplaces, the maker's own direct-to-consumer site, wholesale into gift shops and home-goods retailers, and direct commission.

What unifies the category is material and handwork — the grain, the joinery, the finish. What varies enormously is the product type, the aesthetic, the price point, the buyer, and the way the maker talks about what they make. A cutting-board maker running a personalized-gifts angle and a furniture maker taking bespoke commission work share the category but almost nothing else.

## Brand exemplars across the range

These are real brands and business types anchoring different positionings in this category. They are cited as benchmarks for what a polished version of each direction looks like — not targets for any tenant to imitate. A tenant could land anywhere across this range, including directions not represented here. The mood pick and inspiration URLs are what choose among them.

**Fernweh Woodworking (mid-century modern, small-batch studio, heirloom).** Based in Bend, Oregon. Inspired by Finn Juhl, Hans Wegner, and Sam Maloof. Clean modern forms, American hardwoods, seamless joinery. Voice is understated and aspirational — "furniture you can be proud to pass on to the next generation." Photography runs spare and editorial. The customer is buying design alongside craft.

**Andrew Pearce Bowls (functional artisanal, Vermont-made, nature-led).** A small Vermont workshop and retail store making hand-turned wood bowls and live-edge cutting boards. Founder story is load-bearing. Voice emphasizes simplicity, natural beauty, function. The customer is buying something they plan to keep for decades.

**Parkman Woodworks (sustainability-led, LA studio, community-rooted).** A small close-knit team in a 100-year-old Los Angeles workshop, making custom wood and steel furniture. Voice is direct and grounded. Materials sourced locally and responsibly.

**Words with Boards (personalized gifts, gift-occasion-driven, accessible).** A cutting-board-focused brand built around engraving and personalization — weddings, anniversaries, housewarmings, corporate gifts. Earned an Oprah's Favorite Things placement. Voice is warm, occasion-focused, gift-friendly.

**Woodchuck USA (eco-mission, customizable wood goods, family-owned).** Family-owned brand offering customizable wood products with a "Buy One. Plant One." tree-planting pledge. Voice is friendly and values-forward. The customer is often drawn in by the mission and stays for the product.

**Etsy folk woodworkers (single-maker, story-led, handcrafted-personal).** One person, one workshop, products that carry visible maker identity. Voice is conversational and personal, photography is honest and warm, price points are accessible.

**Custom furniture commission specialists (client-led, process-forward, high-trust).** Small shops that take commissions for dining tables, beds, cabinetry, and built-ins. The storefront is a portfolio, not a shop. Voice emphasizes process, consultation, and craftsmanship vocabulary.

## Who their customers are

Buyer types in this category vary as much as the products. The most common archetypes include:

**Gift-buyers** who want something personal and non-generic — a cutting board engraved with the couple's wedding date, a small sign with a house name, a turned bowl as a housewarming present.

**Self-buyers and home-decorators** investing in their space — a live-edge charcuterie board for entertaining, a wooden serving tray, a wall sign for the kitchen.

**Commission clients** who arrive with a specific project: a dining table for a new house, custom built-in shelving, a bed frame designed around a room. These buyers are making a significant financial decision.

**Functional buyers** who want the thing to work — a cutting board that won't warp, a serving tray that won't stain, a toy that won't splinter.

**Collectors and enthusiasts** who follow specific makers, often in the lathe-turning or sculptural woodwork corners of the category.

Concerns that recur across most segments: Will it warp or crack over time? What's the finish — is it food-safe? What do I do to care for it? Will it arrive damaged? How long will it take?

Price ranges in this category are wide and positioning-dependent. Small decorative items commonly run $15–$60. Cutting boards commonly run $35–$180. Turned bowls commonly run $60–$350. Small furniture pieces commonly run $200–$900. Custom dining tables and large furniture commissions commonly run $1,500–$8,000 and up.

## How they talk about their products

The vocabulary of this category comes from the material, the process, and the tradition.

**Wood species** are often the first descriptor and carry real meaning: walnut (dark, rich, premium feel), maple (light, fine grain, clean, food-safe favorite), cherry (warm reddish tones, darkens with age), oak (open grain, traditional, durable), ash (pale, pronounced grain, flexible), cedar (aromatic, lightweight).

**Grain orientation** is a recurring specification: face grain (long-grain surface, decorative), edge grain (glued strips on their edge, more durable work surface), end grain (glued blocks showing end-grain surface, hardest-wearing, self-healing for cutting boards).

**Finish and food safety** are frequently specified: mineral oil, food-grade walnut oil, beeswax, cutting board oil, food-safe finish.

**Construction vocabulary** appears across the mid-range and high end: mortise and tenon, dovetail, box joint, frame and panel, through-tenon, hand-cut versus router-cut.

**Live edge** — a slab or board where the natural edge of the tree is preserved — carries strong visual and pricing associations. It signals natural, distinctive, premium.

What reads flat in this category: "premium quality," "made with love," "the finest," "beautiful craftsmanship" without a single specific. Specifics always win.

The maker's story carries weight across almost all positionings. Where the shop is, what kind of wood comes from where, why the maker started — these ground the purchase emotionally.

## Common specializations and variations

These are the sub-identities and variation axes that exist across the woodworker category. The maker selects and defines their own — these are starting suggestions, not a fixed schema.

**By product type:** Cutting boards and charcuterie boards · Lathe-turned bowls · Custom wood signs (routed, engraved, burned, painted) · Furniture (dining tables, benches, stools, bed frames, shelving, desks) · Cabinetry and built-ins · Wooden toys (cars, trains, puzzles, stacking games) · Serving trays and platters · Coasters · Spoons and utensils · Picture frames · Floating shelves · Decor (clocks, wall art, sculptures).

**By wood species:** Walnut · Maple · Cherry · Oak (white oak, red oak) · Ash · Cedar · Pine · Poplar · Reclaimed / salvaged wood · Live-edge slabs · Mixed species / contrasting inlay.

**By grain construction:** Face grain · Edge grain · End grain · Butcher block.

**By finish:** Food-safe mineral oil · Food-grade walnut oil · Beeswax · Hard wax oil · Danish oil · Lacquer · Polyurethane · Unfinished (raw) · Painted.

**By personalization type:** Engraved name or date · Monogram · Custom text · Logo · Handwriting reproduction · None (stock design).

**By commission type:** Ready-to-ship from stock · Made-to-order from a standard design · Fully custom commission (client-specified dimensions, species, finish).

Bundle and collection patterns: coordinated kitchen sets, gift-ready sets with oil included, seasonal holiday drops, personalized gift collections organized by occasion, and portfolio-style commission showcases.

## What customers ask before buying

The AI's job in product descriptions, FAQ, and storefront copy is to answer these before the customer has to ask:

- What species of wood is this, and why does it matter for how it performs or looks?
- What's the finish — is it food-safe? Can I use this as a cutting surface or is it decorative only?
- How do I care for it? Oil it? Hand-wash only? Can it go in the dishwasher?
- What are the exact dimensions and approximate weight?
- Will it warp, crack, or check over time?
- Is it made to order or in stock? How long will it take?
- For custom/personalized pieces: how do I submit what I want? When's the deadline for holiday shipping?
- For furniture commissions: What does the process look like? How much deposit is required? How long is the lead time?
- How is it shipped? What if it arrives damaged?
- Is the wood sustainably sourced, locally harvested, or reclaimed?

Storefronts that answer these clearly tend to outperform storefronts that make the buyer track down the answers.

## Visual direction range

The woodworker category holds a wide range of visual sensibilities. There is no single dominant aesthetic — the category spans rustic farmhouse, minimal Scandinavian, bold mid-century, raw industrial, and personalized-gift-shop warm. The mood pick at onboarding and the tenant's inspiration URLs are what choose among them.

- **Warm artisanal / craftsman-natural:** Honey and amber palettes; serif or slab-serif type; lifestyle photography showing hands at work, grain close-ups, morning light through the workshop window.
- **Minimal modern / Scandinavian-influenced:** Clean white or off-white backgrounds; sans-serif type; studio photography isolating the piece against neutral. Wood grain does the visual work.
- **Rustic / farmhouse / reclaimed:** Rough textures; barn wood and salvage framing; warm earth tones; hand-lettered or distressed type.
- **Gift-shop warm / occasion-led:** Light, bright, white backgrounds; warm accents; photography organized around occasion.
- **Design-forward studio:** Bold or dramatic photography; strong art direction; architectural scale.
- **Industrial / mixed-materials:** Raw steel paired with wood; concrete surfaces; urban workshop photography.
- **Natural / earth-connected / sustainability-led:** Outdoor photography; trees and forest imagery; sustainability messaging paired with clean simple design.

What holds across visual directions: wood photography rewards the grain. Close-ups of end grain on a cutting board, the figure in a walnut slab, tool marks on a turned bowl — these are the shots that do visual work in the category regardless of aesthetic direction.

## What tends to surface on the storefront

**A product-type or specialization grid or filter.** Woodworkers often span multiple product types that belong in separate collections.

**A materials and process section.** A brief explanation of the wood species used, how pieces are finished, and what that means for the buyer does real selling work.

**A maker story section.** The shop, the hands, the origin. Across positionings, the maker being visible tends to increase buyer confidence.

**A featured product or hero piece treatment.** A single table, board, or bowl photographed beautifully tends to do more storefront work than the same item thumbnailed in a grid.

**A commissions or custom-order section.** A dedicated block that explains what's possible, what the process looks like, and what the turnaround is.

**A portfolio or past-work gallery.** For commission-led shops, organized by room type or by style.

**A gift-finder or occasion filter.** For makers who do significant gift business.

**A care and maintenance section or FAQ.** Because food safety, oiling schedules, warping, and hand-washing questions recur across buyer types.

**A sustainability or sourcing block.** Where the maker has committed to local wood, reclaimed material, or a specific environmental practice.

## What to avoid

- **Stock photography of wood or workshops.** The category is built on individuality — specific grain, specific tools, specific hands.
- **Species or finish vagueness.** "Wood cutting board with natural finish" is dead copy in this category. Naming the species, the grain orientation, and the finish is what buyers in this category are reading for.
- **Inflated lead times or delivery promises.** Lead-time honesty earns more trust than lead-time optimism.
- **Burying the commission process.** Buyers who can't find the process don't start it; they leave.
- **Dishwasher-safe claims on solid wood.** Solid wood and dishwashers are incompatible.
- **Treating grain variation as a flaw to apologize for.** "No two pieces are identical because the tree is the mold" is a selling point. The AI should treat natural variation as a feature across all positionings.

## Adjacent niches

Woodworkers commonly expand into leatherwork (leather drawer pulls, tool rolls, leather-wrapped handles), blacksmithing and metal fabrication (especially steel-and-wood furniture combos), ceramics, home decor and wall art, and kitchen goods more broadly.

The niche files for home decor, ceramics, and leather goods will share vocabulary with this file around handcraft positioning, maker story, and natural-material care.
$body$,
  'approved', now(), NULL, NULL, NULL
),

-- ============================================================
-- fine_artist
-- ============================================================
(
  'fine_artist',
  'Fine Artist / Painter',
  array['seller', 'doer'],
  array['painter', 'fine art', 'watercolor artist', 'oil painter', 'acrylic painter', 'portrait artist', 'pet portrait artist', 'commissioned artist', 'mixed media artist', 'abstract painter'],
  array['illustrator', 'printmaker', 'photographer', 'ceramicist', 'textile_artist'],
  $body$
# Fine Artist / Painter

## What this business does

A fine artist or painter creates original visual works and sells them, takes commissions for custom pieces, or does both. The physical scope of the work includes oil on canvas or panel, watercolor on paper, acrylic on canvas or board, gouache, mixed media, and various combinations. Many painters also produce limited-edition giclée prints from their originals, which extends a work's commercial life and gives buyers a lower-cost entry point into the artist's catalog.

Operations are almost always small — one person working from a home studio, a shared artist cooperative space, a converted garage, or a rented studio. Distribution spans Etsy and similar marketplaces, the artist's own website, in-person studio sales and open studio events, art fairs, and consignment in local galleries. Commissioned work (portraits of people, pets, places, or objects made to a client's specification) runs alongside original work in many studios and is often the more reliable revenue stream, even for painters who think of themselves primarily as gallery artists.

The category spans subjects — landscape, portraiture, abstraction, still life, botanical, figurative, pet, architectural, folk, narrative — and that subject often shapes both the customer base and the storefront voice more than the medium does. A pet portrait artist and a plein air landscape painter both use oil, but they are running fundamentally different businesses with different customers, different sales cycles, and different vocabularies.

## Brand exemplars across the range

These are real brands and artist types cited not as targets a maker should imitate but as anchors showing what a polished version of different positionings looks like in this category. A tenant could land anywhere across this range, including places not on this list. The mood pick and the tenant's own inspiration URLs at onboarding choose direction.

**By Annie B. (warm, personal, pet portrait commissions, watercolor/charcoal/pencil).** A single-artist studio that has completed over 125 pet portrait commissions since 2014. Voice is personal and warm; the artist communicates directly with each client. The process is transparent: reference photo submission, pencil sketch approval, progress photo updates, two rounds of revisions before delivery. Common sizes are 5×7" and 8×10".

**West & Willow (modern, design-forward, digital illustration, premium pet portraits).** Positions custom pet portraits as interior design objects. Illustration is done digitally by hand and printed on museum-quality giclée Epson matte paper, then framed and ready to hang. Customization includes background color, frame style, size, and pet name. Voice is polished and product-led, not artist-led.

**Brianna Leidy (traditional oil portrait commissions, pets and people, premium process).** Commission-driven studio. Pricing is transparent on the site, deposit-first structure, 50% to reserve the schedule slot. Voice is professional and craft-forward. Positioned toward buyers who want traditional fine art, not digital or illustration-adjacent work.

**Stephen Moody / Moody Fine Art (figurative abstract expressionism, gallery-adjacent).** Originals and limited-edition prints from a studio with a strong point of view — impressionistic nudes and portraits executed in abstract expressionist style. Voice is artist-led and art-world-adjacent; the work is framed as painting first, product second.

**Talya Johnson (impressionist oil, landscapes, figurative, florals, originals and commissions).** A painter whose site covers multiple subjects within one visual voice — loose, colorful, impressionist. Originals sold directly, commissions accepted.

**Folk and naive painters (self-taught, story-led, community-rooted, often Etsy-native).** Work characterized by flat perspective, bold color, joy, and visible individuality. Story and biography matter enormously. Pricing typically runs lower than academically trained artists.

**Abstract painters (process-led, emotion-led, color-led, minimal narrative).** A positioning that resists subject-based description intentionally. Copy tends toward color and texture vocabulary and emotional or atmospheric framing. Originals are the primary product; prints are common.

## Who their customers are

Buyer types in this category vary by subject and positioning, but several archetypes recur across most.

**Commission buyers** who come with a specific request — a portrait of their late dog, a painting of the house they grew up in, a custom wedding gift for a couple. These buyers are often emotionally invested from the first message. Clear process documentation and a warm, patient voice tend to lower the barrier significantly.

**Collectors and followers** who have found an artist they love and buy across their catalog. They follow the artist on social media, get on mailing lists for new releases, and may pre-order from drops.

**Gift buyers** choosing original art or a commission as a significant personal gift. Weddings, significant birthdays, milestone anniversaries, memorials for a lost pet.

**Home decorators** who want original art as a design object — something that fills a specific wall space in a specific palette, made by a real person. These buyers often care about size, orientation, and color range.

**Art-world-adjacent buyers** who respond to a maker's position within a scene, medium, or tradition. They care about process, about what goes into the work, about the artist's references and context.

Common concerns across most buyer segments:

**Authenticity and provenance.** Buyers of original work want to be sure they are getting what is described. Clear distinction between originals and prints (including giclée editions) on every product listing is essential.

**Likeness quality for commissions.** The single biggest concern for pet portrait and people portrait buyers is whether the result will actually look like their subject. Revision rounds, reference photo guidance, and clear before-shipping approval steps are the main trust-builders.

**Longevity and care.** Will this last? Questions about archival quality (acid-free paper, archival inks, UV-protective varnish on oils) show up consistently.

Pricing ranges very widely. Oil commissions from established artists commonly run $500–$5,000+ for a single portrait. Watercolor pet portraits from Etsy-native artists commonly run $80–$300. Giclée prints from originals commonly run $40–$250 depending on edition size and paper.

## How they talk about their products

The vocabulary in this category is medium-specific and process-specific.

**Medium and support vocabulary.** Oil on linen, oil on canvas, oil on wood panel, watercolor on hot-press paper, watercolor on cold-press paper, acrylic on canvas, acrylic on board, gouache on paper or illustration board, mixed media on wood or paper. "Hot press" and "cold press" are not interchangeable; hot press is smooth and gives crisp edges, cold press is textured and holds granulation.

**Print vocabulary.** Giclée refers to archival-quality inkjet prints on acid-free paper or canvas using pigment-based inks rated 100+ years to visible fading. Limited edition prints are numbered individually (e.g., "15/50") and signed by the artist. Open editions are unlimited in quantity. Artist proofs (AP) are a small number printed alongside a limited edition.

**Commission process vocabulary.** Reference photo, likeness approval, revision rounds, commission deposit (typically 50% upfront), queue or waitlist, proof or progress photo, final approval before shipping. For pet portraits specifically: the quality of the reference photo often determines the quality of the portrait.

**Naming strategies.** Abstract and landscape painters often name works by subject, mood, or location — "Late October," "Blue Ridge, September." Portrait artists often name commissions by subject. Some painters use series framing — "From the Meadow series," "Night Studies."

What reads flat across every positioning: generic product descriptions without medium or process specifics.

The maker's story carries weight here even more than in most handcraft categories. Original art buyers at almost every positioning want to know who painted this, what moved them to paint it, and what they were thinking.

## Common specializations and variations

These are the sub-identities and variation axes within this niche. Phrased as starting suggestions the maker picks from, not as a fixed schema.

**By medium:** Oil on canvas · Oil on linen · Oil on wood panel · Watercolor on paper (hot press or cold press) · Acrylic on canvas · Acrylic on board · Gouache on paper or board · Charcoal or pencil (for commissions) · Colored pencil · Mixed media · Digital illustration (hand-drawn, not AI-generated).

**By subject (originals and commissions):** Pet portraits (dog, cat, horse, bird, other) · People portraits (individual, couple, family, child) · Landscape and plein air · Abstract and non-representational · Still life · Botanical and floral · Architectural and house portraits · Narrative or folk · Figurative.

**By format (what the buyer receives):** Original painting (one-of-a-kind) · Limited-edition giclée print (numbered, signed) · Open-edition giclée print · Commission (made to specification) · Digital download (high-resolution file for personal printing).

**Commission-specific variations:** Number of subjects in one composition · Size · Background treatment · Framing · Rush or standard queue timeline · Number of revision rounds included.

Bundle and collection patterns: seasonal releases of a new small original series, "from the studio" drops announced to an email list, holiday commission slots, postcard-size originals as an accessible entry product, and print bundles.

## What customers ask before buying

The AI's job in product descriptions, commission intake pages, FAQ sections, and storefront copy is to answer these without the customer having to ask:

- Is this an original or a print? If a print, what edition size, what paper, and is it archival?
- What medium was used, and on what support?
- What are the exact dimensions?
- For commissions: What does the process look like start to finish? What do I need to provide?
- For commissions: How long will it take? Is there a queue?
- For commissions: How many revisions are included? What happens if I don't like it?
- For commissions: What's the deposit structure and when is the remainder due?
- What reference photo quality do you need?
- Will you show me progress photos before the final version ships?
- How is it shipped, and is it insured?
- Does it come with a certificate of authenticity?
- What are the reproduction rights?
- How do I hang and care for it?

A storefront that answers these clearly tends to outperform one that doesn't, particularly on commission conversion.

## Visual direction range

The fine art and painting category contains a wide range of visual sensibilities with no single dominant aesthetic. The mood pick at onboarding and the tenant's inspiration URLs are what choose among them.

- **Warm and personal, handcraft-coded.** Cream or warm white backgrounds; serif or hand-lettered type; lifestyle photography that shows the studio or the artist's hands.
- **Clean and product-forward.** White backgrounds; minimal typography; product photography as the dominant element. Common in design-forward portrait brands where the piece functions as a design object.
- **Gallery-adjacent.** Large images; generous white space; minimal navigation; often a dark or neutral ground. Common in abstract and fine art positions.
- **Impressionist and color-led.** Saturated palettes drawn from the paintings themselves; painterly or brushstroke-textured backgrounds.
- **Dark and atmospheric.** Deep backgrounds; muted or dark palettes; low-key photography; gothic or elegant serif type.
- **Folk and naive, story-forward.** Bright and informal; often irregular or hand-drawn graphic elements; biographical copy given as much weight as product copy.
- **Commission-process-forward.** The site is organized around the intake flow — how to order, what to send, what to expect.

What holds true across visual directions: original art rewards large images. The AI should push for large, high-resolution images and at least one detail-crop shot alongside the full-painting view. For pet portrait and people portrait commissions, showing before-and-after sets (reference photo alongside the finished work) tends to be the most effective trust-builder.

## What tends to surface on the storefront

**A portfolio or gallery section.** Should be organized in a way that reflects how the artist thinks — by series, by subject, by medium. Large images matter here.

**A commissions section or intake page.** For any artist who takes custom work, this is often the highest-converting page on the site.

**A prints section, separate from originals.** Keeping originals and prints visually and navigationally distinct prevents confusion about what a buyer is purchasing.

**A featured work or hero piece.** One painting displayed large and beautifully tells a stronger story than ten paintings displayed at postage-stamp scale.

**An about section with the artist visible.** Original art buyers at nearly every positioning want to know who made this and why.

**Process transparency for commissions.** A step-by-step section reduces the friction that prevents first-time commission buyers from placing an order.

**A print edition transparency block.** Edition size, what "limited edition" means, how numbering works, what archival materials are used, whether a certificate of authenticity is included.

**An email list capture.** Painters who drop new originals or open commission slots build their most reliable revenue through a list, not social media.

## What to avoid

- **Stock imagery of paintings or art supplies.** Original art storefronts live or die on the authenticity of the work being shown.
- **Conflating originals and prints without clear labeling.** Calling a giclée print "a painting" or "original art" is a trust-breaker.
- **Vague commission descriptions.** "I paint custom portraits" without explaining process, timeline, deposit structure, or revision terms leaves too many questions unanswered.
- **Hiding pricing entirely.** Where a price range or starting price can be given, it reduces the self-exclusion that happens when no number is visible.
- **Treating the painting as a product rather than an object someone made.** The context of making is part of what buyers are purchasing.
- **Burying or omitting the artist.** Storefronts where no human is visible tend to underperform against storefronts where the maker is present and legible.

## Adjacent niches

Fine artists who paint commonly expand into illustration (editorial, book, product), printmaking (silkscreen, linocut, etching — distinct processes with distinct communities and buyers), ceramics and mixed media sculpture, and photography. Some painters move toward teaching — workshops, courses, and instruction become a revenue line alongside originals.

The pet portrait segment specifically overlaps with the illustration and digital art niches. When the illustrator and digital art niche files get written, they should reference this file for shared vocabulary around commissions, reference photos, likeness approval, and revision terms.
$body$,
  'approved', now(), NULL, NULL, NULL
),

-- ============================================================
-- vintage_reseller
-- ============================================================
(
  'vintage_reseller',
  'Vintage Reseller',
  array['seller'],
  array['vintage shop', 'vintage clothing', 'vintage seller', 'vintage finds', 'antique reseller', 'estate finds', 'thrift reseller', 'curated vintage', 'vintage dealer', 'secondhand shop'],
  array['jewelry_maker', 'clothing_boutique', 'antique_dealer', 'art_print_seller', 'home_decor'],
  $body$
# Vintage Reseller

## What this business does

A vintage reseller sources, curates, and sells pre-owned goods with age or provenance value. The work is fundamentally different from making — the seller does not produce the goods; they find them, assess them, authenticate them to the degree their category demands, and present them to buyers who care where things came from and what they've lived through. That curation is the craft. The skill lives in knowing what to look for, where to look, and how to communicate what they found.

Operations range widely. Some resellers source exclusively from estate sales, flea markets, and garage sales and photograph everything on a kitchen table. Others maintain inventory across storage units, booths at antique malls, and an online storefront. Distribution is almost always multi-channel: Etsy is the dominant marketplace for independent vintage sellers, but many also use Depop, eBay, Poshmark, Instagram, and their own sites depending on category and price point.

The category spans clothing and accessories, jewelry (from fashion pieces to fine estate jewelry), housewares and home decor (glassware, ceramics, textiles, barware, kitchenware), and ephemera (paper goods, advertising, postcards, photographs, books, prints, scrapbook material, junk journal fodder). Some resellers work all of these; many are specialists. Era can be as defining as category — a reseller who exclusively hunts Y2K sportswear is running a fundamentally different business from one who deals in Victorian jewelry or mid-century modern barware, even if both call themselves vintage sellers.

## Brand exemplars across the range

These are real brands and seller types cited not as targets the maker should imitate but as anchors showing what a polished version of different positionings looks like in this category. A tenant could land anywhere across this range, including places not on this list. The mood pick and the tenant's own inspiration URLs at onboarding tell the AI which direction to lean.

**Beyond Retro (large-scale curated resale, sustainability-forward).** One of the UK's largest vintage clothing operations, born in a dairy off Brick Lane in 2002. Their handpicked stock spans decades — 1950s team jackets, 80s band tees, Y2K branded sportswear, party sequins — with a "trend-focused team" doing the curation. Voice is casual and contemporary; sustainability is a primary frame ("circular fashion," "pre-loved garments into contemporary treasures").

**Erica Weiner (provenance-led antique jewelry, storytelling-forward).** A New York shop mixing handmade pieces with genuine antique and estate jewelry from the 17th–20th centuries. The brand voice is distinctly personal and odd — they love pieces with "weird, wonderful stories to tell," esoteric symbols, bad repairs, and "what the hell is that?" moments. The about page bills them as "two history nerds curating gorgeous, rare antique jewelry."

**Lang Antiques (expert-led estate and antique jewelry, trust-forward).** A San Francisco dealer in operation since 1969, spanning Georgian, Victorian, Art Nouveau, Edwardian, Art Deco, Retro, and Mid-Century jewelry. Authority and expertise are the primary brand signals.

**Awoke Vintage (accessible, eclectic, neighborhood-energy).** A Brooklyn-via-Perth shop with physical locations and an online presence, known for affordable, eclectic finds. Voice is casual, accessible, down-to-earth.

**Decade-specialist Etsy sellers (era-focused, community-adjacent).** A significant portion of the Etsy vintage market is built around decade specialists — Y2K, 70s boho, 80s power-dressing, 90s grunge. These sellers speak fluently in the slang and visual codes of the era, attract buyers who are partly shopping for an identity as much as a garment.

**Mid-century modern housewares sellers (category-specialist, design-literate).** Shops built around a specific design period — most often mid-century modern (roughly 1940s–1970s). These sellers speak the language of designers, makers, and manufacturers: Pyrex, Cathrineholm, Russel Wright, Fiestaware, Dansk.

**Paper ephemera and junk journal sellers (niche-collectible, community-driven).** A fast-growing segment supplying vintage paper goods — advertising cards, postcards, photographs, die cuts, seed packets, trade cards, ledger pages, maps — primarily to the junk journal, altered art, and scrapbooking communities.

## Who their customers are

Buyer types in this category vary across the sub-segments. The most common ones include:

**Collectors** who buy with intention and accumulate within a defined scope — a Pyrex pattern, a jewelry period, a specific designer's work. Collectors know the market well and compare prices. Repeat buyers when the seller understands what they're hunting.

**Style-seekers** buying vintage clothing and accessories for the look — the fit of an older cut, the quality of older fabric, the impossibility of finding something exactly like it new.

**Identity-signal buyers** for whom the item is partly about belonging to a subculture or era. Y2K fashion, 70s bohemian, cottagecore, grandmillenial, maximalist — the aesthetic is the point.

**Gift-buyers** picking up something unusual, personal, or beautiful for someone specific. Jewelry and art objects attract gift-buyers who want something that couldn't have been bought at a mall.

**Decorators and homeowners** furnishing a space with character — mid-century pieces, vintage ceramics, art glass, framed ephemera.

**Crafters and creatives** buying ephemera, fabric, trims, and notions as raw material for junk journaling, collage, altered art, quilting, or other craft practices.

**Antique and estate jewelry buyers** seeking a specific period or style — Art Deco platinum, Victorian mourning jewelry, Bakelite bangles, signed mid-century costume pieces.

Two concerns cut across most of these buyer types:

**Condition and transparency.** Vintage condition is not standardized — "excellent vintage condition" from a careful specialist means something different from the same phrase from a casual seller. Buyers have been burned by sellers who understate damage, overstate grade, or photograph items strategically to hide flaws. Explicit, photographic condition disclosure is the single most important trust signal in the category.

**Fit and sizing for clothing.** Vintage sizing bears almost no relationship to modern sizing — a 1960s size 14 fits a modern size 6 or 8. Buyers who don't know this get burned. Sellers who provide both the label and the measurements (bust, waist, hips, length, sleeve) in every listing earn trust that sellers who don't never recover.

Price conventions vary dramatically by sub-category. Vintage clothing at the mass-eclectic end commonly runs $15–$65 per piece; curated or era-specialist pieces at $40–$200; fine vintage or designer pieces at $150–$2,000+. Vintage housewares span from $8 single pieces to $100–$500+ for sought-after makers or pattern-complete sets.

## How they talk about their products

Vintage vocabulary is layered, and the layer a seller uses tells you their customer almost immediately.

**Condition language.** The de facto grading scale runs: Mint or New Old Stock (NOS) / Deadstock → Excellent → Very Good → Good → Fair → Poor or As-Is. Most serious sellers use a subset of these and define what they mean by them: what "excellent" allows, what "good" acknowledges, what "fair" discloses (visible flaw, stated specifically — "small underarm stain, photographed").

**Era and period language.** "30s," "40s," "mid-century," "atomic age," "Space Age," "70s boho," "Y2K," "early aughts" — era language is often as important as category in search, discovery, and buyer expectation. For jewelry: Georgian, Victorian, Edwardian, Art Nouveau, Art Deco, Retro (1940s), Mid-Century Modern, Modernist.

**Material and maker language.** For housewares: Pyrex, Fire-King, Corningware, Fiestaware, Cathrineholm, Russel Wright, Dansk, Hazel Atlas — manufacturer recognition matters to collectors. For clothing: fabric content (deadstock wool, silk charmeuse, heavy denim, jacquard weave), hardware details (original zipper, metal buttons, raw edge). For jewelry: material identification (sterling, gold-filled, vermeil, gold plate, Bakelite, Lucite, rhinestone, paste), signed vs. unsigned.

**Provenance and origin language.** "Estate find," "sourced from an estate sale in [region]," "bought from the original owner," "found in a farmhouse attic" — origin stories give context that increases perceived value and establishes seller credibility.

What reads flat across the category: generic language that could describe anything ("beautiful piece," "lovely vintage find," "great condition"). What reads true: specific, observable language — a material you can feel, a flaw you can see in the photo, a maker's mark that can be looked up.

Story carries particular weight in this category. The curation is the story — where it was found, what makes it unusual, what the piece is from. Sellers who can tell that story in a sentence or two write listings that convert.

## Common specializations and variations

These variation axes exist across the vintage resale market. The seller defines their own scope — these are starting suggestions, not a fixed schema.

**Category.** Clothing and accessories / Jewelry (fashion/costume, fine/estate, signed costume pieces) / Housewares and home decor (ceramics, glass, barware, kitchenware, linens, art objects) / Ephemera (paper goods, advertising, postcards, photographs, books, maps, die cuts) / Furniture and decorative objects / Sporting goods and toys / Records and media.

**Era.** Victorian (pre-1900) / Edwardian (1900–1915) / Art Deco / 1920s–1930s / 1940s–1950s / Mid-century modern / 1960s Mod / 1970s / 1980s / 1990s / Y2K (late 1990s–early 2000s).

**Condition grades.** NOS/Deadstock (unworn, original tags or packaging, never used) / Excellent / Very Good / Good / Fair / Poor or As-Is. The seller defines what each grade allows in their shop; stating it explicitly in the shop policy section builds trust.

**Sourcing origin.** Estate sale finds / Flea market and swap meet / Barn and attic finds / International (vintage from Japan, France, Scandinavia, UK carries different buyer associations) / Wholesale vintage lots.

**Bundle and lot patterns.** Ephemera sellers commonly sell curated lots by theme, era, or color palette. Clothing sellers occasionally bundle "wardrobe capsules." Housewares sellers sell matched sets — a complete Pyrex nesting bowl set vs. individual pieces.

**Curation identity.** Some sellers curate across categories ("anything beautiful and old") and are organized by era or aesthetic mood. Others are strict specialists.

## What customers ask before buying

The AI's job in product descriptions, FAQ, and storefront copy is to answer these without the customer having to ask:

- What condition is it, specifically? What does the grade mean in this shop?
- What are the flat measurements? (For clothing: bust, waist, hips, length, sleeve length. For housewares: height, diameter, volume. For jewelry: length, clasp type, stone dimensions.)
- What is the vintage size label, and how does it translate to modern sizing?
- Is it authentic? How do you know the era? Is there a label, maker's mark, or hallmark?
- What is the material?
- Has it been cleaned, laundered, repaired, or altered?
- What does the return policy say?
- How is it shipped, and what's the packaging like?
- Where did it come from?

A storefront that answers these clearly tends to outperform one that doesn't, regardless of design direction or price tier.

## Visual direction range

The vintage resale category contains a genuinely wide range of visual sensibilities. No single aesthetic dominates. The mood pick at onboarding and the tenant's inspiration URLs are what choose among these directions.

- **Editorial vintage:** high-contrast, styled photography on models or dressed flats; warm film tones or deliberately desaturated palette; feels like a magazine spread.
- **Collector-cabinet aesthetic:** clean, consistent backgrounds (white, kraft, linen); item-only photography; careful lighting to show condition and detail.
- **Era-immersive:** backgrounds, props, typography, and color palette all pulled from the source decade.
- **Dark, moody, cabinet-of-curiosities:** deep backgrounds (charcoal, black, forest green); dramatic lighting; gothic or apothecary-coded type.
- **Bright and chaotic maximalist:** packed grids; bold typography; color-saturated photography. Common in high-volume eclectic resellers.
- **Minimal Scandi or mid-century modern:** clean neutrals (cream, warm grey, natural wood tones); sparse styling; objects in situ in styled interiors.
- **Warm market stall:** hand-lettered or vintage-typography branding; warm light; slightly imperfect photography; personal voice throughout.
- **Craft-adjacent for ephemera sellers:** flat lays featuring paper goods styled with other craft supplies.

Photography in this category has specific demands regardless of aesthetic direction. For clothing: flat lays and on-body shots both have legitimate uses; detail shots of labels, hardware, and any disclosed flaws are non-negotiable. For jewelry: close-up macro detail showing construction, finish, and any patina. For housewares: scale photos and pattern detail shots. For ephemera: flat lays in natural light. Flaws should be photographed and labeled, not hidden.

## What tends to surface on the storefront

**A condition policy and grading guide.** An explicit condition grading guide surfaced prominently is a genuine trust-builder in this category. Buyers who have been burned elsewhere specifically look for sellers who define their terms.

**A category or era filter or navigation.** Vintage buyers browse by era, category, or both. A flat unfiltered product grid defeats discovery.

**A sourcing or curation story block.** The curation story — who this person is, where they find things, what they're drawn to — is part of what buyers are buying.

**A featured or spotlight piece.** Vintage is one-of-a-kind by nature; a single beautifully photographed hero item on the homepage performs better than a wall of thumbnails as a first impression.

**A sizing and measurements guide.** Specific to clothing sellers. A sizing conversion chart or measurement guide prevents pre-purchase uncertainty and reduces post-purchase disappointment.

**New arrivals or recent finds.** Repeat buyers in this category come back specifically to see what's new — vintage inventory turns over and is never restocked.

**A thematic collection or curated lot section.** Collections organized by theme tell a more compelling story than individual listings.

**A care and storage guide.** Signals expertise and prevents returns and negative reviews.

## What to avoid

- **Hiding flaws in photography.** Styling a damaged garment to hide staining or photographing a chip from only one angle is the fastest way to generate negative reviews. Vintage buyers have learned to ask for additional photos; sellers who surface flaws proactively earn trust.
- **Vague condition language.** "Good vintage condition" with no further definition is a trust deficit. Define what your grades mean. Say specifically what you're disclosing.
- **Era exaggeration.** Calling a 1985 item "1970s" to boost search appeal, or calling a reproduction "vintage," is the fastest trust-destruction in the category.
- **Clothing listings without flat measurements.** A vintage size label alone is not useful to buyers who know vintage sizing is unreliable.
- **Making the inventory bigger than the curation.** Volume sellers who list everything without selectivity lose the "curator" positioning that makes independent vintage resellers compelling.
- **Generic copy that could apply to any vintage item.** "A beautiful piece from a bygone era" is dead copy. The provenance, the detail, the maker's mark, the unusual colorway, the specific sourcing story — these are what convert browsers to buyers.

## Adjacent niches

Vintage resellers commonly expand into, or overlap with, handmade jewelry makers (sourcing stone or antique parts for new pieces), vintage-inspired reproduction clothing, antique dealers (fine furniture and decorative arts alongside wearables and housewares), textile sellers (vintage fabric yardage, vintage trims and notions as maker supplies), and art print sellers (vintage prints framed or unframed, vintage posters, lithographs).

The ephemera sub-segment overlaps with the junk journal maker community, the art print seller community, and the scrapbooking supply seller community. The clothing resale segment has particular overlap with sustainable fashion boutiques and secondhand clothing resellers who may not use the word "vintage" at all.
$body$,
  'approved', now(), NULL, NULL, NULL
);
