# QR-code self-serve checkout options for in-person vendors (US, 2025-2026)

Scope: every existing way a buyer at a booth / market / farm stand can scan a QR and self-serve pay or order, and how close each comes to the target flow (scan, see this market's pieces, pick one, give first name, choose Venmo / Cash App / Zelle / cash, item held immediately so it can't sell online, P2P app opens pre-filled, maker's phone shows the waiting buyer to mark Paid / Not received; bundled with a maker site at $15-25/mo).

Research limits worth knowing up front: Reddit could not be fetched or searched directly (the domain blocks this crawler), so firsthand vendor sentiment from r/craftfairs, r/farmersmarket, r/Etsy is mostly a gap. Several fee figures come from third-party reviews; official pages are cited where found.

## Payment-app QR codes (Venmo, Cash App, PayPal, Zelle): fees, vendor use, payment-to-item matching

### Takeaway
These are the most common "QR at the booth" method. Vendors print one QR per app on a "Scan to Pay" sign. Fees are low (Venmo business 1.9% + $0.10, Cash App for Business 2.75%, Zelle $0 through the bank). But every one of them is a payment-only QR. There is no item list, no cart, no inventory, and no tie between the payment and what was bought. Matching payments to items is manual: the vendor reads the payment note or name. Venmo and Cash App both support pre-filled amount links, which is the building block the target app would use.

### Cited Findings
- Venmo business profile fee is 1.9% + $0.10 on payments from another Venmo account. It applies to every payment of $1.00 or more and is charged to the merchant. Seller fees are not refunded. — [Venmo Help Center: business profile fees](https://help.venmo.com/hc/en-us/articles/1500003204302-Business-Profile-Fees-)
- Venmo Tap to Pay (iPhone/Android contactless) on a business profile is 2.29% + $0.10. — [Venmo Help Center](https://help.venmo.com/hc/en-us/articles/1500003204302-Business-Profile-Fees-)
- Buyers paying a Venmo business profile with a credit card are exempt from Venmo's usual 3% credit-card-funding fee. — [Venmo Help Center](https://help.venmo.com/hc/en-us/articles/1500003204302-Business-Profile-Fees-)
- A Venmo business profile has no monthly or setup fee. — [NerdWallet Venmo Business review](https://www.nerdwallet.com/article/small-business/venmo-business)
- A Venmo business QR can have a fixed amount set, so it pre-fills the price when scanned ("Set Amount"). — [Wise: Venmo for business review](https://wise.com/us/blog/venmo-for-business-review)
- Venmo has a legacy URL format for pre-filled payments: `venmo.com/<username>?txn=pay&amount=<value>&note=<text>`. The same Venmo page says the Venmo Developer and Payouts APIs are retired, so whether this link is still supported is unconfirmed. — [Venmo payment links docs](https://venmo.com/paymentlinks); [venmo npm package](https://www.npmjs.com/package/venmo)
- Venmo "Show to Pay" is a different flow: the vendor scans the customer's code, and the buyer picks a funding source first. — [Venmo In-Store QR Codes FAQ](https://help.venmo.com/cs/articles/instore-qr-codes-faq-vhel205)
- Cash App for Business automatically deducts a 2.75% processing fee on each payment received. Accounts are free and need no hardware. — [Cash App Help: business fees](https://cash.app/help/6521-cash-for-business-fees)
- NerdWallet reports a split rate instead (2.5% debit / app transfers, 2.75% credit), which conflicts with Cash App's flat 2.75%. — [NerdWallet: Cash App business account](https://www.nerdwallet.com/article/small-business/cash-app-business-account-pros-cons-alternatives); contradicted by [Cash App Help](https://cash.app/help/6521-cash-for-business-fees)
- Cash App instant deposits can cost 0.5%-1.75% (minimum $0.25). — [Cash App Help](https://cash.app/help/6521-cash-for-business-fees)
- Cash App business accounts are liable for chargebacks, and the chargeback fees are not disclosed. — [NerdWallet](https://www.nerdwallet.com/article/small-business/cash-app-business-account-pros-cons-alternatives)
- Cash App launched payment links. A link opens a pre-filled payment with amount and note, and links are reusable. — [Cash App press: payment links](https://cash.app/press/cash-app-launches-payment-links); [Payments Dive](https://www.paymentsdive.com/news/cash-app-debuts-payment-links-text-email-paypal/812114/)
- No documented URL format like `cash.app/$tag/<amount>` was found. Fixed-amount links are generated inside the app. — gap; see [Cash App press](https://cash.app/press/cash-app-launches-payment-links)
- PayPal US QR rates: no official 2025-2026 US figure was found. 2021 coverage set in-person PayPal/Venmo QR at 1.90% + $0.10 above $10 and 2.40% + $0.05 at $10 and under. — [TipRanks on 2021 PayPal rate change](https://www.tipranks.com/news/paypal-to-adjust-its-merchant-rates-from-august); [eMarketer](https://www.emarketer.com/content/paypal-updates-merchant-fee-structure-sharpen-competitive-edge)
- PayPal markets QR codes for in-person sales such as farmers markets: the customer scans and pays in the PayPal app. — [PayPal QR code payments](https://www.paypal.com/ca/webapps/mpp/qr-code-download)
- Zelle for small business: no Zelle-specific fee was found. It runs inside the bank's app, and the QR is under "My Code". — [Fit Small Business](https://fitsmallbusiness.com/how-to-use-zelle-for-business/); [Fulton Bank Zelle SMB FAQ](https://www.fultonbank.com/-/media/Files/Personal/Zelle_Small-Business_FAQs.pdf)
- Zelle limits are set by the bank (for example, Synovus caps sending at $3,000/day and $15,000/30 days). Some banks' small business Zelle can't send to or receive from users of the standalone Zelle app. Zelle doesn't integrate with accounting software. — [Synovus](https://synovus.com/business/digital-banking/zelle/faqs); [Regions](https://regions.com/digital-banking/transfer-money-and-pay/send-money-with-zelle/zelle-for-business); [Fulton Bank](https://www.fultonbank.com/-/media/Files/Personal/Zelle_Small-Business_FAQs.pdf)
- Vendor practice: a processor's craft-fair guide says Venmo is one of the most common payment methods at craft fairs. It advises a large Venmo QR at the booth and accepting cash, cards, Venmo, and PayPal at minimum, with Cash App, Zelle, Apple Pay, and Google Pay as extras. (This is a processor's sales content.) — [QuadraPay](https://quadrapay.com/accept-payments-vendor-fairs-craft-markets/)
- There is a cottage market for printable "Scan to Pay" booth signs that carry separate Venmo / Cash App / PayPal QRs plus a list of other accepted methods. This shows the multi-QR sign is the standard setup. — [Etsy: craft fair payment signs](https://www.etsy.com/market/craft_fair_payment); [Zazzle QR pay sign](https://www.zazzle.com/craft_show_booth_display_qr_code_pay_pedestal_sign-256178961424719229)
- The Vermont Crafts Council publishes a payments guide for makers ("Accepting Payments at the Studio"), so P2P apps are part of mainstream maker practice. — [Vermont Crafts PDF](https://www.vermontcrafts.com/wp-content/uploads/2025/05/Accepting-Payments-at-the-Studio.pdf)

### Inferences
- The fees make P2P attractive. A $40 piece costs about $0.86 on Venmo business, $1.10 on Cash App business, and $0 on Zelle, against roughly $1.06+ on card processors. The target app's choice of P2P rails fits a real habit and real economics.
- The core unsolved problem is reconciliation. The sign carries a QR, not an order, so the vendor has to watch the phone, eyeball a name or note, and remember which piece it was for. Nothing holds inventory, and nothing records "this market sold X". This is exactly the gap the target flow fills (order first, then a pre-filled payment, then the vendor confirms against a named waiting buyer).
- Personal (non-business) Venmo/Cash App accounts used for sales risk policy issues and lose purchase protection. The target app nudging makers toward business profiles is an easy value-add, but this wasn't researched in depth here.

### Gaps
- No official 2025-2026 US PayPal QR merchant rate was found.
- Whether Venmo's `?txn=pay&amount=&note=` deep link still reliably pre-fills in the current app (2025-2026) is unconfirmed. It should be tested on-device.
- No confirmed URL-parameter way to pre-fill a Cash App amount was found. In-app payment links do it, but they appear to be made one at a time in the app, not built by a third party.
- Zelle's support for amount-pre-filled QR / links was not found. Zelle QR appears to carry only the recipient's identity.
- Quantitative data on how often P2P payments at booths are mismatched, missed, or disputed was not found.

## POS self-checkout / QR ordering (Square, Shopify, Clover, Toast, Stripe Payment Links, SumUp)

### Takeaway
The big POS platforms built QR self-ordering for restaurants (scan a table QR, order, pay), not for a retail booth with one-of-a-kind items. For retail and market sellers, the QR options are a payment link (one item or one amount, card rails only) or a QR pointing at the online store. Stripe Payment Links are the nearest primitive to "item held", because a link can cap purchases and auto-deactivate. None of them accept Venmo / Cash App / Zelle as a self-serve tender recorded against an order.

### Cited Findings
- Square launched QR-code self-serve ordering for Square Online sellers (aimed at restaurants) in 2020 at no extra charge. — [VentureBeat](https://venturebeat.com/business/square-adopts-qr-codes-to-bring-self-serve-ordering-to-restaurants); [IBS Intelligence](https://ibsintelligence.com/ibsi-news/square-launches-qr-based-self-serve-ordering-feature-for-restaurants)
- Square Kiosk (May 2024) is a hardware + software self-serve ordering product for quick-service restaurants. — [Square press: Square Kiosk](https://squareup.com/us/en/press/announcing-square-kiosk)
- On Square's seller forum, an unmanned produce stand asked for a QR option. The Square Champion's workaround was a payment link set up as "Accept a Donation" (the buyer types the amount). The Champion noted it does not add up items or give a total. — [Square Community: QR code options for unmanned produce stand](https://community.squareup.com/t5/Payments-Troubleshooting/QR-code-options-for-unmanned-produce-stand/m-p/819156)
- In the same kind of thread, a maple-syrup seller didn't want a QR per product because many customers are elderly and it's "one tech step too far". The suggested tablet-on-a-stand raised theft and weather concerns. — [Square Community: Non-Restaurant Self Service with a Handheld Scanner](https://community.squareup.com/t5/Orders-Menu-Items-Catalog/Non-Restaurant-Self-Service-with-a-Handheld-Scanner/td-p/713344)
- A Square seller-community thread on using Square Kiosk at a farm stand says the kiosk is built mainly for card payments. Cash or manual entries can be tracked with custom tenders, but Venmo is not natively supported. — [Square Seller Community: Square Kiosk for Farm Stands](https://sellercommunity.com/t5/Square-Point-of-Sale/Square-Kiosk-for-Farm-Stands-Can-It-Support-Cash-Coupons-and/m-p/768257)
- Square checkout links can be generated from the POS app (enter amount, Charge, Online Checkout, Get link). An older moderator answer said QR for checkout links wasn't offered, which conflicts with later posts, so it is unclear. — [Square Seller Community: QR code payment option](https://sellercommunity.com/t5/Feature-Requests/Does-Square-offer-a-QR-Code-Payment-Option/td-p/153620/page/2)
- Stripe Payment Links can be shown as a downloadable QR from the Dashboard, and the QR doesn't expire. Links can limit how many times they're purchased and auto-deactivate at the limit ("useful for limited stock"). Default max amount is $10,000. — [Stripe docs: Payment Links](https://docs.stripe.com/no-code/payment-links); [Stripe docs: in person no-code](https://docs.stripe.com/no-code/in-person)
- Stripe in-person rate cited by a third party is 2.7% + $0.05 (online 2.9% + $0.30). This is unverified against Stripe's pricing page. — [WP Full Pay](https://paymentsplugin.com/blog/stripe-payment-links/)
- Shopify POS: no native customer-facing "scan to buy" self-checkout was found. Its QR features are staff-scanned discount codes and third-party loyalty / sign-in QRs. A true customer scan-to-buy would need a custom POS UI extension. — [PowerCommerce on Shopify discount QR codes](https://powercommerce.com/blogs/shopify-updates/shopify-adds-qr-code-support-for-discount-codes-faster-pos-checkouts-and-shareable-online-discounts); [Shopify Community thread](https://community.shopify.com/t/can-a-mobile-app-facilitate-in-store-wireless-purchases-with-qr-code-scanning/87521)
- Farmbrite's Quick Pay (on Stripe) is a QR where the customer enters how much to pay. — [Farmbrite help](https://help.farmbrite.com/help/pdfexport/id/5f1b1349ec161c965368819e)

### Inferences
- Square, Shopify, and Stripe all have the parts (a catalog, inventory, payment links), but the self-serve QR products are aimed at restaurants or are single-amount links. For a craft booth, the common outcome is either "customer types an amount" or "customer browses the full online store on their phone". Neither is a market-scoped list, and neither holds the item.
- Stripe Payment Links with a purchase limit of 1 are the closest thing to an inventory hold, but they are per-item (one QR per piece), card-only, and don't create a named "waiting buyer" for the vendor.
- The target app's novelty against POS players is P2P tenders (Venmo / Cash App / Zelle / cash) as first-class choices on a self-serve order. Square's own forum confirms Venmo isn't supported in its self-serve kiosk.

### Gaps
- Clover, Toast, and SumUp QR / payment-link features were not researched in this pass (out of tool budget). Toast is restaurant-only by design. SumUp has payment links and QR, but its US pricing and features weren't verified.
- Current Square pricing for retail self-serve / kiosk and whether Square Online "order via QR" now supports a retail pickup flow at a market weren't confirmed for 2025-2026.
- Whether Shopify has a native retail "scan a product QR, buy on your phone" feature in 2025-2026 is unconfirmed (only community threads were found).

## Honor-system / unattended farm stand apps and booth self-checkout apps

### Takeaway
There is a small, real category of unattended-stand self-checkout apps. TallyTill is the closest functional match found: a catalog with QR / barcode / photo scan, card / tap / QR / cash payment, honor mode, offline queue, and a $0 / $15 / $35 tier structure aimed at farm stands, honor boxes, and market booths. Other tools are payment-only QRs (TopServe's "Farm Stand" in Canada) or pre-order / pickup storefronts (Farmzie, Homegrown, Foraged, FarmStand Finders). None found offers P2P-app pre-fill plus a vendor-side "mark Paid / Not received" queue plus a hold synced to an online maker store.

### Cited Findings
- TallyTill: "self-checkout software for small and unattended retail — farm stands, honor boxes, micro markets, market booths, camp stores and event gates". It runs on the seller's own phone or tablet. Shoppers scan a barcode or QR or photograph an unbarcoded item, and AI matches it to the catalog. Payment is card, tap to pay, QR, or cash / check with an envelope code. Honor mode and kiosk mode are included, and sales queue offline and sync. — [AlternativeTo: TallyTill](https://alternativeto.net/software/tallytill/about/); [Slashdot: TallyTill](https://slashdot.org/software/p/TallyTill/)
- TallyTill pricing per GetApp: Stand $0, Shop $15/mo, Market $35/mo. Slashdot says paid tiers lower the per-sale fee for a flat per-device price, so the free tier carries a per-sale fee (amount not found). — [GetApp: TallyTill](https://www.getapp.com/all-software/a/tallytill/); [Slashdot](https://slashdot.org/software/p/TallyTill/)
- PEI (Canada): the Federation of Agriculture and TopServe offer a "Farm Stand" service. The farmer gets a personal QR, and the customer scans and enters payment info (a payment-only QR). — [CBC News](https://amp.cbc.ca/news/canada/prince-edward-island/pei-farm-stand-digital-payment-1.6911326)
- Farmzie gives each vendor an online "FarmStand" storefront for pre-orders. — [Farmzie help: pre-orders](https://farmzie.helpdocs.com/orders/pre-orders)
- Homegrown (findhomegrown.com) promotes a QR at the stand that leads to an online ordering page (full product list, pre-order, pay online), listed at about $10/mo on its own blog. Its conversion and revenue stats are unsourced marketing. — [Homegrown blog: QR code farm stand online orders](https://findhomegrown.com/blog/qr-code-farm-stand-online-orders); [Homegrown: best apps for farm stands 2026](https://findhomegrown.com/blog/best-apps-managing-farm-stand-2026)
- FarmStand Finders (iOS) lets shoppers find stands and pre-order, and vendors can track inventory. — [App Store: FarmStand Finders](https://apps.apple.com/app/id6755681003)
- Foraged supports pickup ordering from market vendors through its app (example: Farm Stand at The Urban Farm, Morristown NJ). — [Foraged](https://www.foraged.com/farmers-markets/new-jersey/morristown/farm-stand-at-the-urban-farm)

### Inferences
- TallyTill validates that sellers will pay $15-35/mo for booth / stand self-checkout. It is the most direct competitor to the "market app" half of the offer. Its model is "scan the item in front of you", which suits produce and barcoded goods. The target app's model is "browse this market's pieces, pick one, hold it", which suits one-of-a-kind craft items and a live online store. TallyTill's QR payment option is unspecified (likely card-network QR, not Venmo pre-fill); this is unverified.
- The farm-stand ordering tools (Farmzie, Homegrown, Foraged) are pre-order / pickup, not live at-the-booth checkout, and they target produce more than one-off crafts.

### Gaps
- TallyTill's own site wasn't fetched. Its exact payment rails (does "QR" include Venmo / Cash App?), per-sale fee on the free tier, website / online-store integration, and US availability are unverified. It should be checked directly as the highest-priority competitor.
- No US equivalent of an "honor box" app with Venmo / Cash App pre-fill and vendor confirmation was found. This may mean it doesn't exist, or the search missed it.
- A specific app literally named "Farmstand" for vendor checkout wasn't identified (farmstandapp.com appeared as a farm-management site; not examined).

## Link-in-bio / mini-store tools on a booth QR (Linktree, Beacons, Stan Store, Big Cartel, Etsy shop QR)

### Takeaway
Vendors can put a QR to any online store on the table, but these tools are built for online and creator sales. Stan Store has no free tier and charges about $29/mo with 0% platform fee. Beacons has a free plan with a commission. None found has a market-scoped view, at-booth P2P tenders, or a hold-then-confirm flow. A QR to an Etsy or Big Cartel shop sends a buyer at the booth into a ship-to-me card checkout for the whole catalog.

### Cited Findings
- Stan Store: about $29/mo (Creator) and $99/mo (Pro) with 0% platform transaction fee, plus Stripe / PayPal processing (Stripe ~2.9% + $0.30). Sources disagree on whether there are one or two tiers. A 14-day trial, no free plan. — [Schoolmaker: Stan Store pricing 2026](https://schoolmaker.com/blog/stan-store-pricing.md); [Unilink: Stan Store pricing 2026](https://www.unilink.us/blog/stan-store-pricing)
- Beacons: a free plan with a 9% transaction fee; paid plans reported at $10 / $30 / $50 per month. Another source gives Creator Pro at about $10/mo + 5%. The sources conflict. — [The Leap](https://www.theleap.co/?p=4982); [Dodo Payments: Stan alternatives 2026](https://dodopayments.com/blogs/stan-store-alternatives/)
- Stan and Beacons have grown from link-in-bio into creator storefronts. — [Everything PR](https://everything-pr.com/stan-store-and-beacons-the-link-in-bio-platforms-that-became-creator-storefronts)

### Inferences
- These tools compete with the "website" half of the bundle more than the "market app" half. At a booth, they add friction (a full online checkout, shipping fields, card entry) for a buyer holding the item in their hand.
- The target app's tie between the market list and the online store (a hold removes the piece from online sale) has no analog in link-in-bio tools.

### Gaps
- Linktree commerce, Big Cartel, and Etsy shop QR / in-person features were not researched in this pass. Etsy had an in-person selling integration with Square in the past; its current status wasn't verified.
- Big Cartel's 2025-2026 plan pricing wasn't verified.

## Does anything tie self-serve booth purchases to a per-market sales record and a live inventory hold?

### Takeaway
No tool found does all of it together: market-scoped self-serve ordering, an immediate hold that also removes the item from the online store, P2P pre-filled payment, and a vendor-side confirm queue. Pieces exist separately. TallyTill has a catalog, self-checkout, and offline sales records. Stripe Payment Links have a purchase cap that auto-deactivates (a crude hold). Square has unified online + POS inventory but card-centric self-serve built for restaurants, and no Venmo tender in kiosk.

### Cited Findings
- Stripe Payment Links: a purchase limit deactivates the link when reached ("useful for limited stock"). — [Stripe docs](https://docs.stripe.com/no-code/payment-links)
- Square self-serve kiosk can log cash or manual tenders, but Venmo is not natively supported. — [Square Seller Community](https://sellercommunity.com/t5/Square-Point-of-Sale/Square-Kiosk-for-Farm-Stands-Can-It-Support-Cash-Coupons-and/m-p/768257)
- Square's QR workaround for stands is an amount-entry donation link with no item totals. — [Square Community](https://community.squareup.com/t5/Payments-Troubleshooting/QR-code-options-for-unmanned-produce-stand/m-p/819156)
- TallyTill: catalog-based self-checkout with offline sync. — [Slashdot](https://slashdot.org/software/p/TallyTill/)
- Venmo / Cash App / Zelle QRs carry no item or order data, so per-market records are manual. — [Venmo Help Center](https://help.venmo.com/hc/en-us/articles/1500003204302-Business-Profile-Fees-); [Fulton Bank Zelle FAQ](https://www.fultonbank.com/-/media/Files/Personal/Zelle_Small-Business_FAQs.pdf)

### Inferences
- The defensible part of the target app is the combination: one-of-a-kind items (where a double sale is a real problem), P2P rails (where reconciliation is the real problem), and a live link to the maker's online store. Each competitor solves at most one of these.
- The hold-before-payment-confirmed model has an obvious abuse vector (a buyer holds and walks away). The vendor-side "Not received" button addresses it, and no competitor was found that needs or has that pattern.

### Gaps
- Whether TallyTill syncs with an online store (Shopify / Square / its own) to prevent online double-sells is unknown.
- Whether any Square or Shopify third-party app offers a P2P-tender self-serve booth flow wasn't searched exhaustively.

## Vendor sentiment: do craft fair buyers actually use QR self-checkout?

### Takeaway
There is good indirect evidence that buyers at craft fairs routinely scan vendor P2P QRs: multi-QR "Scan to Pay" signs are a commodity product, and guides call Venmo one of the most common craft-fair payment methods. Direct evidence that buyers self-serve an order (browse, pick, check out on their own phone) at a craft booth was not found. The recorded friction is tech-hesitancy among older buyers, theft and weather for unattended devices, and amount-entry-only QR flows.

### Cited Findings
- Venmo is "one of the most common payment methods at craft fairs and artisan markets"; vendors are advised to hang a large Venmo QR (processor-authored guide). — [QuadraPay](https://quadrapay.com/accept-payments-vendor-fairs-craft-markets/)
- Etsy sellers sell printable multi-app "Scan to Pay" craft-fair signs (Venmo, Cash App, PayPal QRs). — [Etsy market: craft fair payment](https://www.etsy.com/market/craft_fair_payment)
- A maple-syrup stand owner avoided per-product QR because many customers are elderly ("one tech step too far"). — [Square Community](https://community.squareup.com/t5/Orders-Menu-Items-Catalog/Non-Restaurant-Self-Service-with-a-Handheld-Scanner/td-p/713344)
- Unattended stand devices raise theft and weather concerns. — [Square Community](https://community.squareup.com/t5/Orders-Menu-Items-Catalog/Non-Restaurant-Self-Service-with-a-Handheld-Scanner/td-p/713344)
- Vendors are advised to keep the QR clearly labeled ("Scan to pay") at eye level and to double-check the URL, since a fake or mistyped code is a scam risk. — [Adobe QR code guide](https://www.adobe.com/express/discover/qr-code-guide)

### Inferences
- Buyers already accept "scan a QR at the booth and pay in Venmo". The target flow adds one step before that (pick the item, type a first name). Whether buyers will tolerate the extra step at a busy booth versus just handing over cash or tapping a card is the key adoption risk, and no evidence either way was found.
- The flow may work best when the booth is busy (the maker is occupied, so the buyer self-serves) and for higher-priced one-of-a-kind items where the hold matters. It is likely overkill for $5 items.

### Gaps
- Reddit (r/craftfairs, r/farmersmarket, r/smallbusiness, r/Etsy) could not be accessed, so firsthand vendor sentiment on QR payments (missed payments, people "paying" to the wrong account, screenshot fraud, matching names to sales) is not captured. This is the biggest gap and is worth a manual read.
- No survey data was found on the share of craft-fair transactions by method (cash / card / P2P) in 2025-2026.
