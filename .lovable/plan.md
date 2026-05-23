# Finalize Ship-From & Delivery Logic (Steps 1–3)

Steps 1–3 are already built (DB table `product_origins`, `refreshProductOrigins` server fn, unified `<ShippingMeta>` on cards + PDP, manual refresh on `/admin/shopify-sync`). This plan applies your final business rules on top.

## 1. Tie-breaker rule (Most-Stock-Wins)

Currently ties break by lexicographic `location_id` (non-deterministic from a business POV). Change to: **Napoli (IT) wins all ties**, since IT routes are fastest to your primary US/UK markets via UPS/FedEx/DHL hubs.

- Update `pickWinner()` in `src/lib/product-origins.functions.ts`: on tie, prefer `country_code === 'IT'`, then `'DE'`, then `'SE'`, then lex `location_id`.

## 2. Delivery estimate rewrite (BG official windows)

Replace the current ad-hoc estimate with your official BG SLA:

- **Handling:** +1–2 business days (warehouse dispatch)
- **EU destinations:** +3 business days average
- **Non-EU (incl. US/UK):** +5–7 business days
- **Skip weekends + country-specific public holidays** in the origin country (IT / SE / DE).
- **Block routing** to RU / BY / UA — show "We do not currently ship to this region" instead of a date.

Implementation in `src/lib/delivery-estimate.ts`:
- Take `(origin, destZip|destCountry)` → returns `{ minDays, maxDays, arrivalLabel, blocked? }`
- Business-day math skips Sat/Sun + a static holiday table per origin country (IT/SE/DE 2026 bank holidays).
- EU classification: derive from destination country (default US when only ZIP is known).

## 3. Fallback safety-net

- **No location detected** → default to **New York, US (10001)** (already in `DEFAULT_ZIP`), calculated as **non-EU 5–7 business days** (under-promise per your direction).
- **Product has no `product_origins` row** → `<ShippingMeta>` already falls back to vendor map → DEFAULT_ORIGIN (Italy). If vendor is also unknown, display **"Ships from Express Tracked Hub"** instead of leaving blank. Add this string to `formatOriginLabel()` in `src/lib/shipping-origin.ts`.

## 4. Admin refresh button placement

Currently on `/admin/shopify-sync`. Per your direction, also surface it on the **Inventory tab** of the admin dashboard:
- Add a "Refresh ship-from origins" card to `src/routes/admin.inventory-sync.tsx` (reuses `refreshProductOrigins` server fn — no duplication).
- Keep the existing button on `/admin/shopify-sync` for continuity.
- Both are admin-gated by `requireAdmin` middleware — invisible to shoppers.

## 5. UI uniformity audit

`<ShippingMeta>` is already wired into `product-card.tsx` and `pdp-delivery-badge.tsx`. I'll grep every product surface (`for-you-feed`, `trending-now`, `ai-recommendations`, `recently-viewed`, brand pages, search results, cart drawer) to confirm every card uses `<ShippingMeta>` with the same `variant="card"` props — no inline duplicates. Any stragglers get swapped.

Typography/spacing already matches the editorial card style (10px uppercase `0.18em` tracking, bronze accent on PDP). No design changes — just enforcement.

## 6. Data audit

After deploying, click "Refresh ship-from origins" once and run a SQL check:
```sql
SELECT country_code, COUNT(*) FROM product_origins GROUP BY 1;
SELECT COUNT(*) FROM product_origins WHERE country_code IS NULL;
```
If a large share is NULL, the Shopify inventory feeds aren't tagging locations — surfaces as a follow-up task, not a code fix.

---

## Files to change

- `src/lib/product-origins.functions.ts` — tie-breaker (IT > DE > SE > lex)
- `src/lib/delivery-estimate.ts` — BG SLA + holiday calendar + RU/BY/UA block
- `src/lib/shipping-origin.ts` — "Express Tracked Hub" final fallback label
- `src/components/shipping-meta.tsx` — handle blocked-destination state
- `src/routes/admin.inventory-sync.tsx` — add refresh card
- Spot-fixes to any product card surface not yet using `<ShippingMeta>`

## Open question before I build

**RU/BY/UA block** — do you want it as a visible message on the card/PDP ("Not available for shipment to your region — change location"), or silently hide the delivery line for those shoppers? My recommendation: visible message on PDP only, hidden on cards (cards stay clean).