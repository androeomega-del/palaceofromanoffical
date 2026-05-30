# Plan — Catalog cleanup + men's edits + nav hygiene

This is a large, irreversible Shopify + nav change. Approving this plan authorizes me to:
- create live Shopify smart collections,
- modify the main-menu structure (in code, since nav is driven by `buildDepartmentsFromShopifyMenu` + `nav-config`),
- unpublish empty collections and rename `eyewear` → `sunglasses` across the storefront.

Working mode is preserved: deep-research, smallest diff, per-step verification before moving on. I'll stop and report after each numbered step; nothing in step N+1 runs until you OK step N.

---

## Step 1 — Unified Shoes & Bags parents (gender-filterable)

**Goal:** one `shoes` parent + one `bags` parent, each showing men's + women's items, with a gender filter on the collection page.

**Approach (chosen — preferred):**
1. Create/confirm two smart collections in Shopify:
   - `shoes` — rule: `product_type` contains "Shoe" OR tag in (`mens-shoes`, `womens-shoes`, `sneakers`, `loafers`, `boots`, `heels`, `flats`, `sandals`, `oxford-shoes`, `dress-shoes`)
   - `bags` — rule: `product_type` contains "Bag" OR tag in (`handbags`, `backpacks`, `weekenders`, `clutches`, `totes`, `crossbody`, `shoulder-bags`)
2. Make sure every product in those parents carries either a `men` or `women` tag (most already do via dept tagging). I will run a verification pass and only re-tag the small set that's missing.
3. Surface a **Gender** filter facet on `/collections/shoes` and `/collections/bags` — already supported by the existing facet system, just need to confirm `gender` is in the facet list for these handles.

**Files touched (code side):**
- `src/lib/nav-config.ts` — point Shoes/Bags rail items to the unified handles where appropriate.
- Whatever drives facets per collection (will locate before editing).

**Verify:** open `/collections/shoes` and `/collections/bags`, confirm product count ≈ men+women sum, confirm gender filter toggles correctly.

---

## Step 2 — Create 4 men's smart collections live

Create these directly in Shopify (Admin API, using `SHOPIFY_ACCESS_TOKEN`) — **smart collections only, no new products**, rules match existing tagged catalog:

| Handle | Title | Rules (ANY OF) |
|---|---|---|
| `mens-workwear` | Men's Workwear | tag ∈ {suits, blazers, dress-pants, dress-shirts, trench-coats, oxford-shoes} OR product_type contains "Suit"/"Blazer" — AND tag `men` |
| `mens-weekend` | Men's Weekend | tag ∈ {cashmere, polo-shirts, casual-pants, denim-men, sneakers, loafers, sweaters-men, cardigans} AND tag `men` |
| `mens-evening` | Men's Evening | tag ∈ {tuxedos, dress-shirts, silk, leather-jackets, dress-shoes, boots} OR product_type ∈ {Tuxedo, Dress Shoe} — AND tag `men` |
| `mens-travel` | Men's Travel | tag ∈ {weekenders, backpacks, linen, sunglasses, bombers, cashmere, slip-on-loafers} OR product_type ∈ {Weekender, Backpack} — AND tag `men` |

**Pre-check:** for each collection I'll query the matching product count first. If any returns <8 products I'll loosen the rule (add adjacent tags) and re-check — never wire a tile to a thin collection.

**Wire up:** update `OCCASIONS` in `src/routes/men.tsx` so each tile links to its new handle.

**Verify:** load `/men`, click each tile, confirm grid is full and on-theme.

---

## Step 3 — Empty-collection sweep + kill `eyewear`

**3a. Eyewear → Sunglasses (global)**
- Remove every `eyewear` reference from `nav-config.ts`, megamenu builders, route copy, SEO map, sitemap.
- Use `sunglasses` only. If the Shopify `eyewear` collection has products, redirect/merge them into `sunglasses` (re-tag if needed) and unpublish `eyewear`.

**3b. Empty-collection sweep**
From the prior audit, these are the known offenders:

- **17 empty:** `blazers`, `bombers`, `cardigans`, `eyewear` (handled above), `gloves`, `hoodies`, `leather-jackets`, `coats-men`, `jackets-men`, `midi-skirts`, `mini-skirts`, `parkas`, `scarves`, `trench-coats`, `turtlenecks`, `coats-women`, `jackets-women`
- **4 missing collection entirely:** `best-sellers`, `shirts-men`, `dress-shirts`, `sandals-slides`

**Action per handle:**
1. Re-query products that *should* belong (by `product_type` / tags / vendor signals).
2. If matches exist → create or repopulate the smart collection with a sensible rule, publish, keep in nav.
3. If no matches exist → unpublish from storefront AND remove from `nav-config.ts` mega-menu so the rail never renders a broken/empty link.

**Verify:** run the existing `getShopifyCollectionDiff` (or equivalent storefront check) and confirm zero remaining empty handles linked from the menu.

---

## Deliverable at the end

A short report with two lists, exactly as you asked:
- ✅ **Created/populated** (handle, title, product count)
- 🚫 **Hidden** (handle, reason)

Plus a one-line note on the eyewear→sunglasses merge.

---

## Out of scope (won't touch)
- Cart, checkout, Zustand state, fulfillment/inventory locations, BG importers, product creation, fake reviews.
- Homepage category-grid imagery (already done in earlier turn).

---

## Questions before I start

1. **Unified shoes/bags handles** — confirm `shoes` and `bags` as the parent handles (vs `all-shoes` / `all-bags`). The existing `mens-shoes`, `womens-shoes`, `italian-leather-handbags` etc. stay alive as child collections.
2. **Gender filter UX** — OK to default the unified pages to "All" and let the user toggle Men/Women, or do you want it to auto-default based on the active department (women's dept → Women preselected)?
3. **Confirm Step 2 handles** (`mens-workwear`, `mens-weekend`, `mens-evening`, `mens-travel`) — these will be live in Shopify and unhideable without manual cleanup.
