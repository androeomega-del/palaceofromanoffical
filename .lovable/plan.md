## Goal
Make Palace of Roman discoverable, indexable, **and shoppable on every free surface that already lists product catalogs** — Google free listings, Meta/Instagram Shopping, TikTok Shop, Pinterest — plus the on-site SEO + organic social loop. Zero ad spend. No fabricated reviews or claims outside the BrandsGateway certificate.

## What's already in place (verified)
- `public/robots.txt` with sane disallows + sitemap directive
- `src/routes/sitemap[.]xml.ts` server route (static routes + up to 5k product handles, USD/EUR handled in `priceMoney`)
- TanStack Start per-route `head()` pattern
- Editorial routes, brand index, collections, PDP, swim campaign, journal
- Real Shopify storefront with Storefront API checkout

So infrastructure exists. Gaps for catalog-sales + traffic: (1) product feeds aren't published to free shopping surfaces, (2) PDP lacks `Product` JSON-LD (which Google Free Listings reads), (3) no Search Console verification, (4) per-route metadata isn't unique on key templates, (5) no internal-linking from authority landing pages into the catalog, (6) no email-capture for retention.

---

## Plan

### Round 1 — Indexing foundations (highest ROI, zero risk)
1. **Verify `palaceofromanofficial.com` in Google Search Console** via the META-tag flow (Lovable's Google Search Console connector handles token → embed → verify). Submit `/sitemap.xml`.
2. **Verify in Bing Webmaster Tools** (covers DuckDuckGo + ChatGPT search).
3. **Per-route metadata sweep** on the 6 highest-traffic templates: `/`, `/shop`, `/collections/$handle`, `/brand/$vendor`, `/product/$handle`, `/editorial/*`. Each gets unique `title` (≤60), `description` (≤160), `og:title`, `og:description`, `og:url`, `og:image` (route's hero), leaf-only `<link rel="canonical">`.

### Round 2 — Structured data (powers free catalog listings)
The PDP `Product` schema is the single biggest catalog-sales lever — Google Shopping's free listings, Pinterest rich pins, and ChatGPT product answers all read it.

- `__root.tsx`: `Organization` + `WebSite` with `SearchAction`
- `product.$handle.tsx`: **`Product`** with `name`, `image[]`, `brand` (vendor), `sku`, `description`, `offers.price`, `offers.priceCurrency: "USD"`, `offers.availability`, `offers.itemCondition: NewCondition`, `offers.url` — pulled from the existing loader data
- `collections.$handle.tsx` + `brand.$vendor.tsx`: `CollectionPage` + `BreadcrumbList` + `ItemList` of products on the page (rich result eligible)
- `editorial/*` + `journal`: `Article`
- `faq.tsx`: `FAQPage` from existing Q&A
- `shipping-returns.tsx`: ensure shipping/return policy text is crawlable (Google merchant knowledge panel signal)

### Round 3 — Product feed for free shopping surfaces
Publish one canonical feed and reuse it across every free channel.

- **Add `/feed.xml` server route** at `src/routes/feed[.]xml.ts` — Google Merchant Center RSS 2.0 + `g:` namespace, pulls from the same Shopify Storefront query the sitemap uses. Fields: `g:id`, `g:title`, `g:description`, `g:link`, `g:image_link`, `g:additional_image_link`, `g:availability`, `g:price` (USD), `g:brand`, `g:condition: new`, `g:gtin` (when present), `g:product_type`, `g:google_product_category` (mapped from vendor/type).
- **Submit feed to:**
  - **Google Merchant Center → free product listings** (free, surfaces in the Shopping tab + image search). Verifies the same `palaceofromanofficial.com` Search Console property.
  - **Meta Commerce Manager → catalog from data feed** (powers Instagram Shop tags, Facebook Shop, Reels product tags). All organic — paid ads optional.
  - **Pinterest → product catalog** (powers free Product Pins, the highest-intent luxury-fashion surface).
  - **TikTok Shop catalog** (region-gated; flag for US TikTok Shop if eligible).
- A second feed `/feed/meta.xml` can be added if Meta's required fields diverge — usually one feed works for all four.

### Round 4 — Topical-authority routes (drive organic traffic into the catalog)
Real routes with real product grids — not doorway pages. Each links into the catalog.

Pick 2 this round:
- `/edits/dolce-gabbana-swim` — broaden the existing campaign into a permanent edit, with `CollectionPage` schema
- `/edits/black-tie` — filtered grid (`productType:dress` + tags)
- `/guides/sizing-european-luxury` — EU↔US↔UK translation table; very high search demand, near-zero competition
- `/guides/authenticity-luxury-resale` — documents the BrandsGateway sourcing chain (defensible per the certificate); doubles as a trust page linked from every PDP

Each: unique `head()`, `Article` or `CollectionPage` JSON-LD, internal links from `/`, footer, and PDP "you might also like".

### Round 5 — Internal linking + image SEO
- Footer: link to every editorial, guide, brand index, and `/feed.xml` (for transparency)
- PDP: "More from {vendor}" → `/brand/$vendor`, "Shop the edit" → relevant `/edits/*`, "How we source" → `/guides/authenticity-luxury-resale`
- Editorial: 3–5 outbound product links per post (currently under-linked)
- Image `alt`: vendor + product + category (not filename); `loading="lazy"` everywhere except above-the-fold; absolute `og:image` URLs

### Round 6 — Retention + traffic loops (still zero-budget)
- **Email capture** in footer + post-purchase: Klaviyo free tier (up to 250 contacts) or a simple `subscribers` table in Lovable Cloud. Welcome series → first-purchase nudge → abandoned-cart (Shopify webhook).
- **Linktree replacement** — already have `/links`; restructure to: Shop · Latest edit · Sizing guide · Authenticity · Worldwide shipping.
- **IG/TikTok content loop** (3 posts/week from existing 99 editorial PNGs + Shopify product images):
  1. Carousel — "The edit: {theme}" → CTA to `/edits/{slug}`
  2. Reel/TikTok 15–25s — product zoom + price reveal → "link in bio"
  3. Story / B-roll — "new in" cycle from Shopify webhook
- **Hashtag mix** (8–12): vendor (`#dolcegabbana`) · niche editorial (`#europeanluxury`) · long-tail (`#luxuryswim2026`)
- **UGC seed:** printed card in every shipment asking buyers to tag `@palaceofroman` — first source of real, on-policy social proof

---

## Explicitly out of scope this turn
- Paid ads (deferred per zero budget; the feed work above means we can flip them on later without rework)
- Fabricated reviews/testimonials — never (per policy)
- Klaviyo paid features, SMS, Pinterest paid

## Technical notes
- All canonical/og:url construction goes through `SITE_URL` from `@/lib/seo`
- Prices in feeds come from `priceMoney()` in `src/lib/shopify.ts` (already converts EUR→USD)
- New routes use the flat dot convention (`edits.black-tie.tsx`, `guides.sizing-european-luxury.tsx`, `feed[.]xml.ts`)
- Every new public route is added to `STATIC_ROUTES` in `sitemap[.]xml.ts`
- JSON-LD goes in each route's `head().scripts` as `type: "application/ld+json"`
- For Google Search Console: META method via the connector, token in `__root.tsx` `head().meta`, deploy, then call verify
- Run `semrush--keyword_research` on guide topics before writing copy, and `shopify--search_products` before filtering edits, to ground them in the real catalog
- Per working-mode memory: each round is one chat turn; I'll wait for go-ahead between rounds and ship the smallest possible diff

---

## Recommended order
**Round 1 → Round 2 → Round 3** unlocks free catalog sales fastest (verification + Product schema + feed submitted to Google/Meta/Pinterest in one week). **Rounds 4–6** compound traffic and conversion after the catalog is live on those surfaces.

Confirm which round to start with.
