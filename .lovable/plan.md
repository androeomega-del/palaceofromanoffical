# SEO + CRO Implementation Plan

Ordered highest → lowest ROI. Each batch is self-contained and staged per the staged-launch rule (assets, copy, SEO, links ready together; nav exposed only after the full batch lands).

Backlink outreach and email-sequence content are deliverables you execute outside the codebase — flagged below but not coded.

---

## Batch 1 — On-PDP trust + CRO (highest ROI, ships first)
Touches every product page immediately; lifts conversion on existing traffic.

1. **Trust strip on every PDP** above the fold:
   "100% Authentic · Official BrandsGateway Partner · Ships from Europe · 14-Day Returns"
   - New component `src/components/product/TrustStrip.tsx`, inserted into the PDP route.
2. **Sticky Add-to-Cart bar** (mobile + desktop) appearing after the main ATC scrolls out of view.
   - New component `src/components/product/StickyAtcBar.tsx` using IntersectionObserver.
3. **Inline size/fit guidance** — collapsible accordion under variant picker, content sourced from product type (shoes / RTW / accessories).
   - New component `src/components/product/SizeFitGuide.tsx` with a small `size-guides.ts` map.
4. **Editorial PDP copy block** — "The Piece" short paragraph + Maison heritage line above specs.
   - New component `src/components/product/EditorialPiece.tsx`; sources existing maison data.

Checkout protocol is locked per memory — none of cart-store, cart-drawer, use-cart-sync, formatCheckoutUrl, or Zustand shape will be touched.

## Batch 2 — Category landing pages (high SEO ROI)
Real, indexable landing pages targeting the achievable long-tail keywords identified in the Semrush pass.

Routes to create (each with H1 = exact-match, 300+ words curatorial copy, FAQ schema, filtered product grid):
- `/collections/italian-leather-wallets` → "Italian Leather Wallets"
- `/collections/italian-leather-loafers` → "Italian Leather Loafers"
- `/collections/designer-mens-shirts` → "Designer Men's Shirts"
- `/collections/italian-leather-handbags` → "Italian Leather Handbags"

Each route file:
- `head()` with title, description, og:*, canonical, FAQPage + BreadcrumbList JSON-LD.
- Filters existing Shopify products by tag/type/vendor (no fake products per memory).
- Internal links to 2–3 related journal articles (Batch 3).

Sitemap entries appended to `src/routes/sitemap[.]xml.ts`.

## Batch 3 — Journal craftsmanship cluster (compounding SEO ROI)
Long-tail authority content, internally linked to Batch 2 landing pages.

Three new articles in the Journal blog (real copy, Palace of Roman voice, no Lorem):
1. "How to Spot Real Italian Leather — A Buyer's Guide"
2. "Made in Italy vs Designed in Italy — What the Label Really Means"
3. "Caring for Fine Leather — A Maison-Level Guide"

Each article links to relevant Batch 2 landing pages with descriptive anchor text. Articles published via the Shopify blog admin API (same path used for the Versace News article).

## Batch 4 — Schema + internal-linking polish (technical SEO)
- Verify/extend Product, Brand, Offer JSON-LD on every PDP route file.
- Add BreadcrumbList JSON-LD to PDP + collection routes.
- Add "Related Reading" rail on PDP routes linking 2 journal articles per maison.
- Tighten internal anchor text across journal → collection → PDP.

## Batch 5 — Abandoned cart recovery (CRO, requires infra)
Email infrastructure setup, then 3-email sequence.

1. Set up Lovable Emails infrastructure (`setup_email_infra`, scaffold transactional templates).
2. Build cart-abandonment trigger:
   - Capture email on cart drawer if not yet captured (lightweight, no friction).
   - Persist abandoned cart snapshot in a new `abandoned_carts` Supabase table with RLS.
   - pg_cron job enqueues recovery emails at +1h, +24h, +72h.
3. Three React Email templates per the playbook:
   - +1h: "Your selection is reserved" — image, item, secure-checkout link, no discount.
   - +24h: Concierge — "Questions about sizing or the piece?", soft, human.
   - +72h: Craftsmanship paragraph + complimentary shipping (never a % discount, per luxury positioning).
4. One-click cart restore link → existing cart drawer rehydration.

## Batch 6 — Exit-intent + retention micro-CRO (lowest-ROI, optional)
- Exit-intent overlay on `/cart`: "Save your bag" → email capture (NOT a coupon).
- Web Push opt-in after first PDP view, surfacing "Reserved item" + "Back in stock" nudges (browser-native Push API + service worker).

---

## Out of scope (you action, not codeable)
- Backlink outreach to Tatler / Lyst / menswear blogs.
- Pitching the BrandsGateway authorised-reseller story to press.
- Getting Palace of Roman into the Reddit r/handbags style threads organically.

---

## Technical notes (for the build batches)
- All new routes use TanStack `createFileRoute` with full `head()`, canonical only on leaves.
- All JSON-LD inline via the `scripts` array.
- Sitemap auto-extends per new route.
- No changes to `cart-store.ts`, `cart-drawer.tsx`, `use-cart-sync.ts`, `formatCheckoutUrl`, or the Zustand shape (checkout protocol lockdown).
- USD-only display preserved via existing `priceMoney()` boundary.
- No BG import scripts touched.
- New journal articles published via the existing Shopify Admin API path (`SHOPIFY_ACCESS_TOKEN`).
- Batches 2 and 3 ship behind-the-scenes first; nav links added only after content + schema + sitemap are live (staged-launch rule).

---

## Proposed shipping order

| Order | Batch | Why this position |
|---|---|---|
| 1 | Batch 1 (PDP trust + CRO) | Lifts conversion on today's traffic; no infra |
| 2 | Batch 2 (Landing pages) | New indexable surface area; immediate SEO compounding |
| 3 | Batch 3 (Journal cluster) | Authority + internal links to Batch 2 |
| 4 | Batch 4 (Schema polish) | Compounds Batches 2+3 |
| 5 | Batch 5 (Abandoned cart) | Highest infra cost; recovers lost revenue from prior batches |
| 6 | Batch 6 (Exit-intent + push) | Smallest delta; ship last |

---

**Approve to start with Batch 1**, or tell me to reorder / drop batches before I begin.
