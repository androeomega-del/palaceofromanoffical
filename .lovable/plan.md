
## Intent (restated)

Five workstreams, ordered by risk. Nothing internal/marketing/dev-facing stays exposed to the public.

---

### 1. Security lockdown — first, before anything else

**Critical finding flagged by the scanner**: `bg_products.wholesale_price` is publicly readable. That's our cost basis. Fix:
- Revoke public SELECT on `bg_products` and `bg_variants`
- Create a `bg_products_public` view that exposes only customer-safe columns (handle, brand, name, description, gender/category, colour, material, pictures, retail_price, in_stock, total_stock) — **excludes** wholesale_price, currency, modified_at, group_sku, mpn, weight
- Grant SELECT on the view only
- Point any client-side reads at the view

**Audit pass on every other internal surface** — anything not strictly needed for shoppers gets locked behind `has_role('admin')` or removed from the client bundle:
- `/admin/*` routes: confirm every one is gated by `_authenticated` + `has_role` check (the login-loop fix earlier suggests this is partially working but I'll verify each admin route)
- Server fns that return marketing/inventory/cost/recommender internals: confirm `requireSupabaseAuth` + admin role check, not just auth
- `/api/public/*` routes: confirm none leak PII, internal queue state, or AI usage costs
- `llms.txt` and `robots.txt`: confirm they aren't advertising admin paths
- Growth OS, AI usage ledger, email dispatch log, abandoned carts, contact messages, search queries, interaction events, inventory sync runs — all already admin-only by RLS; I'll verify no server fn returns them via an unauthenticated path
- Any "dev/marketing" page that exists as a public route gets either deleted or moved under `_authenticated/_admin`

---

### 2. Admin queue stuck — fix

Symptoms from session replay: "Unauthorized: No authorization header provided" toast on a share/draft button, then 16 min of "Queue is empty" with no jobs draining. Plan:
- Verify `attachSupabaseAuth` is registered in `src/start.ts`
- Read `admin.growth-os.tsx` + `growth-os.functions.ts` to find which fn fires from the share/draft button and is missing middleware or returning early
- Check `growth_jobs` table for stuck `pending` rows (high `attempts`, old `run_after`)
- Add a manual "Run queue now" admin button as the always-available drain so you're never stuck waiting on a scheduler
- If no cron exists, propose (not auto-add) a pg_cron → `/api/public/cron/...` setup as a follow-up

---

### 3. `/limited-finds` editorial landing page — build it

Customer-facing, public, indexable. This is the one new public page.

- New route `src/routes/limited-finds.tsx` with full `head()` SEO meta (title, description, og:title, og:description, og:image from an editorial-library picture, canonical)
- Layout matches homepage rhythm — oversized editorial hero, generous whitespace, tier-sectioned product blocks:
  - **Final Pieces** (`finalPiece` tier) — 2-up large grid
  - **Archive Editions** (`archive` tier, ≥$1800) — 3-up
  - **Rare Finds** (`rareFind` tier) — 4-up
  - **Last at Markdown** (`lastMarkdown` tier) — 4-up
- Empty tier sections auto-hide so the page never looks thin
- Data via new server fn `src/lib/limited-finds.functions.ts` that pulls Shopify products + runs them through the existing `computeScarcitySignal()` — single source of truth, no parallel logic

---

### 4. Urgency conversion tracking — admin-only insights

- Extend `interaction_events` CHECK to accept `scarcity_view`, `scarcity_click`, `scarcity_cart`
- Fire from `ProductCard` (impression + click when scarcity tier ≠ none) and PDP (cart event when scarcity tier ≠ none)
- New admin panel in Growth OS: impressions → clicks → carts funnel per tier, last 7 / 30 days. **Admin-only**, server-fn protected by `requireSupabaseAuth` + role check.

---

### 5. Reviews — declining the import, proposing a trust-lift instead

Per memory rule and Shopify reviews policy: we cannot import third-party reviews (Trustpilot/Yotpo/brand sites/BG/etc.) — TOS violation everywhere, deceptive to shoppers, puts the reseller certificate at risk. Store is brand new so there's no authentic POR review pool yet. Keep "No reviews yet" on PDPs.

What I'll do instead (all customer-facing, all honest):
- **Authenticity & sourcing strip** on PDP — "Sourced via our authorised BrandsGateway partnership · Original packaging · 14-day returns" with link to reseller-certificate.pdf
- **Brand heritage** block on PDP — surface the existing `brand-heritage.ts` content more prominently
- **First-party review collection** — wire the existing `post-purchase-email-template.ts` to request a review 10 days after order; reviews flow into a new `product_reviews` table (admin-moderated before publish)
- "As seen in" / editorial mentions — only when real, blank when not

If you have specific written permission from a source, name it and I'll revisit.

---

## What's customer-facing vs locked

**Public / customer-facing** (storefront):
- All existing storefront routes
- New: `/limited-finds`
- New PDP authenticity strip + first-party reviews UI (empty until real reviews come in)

**Locked / admin-only** (no public exposure):
- All `/admin/*` routes (verified per-route)
- All marketing/dev/growth/AI-usage/email-dispatch/queue surfaces
- Urgency conversion analytics
- Anything BG-internal (wholesale, group SKU, MPN, supplier metadata)

---

## Files I expect to touch

- `supabase/migrations/...` — bg_products view + RLS lockdown + interaction_events CHECK extension + `product_reviews` table
- `src/routes/limited-finds.tsx` (new, public)
- `src/lib/limited-finds.functions.ts` (new, public-safe)
- `src/components/product-card.tsx` + `src/routes/product.$handle.tsx` — fire urgency events
- `src/routes/admin.growth-os.tsx` + `src/lib/growth-os.functions.ts` — fix stuck queue, add manual drain
- `src/start.ts` — verify `attachSupabaseAuth`
- `src/components/site-header.tsx` — add "Limited Finds" nav entry (pending answer to Q2)
- PDP trust-lift components (authenticity strip, brand heritage surfacing, reviews empty state)
- Audit pass on every file under `src/routes/api/public/*` and every `*.functions.ts` to confirm no internal data leaks

---

## Three questions before I execute

1. **Approve declining the reviews import** + the first-party review collection path?
2. **Should `/limited-finds` appear in main nav**, or stay unlinked (only reachable from emails, homepage tile, social)?
3. **If the stuck queue is a missing scheduler**, do you want me to wire pg_cron → `/api/public/cron/drain-growth-jobs` now, or leave that as a follow-up and ship only the manual "Run queue now" button?

Execution order once approved: security lockdown → admin queue fix → Limited Finds + tracking → PDP trust-lift.
