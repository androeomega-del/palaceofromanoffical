# Phase 2a — Full Obsidian Re-Skin of PDP

Apply the obsidian palette (`#0A0A0A` / `#121212` / `#1A1A1A` / `#F9F6F0` / `#E5DDCB` / `#A39E93`) and editorial typography (serif title, wide-tracked sans micro-labels) across the live PDP and every sub-component it mounts. **Zero logic, state, SEO, JSON-LD, loader, ATC, or cart-store changes** — className overrides only.

## Files Touched (12)

**Route file**
1. `src/routes/product.$handle.tsx` — outer wrapper, breadcrumbs, vendor/title block, price, size tiles, quantity stepper, ATC button, accordion wrapper, gallery surface.

**Sub-components mounted on the PDP**
2. `src/components/pdp-authenticity-strip.tsx`
3. `src/components/pdp-brand-heritage.tsx`
4. `src/components/pdp-delivery-badge.tsx`
5. `src/components/pdp-shipping-sheet.tsx`
6. `src/components/pdp-journal-links.tsx`
7. `src/components/pdp-faq.tsx`
8. `src/components/product-reviews.tsx`
9. `src/components/recently-viewed-rail.tsx`
10. `src/components/product/size-fit-guide.tsx`
11. `src/components/product/image-lightbox.tsx`
12. `src/components/yelp-trust-badge.tsx` (only if it has light backgrounds — verify first)

## Token Mapping (applied consistently across all 12 files)

| Surface | Class |
|---|---|
| Page canvas | `bg-[#0A0A0A] text-[#F9F6F0]` |
| Card / panel surface | `bg-[#121212] border-[#1A1A1A]` |
| Divider / hairline | `border-[#1A1A1A]` |
| Hero/serif heading | `font-serif font-light tracking-wide text-[#F9F6F0]` |
| Body copy | `text-[#A39E93]` |
| Highlighted accent | `text-[#E5DDCB]` |
| Micro-label | `font-sans text-[10px] tracking-[0.35em] uppercase text-[#A39E93]` |
| Primary CTA | `bg-[#F9F6F0] text-[#0A0A0A] hover:bg-[#E5DDCB]` |
| Selected tile | `border-[#E5DDCB] bg-[#121212] text-[#E5DDCB]` |
| Disabled / OOS | `border-[#1A1A1A] bg-[#0A0A0A] text-[#2A2A2A] line-through` |

## Out of Scope (untouched)

- `ProductCard`, `AIRecommendations` — used on PDP but rendered identically in collections/home; re-skinning them changes the whole site. Defer to a separate global pass.
- `Accordion` primitive in `src/components/ui/accordion.tsx` — shadcn primitive used app-wide; we override at the wrapper className level instead.
- All loader code, hooks, intersection observers, error timers, JSON-LD, head() meta, ATC handler, variant state, cart-store calls.
- Components NOT mounted on the PDP.

## Approach

1. Read each file fully before editing.
2. Surgical className swaps only — no JSX structure changes.
3. Per memory `mem://preferences/working-mode`: smallest diff per file, verify after.
4. **Note re design tokens**: per project memory we normally avoid hardcoded hex. This phase intentionally uses inline `bg-[#…]` because the obsidian palette is a PDP-scoped experiment; if approved, Phase 2c will promote these to semantic tokens in `src/styles.css`.

## Verification

After all 12 edits: open `/product/<handle>` in the preview, confirm:
- No light cream/white seams between sections
- Variant selection still toggles
- ATC still adds to cart drawer
- Accordions still expand
- No console errors

Awaiting your go-ahead to execute.
