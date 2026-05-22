# Palace of Roman — Product Requirements (Living Doc)

## Problem Statement (verbatim)
> Update the website to EXCLUSIVELY curate the 100 luxury & designer brands provided.
> Refactor brand filter sidebar/search, mock catalog, featured-brand sections.
> Add AI features for site traffic + sales conversion. Catalog lives inside Shopify.
> Mid-flight: replace Bode → Dolce & Gabbana (Tier 2), replace Alexander Wang → Calvin Klein (Tier 4). Keep list at exactly 100.
> Follow-up: add an AI that recommends products while customers are browsing.

## Architecture
- **Stack**: TanStack Start (React 19 + TypeScript) on Cloudflare Workers (Vite + Wrangler)
- **Catalog**: Shopify Storefront API (`mwuwqi-vy.myshopify.com`) — no MongoDB
- **Admin/auth/contact**: Supabase
- **AI**: Emergent Universal LLM proxy → Claude Sonnet 4.5 (server-only via `src/lib/llm.server.ts`)
- **Dev server**: supervisor `frontend` program runs `vite dev` from `/app` on `:3000`

## Curated 100 Brands — Source of Truth
`src/lib/luxury-brands.ts` — verified **exactly 100** names:
- **Tier 1** (10): LV, Chanel, Hermès, YSL, Dior, Gucci, Prada, Miu Miu, Cartier, Rolex
- **Tier 2** (21): Loewe, Tiffany & Co., Celine, Bottega Veneta, Fendi, Burberry, Versace, Balenciaga, The Row, Moncler, Givenchy, Valentino, Tom Ford, Giorgio Armani, **Dolce & Gabbana** (added), Alexander McQueen, Jacquemus, Balmain, Bvlgari, Alaïa, Ralph Lauren
- **Tier 3** (20): Brunello Cucinelli, Zegna, Coach, Margiela, Louboutin, Vivienne Westwood, Ferragamo, Van Cleef, Chloé, Goyard, Thom Browne, Brioni, Longchamp, Michael Kors, Tory Burch, Stella McCartney, Marc Jacobs, Jimmy Choo, Manolo Blahnik, Rimowa
- **Tier 4** (25): Acne, Rick Owens, Khaite, Dries, CdG, Off-White, Kenzo, Issey Miyake, Jil Sander, Sacai, **Calvin Klein** (added), Moschino, Schiaparelli, Marni, Lanvin, Yeezy, Fear of God, Ami Paris, Diesel, Simone Rocha, Maison Kitsuné, Proenza Schouler, Casablanca, Dunhill, Bally
- **Tier 5** (24): Patek, AP, Omega, TAG Heuer, JLC, Graff, Chopard, Messika, Canada Goose, Mackage, Barbour, Canali, Loro Piana, Mulberry, Kate Spade, MCM, JPG, Roberto Cavalli, Missoni, Coperni, Mugler, JW Anderson, Peter Do, Ludovic de Saint Sernin

Removed: Alexander Wang, Bode. Strict whitelist enforced via `isAllowedLuxuryBrand()` in `src/lib/nav-config.ts` — used by megamenu, /brands index, catalog filters, and search.

## Implemented (Jan 2026)

### 1. Brand list correction
- `src/lib/luxury-brands.ts`: D&G added (Tier 2), Calvin Klein added (Tier 4), Alexander Wang + Bode removed. Count = 100.

### 2. AI Search Concierge (in search overlay)
- `src/lib/ai-search.functions.ts`: TanStack server function parses natural-language query → structured Shopify search payload (`q`, `gender`, `collection`, `title`, `min`, `max`) using Claude. Validates output against the 100-brand allowlist.
- `src/components/ai-search-bar.tsx`: bronze-bordered AI panel at the top of the search overlay with 4 example queries.
- Submit → navigates to `/shop` with parsed params.

### 3. Floating AI Concierge widget (recommends while browsing)
- `src/lib/ai-concierge.functions.ts`: contextual server function. Takes `{pageType, currentProductHandle, currentVendor, currentCollection, wishlistHandles, recentHandles}` → returns 4 AI-ranked picks with one-line reasons + a warm greeting.
- `src/components/concierge-widget.tsx`: floating "✨ Concierge" pill button (bottom-right, every page), one-time nudge tooltip, slide-out right drawer with picks. Lazy-loads (only calls Claude when drawer opens — saves LLM credit).
- Mounted in `src/routes/__root.tsx` as `<ClientOnlyConcierge />` so it appears across the entire site.

### 4. Personalised "For You" feed (homepage rail)
- `src/lib/ai-recommendations.functions.ts`: takes wishlist + recently-viewed, builds vendor-matched candidate pool from Shopify, lets Claude rank 6 picks with reasons.
- `src/components/for-you-feed.tsx`: rendered between Bento and Swim sections on `/`. Cold-start falls back to best-sellers.

### 5. Recently-viewed tracker
- `src/stores/recently-viewed-store.ts`: Zustand + `localStorage`, capacity 30. Populated automatically when `product.$handle.tsx` mounts.

### 6. SEO-rich brand landing pages
- `src/lib/brand-heritage.ts`: hand-curated heritage copy for **25 anchor brands** (LV, Chanel, Hermès, Gucci, Prada, Dior, YSL, Rolex, Cartier, Miu Miu, BV, Loewe, Celine, Balenciaga, The Row, Tom Ford, Burberry, D&G, Calvin Klein, Versace, Fendi, Valentino, Tiffany & Co., Moncler) + smart fallback covering the other 75.
- `src/routes/brand.$vendor.tsx` rewritten: heritage hero with eyebrow (Maison · Country · Founded), tagline, 3-sentence narrative, "Iconic Pieces" sidebar. Adds Brand JSON-LD (with `foundingDate`, `foundingLocation`) + BreadcrumbList JSON-LD. Captures long-tail Google intent like *"buy authentic Loewe Puzzle"*.

### 7. Infrastructure
- `EMERGENT_LLM_KEY` added to `/app/.env`.
- `src/lib/llm.server.ts`: Workers-compatible fetch wrapper for the Emergent OpenAI-compatible proxy. JSON-fence stripping + typed fallback.
- supervisor `frontend` repointed to `vite dev` at `/app:3000`.
- All new files type-clean and lint-clean.

## Verified
- Brand count = exactly 100 ✓
- Live Emergent → Claude Sonnet 4.5 call returns 4 valid picks (LV, Givenchy, Rick Owens, Prada products) with editorial greeting ✓
- Brand page (`/brand/loewe`) renders heritage hero correctly ✓
- AI search bar visible in search overlay with sample chips ✓
- Concierge widget appears bottom-right on every route ✓
- ESLint passes, TypeScript clean on all new files ✓

## Known catalog caveat
Connected Shopify store has many products whose `vendor` field uses non-canonical names (e.g. `Cavalli` vs `Roberto Cavalli`, `Versace Jeans` vs `Versace`, `Costume National` not on list). Strict whitelist hides those — fix is to normalise vendor names in Shopify admin OR add an alias layer (not done; user opted to leave as-is).

## Backlog / P1
- Hand-curated heritage copy for the remaining 75 brands (currently uses fallback).
- Vendor-name alias layer for Shopify products that don't exactly match the 100 (e.g. "Cavalli" → "Roberto Cavalli").
- Surface the AI search bar narrative ("Searching Loewe leather bags under $3,000.") on the `/shop` results header for transparency.
- Cache personalised feed responses per signal-hash in Supabase for repeat visitors.

## P2 / Future
- Exit-intent offer modal + low-stock badges + wishlist→email drip (Tier-2 conversion features deferred).
- AI Stylist conversational chat (multi-turn).
- "What's New / On Sale" AI weekly digest via existing Resend pipeline.
- A/B test placement of the For You feed (currently between Bento + Swim).
- Conversational concierge — open-ended Q&A instead of just 4-pick rails.

## Files touched / created
- **Created**: `src/lib/llm.server.ts`, `src/lib/ai-search.functions.ts`, `src/lib/ai-recommendations.functions.ts`, `src/lib/ai-concierge.functions.ts`, `src/lib/brand-heritage.ts`, `src/stores/recently-viewed-store.ts`, `src/components/ai-search-bar.tsx`, `src/components/for-you-feed.tsx`, `src/components/concierge-widget.tsx`
- **Modified**: `src/lib/luxury-brands.ts`, `src/components/search-overlay.tsx`, `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/brand.$vendor.tsx` (rewrite), `src/routes/product.$handle.tsx`, `/app/.env`, `/etc/supervisor/conf.d/supervisord.conf`
