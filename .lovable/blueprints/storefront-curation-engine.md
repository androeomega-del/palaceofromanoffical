# Storefront Curation Engine — Master Blueprint

**Status:** canonical reference for the automated, zero-downtime, bi-daily publishing architecture.
**Saved:** 2026-05-23
**Source:** user brief (gemini-code-1779568645998.txt)

This document is the architectural source of truth. All upcoming phases — database schemas, server functions, cron jobs, and frontend routes — must line up exactly with it. Update this file (do not overwrite without diff) whenever the user revises the plan.

---

## 1. Architecture Hardening & Atomic Swaps

- **Atomic Swap (homepage):** the active storefront keeps serving the previous valid `status='active'` row in `homepage_daily_layout` until a new configuration is fully generated, written, and validated. The flip is a single-row status transition, never a destructive overwrite.
- **Zod-enforced validation:** every generated `layout_json` is parsed through a Zod schema before it can be marked `staged` or `active`. On Claude failure or malformed output, the renderer falls back to a hardcoded **skeleton fallback** layout — never an empty screen, never a compile error.
- **Legacy redirect map:** `/collections/best-sellers` and `/collections/new-arrivals` issue **301 permanent redirects** to filtered `/shop` fallbacks (unbreakable, SEO- and bookmark-safe).

## 2. Overnight Extraction — Custom Claude API (cost & quality locked)

- Background server function powered by the user's own `ANTHROPIC_API_KEY` (Supabase secret), model **`claude-3-5-sonnet`**, bypassing default Lovable AI credits.
- **Cron:** fires at **02:00 AM every 48 hours**.
- **Dual-signal priority evaluation:**
  - **Offensive signal** — query `interaction_events` where `event_type = 'search'` over the last 48h. Any term with ≥ 5 occurrences gets a **velocity priority score**.
  - **Defensive signal** — compare collection page views vs. `add_to_cart` events over the last 48h. Collections with views > 100 and add-to-cart rate < 2% get a **conversion drop-off margin score**.
- **Priority logic:** Claude evaluates both signals, picks whichever has the **highest velocity** for the current cycle, then acts as Creative Director and emits a full layout JSON — thematic headlines, editorial copy, section ordering, and a top-10 product array — tailored to solve that specific signal.

## 3. Dynamic Landing Pages Layer

- New table **`dynamic_landing_pages`** (already created — see migration `20260523203140`).
- Dynamic frontend route **`/pages/$slug`** (already scaffolded — `src/routes/pages.$slug.tsx`).
- When a search spike or conversion drop triggers trend-specific optimization, Claude generates a brand-new standalone blueprint for that slug.
- **Navigation rule:** these pages are reachable **only** via homepage tiles or direct/social deep links. They MUST NEVER auto-inject into the top site-header menu.

## 4. The 9:00 AM Soft-Launch & Production Rendering

- Daily scheduled task at **09:00 AM**:
  - Scan `homepage_daily_layout` and `dynamic_landing_pages` for any `status='staged'` row scheduled for that morning.
  - Flip it to `status='active'` and mark previous active layouts as **`superseded`** (not deleted).
- The homepage route canvas maps dynamically over these parameters — the entire aesthetic shifts with zero manual code changes and zero downtime.

---

## Mapping to Current Codebase

| Blueprint item | Implementation location | Status |
|---|---|---|
| Atomic swap on `homepage_daily_layout` | `src/lib/homepage-layout-generator.server.ts` | partial — verify staged→active transition |
| Zod schema for layout JSON | `src/lib/landing-page-schema.ts` (extend for homepage) | partial |
| Skeleton fallback | needs a hardcoded default exported from `landing-page-schema.ts` | TODO |
| 301 redirects for legacy collection URLs | `src/routes/collections.best-sellers.tsx`, `src/routes/collections.new-arrivals.tsx` | scaffolded — confirm 301 not 302 |
| Overnight Claude cron @ 02:00 every 48h | `src/routes/api/public/cron/generate-homepage-layout.ts` | exists — retime + swap to `ANTHROPIC_API_KEY` + `claude-3-5-sonnet` |
| `ANTHROPIC_API_KEY` secret | Supabase Secrets | **TODO — request from user before wiring** |
| Dual-signal queries (search velocity + conversion drop-off) | `src/lib/landing-page-generator.server.ts` | extend |
| `dynamic_landing_pages` table | migration `20260523203140` | done |
| `/pages/$slug` route | `src/routes/pages.$slug.tsx` | done |
| Header nav exclusion for dynamic pages | site header component (no auto-inject) | enforce in review |
| 09:00 AM soft-launch cron (flip staged→active, mark superseded) | new cron route under `src/routes/api/public/cron/` | TODO |

## Upcoming Phases (ordered)

1. **Secret intake** — request `ANTHROPIC_API_KEY` via `add_secret` before any Claude wiring.
2. **Skeleton fallback** — add hardcoded default layout + Zod parse wrapper used by every renderer.
3. **Overnight generator** — retime cron to `0 2 */2 * *`, switch model to `claude-3-5-sonnet`, implement dual-signal scoring + priority pick.
4. **09:00 soft-launch cron** — new endpoint that promotes `staged` → `active` and demotes prior `active` → `superseded` atomically.
5. **Legacy redirect audit** — confirm both legacy collection routes return HTTP 301 (not client-side redirect).
6. **Header guard** — assert dynamic landing pages are excluded from the main nav (test + comment).

## Invariants (do not violate)

- Active row in `homepage_daily_layout` is never deleted by the generator — only marked `superseded`.
- No renderer reads `layout_json` without Zod validation; on failure, render skeleton fallback.
- Dynamic landing pages never appear in the top nav.
- All cron endpoints live under `/api/public/cron/*` and validate a shared secret header.
- Prices stay in USD at the render boundary (EUR→USD conversion in `src/lib/shopify.ts`).
