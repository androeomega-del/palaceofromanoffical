# Fix smart-collection filters (Title-contains OR Vendor-equals, ANY logic)

## Problem
Every smart collection currently filters with `Vendor Equals "<brand>"` and `Match Column = all`. When a product's Shopify Vendor field is inconsistent or empty, the collection comes up empty. The multi-rule collections (e.g. `women-bags = Tag:Women AND Type:Bags`) are also being switched to ANY per your direction so nothing is excluded.

## Fix

### 1. Rewrite the rule definitions
For every smart collection across `public/imports/smart-collections-mini-*.csv` (and the consolidated `smart-collections-part-*.csv` files):

- **Brand collections** (currently 1 rule, `Vendor Equals X`) → 2 rules combined with ANY:
  - `Vendor Equals "<Brand Name>"`
  - `Title Contains "<Brand Name>"`
- **Category collections** (`Type Equals Clothing/Bags/Shoes/Accessories`) → keep single rule, set Match Column = `any` (no-op but consistent).
- **Tag collections** (Handbags, Watches, Shirts, Women, Men, etc.) → keep single Tag rule, Match Column = `any`.
- **Composite collections** (`women-bags`, `men-shoes`, `women-clothing`, `men-accessories`, etc., currently `Tag:Women AND Type:Bags`) → switch Match Column to `any`. Per your direction these become unions (every Women product + every Bag).
- **Special collections** (`in-stock` = Variant Inventory > 0, `new-arrivals` = Tag:New) → unchanged.

### 2. Push the updated rules to Shopify
Following `mem://integrations/shopify-admin-api`:

- Add `scripts/shopify/update-smart-collection-rules.mjs`
- Uses `SHOPIFY_ACCESS_TOKEN` against `mwuwqi-vy.myshopify.com` API `2025-07`
- For each collection handle in the CSVs:
  1. `GET /admin/api/2025-07/smart_collections.json?handle=<handle>` to look up the existing collection ID
  2. `PUT /admin/api/2025-07/smart_collections/<id>.json` with:
     ```json
     { "smart_collection": {
         "id": <id>,
         "disjunctive": true,
         "rules": [ ...new rules... ]
     }}
     ```
  3. If the handle doesn't exist, POST to create it (using the same payload + title/body_html from the CSV)
- 500ms throttle, 429 retry honoring `Retry-After`, `--dry` flag, final `Updated / Created / Skipped / Failed` summary
- Run sequence:
  ```
  node scripts/shopify/update-smart-collection-rules.mjs --dry
  node scripts/shopify/update-smart-collection-rules.mjs
  ```

### 3. Verify
- After the push, spot-check 3 collections in Shopify admin (one brand, one category, one composite) to confirm `Match condition: any` and the new rule set.
- Hit `/collections/<handle>` on the storefront for the same three to confirm products populate.

## Files
- **Edit:** all `public/imports/smart-collections-mini-*.csv` and `smart-collections-part-*.csv` (rule rows + Match Column)
- **New:** `scripts/shopify/update-smart-collection-rules.mjs`
- No app/frontend code changes — the storefront already reads collections from Shopify, so once the rules update there, the site updates.

## Out of scope
- No changes to product Vendor / Tag / Type fields
- No changes to `in-stock` or `new-arrivals` logic
- No re-enabling of disabled BG import scripts
