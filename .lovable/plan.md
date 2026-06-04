# Promote Studio shell to homepage — non-destructive merge

## Intent
Make the existing `/studio` visual layer the live homepage `/`, while every backend wire, server function, Shopify connection, cart/checkout protocol, and SEO surface stays exactly as it is today. Nothing is deleted; legacy is archived by unlinking, per the staged-launches rule.

## What stays untouched (hard guarantees)
- `src/lib/shopify.ts`, `src/lib/ai-concierge.functions.ts`, `src/lib/rails/queries.ts`, `formatPrice`, `EUR_TO_USD`.
- Cart protocol: `cart-store.ts`, `cart-drawer.tsx`, `use-cart-sync.ts`, `formatCheckoutUrl`.
- All server functions, all routes except `/`, all API endpoints, all sitemaps, all admin tools.
- `src/components/editors-edition/*` (EditionLayout) — left in place, just unlinked from `/`. Reachable via direct import if you ever want to restore.
- Meta-AB SEO on `/` (`readMetaAbBucket`, `pickHomeMeta`, `seoMetaForBucket`, `useMetaAb`, OG/Twitter image, BreadcrumbList JSON-LD, canonical).
- Studio route at `/studio` continues to work (kept as draft mirror).

## What changes

### 1. `src/routes/index.tsx` — rewire visual layer only
- Keep the existing `loader`, `head()`, and `useMetaAb` block exactly as they are (preserves SEO + A/B).
- Replace the `HomePage` body: instead of `<EditionLayout/>`, render a new `<HomeStudioLayout/>` component that wraps the studio shell (header trigger, hero, asymmetric grid, concierge drawer, footer).
- Keep `HomeErrorComponent`.
- Add the loader prime for `newThisWeekQueryOptions("Women")` alongside the existing `readMetaAbBucket` call so the grid SSRs without a flash. Both run in parallel via `Promise.all`.

### 2. New `src/components/home-studio/*` — extracted from studio.tsx
Move the studio composition into reusable components so `/` and `/studio` share one source of truth and we never drift:
- `home-studio-layout.tsx` — orchestrator (hero + grid + concierge drawer + footer area)
- `home-studio-header.tsx` — concierge-trigger header (used only on `/studio`; on `/` we keep the real `SiteHeader`)
- `asymmetric-grid.tsx` — the 12-col asymmetric tile grid, fed by `newThisWeekQueryOptions`
- `concierge-drawer.tsx` — left drawer wired to `fetchConciergePicks` (same as today)
- `palette.ts` — the obsidian/off-white/sand tokens, scoped via inline style props (no global CSS-var changes)

### 3. Chrome handling on `/`
- Do **not** suppress `<SiteHeader/>` / `<SiteFooter/>` on `/`. The real site nav, cart drawer trigger, search, and account menu must remain functional.
- Add a single concierge entry-point inside the new home body (a "Begin with the concierge" CTA + an `<button>` icon in the hero) — the drawer is mounted at the page level, not in the global header.
- Tighten the layout so SiteHeader + the obsidian hero coexist cleanly (small spacer, no double background).

### 4. `src/routes/studio.tsx` — refactor to consume the same components
- Keep the route at `/studio` (still noindex) but rewrite its body to render `<HomeStudioLayout variant="standalone"/>` so the two surfaces never diverge. The `standalone` variant keeps the suppressed SiteHeader + custom StudioHeader behavior it has today.

### 5. Asymmetric grid — catalog-truth guarantee
- Source is `newThisWeekQueryOptions("Women")`, which already returns live Shopify handles from your storefront. Each tile links to `/product/$handle` using `p.node.handle` — verified by the API response. No hard-coded handles, no placeholder images.
- Empty / error state: render the existing "The next edit is being curated." line — no fabricated tiles.

### 6. Cart wiring
- The studio shell currently has no add-to-cart on tiles (tiles link to PDPs). Cart drawer continues to open from the real `SiteHeader`. No changes to cart store or checkout URL formation.

## What the user will see at `/`
- Real `SiteHeader` (nav, search, cart, account) on top — unchanged.
- New obsidian hero: oversized serif headline, sand accent, "Begin with the concierge" CTA.
- Editorial asymmetric grid of 6 live "New In" products with inward image scaling on hover and staggered fade-in.
- Footer = existing `SiteFooter` (unchanged).
- Concierge drawer (left, off-white) opened from the hero CTA, wired to `fetchConciergePicks`.

## Files touched
| File | Action |
|---|---|
| `src/routes/index.tsx` | Edit: swap body to `HomeStudioLayout`, add grid prefetch to loader |
| `src/routes/studio.tsx` | Edit: thin wrapper around `HomeStudioLayout variant="standalone"` |
| `src/components/home-studio/home-studio-layout.tsx` | New |
| `src/components/home-studio/home-studio-header.tsx` | New (standalone variant only) |
| `src/components/home-studio/asymmetric-grid.tsx` | New |
| `src/components/home-studio/concierge-drawer.tsx` | New |
| `src/components/home-studio/palette.ts` | New |
| `src/components/editors-edition/*` | UNTOUCHED (archived by unlinking from `/`) |

## Verification after build
1. Typecheck/build passes.
2. `/` renders new shell + real SiteHeader/SiteFooter; cart drawer still opens; checkout URL unchanged.
3. `/studio` still renders (standalone variant).
4. Concierge drawer streams from `fetchConciergePicks`.
5. Grid tiles route to `/product/<live-handle>` — handle equals `p.node.handle` from the live query.
6. View-source: title, description, og:image, canonical, BreadcrumbList JSON-LD all match the meta-AB bucket (SEO preserved).
7. Lighthouse/preview check that hover scale and stagger animations run.

## Non-goals (explicit)
- No changes to product data, vendor names, prices (USD continues via `formatPrice`).
- No new copy on legal/compliance surfaces; no BG mention introduced.
- No changes to navigation taxonomy, no new nav links, no new collections.
- No changes to admin tools, sitemaps, or any other route.
- No restyling of global tokens in `src/styles.css` — palette stays scoped to the home shell.

Approve and I'll execute exactly this. If you'd rather keep the EditionLayout content (Editor's Edition body, themed Edit tiles) and only wrap the existing home in the new obsidian chrome, say so and I'll re-plan — that's a different shape.
