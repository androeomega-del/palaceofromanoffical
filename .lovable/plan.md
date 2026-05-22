## Scope

Two new tabs inside `src/routes/admin.growth-os.tsx`. No other routes touched, no public surface changed. Both run on-demand only (no cron, no CI).

---

## 1. Active Audit tab

One "Run audit" button. One server fn `runActiveAudit` returns categorized pass/fail/warn rows. Results render as 4 collapsible cards (Tech+Security, SEO+Perf, Sales, UX/A11y) with green/amber/red dots and one-line remediation per row.

**Checks (all runtime-verifiable, no filesystem grep):**

Tech + Security
- `GET /sitemap.xml` → 200 + parses + entry count
- `GET /robots.txt` → 200 + contains `Sitemap:`
- Canonical handle redirect: `GET /collections/men-accessories` → 308 to `/collections/mens-accessories` (proves the fix from earlier this session is live)
- Spot-check 5 critical routes (`/`, `/shop`, `/brands`, `/collections`, `/about`) → 200
- RLS coverage: `supabaseAdmin` queries `pg_tables` + `pg_policies` in `public` schema → list any table with RLS disabled or 0 policies
- Required webhook secret env vars present (`SHOPIFY_WEBHOOK_SECRET`, `LOVABLE_API_KEY`)

SEO + Performance
- Fetch `/`, `/shop`, top collection HTML → parse for `<title>`, meta description, canonical link, og:image, og:title, og:description, JSON-LD breadcrumb
- Flag missing/empty/duplicate
- Homepage HTML size + script count + TTFB (single fetch timing)

Sales / Conversion (last 7 days, all from Supabase)
- `cart_events`: counts by event_type → funnel `add_to_cart → checkout_started → reached_checkout`, conversion %
- `abandoned_carts`: total, recovered, recovery email sent
- `newsletter_subscribers`: new signups
- `email_dispatch_log`: sent vs failed by template_name
- Warn if any zero where it shouldn't be (e.g. no abandoned-cart emails dispatched in 7 days)

UX / A11y (homepage HTML heuristic only — fast, no axe-core dep)
- `<img>` without `alt=` count
- `<button>` / `<a>` with no text and no `aria-label` count
- Flag any `class=...h-screen` (should be `h-dvh`)

**Files**
- `src/lib/active-audit.functions.ts` — `runActiveAudit` server fn (admin-only middleware)
- `src/lib/active-audit-checks.server.ts` — pure helpers per check
- `src/routes/admin.growth-os.tsx` — add tab + UI

No migration. No new tables.

---

## 2. UGC Content Recommender tab

One "Generate ideas" button → server fn pulls 4 buyer-behavior signals from Supabase, ranks opportunities, calls Lovable AI Gateway once per opportunity to produce brief + per-channel caption. Capped at 8 ideas per run for cost.

**Signals (last 14 days)**

| Signal | Source | Logic |
|---|---|---|
| Top-viewed | `interaction_events` where event_type in ('pdp_view','click','impression') | Top 5 handles by weighted score (pdp_view×3 + click×2 + impression×1) |
| Wishlist→no-cart | `interaction_events` event_type='wishlist' minus matching 'cart' for same handle | Top 5 with desire signal but no purchase intent |
| Abandoned-cart | `abandoned_carts.items` jsonb → unnest handles | Top 5 most-abandoned product handles |
| No-results search | NEW `search_queries` table | Top 5 queries with result_count=0 |

**New table (one migration):**
```
search_queries (id, query text, result_count int, session_id text, page_path text, created_at)
- RLS: anon+auth INSERT with length/regex bounds (mirrors cart_events pattern)
- RLS: admin SELECT only
```

Plus a small wire-up in `src/components/search-overlay.tsx` (or `ai-search-bar.tsx` — whichever owns the query) to fire an insert when results.length === 0. **One line of new code in the search component, no UI change.**

**Per-opportunity AI call**

Uses existing `src/lib/ai-gateway.server.ts` + `src/lib/brand-voice.ts`. Model: `google/gemini-3-flash-preview` (fastest/cheapest, fits brief gen). Returns JSON:
```
{
  rationale: string,         // why this product, citing the signal
  hook: string,              // 1-line opening
  instagram_caption: string, // ~150 chars + emojis off (POR voice)
  pinterest_caption: string, // ~200 chars, keyword-rich
  x_caption: string          // ≤240 chars
}
```

Renders as a card per idea with copy buttons per channel. "Send to Social Pilot queue" button writes to existing `content_queue` table (`channel`, `kind='draft'`, `status='draft'`, payload= captions + product_handle).

**Files**
- `supabase/migrations/<ts>_search_queries.sql` — new table + RLS
- `src/lib/ugc-recommender.functions.ts` — `getUgcSignals`, `generateUgcIdeas`, `queueIdeaForChannel`
- `src/components/search-overlay.tsx` (or whichever) — 3-line tracking insert
- `src/routes/admin.growth-os.tsx` — add tab + UI

---

## Cost & guardrails

- Audit: ~10 Supabase queries + ~5 fetches per run. No AI calls. Should complete in 3–5s.
- UGC: 1 AI call per opportunity × max 8 = 8 calls per "Generate ideas". Uses Gemini 3 flash (cheapest). User controls cadence with the button.
- Both gated by `adminBeforeLoad` + `requireSupabaseAuth` server middleware.

## Out of scope (explicit)

- No CI integration / GitHub Action
- No cron / nightly run
- No Lighthouse runner (browser-based; not feasible from worker — flagged for separate decision)
- No axe-core (heavyweight; HTML heuristic is the v1)
- No edits outside the two new tabs + the search-overlay one-liner + the one migration

---

## What I need from you

Approve and I build it. If you want me to swap any check, drop any signal, or change the AI model, say so and I revise the plan first.