# Storefront search + luxury filters on /shop

## Current state (already shipped, do not rebuild)
- `/shop` runs Storefront `search` via `fetchSearchFiltered` with infinite scroll
- Sidebar (`CatalogFilters`) renders **Brand, Category, Color, Size, Price, Material** dynamically from Shopify's `productFilters` response
- **Price range** slider + min/max inputs ✅
- **In-Stock Only** toggle ✅
- Sort: Best Selling, New, A–Z, Price ↑/↓ ✅
- Site-wide search overlay routes to `/shop?q=...` ✅

## What's missing
1. **Gender** facet — Storefront `search` doesn't expose gender. Products carry `tag:"Women"`, `tag:"Men"`, `tag:"Unisex"` (verified live).
2. **Collection** facet — picking a category across the catalog (Dresses, Hoodies, Swimwear, Bags, Sunglasses, etc.). 456 collections exist; brand handles already covered by the Brand facet — we curate ~25 categorical handles.
3. The `/shop` header lacks an inline search input (only the overlay reaches it today).

## Changes

### 1. `src/lib/shop-taxonomy.ts` (new, ~40 lines)
- `GENDERS = [{value:'Women',tag:'Women'},{value:'Men',tag:'Men'},{value:'Unisex',tag:'Unisex'}]`
- `CATEGORY_COLLECTIONS` — curated list of `{handle,label,group}`:
  - **Women**: dresses, womens-clothing, knitwear-women, jackets-women, coats-women, denim-women, shirts-women, tshirts-women, swimwear-women, shorts-women, womens-shoes, women-bags, women-accessories
  - **Men**: mens-clothing, polo-shirts, hoodies, sweatshirts, cardigans, long-sleeve-tees, shirts-men, sweaters-men, jackets-men, coats-men, denim-men, swimwear-men, mens-shoes, men-bags, men-accessories
  - **Unisex**: sunglasses, accessories, bags

### 2. `src/routes/shop.tsx`
- Add URL-synced state via `zodValidator`/`fallback`: `q`, `title`, `gender` (`Women|Men|Unisex|undefined`), `collection` (handle), `sort`, `min`, `max`, `inStock`. Use `retainSearchParams` for shareable URLs.
- **Branch fetcher**:
  - If `collection` selected → `fetchCollectionFiltered({handle: collection, filters, sortKey, reverse})` so Shopify scopes facet counts to that category
  - Else → `fetchSearchFiltered({query: composedQuery, filters, ...})` where `composedQuery` is `q` plus `tag:"<gender>"` when gender is set
- Add a slim search input to the page header (binds to `q`, debounced).
- Render two new sidebar groups **above** the existing dynamic groups:
  - **Gender** — 3 pill buttons
  - **Category** — collapsible list (grouped by Women / Men / Unisex), single-select
- Active selections show up in the existing `ActiveFilterPills` row.

### 3. `src/components/catalog-filters.tsx`
- Export a new `<TaxonomyFilters>` block that takes `gender`, `collection`, `onGenderChange`, `onCollectionChange` and renders the two groups above the dynamic Shopify facets. Keep style/tracking identical (uppercase 0.2em, ink/canvas, chevron toggles).
- `ActiveFilterPills` gets two extra optional pills (gender, collection) with their own remove handlers.

### 4. Header search input
- Reuse existing search overlay trigger; just add an inline `<form action="/shop">` input in the `/shop` hero so refining within results doesn't require opening the overlay.

## Out of scope (call out, don't build)
- Size / color filter remain dynamic from Shopify (already in place)
- We don't introduce a "Price preset" pills row — slider + numeric inputs cover it

## Verification after build
- `bunx tsc --noEmit`
- Manually: `/shop?gender=Women&collection=dresses&min=200&max=800&sort=PRICE-false` returns dresses with price filter applied
- Refresh preserves all filters; "Clear All" wipes them and updates URL
- Mobile drawer still works (same sidebar component)

## Notes
- All copy in voice: "Women / Men / Unisex" labels, "Category" group header, "By Maison" stays as brand label
- USD pricing already enforced via `priceMoney()` — no currency changes
