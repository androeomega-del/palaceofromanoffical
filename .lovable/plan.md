## Sprint 2 — Safe Path (Additive Only)

Greenlight received. Three Storefront scopes confirmed enabled. Building Phase 1, verifying, then proceeding to Phase 2. Nothing existing is deleted: `nav-config.ts`, megamenu editorial tiles, Supabase admin auth at `/login` + `/admin/*`, all editorial routes, and the Supabase+Gmail newsletter pipeline all stay exactly as they are.

---

### Phase 1 — Hybrid Shopify Menu Layer

**Goal:** if Shopify Admin has a real curated `main-menu`, use it. Otherwise keep the existing live-built tree (already dynamic — built from Smart Collections + vendor index).

**Files:**

1. **NEW `src/lib/shopify-menu.ts`** — Storefront query helper + types.
   - Recursive 3-level GraphQL: `menu(handle: "main-menu") { items { id title url resourceId type items { ... items { ... } } } }`.
   - Returns `null` on: 403/ACCESS_DENIED, network error, `menu == null`, or empty `items[]`.
   - Maps each leaf's `resourceId`/`type` to a typed route descriptor:
     - `COLLECTION` → `/collections/$handle` (handle resolved from `resourceId` against the `fetchCollections` cache)
     - `PRODUCT` → `/product/$handle`
     - `HTTP` / external → kept only if URL host matches our own domain; otherwise dropped
     - `PAGE` / `ARTICLE` / `BLOG` → dropped (no matching routes — never render `#` placeholders)
   - Exports: `type ShopifyMenuTree`, `fetchShopifyMenuRaw()`.

2. **NEW `src/lib/menu-source.functions.ts`** — `createServerFn` wrapper.
   - 10-minute in-memory cache (same pattern as `collection-category-counts.functions.ts`).
   - Returns DTO `{ tree: ShopifyMenuTree | null }`.
   - Runs server-side so it doesn't bill the browser's Storefront quota.

3. **EDIT `src/components/megamenu.tsx`** — additive only.
   - Add a `useQuery` for `getShopifyMenu()` alongside the existing `fetchCollections` query (same `staleTime: 5 * 60_000`).
   - New `useMemo` source selector:
     - Shopify tree present **AND** has ≥ 2 top-level items mappable to `women` / `men` department keys → render from Shopify tree (preserving editorial feature tiles, which are keyed by department in code, not in Shopify).
     - Otherwise → fall through to existing `buildDepartments(liveCollections)` path (unchanged).
   - Mobile drawer (in same file) uses the same selector.
   - Editorial feature tiles (`MegaFeature`) are **always** sourced code-side — Shopify menus don't carry tiles.

4. **No changes** to `nav-config.ts`, `site-header.tsx` flat links, `routeTree.gen.ts`, or any other file.

**Defensive behavior matrix:**

| Storefront response | Rendered nav |
|---|---|
| Scope still denied (403) | Existing live-built tree |
| `menu == null` | Existing live-built tree |
| `items: []` | Existing live-built tree |
| Tree missing `women`/`men` matches | Existing live-built tree |
| Curated 3-level tree | Shopify tree + code-side editorial tiles |

**Verify after build:**
- Hit `/` → header megamenu renders. If Shopify menu is the default Catalog/Home/Contact, fallback path kicks in → identical to today.
- Server-fn log shows either `[menu-source] using shopify tree` or `[menu-source] falling back`.
- No new console errors, no broken `#` links, visual-regression snapshots for megamenu unchanged.

---

### Phase 2 — Additive Shopify Customer Accounts at `/account`

**Goal:** brand-new `/account` surface backed by Storefront customer mutations. **Does not touch** `src/routes/login.tsx`, `bootstrap-admin`, `requireSupabaseAuth`, `/admin/*`, or any Supabase auth code.

**Files:**

1. **NEW `src/lib/shopify-customer.ts`** — browser-safe Storefront client helpers (publishable token, no admin key).
   - `customerCreate({ email, password, firstName, lastName, acceptsMarketing })`
   - `customerAccessTokenCreate({ email, password })` → `{ accessToken, expiresAt }`
   - `customerAccessTokenDelete(accessToken)`
   - `customerRecover(email)` — triggers Shopify's password-reset email
   - `getCustomer(accessToken)` — `{ firstName, lastName, email, defaultAddress, orders (last 20) }` with order number, processedAt, fulfillmentStatus, financialStatus, currentTotalPrice, lineItems (first 3), statusUrl
   - Every helper returns typed `{ data | null, errors: { field, code, message }[] }` extracted from `customerUserErrors[]` so UIs can render Shopify's exact validation messages inline.

2. **NEW `src/stores/customer-store.ts`** — Zustand store persisted to `localStorage` as `por-customer-token-v1`.
   - Stores only `{ accessToken, expiresAt }` — never password/PII.
   - Auto-expires when `Date.now() > expiresAt`.
   - `signOut()` calls `customerAccessTokenDelete` then clears.
   - All `localStorage` reads guarded for SSR safety.

3. **NEW `src/routes/account.tsx`** — layout route (`<Outlet />`) with auth-aware redirect on the dashboard child only.
   - `head()`: `noindex, nofollow` (private surface).

4. **NEW `src/routes/account.index.tsx`** — dashboard.
   - `useQuery` calls `getCustomer(token)`.
   - Order table: order #, processed date, fulfillment badge, financial status, USD total (via `formatPrice` from `src/lib/shopify.ts`).
   - "View order" → opens `order.statusUrl` in new tab (Shopify customer order pages aren't on Storefront API; this is the standard headless pattern).
   - Empty state: "You haven't placed any orders yet." + CTA to `/shop`.

5. **NEW `src/routes/account.login.tsx`** — email + password.
   - Inline error messages from `customerUserErrors`.
   - Links: "Forgot password?" → `/account/recover`, "Create account" → `/account/register`.
   - Brand-styled with existing semantic tokens (matches `newsletter-form.tsx`).

6. **NEW `src/routes/account.register.tsx`** — first name, last name, email, password, "Subscribe to drops" checkbox (default checked → `acceptsMarketing: true`).
   - On success → immediately `customerAccessTokenCreate` → redirect to `/account`.

7. **NEW `src/routes/account.recover.tsx`** — single email field → `customerRecover`. Success: "Check your inbox for reset instructions."

8. **EDIT `src/components/site-header.tsx`** — single handler change on the existing account icon.
   - If no customer token → `/account/login`. If token present → `/account`.
   - `/login` (Supabase admin) stays exactly where it is. Founder reaches it by typing the URL or via `/admin/*` redirects (already implemented).

**Defensive behavior:**
- Any customer mutation that errors returns typed `customerUserErrors[]`; forms render Shopify's exact message inline. No raw stack traces.
- Newsletter form stays on Supabase + Gmail (Phase 3 explicitly skipped).

**Verify after build:**
- `/account/login`, `/account/register`, `/account/recover`, `/account` all render without crashing.
- Bad credentials → see Shopify's inline error.
- `/admin/` still works for the founder via Supabase auth.
- Header cart/search/wishlist all unchanged.

---

### Phase 3 — Explicitly skipped

No content migration, no newsletter rewire, no edits to `about` / `faq` / legal / journal / editorial routes. Hand-written brand copy stays. `newsletter_subscribers` table + Gmail welcome template stay.

---

### Out of scope (explicitly NOT building)

- Customer addresses CRUD UI — only the order dashboard.
- httpOnly cookie session for customer — using the standard Storefront pattern (token in `localStorage`); follow-up if you want server-side sessions later.
- Multipass / SSO between Shopify and Supabase — the two auth systems stay fully isolated as requested.

---

### Execution order

1. Phase 1 → build → verify megamenu unchanged in fallback + report results.
2. Phase 2 → build all `/account` routes + customer store + header handler swap → verify.
3. Confirm both phases shipped, no regressions to admin or editorial surfaces.