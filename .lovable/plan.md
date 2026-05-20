# Wire Real Shopify Checkout

## Current state

- Storefront shows products from `bg_products` / `bg_variants` (Supabase snapshot).
- `storefrontApiRequest` in `src/lib/shopify.ts` is a stub that returns `undefined` and silently fails — so Add to Bag → checkout does nothing.
- Shopify domain in code (`i1w7wx-gu.myshopify.com`) and token are stale; the live store is `mwuwqi-vy.myshopify.com`.
- The live Shopify store already has 8,559 BG products with matching variant SKUs (`CA-30278-XL` etc.), so no product re-creation needed.

## Plan

### 1. Build a SKU → Shopify variant GID lookup
- New Supabase table `shopify_variant_map(sku TEXT PRIMARY KEY, variant_gid TEXT NOT NULL, product_handle TEXT, available BOOLEAN DEFAULT true, synced_at TIMESTAMPTZ DEFAULT now())` with public-read RLS.
- One-off Node script `scripts/shopify/sync-variant-map.mjs` that paginates `GET /admin/api/2025-07/products.json?limit=250&fields=handle,variants` via Admin REST, then `INSERT … ON CONFLICT (sku) DO UPDATE` into `shopify_variant_map`. Throttled at 2 req/sec, retries on 429.

### 2. Restore the real Storefront API
- Replace the stub in `src/lib/shopify.ts`:
  - `SHOPIFY_STORE_PERMANENT_DOMAIN = "mwuwqi-vy.myshopify.com"`
  - `SHOPIFY_STOREFRONT_TOKEN = "3b02ce4f61d642096147b804ec7ba962"`
  - Real `fetch` against `…/api/2025-07/graphql.json` with proper error handling and the 402 billing-required toast.

### 3. Make catalog variants carry the real GID
- In `src/lib/shopify.ts`, when materialising `ShopifyVariant` from a `bg_variants` row, look up `shopify_variant_map.variant_gid` by SKU and set `variant.id` to the GID. Variants without a mapping become `availableForSale: false` (graceful fallback while the sync catches up).
- Adjusts the adapter only — no UI changes.

### 4. Verify
- Reload `/shop`, Add to Bag a Cavalli Class polo (size XL), open drawer → confirm a `cartCreate` request hits `mwuwqi-vy.myshopify.com` and returns a `checkoutUrl`.
- Click Proceed to Checkout → confirm it loads the real Shopify checkout (storefront password does NOT block checkout pages).

### 5. Memory
- Update `mem://integrations/shopify-admin-api` to note the SKU mapping table and the storefront token.

## Technical notes

- The variant map sync only needs to run when new BG products are imported into Shopify; we can hook it later, for now manual `node scripts/shopify/sync-variant-map.mjs` is fine.
- We do NOT change BG product/variant rendering — the storefront keeps reading from `bg_products` for catalog speed and to preserve filters/SEO.
- Stock counts stay from `bg_variants.quantity`; Shopify is only used for the checkout handoff.

## Out of scope (can do later)
- Auto-syncing inventory between Shopify and `bg_variants`.
- Webhook to refresh `shopify_variant_map` when products change in Shopify.
- Removing the unused `bg_*` adapter once we move fully to Shopify Storefront API for catalog.
