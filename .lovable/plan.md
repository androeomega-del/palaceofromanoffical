## What changes

Replace the current product rail (which is still pulling the `low-stock` collection) with a horizontal rail of **brand hero tiles** — large image + brand name — each linking to `/brand/$vendor`. No copy heading, the images do the talking, matching the "let the images talk" direction.

## The rail

In `src/components/farfetch-edition-body.tsx`, swap `NewInRail`'s Shopify query + `ProductCard` grid for a static brand list rendered as image tiles. Keep the section spacing, the trailing "Shop all → /brands" link, and the snap-scroll behaviour.

Tile structure (per brand):
- Full-bleed brand hero image (existing `src/assets/brand-{slug}.jpg`)
- Brand name overlaid bottom-left in serif, on a subtle gradient scrim
- Whole tile is a `<Link to="/brand/$vendor" params={{ vendor: slug }}>`
- Same card width as the old rail (`w-[46vw] sm:w-[30vw] lg:w-[19vw] xl:w-[15vw]`), aspect `3/4`

## Brand set (8 tiles, in order)

Curated best-sellers, all already have hero assets and live `/brand/$vendor` pages:

1. Gucci — `brand-gucci.jpg`
2. Prada — `brand-prada.jpg`
3. Bottega Veneta — `brand-bottega-veneta.jpg`
4. Saint Laurent — `brand-saint-laurent.jpg`
5. Moncler — *(no dedicated hero yet — use existing Moncler imagery from `src/assets/brand/` if present, otherwise drop from list)*
6. Tom Ford — `brand-tom-ford.jpg`
7. Dolce & Gabbana — `brand-dolce-gabbana.jpg`
8. Versace — `brand-versace.jpg`

I'll verify Moncler asset availability in `src/assets/brand/` during implementation; if missing, the rail ships with the 7 confirmed brands rather than fabricating an asset.

## Out of scope

- No new Shopify queries, no changes to cart/checkout.
- No changes to the six category tiles above, the trending sections, or any `/brand/$vendor` page.
- No new copy block above the rail — images and brand names only.
