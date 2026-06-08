## Goal

Replace any non-live sources feeding nav + homepage with the live Shopify catalog, and gate every surface to **in-stock only** (`inventory_total:>0`, `availableForSale: true`). Zero visual/layout changes — only the data feeding existing components.

## Catalog snapshot
- 4,873 active products, all currently in stock.
- Shop: `mwuwqi-vy.myshopify.com`, Admin REST `2025-07`, token `SHOPIFY_ACCESS_TOKEN`.

## Scope (4 surfaces)

### 1. Megamenu / header nav
- Source: `src/lib/menu-source.functions.ts` + `src/lib/megamenu-source.ts` + `src/components/megamenu.tsx`.
- Rebuild the brand list and category list from a single SSR loader that:
  - Pulls every Shopify collection.
  - For each, runs an in-stock product count.
  - Drops any collection / vendor with `count === 0`.
- Cache 60s (per system-compliance mandate).
- Preserve existing menu structure (Women / Men / Brands / Edits) — just filter contents.

### 2. Homepage product rails
- Files: `src/components/sections/best-sellers-rail.tsx`, `new-this-week-rail.tsx`, `on-sale-rail.tsx`, `trending-now-strip.tsx`, `brands-of-the-moment.tsx`.
- Each rail loader switches to Storefront API queries with `available_for_sale:true` filter and required tag (`tag:bestseller`, `tag:new`, `tag:sale`, etc.).
- If a rail returns < N items, hide the rail (don't pad with placeholder).

### 3. Homepage editorial Edit tiles + brand spotlights
- Files: `src/components/home-studio/asymmetric-grid.tsx`, `src/components/sections/brand-category-spotlight.tsx`, themed edit pages under `src/routes/edits/*`.
- For each tile, verify its target collection / brand handle has ≥ 1 in-stock product before rendering the tile. Hide tiles whose target is empty (per staged-launches: archive by unlinking, never delete the page).

### 4. Concierge drawer recommendations
- File: `src/lib/ai-concierge.functions.ts` + `src/components/home-studio/concierge-drawer.tsx`.
- Append `available_for_sale:true` to every product query the concierge issues. Filter response server-side as a safety net.

## Technical notes
- New helper: `src/lib/in-stock-source.ts` — single source of truth for `inStockCollections()`, `inStockBrandHandles()`, `inStockProductsByTag(tag, limit)`. All four surfaces consume from here.
- All fetches via existing `shopify-admin.server.ts` / Storefront helpers — no new clients, no checkout-protocol touch.
- 60s server cache via existing `server-cache.ts`.
- SSR loaders only (no client-side fetches for initial paint, CLS=0).

## Out of scope (explicit)
- No visual / Tailwind / palette changes.
- No new pages, no new routes, no editorial rewrites.
- No Shopify writes (no product updates, no inventory mutations, no BG imports).
- No changes to cart-store, cart-drawer, use-cart-sync, checkout URLs.
- No fake reviews / counts.

## Verification (after build)
1. `invoke-server-function` the menu loader → confirm every returned brand has `inStockCount > 0`.
2. Spot-check 3 random homepage rails → every product `availableForSale: true`.
3. Concierge: issue test query → all recs in-stock.
4. Visual diff vs. current preview: layout pixel-equal, only contents differ.

## Approval needed
Confirm and I'll implement in this order: (1) shared `in-stock-source.ts` helper, (2) megamenu loader, (3) rails, (4) edit tiles + spotlights, (5) concierge, (6) verify.
