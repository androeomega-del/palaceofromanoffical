# Storefront SSR / Cache / CLS / Anchor Hardening

Per our working-mode rule (plan-first, smallest diff, no sweeping changes without per-item approval) and the checkout-protocol lockdown (cart-store / cart-drawer / use-cart-sync / checkout URL generation are untouchable), I'm scoping this into 4 reviewable phases. Approve them individually — I will NOT do all four in one pass.

## Phase 1 — Server-side TTL cache helper (foundation)

Create `src/lib/server-cache.ts`: generic `cached<T>(key, ttlMs, loader)` using a per-Worker `Map<string, {value, expiresAt}>`, mirroring the pattern already shipped in `vacation-destinations.server.ts`. Single file, zero behavior change until Phase 2 wires it in.

## Phase 2 — Homepage (`/`) SSR audit

`src/routes/index.tsx` already prefetches Men + Women "New This Week" rails into the QueryClient via `ensureQueryData` in the loader, and the LCP image is preloaded. What's missing:
- Best-Sellers rail still fetches client-side after hydration.
- The Shopify calls behind `newThisWeekQueryOptions` / `bestSellersQueryOptions` aren't wrapped in our 60s server cache.

Changes:
- Add Men + Women Best-Sellers `ensureQueryData` to the home loader (parallel with existing New-In).
- Wrap `fetchProducts` calls used by rail queryFns in `cached(...)` keyed by `{surface, dept, market}`, 60s TTL. The cache lives on the server side of the queryFn — `useQuery` keys and client behavior are unchanged.

Out of scope: any change to `HomeStudioLayout` JSX, cart, or chrome.

## Phase 3 — Collection pages (`/collections/$slug`) SSR + cache

I need to read `src/routes/collections.$slug.tsx` first (not in current context) to confirm current loader shape before committing to a diff. Expected change: move the products query into `loader` via `ensureQueryData`, wrap the Shopify fetch in `cached(...)` with 60s TTL keyed by `{slug, market, page, sort, filters}`. Confirm `errorComponent` + `notFoundComponent` are present (required by our standards).

## Phase 4 — PDP (`/product/$handle`) SSR + cache

Same shape: read current file, then move product + related fetches into the loader in parallel, cache the product read 60s by `{handle, market}`. PDP-specific: cart `onAdd` handlers stay exactly as they are (checkout-protocol lockdown).

## CLS audit — separate, after Phases 2–4

`ProductCard` (the shared component used by every rail) needs an audit pass: verify every code path renders `aspectRatio: 3/4` + explicit `width`/`height` on `<img>`, matching the Vacation Stylist tile. I'll list any drift in a follow-up and ask before editing. I won't touch the card in the same diff as routing/loader work.

## Anchor audit — separate

`ProductCard` already wraps in `<Link to="/product/$handle" params={{handle}}>` — that's a real `<a>` in the DOM, type-safe, preload-friendly. The user's prompt asks for raw `<a href>`, but our standing rule (`tanstack-navigation` knowledge: "Params interpolated into `to` strings instead of `params`" is a common mistake) is to keep `<Link>`. **Question for you:** do you want me to (a) keep `<Link>` everywhere (recommended, same SEO outcome — `<Link>` renders `<a href>`), or (b) downgrade product/brand grids to raw `<a href>` strings? I will NOT change this without an explicit pick.

## What I'm explicitly NOT touching

- `__root.tsx` — root `head()` must stay free of `og:image` and per-page meta (per `tanstack-ssr-head`).
- `cart-store`, `cart-drawer`, `use-cart-sync`, `formatCheckoutUrl`, cart mutations (lockdown).
- `src/integrations/supabase/*` auto-generated files.
- `HomeStudioLayout` JSX, megamenu, chrome, filters UI.

## Verification per phase

After each phase: `invoke-server-function` against the touched route, confirm initial HTML payload contains the SSR'd grid markup (grep for product handles in the streamed HTML), confirm no console hydration warnings in the preview.

---

**Please confirm:**
1. Approve Phase 1 (cache helper)?
2. Approve Phase 2 (homepage Best-Sellers SSR + cache)?
3. Approve Phase 3 + 4 in principle (I'll read the files and come back with concrete diffs)?
4. Anchor question above: `<Link>` (recommended) or raw `<a href>`?
