# Auto-Morphing Homepage (48h AI Blueprint)

Per your working-mode rule (deep-research, approval-gated, smallest diff), confirming the plan before any code or DB changes. The current `src/routes/index.tsx` is a hand-curated editorial homepage with bento, swim campaign, For You feed, etc. — I will **not** delete it. Instead I'll add a dynamic *overlay* the AI controls, leaving the existing structure as the safety net.

## 1. Database

New table `homepage_daily_layout`:
- `id` uuid pk
- `generated_at` timestamptz default now()
- `layout_json` jsonb
- `is_active` boolean default true (single active row pattern)

RLS: public SELECT on active row only; writes service-role only (cron + admin).

Index on `(is_active, generated_at desc)`.

## 2. Velocity signal

Reuse existing `interaction_events` table (already tracks impression/click/pdp_view/wishlist/cart per handle). Aggregate last 48h, weighted score → top ~30 handles. Hydrate via Shopify Storefront API to give the AI title/vendor/price/tags.

## 3. Generation job

**No Supabase Edge Function.** Per stack rules use a TanStack server route under `/api/public/cron/generate-homepage-layout` (signature-protected via `checkWebhookSecret`, same pattern as existing `drain-growth-jobs`). Schedule with `pg_cron` + `pg_net` every 48h at 00:00 UTC.

Function flow:
1. Pull top handles from `interaction_events` (48h window).
2. Hydrate product summaries from Shopify.
3. Call Lovable AI (`google/gemini-2.5-pro`, JSON mode) with a Creative Director system prompt.
4. AI returns JSON:
   ```json
   {
     "edition_name": "Sleek Brutalism",
     "hero": { "eyebrow": "...", "headline": "...", "subcopy": "...", "cta": "Shop the edition" },
     "accents": { "bg": "#0a0a0a", "fg": "#f5f0e8", "accent": "#c9a84c", "font_pair": "instrument-serif+work-sans", "texture": "grain|gloss|matte" },
     "sections": [
       { "id": "edit-1", "title": "The Sharp Set", "blurb": "...", "handles": ["...","..."] },
       { "id": "edit-2", "title": "...", "blurb": "...", "handles": [...] },
       { "id": "edit-3", "title": "...", "blurb": "...", "handles": [...] }
     ],
     "layout_order": ["hero","edit-1","edit-2","edit-3"]
   }
   ```
5. Validate with Zod, enforce handle allowlist (must exist in Shopify + pass `isAllowedLuxuryBrand` vendor whitelist), clamp colors/copy lengths.
6. Insert new row, flip prior row `is_active=false`.

Manual "Run now" button added to `admin.growth-os.tsx`.

## 4. Frontend rendering

`src/routes/index.tsx` change — additive, not destructive:
- New `<DynamicEditionHero />` component fetched via `createServerFn` (`getActiveHomepageLayout`) using QueryClient prefetch in loader (canonical TanStack pattern).
- Renders at the top of the page **above** the existing hero. If no row exists or fetch fails → component returns null, existing homepage unchanged.
- Three AI edits render as product rails using existing `ProductCard` component, populated from Shopify Storefront API (batch fetch by handles).
- Accents applied via inline CSS custom properties scoped to a wrapper (no global theme mutation).

No removal of: existing hero, bento, For You feed, swim, journal, FBT, footer. The AI overlay is *additive curation*.

## 5. Files

**Create**
- `supabase/migrations/<ts>_homepage_daily_layout.sql` (table + RLS)
- `src/lib/homepage-layout.functions.ts` (`getActiveHomepageLayout` server fn)
- `src/lib/homepage-layout-generator.server.ts` (velocity → AI → validate → write)
- `src/lib/homepage-layout-schema.ts` (Zod schema)
- `src/routes/api/public/cron/generate-homepage-layout.ts` (cron-callable route)
- `src/components/dynamic-edition-hero.tsx`
- `src/components/dynamic-edition-rail.tsx`

**Edit (surgical)**
- `src/routes/index.tsx` — add `<DynamicEditionSlot />` at the top of `<main>`; no other changes
- `src/routes/admin.growth-os.tsx` — add "Regenerate homepage edition" button

**Pg_cron** — separate insert SQL (not migration) after route deploys.

## 6. Safety / non-negotiables (per your memory rules)

- USD display via existing `priceMoney()` (EUR→USD).
- Never fabricate brands — handle allowlist enforced.
- No fake reviews/social-proof copy.
- No `inventoryActivate` / fulfillment-location changes.
- No BG import code touched.
- Checkout protocol untouched (cart-store, cart-drawer, use-cart-sync, formatCheckoutUrl).
- Existing homepage continues to work if AI row is missing.

## 7. Open questions before I build

1. **Cadence** — you said "every 48 hours" *and* "every other day at midnight". Confirm midnight **UTC** (server time) vs Europe/Rome (your store TZ).
2. **Scope of morph** — keep additive (new AI edition section added *above* existing homepage), or do you literally want the AI to replace the entire homepage (kill bento + For You + swim)? Strong recommendation: additive. Confirm.
3. **AI model** — `google/gemini-2.5-pro` (best taste, costs more) vs `google/gemini-2.5-flash` (cheap, ~10x cheaper, fine for copy + handle selection). Recommendation: flash for the rotation, pro only if quality disappoints.
4. **Cold start** — first 48h after launch there's no row yet. OK to seed manually by clicking "Run now" once after deploy?

Reply with answers (or "go with your recommendations") and I'll build it in one pass.