## Goal
Make the homepage + collection meta A/B test fully SEO-safe, bot-aware, tracked, and regression-tested. Stack is TanStack Start (React 19, Vite, Cloudflare Worker SSR) with Lovable Cloud (Supabase) — so detection runs in the SSR server function layer, meta injection runs in route `head()`, and the dashboard is a Supabase-backed admin page.

## 1. Bot detection (server-side, fail-safe)

Create `src/lib/bot-detect.ts` with `classifyUserAgent(ua, headers)`:
- Known-bot UA regex list (Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot, Applebot, FacebookExternalHit, Twitterbot, LinkedInBot, Slackbot, DuckDuckBot, YandexBot, Baidu, headless Chrome, curl/wget/python-requests, etc.). Easy to extend — single exported array.
- Heuristics: missing `accept`/`accept-language`, `accept` lacks `text/html`, suspicious UA tokens (`bot|spider|crawler|crawling|preview|fetch|http-client`).
- Returns `{ isBot: boolean, reason: string }`. Fail-safe: any error / uncertainty → `isBot: true` so the default variant ships.

Update `src/lib/meta-ab.functions.ts` `readMetaAbBucket`:
- Read `user-agent` + headers via `getHeaders()`.
- If `isBot` → always return `{ bucket: 0, isBot: true, forced: true }`.
- Otherwise return the cookie bucket (+ `isBot: false`).

Reverse-DNS verification is intentionally skipped (Workers can't do PTR lookups reliably and UA+heuristics already catch 99%+; called out in code comments).

## 2. Indexability rules (canonical-safe)

Update `src/routes/index.tsx` and `src/routes/collections.$handle.tsx` `head()`:
- Variant A (bucket 0, default) → normal title/description + self-referencing canonical, no robots tag (indexable).
- Variant B (bucket 1) → variant title/description **but** `<meta name="robots" content="noindex,follow">` and the same canonical pointing at the default URL.
- Bot requests are forced to bucket 0 in step 1, so crawlers literally never see noindex or variant copy.

Update `useMetaAb` hook to also patch the `robots` meta tag client-side when the client-assigned bucket differs from SSR (e.g. a first-visit user rolled into bucket B mid-session) — keeps user-facing behavior consistent with SSR for returning visits.

## 3. Conversion tracking + dashboard

**Migration** — new tables:
- `meta_ab_exposures(id, page_type, page_path, bucket, variant, session_id, created_at)`
- `meta_ab_conversions(id, page_type, bucket, variant, event_type, session_id, value_usd, created_at)`
- Both: `anon+authenticated INSERT` with input validation (length/range checks); `admin SELECT` only. Indices on `(page_type, variant, created_at)`.

**Client tracking** — new `src/lib/meta-ab-track.functions.ts` server fns: `recordExposure`, `recordConversion`. Wire:
- `useMetaAb` already fires Plausible — add a server-fn call to `recordExposure` (once per session per page_type, deduped via sessionStorage key).
- `src/stores/cart-store.ts` (or `use-cart-sync`) → on add-to-cart, call `recordConversion({ event_type: 'add_to_cart', value_usd })` reading bucket from cookie.
- `formatCheckoutUrl` site / cart-drawer checkout button → `recordConversion({ event_type: 'checkout_started' })`. Memory says don't modify checkout protocol — only ADD a fire-and-forget tracking call alongside, no changes to URL generation, mutations, or state shape.

**Dashboard** — new `src/routes/admin.meta-ab.tsx` (admin-guarded like other admin routes):
- Server fn `getMetaAbReport({ days })` aggregates: per `page_type × variant` → impressions, conversions (by event_type), conversion rate, lift vs variant A.
- Basic significance: two-proportion z-test, surface `z`, `p`, and a label (`Not enough data` < 100 exposures/arm; `Trending`; `Significant @ 95%`; `Significant @ 99%`).
- Table UI with sample sizes, CR%, lift%, confidence label per page type.

## 4. Tests (Vitest)

New `src/lib/__tests__/meta-ab-seo.test.ts`:
- Default variant → canonical = page URL, no robots noindex.
- Variant B → canonical = default URL, robots includes `noindex`.
- Bot UAs (Googlebot, GPTBot, ClaudeBot, PerplexityBot, plain `curl/7.x`) → `classifyUserAgent` returns `isBot: true`.
- Real Chrome/Safari UAs → `isBot: false`.
- Snapshot-style: head output for both routes × both buckets is internally consistent (title present, description ≤160, canonical absolute, og:url matches canonical).
- Regression: adding a new collection recipe still passes the canonical-safety invariants.

## Technical files

- new: `src/lib/bot-detect.ts`, `src/lib/meta-ab-track.functions.ts`, `src/lib/meta-ab-report.functions.ts`, `src/routes/admin.meta-ab.tsx`, `src/lib/__tests__/meta-ab-seo.test.ts`, `src/lib/__tests__/bot-detect.test.ts`
- edit: `src/lib/meta-ab.functions.ts` (bot-aware), `src/lib/meta-ab.ts` (export helpers + canonical default URL per page), `src/hooks/use-meta-ab.ts` (record exposure server-side, patch robots), `src/routes/index.tsx` + `src/routes/collections.$handle.tsx` (noindex/canonical rules), one cart hook (add-to-cart conversion), nav link to dashboard
- migration: two `meta_ab_*` tables + grants + RLS + indices
- untouched: cart-store, cart-drawer, use-cart-sync internals, formatCheckoutUrl, Shopify integration

## Open question
Plan confirms the stack (TanStack Start + Cloudflare Worker SSR + Supabase). Ready to implement on approval.