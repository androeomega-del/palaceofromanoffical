# DB-backed hotspots + placement correction tool

## Why
Every hotspot today lives in TypeScript source — themed-edit chapters, editorial pages, the campaign deck, `default-edition-body`, and the homepage cron's `layout_json`. There is no single place to audit or fix a mis-tagged placement. We will move them into `lookbook_images` + `lookbook_hotspots` and add a correction UI.

## Scope

### 1. Schema additions (one migration)
- `lookbook_images`: add `surface_kind text not null` (e.g. `themed-edit`, `editorial`, `campaign`, `homepage`, `bg_product`), `surface_slug text` (e.g. `yacht-edit/monaco`), `chapter_key text` (nullable), `external_id text` (nullable, for matching legacy refs).
- `lookbook_hotspots`: add `surface_kind text` denormalised for fast admin queries, plus index on `(surface_kind, surface_slug)`. Keep existing FK semantics.
- GRANTs already exist; no policy change needed (admin-only writes, public read).

### 2. Inventory + seed migration script
A one-off TanStack server fn `seedLookbookFromSource()` (admin-gated, idempotent on `(surface_kind, surface_slug, sort_order)`) that walks the known hotspot sources and inserts rows:

- `src/routes/editorial.*.tsx` — every `<EditorialHotspots image=... hotspots=[...] />` literal
- `src/components/default-edition-body.tsx` (line 564 block) — the default editorial deck
- `src/routes/editors-edition.tsx` `block.hotspots` arrays (read from the edition definitions in `src/lib/editions/*` if present)
- `src/components/themed-edit.tsx` chapter spots — sourced from the per-page chapter arrays in each `edits.*.tsx`
- `src/routes/campaign.mens-swim.tsx` — the flatlay deck
- `homepage_daily_layout.layout_json` — current active row's hotspot entries

Each insert links `image_url` → existing asset URL (no re-upload), captures `alt_text`, sort order, and the hotspots' `{x, y, product_handle, label}`.

I'll generate this inventory file-by-file and the script will print a dry-run diff before writing.

### 3. Component refactor (read from DB)
- `EditorialHotspots` keeps its current props for back-compat, but gains an alternate `surfaceKind` + `surfaceSlug` lookup mode that fetches hotspots via a new `getLookbookForSurface()` server fn.
- `themed-edit.tsx`, `default-edition-body.tsx`, `editors-edition.tsx`, and `campaign.mens-swim.tsx` switch to the DB-lookup mode. Inline arrays stay as a fallback for one release.
- Existing catalog-truth guard (`availabilityByHandle`) stays — hotspots referencing unavailable products keep getting hidden.

### 4. Correction tool — `/admin/lookbook-hotspots`
New admin route, linked from `admin.index.tsx` and from the existing product-images panel:

- **Left list:** all `lookbook_images` grouped by `surface_kind` / `surface_slug`, with thumbnail + hotspot count + a "mismatch suspect" flag (hotspot whose product handle's vendor ≠ image's expected vendor, or whose product is unavailable).
- **Main canvas:** selected image rendered full-bleed with hotspot dots overlaid at their `x/y` percentages. Hovering a dot shows its current label + linked product. Clicking opens a side panel.
- **Side panel:**
  - Current product (thumbnail, title, handle, vendor, availability)
  - Search field that hits a new `searchCatalogForHotspot({q})` server fn (queries `bg_products` by `name/brand/color/category` with trigram similarity + falls back to Shopify Admin search for live availability)
  - Result list with thumbnail + title + vendor + handle + "in stock" badge
  - "Set as hotspot product" button → optimistic update
  - Delete-hotspot button for when no product fits ("remove this placement entirely")
  - **Save** commits via `updateLookbookHotspot({id, product_handle, label?})` server fn
- Audit trail: every save inserts a row in `homepage_layout_audit` (reusing the existing audit table) with `action='hotspot_update'` and before/after handles.

### 5. Verify
- After migration: run dry-run, then real seed, then load `/edits/yacht-edit/monaco` and the May 2026 editorial to confirm visual parity.
- After correction tool: change one McQueen hotspot on the May 2026 page, reload public page, confirm new product link is live.

## Out of scope
- Visual reposition of hotspot dots (x/y editing) — only product swap + delete this round.
- Multi-image batch edit — single-image flow only.
- Storefront-side caching invalidation beyond a short SWR — assume `staleTime: 0` on the public query for now.

## Approval gate
This rewrites how 15+ files source their hotspots. Confirm before I start, and I'll execute the migration → seed → refactor → admin UI in that order, pausing after the seed for you to spot-check before swapping components to DB mode.
