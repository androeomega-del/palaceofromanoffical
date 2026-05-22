# Palace of Roman — Product Requirements (Living Doc)

## Problem Statement (verbatim from user)
> Update the website to EXCLUSIVELY curate the 100 luxury & designer brands provided.
> Refactor brand filter sidebar/search, mock catalog, featured-brand sections.
> Add AI features for site traffic + sales conversion. Catalog lives inside Shopify.
> Adjustments mid-flight: replace Bode → Dolce & Gabbana (Tier 2), replace Alexander Wang → Calvin Klein (Tier 4). Keep list at exactly 100.

## Architecture
- TanStack Start (React 19 + TypeScript) on Cloudflare Workers (Vite + Wrangler)
- Shopify Storefront API as the catalog source (no MongoDB)
- Supabase for admin/auth/contact persistence
- Emergent Universal LLM proxy (Claude Sonnet 4.5) called from server functions

## Curated 100 Brands (current source of truth)
`src/lib/luxury-brands.ts` — verified exactly **100 names** distributed:
- Tier 1 World Leaders (10): LV, Chanel, Hermès, YSL, Dior, Gucci, Prada, Miu Miu, Cartier, Rolex
- Tier 2 High-Demand Elite (21): Loewe, Tiffany & Co., Celine, Bottega Veneta, Fendi, Burberry, Versace, Balenciaga, The Row, Moncler, Givenchy, Valentino, Tom Ford, Giorgio Armani, **Dolce & Gabbana**, Alexander McQueen, Jacquemus, Balmain, Bvlgari, Alaïa, Ralph Lauren
- Tier 3 Heritage (20): Brunello Cucinelli, Zegna, Coach, Margiela, Louboutin, Vivienne Westwood, Ferragamo, Van Cleef, Chloé, Goyard, Thom Browne, Brioni, Longchamp, Michael Kors, Tory Burch, Stella McCartney, Marc Jacobs, Jimmy Choo, Manolo Blahnik, Rimowa
- Tier 4 Modern Vanguards (25): Acne, Rick Owens, Khaite, Dries, CdG, Off-White, Kenzo, Issey Miyake, Jil Sander, Sacai, **Calvin Klein**, Moschino, Schiaparelli, Marni, Lanvin, Yeezy, Fear of God, Ami Paris, Diesel, Simone Rocha, Maison Kitsuné, Proenza Schouler, Casablanca, Dunhill, Bally
- Tier 5 Niche & Hard Luxury (24): Patek, AP, Omega, TAG Heuer, JLC, Graff, Chopard, Messika, Canada Goose, Mackage, Barbour, Canali, Loro Piana, Mulberry, Kate Spade, MCM, JPG, Roberto Cavalli, Missoni, Coperni, Mugler, JW Anderson, Peter Do, Ludovic de Saint Sernin

Strict whitelist enforced via `isAllowedLuxuryBrand()` in `src/lib/nav-config.ts` — used by megamenu, /brands index, catalog filters, and search.

## Implemented (Jan 2026)
- **Brand list adjustment**: +Dolce & Gabbana (Tier 2), +Calvin Klein (Tier 4), −Alexander Wang, −Bode. Verified count = 100.
- **AI Search** (`/src/lib/ai-search.functions.ts` + `/src/components/ai-search-bar.tsx`): Natural-language query → Claude Sonnet 4.5 → structured Shopify search params (q, gender, collection, title, min/max). Wired into the global search overlay with sample queries.
- **Personalised "For You" feed** (`/src/lib/ai-recommendations.functions.ts` + `/src/components/for-you-feed.tsx`): Hydrates wishlist + recently-viewed handles, pulls vendor-matched candidates, lets Claude rank 6 with one-line styling reasons. Cold-start falls back to best-sellers. Rendered on homepage between Bento and Swim sections (client-only).
- **Recently-viewed tracker** (`/src/stores/recently-viewed-store.ts`): Zustand store with localStorage persistence, populated from the product page (`product.$handle.tsx`).
- **SEO-rich brand landing pages** (`/src/lib/brand-heritage.ts` + rewritten `/src/routes/brand.$vendor.tsx`): Heritage hero with eyebrow, tagline, 3-sentence house narrative, iconic-pieces sidebar. Adds Brand JSON-LD with foundingDate/foundingLocation + BreadcrumbList JSON-LD. Curated copy for 25 anchor houses; graceful fallback covers all 100.
- **LLM utility** (`/src/lib/llm.server.ts`): Workers-compatible fetch wrapper for the Emergent OpenAI-compatible proxy. Strips ```json fences, guarded JSON parse with typed fallback.
- **Env**: `EMERGENT_LLM_KEY` added to `/app/.env`.

## Verified
- TypeScript type-clean across all 8 new/modified files (only legacy router-typing errors remain in untouched files).
- Brand count = exactly 100, with required adjustments applied.
- Live test of Emergent proxy → Claude Sonnet 4.5 returns valid response.
- ESLint passes.

## Backlog / P1
- Curate heritage copy for the remaining 75 brands beyond the 25 anchors (currently using a high-quality fallback).
- Add "Why this pick" tooltip on the For You cards (already returned by LLM as `reason`, surfaced inline).
- Optionally cache personalised-feed responses in Supabase keyed by signal-hash for repeat visitors.
- A/B test placement of the For You feed (currently between Bento + Swim).

## P2 / Future
- AI Stylist chat (option a we deferred) — could be added in a side drawer.
- "What's New / On Sale" AI weekly digest emailed via existing Resend pipeline.
- Exit-intent offer modal + low-stock badges (Tier-2 conversion features we didn't take this round).
