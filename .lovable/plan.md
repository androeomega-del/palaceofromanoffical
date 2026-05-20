## Goal
Preserve everything needed to recreate Shopify smart collections (and similar Admin API bulk operations) without rediscovering the working token, payload mapping, or rate-limit handling.

## What gets saved

### 1. The script → permanent project location
Move `/tmp/create_collections.mjs` (currently ephemeral — wiped on sandbox reset) to `scripts/shopify/create-smart-collections.mjs`. It will run from any future sandbox via:
```
node scripts/shopify/create-smart-collections.mjs --dry
node scripts/shopify/create-smart-collections.mjs
```

### 2. A Lovable skill → `.agents/skills/shopify-admin-bulk/`
So any future agent (in this project or remixes) knows the playbook:
- `SKILL.md` — when to use, full workflow, common errors
- Key facts captured:
  - Use `SHOPIFY_ACCESS_TOKEN` for Admin REST — **not** `SHOPIFY_ADMIN_TOKEN` (returns 401)
  - Shop domain: `mwuwqi-vy.myshopify.com`, API version `2025-07`
  - 2 req/sec throttle + 429 retry pattern
  - Matrixify free-plan import cap is ~10 rows / ~10KB — bypass with this script
  - CSV → REST field mapping table (Vendor/Tag/Type → column; Equals/Greater Than → relation)
- Apply via `skills--apply_draft` so it's discoverable on every future request matching "shopify collections", "bulk admin api", etc.

### 3. Project memory → `mem://integrations/shopify-admin-api`
One-line core rule + detailed note:
- Core: "Shopify Admin REST API: use `SHOPIFY_ACCESS_TOKEN` (not `SHOPIFY_ADMIN_TOKEN` — that returns 401)."
- Detail file: shop domain, API version, working endpoints, script location.

## What doesn't need saving
- The 381 collections themselves are now live in Shopify — that's the source of truth.
- The CSV at `public/imports/smart-collections-matrixify-fixed.csv` stays where it is (it's the input the script reads).

## What changes in your project
- **New file:** `scripts/shopify/create-smart-collections.mjs`
- **New skill:** `.agents/skills/shopify-admin-bulk/SKILL.md` (then applied)
- **New memory:** `mem://integrations/shopify-admin-api` + 1 line added to `mem://index.md`
- No app code, routes, or database changes.
