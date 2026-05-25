
## Goal

`/` is rendered entirely by the AI edition system — **including the header and footer**. The cron decides every block, its order, its copy, its imagery, and even the header/footer variant on each 48h cycle. Nothing on the homepage is hardcoded.

```text
<EditionLayout>                ← 100% AI-managed
  ├─ header block              ← AI-chosen header variant + copy
  ├─ N body blocks             ← hero, rails, trending, for-you, countdown, banners, etc.
  └─ footer block              ← AI-chosen footer variant + copy
</EditionLayout>
```

Other routes (PDPs, collections, account, etc.) keep the existing root-level `<SiteHeader/>` + `<SiteFooter/>` unchanged. The change is scoped to the homepage.

## Header / footer architecture

We can't have Claude rewrite component code every 48h, but the cron *can* drive variants + copy + visibility through new block types:

- `site_header` block (homepage only):
  - `variant`: `"default" | "minimal" | "editorial" | "transparent-over-hero"`
  - `announcementBar`: optional `{ message, href?, tone? }` rendered above the nav
  - `ctaOverride`: optional override for the primary header CTA label/link (e.g. "Shop the Edition")
  - `searchPlaceholder`: optional override
  - `hideOnScroll`: boolean

- `site_footer` block (homepage only):
  - `variant`: `"default" | "editorial" | "minimal"`
  - `eyebrow`: optional eyebrow line above the columns ("Resort 2026 — closing soon")
  - `featuredLinks`: optional `[{ label, href }]` slot the cron can fill with edition-themed shortcuts
  - `newsletterCopy`: optional override `{ heading, body, cta }`

Implementation:
- Extract today's `SiteHeader`/`SiteFooter` into the existing components but add prop-driven `variant` + slot props (announcement bar, CTA override, footer eyebrow, etc.) with current values as defaults — so nothing changes for non-homepage routes.
- Root layout (`__root.tsx`) gets a small mechanism (route-context flag or a `useChromeOverride` hook backed by Zustand) that lets the homepage **suppress the default header/footer** and render its own AI-driven variants instead. Concretely: on `/` only, set `chrome.headerSuppressed = true` and `chrome.footerSuppressed = true` until `EditionLayout` mounts its own header/footer blocks. Suppression is per-page and resets on navigation away.
- This keeps a single React tree (no double headers, no flash of default chrome) and leaves every other route untouched.

## Block schema additions (`src/lib/homepage-layout-schema.ts`)

New blocks (in addition to those agreed in the previous plan):

- `site_header` — fields above
- `site_footer` — fields above

Smart-widget blocks (cron-included, no longer hardcoded):
- `trending_rail` — eyebrow/heading/subheading + optional `windowDays`/`limit`
- `for_you_feed` — eyebrow/heading/subheading + optional `limit`
- `curation_countdown` — eyebrow/heading/subheading

Composed blocks (cover today's hardcoded sections):
- `trust_strip`, `cta_banner`, `campaign_hero`, `editorial_split`, `triptych`, `brand_grid`, `pillars`, `editorial_feature` — see prior plan for shape.

Existing `hero`, `product_rail`, `editorial_banner` stay.

`layout_meta`: optional `{ theme?: "warm" | "cool" | "default", spacing?: "tight" | "default" | "open" }`.

Validation rule (zod refine): an edition MUST contain exactly one `site_header` (first block) and exactly one `site_footer` (last block) and exactly one `curation_countdown` somewhere in between. `trending_rail` and `for_you_feed` are recommended but not required (cron prompt enforces inclusion via instructions).

## Renderer (`src/components/editors-edition.tsx` → `EditionLayout`)

- Sole body renderer for `/`. Renders the AI layout end-to-end, including header and footer blocks.
- On mount, sets the chrome-suppression flag so root-level `SiteHeader`/`SiteFooter` don't render on `/`. Cleared on unmount.
- One renderer per block type, using existing tokens (`bronze`, `ink`, `canvas`, `canvas-raised`).
- Smart-widget blocks wrap `TrendingNowRail`, `ForYouFeed`, `CurationCountdown` and pass AI copy/limits as props.
- Image resolver: `library:N` → editorial library, `collection:<handle>` → first product image of the collection, absolute URL → as-is.
- Brand sources: `featured-shared` (extracted to `src/lib/featured-brands.ts`), `houses-tier` (uses `LUXURY_TIERS`), explicit slug list.
- Block-level failures bail to `null`. If header/footer blocks fail to render, fall back to the default `SiteHeader`/`SiteFooter` for that pass (no naked page).

## Component prop extensions

- `SiteHeader` — add optional `variant`, `announcementBar`, `ctaOverride`, `searchPlaceholder`, `hideOnScroll` props with current values as defaults.
- `SiteFooter` — add optional `variant`, `eyebrow`, `featuredLinks`, `newsletterCopy` props with current values as defaults.
- `TrendingNowRail`, `ForYouFeed`, `CurationCountdown` — add optional `eyebrow`/`heading`/`subheading` (plus `limit`/`windowDays` where relevant) with current values as defaults.

No behaviour change on existing routes — all new props are optional and default to today's output.

## Chrome-suppression mechanism

- Add `src/stores/chrome-store.ts` (Zustand) with `{ headerSuppressed, footerSuppressed, setSuppressed }`.
- `__root.tsx` reads the store and conditionally renders the default `SiteHeader`/`SiteFooter`.
- `EditionLayout` calls `setSuppressed({ header: true, footer: true })` on mount, `false` on unmount. Cleanup ensures no leak across SPA navigations.
- Cart/checkout protocol stays untouched (no edits to cart-store, cart-drawer, use-cart-sync, formatCheckoutUrl).

## Cron (`src/routes/api/public/cron/refresh-homepage-layout.ts`)

- Rewrite Claude prompt to compose a complete homepage edition (14–20 blocks total) starting with a `site_header` block and ending with a `site_footer` block, including at least one each of `curation_countdown`, `trending_rail`, `for_you_feed`.
- Provide same signals as today plus editorial library keys, brand directory, tier data, previous edition headings/hero for divergence.
- Update `buildFallbackLayout()` to emit a full edition including header/footer blocks so cold-start matches what we ship.
- Atomic swap, validation, audit logging unchanged.

## Index route (`src/routes/index.tsx`)

- Body collapses to: head/meta + error boundary + `<EditionLayout/>`.
- Remove all hardcoded sections + section queries — that data now lives in block renderers or the seeded fallback.
- Keep `SummerBento` markup only as the *default hero block* of the seeded fallback edition for the LCP preload on cold first load.

## Seeding (one-time)

Insert a "full-homepage" edition (`source: "manual"`, `is_active: true`) including `site_header`, all body blocks, `trending_rail`, `for_you_feed`, `curation_countdown`, and `site_footer`. Bypasses the cold-start filter. Next cron run replaces it.

## Out of scope

- Header / footer on routes other than `/` — unchanged.
- Nav menu items, megamenu structure, cart drawer behaviour — unchanged.
- Checkout / cart code (locked per memory).
- No new database tables — reuses `homepage_daily_layout`.

## Verification

- `/` renders fully via `EditionLayout`: AI-driven header → AI body blocks (incl. Trending, For You, Countdown) → AI-driven footer. No duplicate chrome. No hardcoded sections.
- Other routes still render the default `SiteHeader` / `SiteFooter` unchanged.
- Trigger cron with `?force=true` → swap succeeds, header variant + body order + footer variant restructure, no duplicates.
- AI failure path → seeded fallback renders complete homepage including header + footer blocks.
- Spot-check at 440px (current viewport) and desktop.
