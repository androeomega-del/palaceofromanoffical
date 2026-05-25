
## Goal
Rebuild the homepage as an immersive, edition-driven lookbook with the visual register of **Burberry.com** (architectural restraint, full-bleed editorial, generous negative space, serif/sans pairing, slow choreographed motion) and **Gucci.com** (cinematic hero takeovers, oversized typography, rich color blocking, playful but couture rhythm).

The Lookbook is the spine. Your kept hardcoded surfaces (Trending This Week, Curated For You, Find Your Edit, Style Quiz CTA, Featured Houses) are interleaved as bands inside it and inherit each Edition's palette + type.

## Aesthetic anchors (Burberry × Gucci)
- **Hero**: full-bleed, edge-to-edge cover. Slow Ken-Burns parallax. Edition number set in oversized serif (Gucci-scale display type) over the image. Single thin-stroke "Discover" / "Shop the edition" CTA bottom-left (Burberry calm).
- **Edition Switcher**: minimal pill, top-right of hero. Roman numerals or "I / II". Crossfades the entire page on switch (Burberry-style page-level transitions).
- **Lookbook masonry**: full-width columns, no card chrome, no rounded corners, no shadows. Image gutters tight. Each tile breathes — generous vertical rhythm between rows.
- **Hotspots**: minimal hairline dot (Burberry's "Shop the look" hotspot pattern). On hover/tap, a thin line draws to a small product card overlay with name + price in restrained sans. Click → Quick View.
- **Quick View**: not glass-morphism — that reads tech, not couture. Instead, a clean off-white side sheet (Burberry product modal). Image carousel left, options right, single full-width "Add to bag" button.
- **Typography**: serif display (existing `cormorant-karla` pair is on-brief) for edition titles + headlines; sans for body, prices, labels. Switching Editions can swap the type pair.
- **Color**: each edition owns a 3-token palette (`--edition-bg`, `--edition-fg`, `--edition-accent`). Crossfade on switch via CSS variables on `<html>`.
- **Motion**: Framer Motion. Reveal images with slow fade + 24px upward slide as they enter viewport (300–500ms, ease-out). No bouncy springs. Edition crossfade: 400ms.

## Homepage composition (top → bottom)
```
[Header + trust strip]
[EDITION HERO]             ← full-bleed cover, oversized roman numeral, parallax
                             EDITION SWITCHER pill top-right
[EDITION INTRO]            ← serif title, dek, "Shop the edition" CTA
[Trending This Week]       ← kept
[LOOKBOOK MASONRY pt.1]    ← shoppable hotspots, blur-up + lazy
[Style Quiz CTA]           ← kept, restyled to active edition
[Curated For You]          ← kept
[EDITION EDITORIAL BAND]   ← second narrative slot from the edition (image + pull quote)
[Find Your Edit]           ← kept
[LOOKBOOK MASONRY pt.2]    ← second row, different rhythm
[Featured Houses]          ← kept
[Footer]
```

## Archived from current homepage (unlinked, files preserved)
Shoreline Perspective · Bikinis & Swimwear bento · D&G "Water's Edge" banner · Versace In Stock Now · The Men's Edit rail · Accessories block · duplicate New Arrivals carousel · current additive `EditorsEdition` band.

## Edition System
- Context `EditionProvider` exposes `{ editions[], active, setActive }`.
- Discovery: `fetchCollections()` → take the 2 most recently updated editorial collections (tag `editorial` or handle pattern `editorial-*` / `edition-*` / existing `resort-2026`, `may-2026`, `the-new-evening`).
- Each Edition: `{ number, title, description, cover, palette, typePair, products, lookbook[] }`.
- Switching writes to `localStorage`, sets `<html data-edition>`, triggers `AnimatePresence` crossfade.

## Lookbook + Hotspots (Supabase-backed, admin-managed)
New tables:
- `lookbook_images` — edition_handle, image_url, blur_data_url, width, height, sort_order, alt_text.
- `lookbook_hotspots` — lookbook_image_id (FK), x (0–1), y (0–1), product_handle, variant_gid?, label.

RLS: public read (anon/auth), admin write (`has_role 'admin'`).

Admin route `/admin/lookbook`: upload to existing `collection-images` bucket → drag-to-place hotspots → product picker via Shopify search. Drag uses framer-motion. No fabricated data — if an edition has zero lookbook rows, the masonry uses real product images from that collection with auto-placed center hotspots, never placeholders.

## Quick View
- Reuses shadcn `Sheet`. Burberry-style off-white panel, not glass.
- Embla carousel (already installed) for images.
- Variant selectors from `product.options`; price updates per variant.
- "Add to bag" → existing `useCartStore.addItem`. No changes to cart store.

## Cart drawer / checkout
**Untouched.** `cart-store.ts`, `cart-drawer.tsx`, `use-cart-sync.ts`, `formatCheckoutUrl`, all cart mutations — byte-for-byte identical. (Checkout-protocol lockdown.)

## Performance
- All lookbook `<img>`: `loading="lazy"`, `decoding="async"`, explicit width/height (no CLS), base64 blur placeholder (~200 B/image, stored at upload).
- Hero LCP preloaded via route `head().links`.
- Masonry uses CSS `columns` — zero JS layout cost.
- Editions fetched via TanStack Query, `staleTime: 5min`; prefetch on switcher hover.
- Framer Motion limited to crossfade root + hotspot tooltips; no layout animations.

## SEO
- Route `head()` reflects active edition title + description; `og:image` = edition cover.
- One H1 per render (edition title). Existing site-wide schema unchanged.

## Files (additive only; kept files modified surgically)
- `src/contexts/edition-context.tsx`
- `src/lib/editions.ts`
- `src/components/lookbook/edition-hero.tsx`
- `src/components/lookbook/edition-switcher.tsx`
- `src/components/lookbook/lookbook-masonry.tsx`
- `src/components/lookbook/hotspot.tsx`
- `src/components/lookbook/quick-view-sheet.tsx`
- `src/routes/admin.lookbook.tsx`
- `src/routes/index.tsx` — recomposed; archived sections kept in comments for rollback
- `src/styles.css` — add edition CSS variable hooks

## Ship order (one batch, staged launch)
1. DB migration (tables + RLS + indexes).
2. Edition discovery + provider + palette/type maps.
3. Lookbook components + Quick View.
4. Admin editor at `/admin/lookbook`.
5. Recompose `src/routes/index.tsx`.
6. SEO updates.
7. Verify: build clean, no console errors, hotspot → quick view → add to bag → cart drawer → checkout URL has `channel=online_store`.

Nav untouched. Nothing exposed until the full batch is in.

## I need from you to start
1. **Approve this plan.**
2. **Editions for first ship** — auto-pick latest 2 editorial collections (default), or name 2 specific handles? Candidates I can see: `resort-2026`, `may-2026`, `the-new-evening`.
3. **Approve the migration** to create `lookbook_images` + `lookbook_hotspots`.
