# Prompt 3 — Localized Pricing (Shopify Markets `@inContext`)

## Goal
Surface true Shopify Markets pricing (correct currency symbol, tax-inclusive where the market is configured for it) on every storefront query, driven by a sleek country/currency selector in the utility nav. No full page reload on switch.

## Constraints (must hold)
- **Checkout protocol lockdown** — `formatCheckoutUrl`, cart mutations, Zustand cart shape: untouched.
- **Pricing-currency memory** — display in selected currency, but keep the existing USD-default + EUR→USD conversion as the **fallback** when no Shopify Markets price is returned.
- **Staged launch** — selector hidden behind a feature flag until all queries migrated + verified, then exposed in one batch.
- **Obsidian theme** — selector matches utility-nav tokens (`--studio-ink`, `--studio-bronze`, `--studio-rule`).

## Architecture

### 1. New: `src/stores/locale-store.ts` (Zustand, persisted)
```text
{ country: CountryCode, language: LanguageCode, currency: CurrencyCode }
```
- Defaults seeded from `geo-ip.functions.ts` on first load (already exists in repo).
- Persists to localStorage under `por-locale`.
- Exposes `setCountry(code)` which also updates language + currency from a static map.

### 2. Modify: `src/lib/shopify.ts`
- `storefrontApiRequest(query, variables, opts?)` gains optional `{ country, language }`.
- New helper `withInContext(query)` injects `@inContext(country: $country, language: $language)` into the operation and adds the required `$country: CountryCode!`, `$language: LanguageCode!` variable declarations.
- All product/collection queries (`PRODUCT_QUERY`, `PRODUCTS_QUERY`, `COLLECTION_QUERY`, `CART_QUERY` if needed) get wrapped.
- `priceMoney()` / `formatPrice()` already currency-aware via `currencyCode` — no change needed once Shopify returns the localized money object.
- `EUR_TO_USD` fallback path remains for products without Shopify Markets pricing.

### 3. Modify: TanStack Query keys
- Every product/collection query key gets `[..., country]` appended so a switch re-fetches automatically (instead of manual `queryClient.invalidateQueries()`).
- Pattern: `["product", handle, country]`, `["products", query, country]`, etc.

### 4. New: `src/components/locale-selector.tsx`
- Headless `<Select>` (already in shadcn) → custom obsidian trigger: flag emoji + `EUR` code in utility nav.
- Dropdown shows curated list (US, GB, CA, AU, JP, DE, FR, IT, ES, AE, HK, SG, CH — 13 priority markets matching the SEO playbook).
- On change: `setCountry()` + (Query keys auto re-fetch) + toast "Showing prices in <currency>".
- A11y: labeled, keyboard-navigable, `aria-current` on selected.

### 5. Modify: `src/components/site-header.tsx` (utility nav)
- Mount `<LocaleSelector />` next to the existing concierge/wishlist icons.
- Behind `import.meta.env.VITE_LOCALE_SWITCHER === "on"` flag for staged rollout.

## Files touched
```text
NEW   src/stores/locale-store.ts
NEW   src/components/locale-selector.tsx
EDIT  src/lib/shopify.ts                  (add @inContext helper + plumb variables)
EDIT  src/components/site-header.tsx      (mount selector, gated)
EDIT  src/routes/product.$handle.tsx      (query key += country)
EDIT  src/routes/collections.$handle.tsx  (query key += country)
EDIT  src/routes/shop.tsx                 (query key += country)
EDIT  src/lib/rails/queries.ts            (query key += country)
```

Files explicitly NOT touched:
- `src/stores/cart-store.ts`, `src/components/cart-drawer.tsx`, `src/hooks/use-cart-sync.ts` (checkout lockdown).
- Any `scripts/shopify/*` (admin scripts, irrelevant).

## Verification checklist
1. Switch country → product card price re-renders with correct symbol within 1 RTT, no page reload.
2. Cart drawer subtotal currency follows the selected market.
3. Checkout URL still carries `channel=online_store` (lockdown).
4. SSR build still passes; no server bundle leak from locale-store.
5. Markets without Shopify Markets pricing fall back to USD via existing `EUR_TO_USD`.
6. Selector hidden until `VITE_LOCALE_SWITCHER=on` set in `.env` — staged-launch rule.

## Open questions before I start
1. **Market list** — confirm the 13 priority markets above, or give me your shortlist.
2. **Tax-inclusive display** — Shopify returns `price` as configured in each Market. Want to also surface a `(VAT included)` micro-line in EU/GB markets?
3. **Language switching** — for Phase 1, do you want language tied 1:1 to country (e.g. JP→JA) or country-only with English UI everywhere?
4. **Flag UI** — emoji flags (works everywhere, but inconsistent on Windows) or a small SVG flag set in `src/assets/flags/`?
