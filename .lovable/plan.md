# Next curation: fully AI-composed + swap the About founder portrait

Two independent changes.

## 1. Swap the founder portrait on `/about`

Today `src/routes/about.tsx` renders `@/assets/founder-option-palazzo.jpg`. Replace it with the LA pinstripe-suit photo you just uploaded.

- Copy `user-uploads://IMG_0848.jpeg` → `src/assets/founder-portrait-la.jpg`
- In `src/routes/about.tsx`, change the import to the new file and update the `alt` to reflect the new setting (downtown LA at golden hour, three-piece pinstripe). Old file stays in `src/assets/` (archived by unlinking, per the staged-launches rule) — not deleted.
- No layout, copy, or section changes on the About page.

That's the whole "founder image" change. No Founder Edit block on the homepage.

## 2. Make the next 48-hour curation feel fully AI-composed

Right now the cron only emits **one block** (a best-sellers rail) — that's why the homepage doesn't feel pulled together. Rebuild the generator so the next edition is a real multi-block AI composition.

Replace `buildFallbackLayout()` in `src/routes/api/public/cron/refresh-homepage-layout.ts` with `buildAiLayout()`. Cold-start fallback stays as the safety net if anything fails.

The generator will:

1. **Pull live signals in parallel:**
   - Top trending brands (from `trending.functions.ts`)
   - Best-selling products by gender (men / women) from Shopify
   - This week's most-viewed products from `interaction_events`
   - Current editorial routes (`resort-2026`, `the-new-evening`, `may-2026`)

2. **Hand those signals to Claude** via `callLlmJson` in `src/lib/llm.server.ts` (already wired, uses `EMERGENT_LLM_KEY`) with the `PALACE_BRAND_VOICE` system prompt. Claude returns a `HomepageLayout` JSON with curatorial copy for every block — real handles only, USD, no fabricated reviews.

3. **Compose a fixed block order** so the page feels intentional:
   - `hero` — AI-written eyebrow + headline + sub, image picked by Claude from an editorial-library shortlist we provide
   - `product_rail` — "This week, women are reaching for…"
   - `editorial_banner` — links to whichever editorial story is most thematically aligned this cycle, with 3–4 shoppable hotspots
   - `product_rail` — "This week, men are reaching for…"
   - `product_rail` — Trending brands strip (one product per top brand)

4. **Validate against `homepageLayoutSchema`** before insert. Any LLM failure → fall back to today's cold-start layout so the cron never errors.

## 3. Generate the next edition as a preview

After the generator change, hit the cron with `?preview=true`. That writes a **pending, inactive** row to `homepage_daily_layout` — the live homepage is untouched. You can open `/admin/homepage-curation` and see the fully composed edition before promoting it.

## Technical notes

- All LLM work runs inside the existing cron route — no new endpoints, no new secrets.
- `EMERGENT_LLM_KEY` is already in env; Claude Sonnet 4.5 is the default model.
- The cron guardrail (extend viral editions, skip if <48h elapsed) stays as-is.
- No Shopify writes, no inventory mutations, no admin UI changes.
- No changes to cart, checkout, or the protected stores (per memory constraints).
