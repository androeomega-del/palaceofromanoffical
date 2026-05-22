# Execution Plan — 3 Waves

Working mode: per-wave approval. I will pause after each wave and wait for your signal before starting the next. Smallest viable diffs; nothing customer-facing unless it sells product; everything else admin-gated.

---

## Wave 1 — Security & Infrastructure

**1.1 `/api/public/*` audit pass**
- Enumerate every file under `src/routes/api/public/` (cron hooks, AI recs, SEO health, stock alerts, webhooks).
- For each: confirm (a) signature/secret verification on writes, (b) explicit column projection on any DB read (no `select('*')`), (c) no PII or wholesale/cost data in the response, (d) Zod validation on body/query.
- Fix any leaks in place; document each route's surface in a short comment block at the top of the file.
- Re-confirm admin server functions all chain `requireAdmin` (not just `requireSupabaseAuth`). Grep + fix any stragglers.

**1.2 Queue drain endpoint + cron**
- New route: `src/routes/api/public/cron/drain-growth-jobs.ts` — POST, verifies `apikey` header against `SUPABASE_PUBLISHABLE_KEY` (anon key pattern per docs; no new `CRON_SECRET` needed).
- Handler pulls up to N `pending` rows from `growth_jobs` where `run_after <= now()`, dispatches by `job_type`, updates status/attempts/last_error. Idempotent, bounded batch (e.g. 25/run).
- `pg_cron` every 5 min → POSTs to `project--<id>.lovable.app/api/public/cron/drain-growth-jobs` with `apikey` header. Installed via `supabase--insert` (not migration — contains URLs).
- New admin server fn `drainGrowthJobsNow` (admin-gated) that calls the same handler logic. Wire a "Run queue now" button on `admin.growth-os.tsx` with loading state + toast.

---

## Wave 2 — Frontend Trust (PDP)

**2.1 Authenticity strip**
- New component `src/components/pdp-authenticity-strip.tsx`.
- Renders below the buy box on `product.$handle.tsx`. 3 pillars only (avoid clutter): "100% Authentic", "Sourced from the brands or their authorised distributors", "Inspected before dispatch". Icons from `lucide-react`, bronze/ink palette, semantic tokens only.
- Copy aligned to mem://business/reseller-status — no claims beyond the signed certificate.

**2.2 Brand heritage accordion**
- Already have `src/lib/brand-heritage.ts`. Add a collapsible "The {Vendor} Story" section further down PDP using the existing `accordion` UI primitive, fed by vendor lookup. Auto-hide if no heritage entry exists.

**2.3 Reviews empty state UI**
- New component `src/components/product-reviews.tsx` on PDP.
- Reads from `product_reviews` (status='approved', handle=...). Renders list if any, else editorial empty state: faded icon, copy "Be the first to share your thoughts on this piece.", "Write a Review" button opens a modal form posting to a new `submitReview` server fn (anon allowed per existing RLS, status='pending').
- Form: rating (1-5), title, body (10-4000 chars), name, email. Client-side validation matches DB CHECK. Honeypot field for spam.
- Per Shopify reviews policy + mem://core: never fabricate. Empty state stays honest.

---

## Wave 3 — Post-Purchase Loop + Urgency Funnel

**3.1 Post-purchase review request**
- Existing `post-purchase-email-template.ts` is order-confirmation. New template `review-request-email-template.ts` — single column, "How was {product}?", deep links to `/product/{handle}#reviews?token=...`.
- Token: HMAC-signed `{order_id, handle, email, exp}` using `SHOPIFY_WEBHOOK_SECRET` (already exists, server-only). PDP review form prefills + marks `verified_purchase=true` when token validates.
- Trigger: extend the existing Shopify order webhook handler — on `fulfillments/update` with status `delivered` (or fallback: T+10 days after `paid`), enqueue a `send_review_request` job in `growth_jobs`. Queue worker (Wave 1.2) dispatches it, dedupes via `order_emails_sent` (`email_type='review_request'`).

**3.2 Urgency-conversion funnel panel**
- New section on `admin.growth-os.tsx`, server fn `getUrgencyFunnel` (admin-gated) aggregates last 30d from `interaction_events`:
  - Scarcity views, scarcity clicks, scarcity carts, scarcity→checkout (joined to `cart_events`).
  - Derived: CTR (click/view), Cart rate (cart/click), Tier breakdown by `vendor`/`product_type`.
- UI: 4 metric cards + simple funnel bar (no chart lib needed — flex bars sized by ratio). All numbers, no PII.

---

## Out of scope (will not do unless asked)
- Fake countdown timers / fabricated stock numbers.
- Third-party review scraping (declined on ethical/TOS grounds, per prior turn).
- Homepage redesign.
- New `CRON_SECRET` (using anon-key `apikey` header per Lovable docs).

---

## Confirm to proceed
Reply **"go wave 1"** to start with security audit + queue drain. I will stop and report before touching Wave 2.