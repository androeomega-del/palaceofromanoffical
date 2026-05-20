## Why

`/shop` today:
- shows **SOLD OUT** products by default
- REFINE sidebar is empty (search path returns `filters: []`)
- many cards display **$0** because rows with null `retail_price` are still rendered

The user wants the page to behave like the "in-stock collection" with **tag-shaped filters** (the same dimensions we just normalised on Shopify: Men/Women, Category, Subcategory, Brand, etc.).

## What changes

### 1. `src/lib/shopify.ts` — `fetchSearchFiltered`
- Add `available` to the opts (default `true`). The /shop tab will always pre-apply `{ available: true }` unless the user explicitly toggles it off — this *is* the "in-stock collection".
- Drop rows with `retail_price <= 0` so no $0 cards leak through.
- Compute real facet aggregates over the current query (mirroring `fetchCollectionFiltered`'s vendor agg, just broader). Each facet is built from `bg_products` columns and emits `StorefrontFilterValue.input` JSON that the existing `applyFilters` already understands:
  - **Availability** — `{ available: true }` (pre-checked)
  - **Gender** — `{ gender: "Women" | "Men" | ... }`
  - **Category** — `{ category: "Clothing" | "Shoes" | "Bags" | "Accessories" }`
  - **Subcategory** — `{ subcategory: "Sneakers" | "Handbags" | ... }` (top ~30 by count)
  - **Brand / Designer** — `{ productVendor: "..." }` (top ~30, searchable in sidebar)
  - **Color** — `{ color: "..." }` (top ~20)
  - **Material** — `{ material: "..." }` (top ~15)
  - **Price** — `{ price: { min, max } }` derived from row bounds
- Extend `applyFilters` to recognise the new keys (`gender`, `category`, `subcategory`, `productVendor`, `color`, `material`) and map them to the matching `ilike` clauses already used elsewhere.

### 2. `src/routes/shop.tsx`
- Default selections to include `{ available: true }` on first load.
- Show "In stock only" as a sticky pill above the grid that the user can toggle off.
- Update piece count to reflect the filtered total (drop the `36+` placeholder once we have `pageInfo.totalCount` — if total is expensive, keep `36+` but qualify with "In stock").
- Header subtitle: "The Boutique · In stock now".

### 3. No new tags, no Shopify Storefront rewrite
- We stay on Supabase (consistent with `/collections/*` and brand pages).
- The facet labels are the **same vocabulary** as the Shopify tags we normalised, so the mental model is identical.

## Out of scope (ask before doing)

- Switching `/shop` to the Shopify Storefront API + `in-stock` smart collection.
- Adding a hero/editorial banner above the grid.
- Changing the product card design.

## Verification

1. Visit `/shop` → sidebar shows the 7 facet groups with counts, no SOLD OUT cards, no $0 prices.
2. Tick "Sneakers" + "Men" → grid narrows, counts on other facets re-adjust on the next query.
3. Toggle "In stock only" off → SOLD OUT cards reappear (proves the default is doing real work).
4. Sort by Price ↑ / ↓ continues to work.

Reply **"go"** to implement, or tell me which facets to add/remove.
