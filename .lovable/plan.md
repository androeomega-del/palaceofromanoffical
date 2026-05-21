## Goal
Drive discoverable, indexable traffic to palaceofromanofficial.com this week and convert it through organic IG/TikTok — no paid spend, no fabricated reviews, no claims the reseller certificate doesn't support.

## What's already in place (verified)
- `public/robots.txt` with proper disallow + sitemap reference
- `src/routes/sitemap[.]xml.ts` (static routes + up to 5k product handles from Shopify)
- Per-route `head()` metadata pattern in TanStack Start
- Editorial routes (`editorial.may-2026`, `resort-2026`, `the-new-evening`, `journal`)
- Shopify storefront wired to real catalog, USD pricing, cart→Storefront API checkout

So the gap is **not infrastructure**. It's: (1) topical authority pages targeting buyer-intent queries, (2) per-route metadata quality, (3) structured data depth, (4) a repeatable IG/TikTok content loop from assets we already own.

---

## Week-1 SEO work (in order of impact)

### 1. Search Console + Bing Webmaster verification
- Verify `palaceofromanofficial.com` in Google Search Console via META tag (Lovable has a connector for this — agent can run the 3-step token → embed → verify flow).
- Submit `/sitemap.xml` once verified.
- Mirror in Bing Webmaster (free, covers DuckDuckGo + ChatGPT search).
- Outcome: Google starts crawling the ~5k product URLs within days instead of weeks.

### 2. Per-route metadata audit
Sweep every public route under `src/routes/` and confirm each defines a unique:
- `title` (≤60 chars, includes the route's primary phrase)
- `description` (≤160 chars, value + CTA)
- `og:title`, `og:description`, `og:url`, `og:image` (the route's hero/product image)
- `link rel="canonical"` on the leaf (already correct per `head-meta` rules)

Highest-leverage routes to harden first: `/`, `/shop`, `/collections`, `/collections/$handle`, `/brand/$vendor`, `/product/$handle`, `/swim`, `/editorial/*`, `/journal`, `/about`, `/authentication` (the trust page).

### 3. Structured data (JSON-LD)
Add schema only where it maps to real content — no fabrications.
- `__root.tsx`: `Organization` + `WebSite` with `SearchAction` (sitelinks search box)
- `product.$handle.tsx`: `Product` with `name`, `image`, `brand`, `offers.price`, `offers.priceCurrency: "USD"`, `availability` from Shopify variant data
- `brand.$vendor.tsx`: `CollectionPage` + `BreadcrumbList`
- `collections.$handle.tsx`: `CollectionPage` + `BreadcrumbList`
- `editorial/*` and `journal`: `Article` with `headline`, `image`, `datePublished`, `author: "Palace of Roman"`
- `faq.tsx`: `FAQPage` from the existing Q&A
- `shipping-returns.tsx`: include shipping/returns policy text — Google surfaces this in the merchant knowledge panel

### 4. Topical-authority pages (the actual organic growth lever)
With KDI low for long-tail luxury queries, the fastest path is buyer-intent landing pages built from the catalog we already have. Each one is a real route, real copy, real product grid — not a doorway page.

Proposed additions for this week (pick 2–3, not all):
- `/edits/dolce-gabbana-swim` — already have the campaign; broaden into an "edit" with copy + filtered product grid
- `/edits/black-tie` — pulls `productType:dress` + tag-based filters
- `/guides/sizing-european-luxury` — practical sizing translation table (EU↔US↔UK); high search demand, zero competition for boutiques
- `/guides/authenticity-luxury-resale` — explains the BrandsGateway sourcing chain (defensible per the certificate) — also doubles as a trust page linked from PDPs

Each gets its own `head()`, `Article`/`CollectionPage` JSON-LD, internal links from `/` and the global footer.

### 5. Internal linking pass
- Footer: link to every editorial + guide + brand index
- PDP: link "More from {vendor}" → `/brand/$vendor`, "Shop the edit" → relevant `/edits/*`
- Editorial: link out to 3–5 product URLs each (currently under-linked)

This is the single highest-ROI move after metadata — Google ranks pages partly by how reachable they are from the home page.

### 6. Image SEO
- Confirm every `<img>` in PDP, hero, editorial has descriptive `alt` (vendor + product + category, not the filename)
- Add `loading="lazy"` everywhere except above-the-fold hero
- Confirm `og:image` resolves to an absolute URL on each route (TanStack SSR head guidance)

---

## IG / TikTok content loop (zero budget, repeatable)

We already own 99 editorial PNGs + the full Shopify product image library. The loop:

**3 posts/week minimum, all sourced from existing assets:**
1. **Carousel** (IG) — "The edit: {theme}" — 6–8 product stills + one editorial cover. Caption ends with `Shop the edit → palaceofromanofficial.com/edits/{slug}` (matches a real route from §4).
2. **Reel / TikTok** (15–25s) — single product, slow zoom + price reveal. Trending audio. CC: brand + price in USD + "link in bio".
3. **Story / TikTok B-roll** — "what arrived this week" — restock or new-in cycle.

**Profile setup:**
- Single Linktree-style page already exists at `/links` — make sure it lists: Shop, Latest edit, Sizing guide, Authenticity.
- Bio: "Curated European luxury. Authorised BrandsGateway partner. Worldwide shipping." (matches what the certificate supports)
- Pinned posts: 3 best edits.

**Hashtag strategy** (use 8–12, mix sizes):
- Vendor-specific (`#dolcegabbana`, `#bottegaveneta`) — high reach, low conversion
- Niche editorial (`#luxuryeditorial`, `#europeanluxury`) — better intent
- Long-tail (`#luxuryswim2026`, `#resort26`) — small but converts

**UGC seed:** as orders ship, include a printed card asking buyers to tag `@palaceofroman` — first source of real, on-policy social proof (which we can later surface as embedded posts, never as fabricated reviews).

---

## Out of scope this week
- Paid ads (Meta/Google/TikTok) — deferred per zero budget
- Email capture + Klaviyo welcome flow — strong next step, flag for week 2
- Pinterest — high luxury fashion intent, also week 2
- Blog content beyond the 2–3 guides above — month-2 cadence
- Fabricated reviews / testimonials — never (per policy)

---

## Technical notes (for implementation phase)

- Use `SITE_URL` from `@/lib/seo` for all canonical/og:url construction (already used by sitemap)
- New routes go in `src/routes/` using the flat dot convention (`edits.dolce-gabbana-swim.tsx`, `guides.sizing-european-luxury.tsx`)
- Add new route paths to `STATIC_ROUTES` in `src/routes/sitemap[.]xml.ts` so they ship in the sitemap
- JSON-LD goes in each route's `head().scripts` as `type: "application/ld+json"`
- For Search Console verification: use the META method via the Google Search Console connector — token goes into `__root.tsx` `head().meta`, then deploy, then call verify
- Run `semrush--keyword_research` on candidate guide topics before writing copy, to confirm volume + difficulty for the `us` market

---

## Suggested execution order (4 implementation rounds)

1. **Round 1 (foundations):** Search Console + Bing verification, per-route metadata sweep on the 6 highest-traffic route templates (`/`, `/shop`, `/collections/$handle`, `/product/$handle`, `/brand/$vendor`, `/editorial/*`).
2. **Round 2 (schema):** Product + CollectionPage + Article + Organization + FAQPage JSON-LD.
3. **Round 3 (content):** Build 2 new routes (1 edit + 1 guide), add to sitemap, internal-link from home and footer.
4. **Round 4 (social kit):** `/links` audit, IG/TikTok post templates checked into `/public` or a `docs/` folder so the founder can post directly, no design work each time.

Each round is one chat turn. Confirm which round to start with and I'll implement.
