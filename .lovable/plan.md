
## Goal

Push the store's organic + AI-answer visibility on the surfaces that actually convert luxury intent:
**PDP (product) → Brand page → Heritage / journal → Reputation signals.**

Built on what already exists (`brand-heritage.ts`, `collection-seo.ts`, `seo.ts`, `product.$handle.tsx` Product JSON-LD, FAQ + Authentication FAQPage schema). No new pages added to nav until each phase is fully wired (staged-launch rule). Zero fabricated reviews / ratings / testimonials.

---

## Phase 1 — Product (PDP) SEO + AEO — highest revenue impact

Files: `src/routes/product.$handle.tsx`, `src/lib/product-composition.ts`, new `src/lib/pdp-faq.ts`, new `src/components/pdp-faq.tsx`.

1. **Rewrite the PDP title + description template** (`seo.ts` helpers stay; template changes only).
   - Title: `{Product} — {Vendor} | Authentic at Palace of Roman`
   - Meta: `Shop authentic {Vendor} {Product} at Palace of Roman. {Category} in {Material/Color}. Worldwide shipping, 90-day authenticity guarantee.` — fall back to Shopify body when richer.
2. **Enrich Product JSON-LD** in the existing `head()`:
   - Add `material`, `color`, `gtin`/`mpn` when present on variant, `category` (Google Product Taxonomy mapped from collection bucket), `audience` (Men/Women from tags), `countryOfOrigin` (Italy default via `shipping-origin.ts`), `aggregateRating` **omitted entirely** unless real reviews exist (per memory).
   - Add `hasMerchantReturnPolicy` + `shippingDetails` referencing `/shipping-returns`.
3. **Per-PDP FAQPage JSON-LD + visible accordion** ("On this piece"):
   - 4 Q&As generated from product data: *"Is this {Product} authentic?"*, *"Where does it ship from?"*, *"What's the return window?"*, *"How does {Vendor} sizing run?"* (sizing copy keyed off category bucket).
   - Visible accordion uses existing `Accordion` primitive — answers double as AEO content + on-page text.
4. **Speakable spec** on the PDP description + FAQ block (CSS selectors `.pdp-aeo-summary`, `.pdp-faq`).
5. **Internal-link rail (already partly built — `PdpJournalLinks`)**: extend mapping so every category surfaces 2 relevant `/journal/...` heritage articles + the matching `/collections/...` PLP.

---

## Phase 2 — Brand pages SEO + AEO

Files: `src/routes/brand.$vendor.tsx`, `src/lib/brand-heritage.ts`, new `src/lib/brand-faq.ts`.

1. **Expand `brand-heritage.ts`** signals already feeding `CollectionPage > about > Brand`:
   - Add `slogan`, `iconicMaterials`, `headquarters` to the type; populate for the top 25 maisons by traffic (Gucci, Versace, Prada, Dior, Balenciaga, Saint Laurent, Bottega Veneta, Loewe, Fendi, Valentino, Givenchy, Burberry, Off-White, Moncler, Stone Island, Brunello Cucinelli, Loro Piana, Tom Ford, Maison Margiela, Jacquemus, Ami, Acne, Isabel Marant, Marni, Etro).
   - Wire new fields into the existing `Brand` JSON-LD.
2. **Add `WebPage > mainEntity > FAQPage`** to each brand route: 4 generated Q&As ("Is {Brand} authentic at Palace of Roman?", "Where does {Brand} ship from?", "What's the return window on {Brand}?", "How does {Brand} sizing run?") using brand-specific copy from `brand-heritage`.
3. **Visible heritage block already exists** — extend with a small "Signature codes" chip strip from `signatures[]` linking to the matching `/collections/...` filter URL when one exists (sneakers, loafers, handbags, sunglasses, scarves, belts, wallets, knitwear).
4. **`/brands` index**: emit `ItemList` JSON-LD enumerating each brand with `url` + `image` so Google's Knowledge graph + AI engines can map maison → boutique.

---

## Phase 3 — Heritage / Journal authority

Files: `src/routes/journal*.tsx`, `src/components/craftsmanship-article.tsx`, new `src/lib/article-faq.ts`.

1. **Add `Article` + `FAQPage` JSON-LD** to every existing craftsmanship + style article (6 routes today). Currently only `head()` meta + breadcrumbs.
2. **`speakable` spec** on each article's intro + first H2 — these are the AEO-quotable blocks for "is italian leather…", "how to care for cashmere…", "how to spot real…".
3. **Author = Palace of Roman** (Organization, not a Person — solo-founder constraint, no fabricated bylines).
4. **Cross-link**: each article gets a "Shop the edit" rail to the matching collection + 3 PDPs (component already exists; expand mapping).

---

## Phase 4 — Reputation / E-E-A-T signals

Files: `src/routes/__root.tsx` (Organization JSON-LD already in `seo.ts`), `src/routes/authentication.tsx`, `public/llms.txt`.

1. **Enrich the sitewide Organization JSON-LD**:
   - Add `sameAs` (Instagram, TikTok, Pinterest, Yelp — only ones the founder actually controls; ask before adding).
   - Add `slogan`, `knowsAbout` (the 25 top maisons), `areaServed: Worldwide`, `paymentAccepted`, `currenciesAccepted: USD`.
2. **First-party reviews surface (already built — `ProductReviews`)**: confirm it renders "No reviews yet" copy until real submissions arrive — **do not emit `aggregateRating` until ≥3 verified reviews exist** (Shopify reviews policy + memory rule).
3. **`/authentication` page**: add `Service` JSON-LD ("90-day authenticity guarantee") + repeat speakable.
4. **`llms.txt`**: expand with the boutique-network framing + top 25 maisons + return/authenticity policy summary so ChatGPT / Perplexity / Claude can quote the store correctly.

---

## Technical notes

- All JSON-LD lives in route `head().scripts` (TanStack head). No client-side injection.
- Canonical / og:url stay on leaf routes only (dedupe caveat already respected in `seo.ts > routeHead`).
- Schema-only changes are SSR-safe and ship with the next build — no runtime cost on PDPs (we already serialise the product).
- Speakable selectors must match real DOM classes I add in the same edit batch (avoid stale CSS targets).
- Brand FAQ + PDP FAQ tables stay in `src/lib/` (no DB, no migrations needed).
- Nothing in Phase 1–4 touches checkout, cart-store, Shopify fulfillment, or BG imports (locked-down per memory).

---

## Out of scope (call out before doing)

- Generating new editorial articles, new collection landing pages, or any homepage tile changes (staged-launch rule — separate request).
- Fetching real reviews, importing third-party review widgets, or anything that fabricates social proof.
- Off-page SEO (link-building, PR outreach, Google Business Profile setup).
- Multi-currency / hreflang (USD-only per memory).

---

## Suggested execution order

If you approve, I'd ship in this order (each phase independently verifiable in the SEO panel):

1. Phase 1 — PDP (biggest revenue lift, every product page benefits)
2. Phase 2 — Brand pages (long-tail "{brand} {product}" intent)
3. Phase 4 — Org + llms.txt (low effort, sitewide AEO lift)
4. Phase 3 — Journal Article + FAQPage schema

Tell me **"ship phase N"** and I'll implement that phase only.
