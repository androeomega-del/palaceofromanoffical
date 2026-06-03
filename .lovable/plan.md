## SS26 Edit — Research-Driven, Dept-Scoped Themed Launch

A new "SS26" surface positioned as Palace of Roman's editorial read on Spring/Summer 2026, curated against historical SS publication data (Vogue Runway / Business of Fashion / WWD SS24+SS25 archives) and grounded in what's actually in the live Shopify catalog. Per the themed-edits + always-tag rules, each dept gets its own fully themed page wired to real product handles — nothing exposed in nav until the whole bundle is ready.

### Scope

1. **Research pass (no code)** — pull historical SS trend signals from past seasons (2-3 cycles) for both Women's and Men's: dominant themes (e.g. quiet luxury, tailoring revival, '70s resort, transparency, raffia/crochet, marine, butter yellow), recurring maisons that anchor SS coverage, recurring categories that spike (linen tailoring, swim, espadrilles, ballet flats, sunglasses, raffia bags). I'll deliver a short brief in chat, then map each theme to live catalog vendors/handles before we proceed.

2. **Catalog match** — for every proposed theme, run a Shopify search to confirm ≥ N taggable products (vendor + category) before the theme makes the page. Themes with no live products get cut. No untagged story sections.

3. **Two dept-scoped themed pages**
    - `/women/ss26` — `src/routes/women.ss26.tsx`
    - `/men/ss26` — `src/routes/men.ss26.tsx`
    - Structure mirrors existing ThemedEdit pages (chapter cover → editorial paragraph → shoppable grid pulled from real handles, repeat per theme; closing rail of all SS26 products).
    - Brand-accurate imagery: generated per-chapter using `imagegen--edit_image` with real product CDN refs, then post-gen QA per the product-imagery-qa rule. No generic editorial-library filler.
    - Full SEO head: title, description, canonical, og:image (chapter cover), JSON-LD `CollectionPage`.

4. **Nav surfacing (mobile + desktop)** — only after both pages pass QA:
    - **Mobile** (`src/components/mobile-farfetch-menu.tsx`): add an `SS26` row above `New In` on both Women and Men tabs, bronze accent, links to `/women/ss26` or `/men/ss26` based on active tab. Resolves to dept-scoped route directly (no Shopify handle lookup needed since these are app routes).
    - **Desktop** (`src/components/site-header.tsx` row-2 category rail): add `SS26` as a first-position rail item per dept, reading from `useDeptStore`.
    - Does not touch `nav-config.ts` Shopify-derived columns — SS26 is an app route, not a collection handle.

5. **Homepage tile** — add an SS26 Edit tile to the homepage editorial grid (whichever component currently renders the Edit tiles; I'll locate before edit). Tile links to `/women/ss26` by default (Women is the higher-volume dept per your existing nav default).

6. **Verify after** — visual QA on mobile viewport (390x844, where you are now) + desktop, confirm every product card links to a live PDP, confirm head meta + JSON-LD render, confirm nav rows appear on both dept tabs.

### Out of scope (this batch)

- Creating a new `ss26` Shopify smart collection — not needed unless you want a flat grid surface too. Can be added in a follow-up if you want Shopify-side merchandising.
- Email/social announcement assets.
- Any change to checkout, cart-store, or Shopify import scripts (locked).
- BG mention anywhere; voice stays "our global boutique network."

### Technical details

- **Route files**: TanStack flat dot-naming → `src/routes/women.ss26.tsx` + `src/routes/men.ss26.tsx`. `createFileRoute("/women/ss26")` / `("/men/ss26")`. Each defines `head()` with route-specific meta + og:image; no root og:image touched.
- **Data**: products fetched via existing `fetchProducts` / vendor + tag filters in `src/lib/shopify.ts`. Themes encoded as `{ title, copy, vendorOrTagFilters, heroSrc }[]` arrays; chapter render uses the existing ThemedChapter component pattern (per `mem://preferences/brand-accurate-imagery`, dedicated `src` per chapter, not generic).
- **Imagery**: generated to `src/assets/ss26/women-{theme}.jpg` and `src/assets/ss26/men-{theme}.jpg` using `edit_image` with real Shopify CDN refs of the products being merchandised. Pre-gen: pull 2-3 product CDN photos per theme + jot the signatures (color, hardware, silhouette). Post-gen: zoom + verify color/pattern/material/hardware/logo before committing.
- **Mobile nav row**: new `Row` entries in `mobile-farfetch-menu.tsx` flat list — `to={`/${tab}/ss26`}` with `accent`.
- **Desktop rail**: small edit to the row-2 rail component to inject an SS26 link as the first item, scoped by `useDeptStore().dept`.
- **No edits to**: `src/integrations/supabase/*`, `cart-store`, `cart-drawer`, `use-cart-sync`, `formatCheckoutUrl`, `routeTree.gen.ts` (auto-gen), Shopify import scripts.

### Sequenced delivery (approval-gated per your working-mode rule)

I'll stop after each numbered step for your OK before continuing:

1. Research brief + theme list + per-theme catalog match counts (chat, no code).
2. Generate + QA hero/chapter imagery (chat, with images for you to approve).
3. Build the two route pages with real product grids.
4. Wire nav (mobile drawer + desktop rail) and the homepage tile in one final commit.
5. Final visual + link QA report.

Confirm and I'll start with step 1 (research brief).
