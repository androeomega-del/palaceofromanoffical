
# Auto-generate Shopify smart collections from product catalog

Working mode preserved: deep-research, smallest diff, verify after each step. Nothing irreversible runs until you OK this plan.

## Step 0 — Catalog scan (read-only)

Authenticate via client credentials (`SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET` → Admin token, same flow used by `scripts/shopify/update-smart-collection-rules.mjs`).

Pull every product and aggregate:
- distinct `product_type` values + count per type
- distinct tags per type (so rules match real tags, not invented ones)
- gender tag presence (`Men` / `Women`) per type

Output written to `/tmp/catalog-types.json` for review. No writes yet.

## Step 1 — Generate collection spec

For each distinct `product_type` (e.g. "Sneakers", "Loafers", "Tote Bag", "Sunglasses", "Blazer", …):

- Handle: slugified type (`sneakers`, `tote-bag`, …). Skip if already exists with matching rule — never duplicate.
- Title: pluralized, title-cased product type.
- Rules (ANY of, `disjunctive: true`):
  - `product_type equals "<Type>"`
  - `tag equals "<slug-of-type>"` (covers tag-only products)
- Sort: `best-selling`. Published: `true`.

Special cases:
- **Shoes** parent: one unified `shoes` smart collection — rule = `product_type contains "Shoe"` OR tag in shoe-family slugs found in the scan (sneakers, loafers, boots, heels, flats, sandals, oxford-shoes, dress-shoes). All products keep their existing `Men`/`Women` gender tag → gender facet on `/collections/shoes` filters in-page.
- **Bags** parent: same pattern — one `bags` collection, rule = `product_type contains "Bag"` OR tag in bag-family slugs (handbags, backpacks, totes, crossbody, clutches, shoulder-bags, weekenders).
- **Sunglasses only**: any `eyewear` type/tag/handle is treated as `sunglasses`. The `eyewear` collection is unpublished; nav/SEO/sitemap references swapped to `sunglasses`.

Spec written to `/tmp/collection-spec.json`. I stop here and show you the spec **before** any write.

## Step 2 — Pre-flight count (read-only)

For each spec entry, run the matching Storefront query and count products.
- ≥1 product → mark `populate`
- 0 products → mark `hide` (will create with `published: false` OR skip + unpublish if it already exists)

## Step 3 — Write to Shopify (smart collections only)

For each `populate` entry:
- If handle exists → PUT new rules + `disjunctive: true`, ensure `published: true`.
- Else → POST new smart collection.

For each `hide` entry:
- If exists → PUT `published: false`.
- Else → skip (don't create empty).

Rate-limited at 2 req/s with 429 backoff (same pattern as existing scripts). All writes logged to `/tmp/collection-writes.log`.

## Step 4 — Frontend hygiene

- Gender filter facet enabled on `/collections/shoes` and `/collections/bags` (uses existing facet system).
- Global rename `eyewear` → `sunglasses` in `src/lib/nav-config.ts`, `src/lib/seo.ts`, sitemap route, megamenu source.
- `DesktopCategoryRail` + mobile menu already filter to live handles — verify, no rewrite.

## Step 5 — Deliverable

A single report with three lists exactly as you asked:
1. **Created/updated** — handle, title, rules summary
2. **Populated** — handle, product count
3. **Hidden** — handle, reason ("0 matching products")

Plus a one-line `eyewear → sunglasses` confirmation.

## Out of scope (won't touch)
Cart, checkout, Zustand, fulfillment locations, BG importers, product creation, fake reviews, homepage imagery.

## Approval gates
- **Gate A**: After Step 0, I show you the unique product types + counts. You OK the list (drop any junk types).
- **Gate B**: After Step 1, I show you the full spec (handles + rules). You OK before any write.
- **Gate C**: After Step 3, I show the deliverable report.

Reply "go" to start at Step 0 (read-only scan, safe).
