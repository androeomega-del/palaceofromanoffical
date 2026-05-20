## Goal
Create all 381 smart collections directly in your Shopify store (`mwuwqi-vy.myshopify.com`) via the Shopify Admin REST API, bypassing Matrixify entirely.

## Why this works
- `SHOPIFY_ADMIN_TOKEN` is already configured as a secret — no new credentials needed.
- The source CSV (`public/imports/smart-collections-matrixify-fixed.csv`) is clean and contains all 381 rows with: handle, title, body HTML, sort order, rule column (Vendor/Tag/Type/Variant Inventory), relation (Equals/Greater Than), and condition value.
- Shopify's REST endpoint `POST /admin/api/2025-07/smart_collections.json` creates a smart collection with rules in a single call.

## Approach
This is a **one-off operation**, not an app feature. I'll run a Node script via `code--exec` — nothing gets committed to your codebase.

### Script logic
1. Parse the CSV (handle commas inside `<p>` HTML and rule conditions like `Dolce & Gabbana`).
2. Fetch existing smart collections by handle (paginated) so we skip duplicates and don't double-create the 10 already imported.
3. For each remaining row, map CSV fields → Shopify rule format:
   - `Rule: Product Column` → `column` (`vendor`, `tag`, `type`, `variant_inventory`)
   - `Rule: Relation` → `relation` (`equals`, `greater_than`)
   - `Rule: Condition` → `condition` (string)
   - `Match Column` `all` → `disjunctive: false`
   - `Sort Order` `best-selling` → `sort_order: "best-selling"`
4. POST to `https://mwuwqi-vy.myshopify.com/admin/api/2025-07/smart_collections.json` with header `X-Shopify-Access-Token: $SHOPIFY_ADMIN_TOKEN`.
5. Throttle to 2 req/sec to respect Shopify's leaky-bucket rate limit; auto-retry on HTTP 429 with the `Retry-After` header.
6. Log every result (✓ created / ↻ skipped existing / ✗ failed with reason) and print a final summary.

### Validation
- Dry-run first: parse all 381 rows and print the first 3 + last 3 payloads without POSTing, to confirm the mapping is correct.
- Then run the full import.
- After completion, fetch the smart_collections count from Shopify to verify it equals 381.

## What you'll see
A live log streaming through all 381 collections (~3-4 minutes at 2/sec) followed by a summary like `Created: 371, Skipped (already existed): 10, Failed: 0`.

## What changes in your project
**Nothing.** No files added, no code modified. This is a pure data-creation task run from the sandbox against Shopify's API.
