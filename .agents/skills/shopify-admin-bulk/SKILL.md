---
name: shopify-admin-bulk
description: Bulk-create or update many Shopify resources (smart collections, custom collections, products, metafields) via the Admin REST API when Matrixify free-plan limits, CSV import errors, or one-off scripts are needed. Use whenever the user wants to create more than ~10 collections or products at once, or when a Matrixify import keeps failing.
---

# Shopify Admin Bulk Operations

One-off Node scripts that hit the Shopify Admin REST API directly. Bypasses Matrixify's free-plan ~10-row / ~10KB import cap and avoids CSV format gotchas.

## Critical facts (for THIS project: Palace of Roman)

- **Use `process.env.SHOPIFY_ACCESS_TOKEN`** for Admin REST. `SHOPIFY_ADMIN_TOKEN` exists as a secret but returns HTTP 401 — do not use it.
- Shop domain: `mwuwqi-vy.myshopify.com`
- API version: `2025-07`
- Existing working script: `scripts/shopify/create-smart-collections.mjs`

## When to use

- User asks to create > 10 collections, products, or metafields at once
- Matrixify import fails with "FILE SIZE TILL HERE" / plan limit
- Matrixify rejects column values (Relation, Product Column, etc.)
- User wants programmatic creation without leaving the chat

## Workflow

1. **Verify the token works** before writing anything:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" \
     -H "X-Shopify-Access-Token: $SHOPIFY_ACCESS_TOKEN" \
     "https://mwuwqi-vy.myshopify.com/admin/api/2025-07/shop.json"
   ```
   Expect `200`. If 401, fall back to listing `env | grep -i shopify` and probe each token.

2. **Adapt `scripts/shopify/create-smart-collections.mjs`** for the resource you need:
   - Smart collections: `POST /smart_collections.json` with `{smart_collection: {handle, title, body_html, sort_order, published, disjunctive, rules: [{column, relation, condition}]}}`
   - Custom collections: `POST /custom_collections.json`
   - Products: `POST /products.json`
   - Metafields: `POST /metafields.json`

3. **Always**:
   - Throttle: `await new Promise(r => setTimeout(r, 500))` → 2 req/sec
   - Retry on 429 using `Retry-After` header
   - Pre-fetch existing handles via paginated GET (parse `Link` header for `rel="next"`) and skip duplicates
   - Dry-run with `--dry` flag to print first/last 2 payloads before committing
   - Print a final `Created / Skipped / Failed` summary

4. **CSV → Shopify Admin REST mapping** (smart collections):
   | CSV (Matrixify) | Shopify REST | Values |
   |---|---|---|
   | `Rule: Product Column` | `column` | `vendor`, `tag`, `type`, `variant_inventory`, `title`, `variant_price`, `variant_compare_at_price`, `variant_weight` |
   | `Rule: Relation` | `relation` | `equals`, `not_equals`, `greater_than`, `less_than`, `starts_with`, `ends_with`, `contains`, `not_contains` |
   | `Rule: Condition` | `condition` | string |
   | `Match Column` `all`/`any` | `disjunctive` | `false` / `true` |
   | `Sort Order` | `sort_order` | `best-selling`, `manual`, `alpha-asc`, etc. |

5. **Run**:
   ```bash
   node scripts/shopify/create-smart-collections.mjs --dry   # validate mapping
   node scripts/shopify/create-smart-collections.mjs         # execute
   ```

## Common errors

- **401 "Invalid API key or access token"** → wrong token. Use `SHOPIFY_ACCESS_TOKEN`, not `SHOPIFY_ADMIN_TOKEN`.
- **422 `{"handle": ["has already been taken"]}`** → handle already exists. Either skip (preferred) or PUT to update instead of POST.
- **422 `{"title": ["can't be blank"]}`** → CSV row had an empty title (often a duplicate row from Matrixify exports). Filter those out.
- **429** → rate-limited. Sleep for `Retry-After` seconds and retry.

## Do not

- Do not call `/admin/api/.../graphql.json` for smart collections — REST is simpler (GraphQL has no `SmartCollection` type; you'd use `collectionCreate` with `ruleSet`).
- Do not commit the script into `src/` — it's a one-off, lives in `scripts/`.
- Do not add the script as a server function or route — it's run locally via `node`, not from the app.
