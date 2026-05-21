# Add "The Jewelry Edit" beside Accessories

## What

Add a new bento tile titled **The Jewelry Edit** immediately to the right of the existing Accessories tile on the homepage. Visually match Accessories so the two narrow tiles bookend the row and the grid stays balanced on a 12-column layout.

## Where

`src/routes/index.tsx` — the bento `<section>` that ends with the Accessories `<Link>` (around lines 1084–1108) and its skeleton mirror `SummerBentoSkeleton` (lines 1120–1140).

## Layout math (lg breakpoint, 12 cols)

Current row containing Women / Men / Accessories:

```text
Women(4)  Men(5)  Accessories(2)  = 11   (1 col gap)
```

After change:

```text
Women(4)  Men(4)  Accessories(2)  Jewelry(2)  = 12
```

- Women: `lg:col-span-4` (unchanged)
- Men's Edit: `lg:col-span-5` → `lg:col-span-4` (one-col trim)
- Accessories: `lg:col-span-2` (unchanged)
- **Jewelry (new): `lg:col-span-2 row-span-2`**

Mobile/tablet: mirror the Accessories breakpoint pattern — `col-span-6 md:col-span-4 lg:col-span-2` — so the two narrow tiles sit side-by-side on tablet and stack cleanly on mobile.

## New tile spec

- **Link target:** `to="/shop"` with `search={{ q: "tag:Jewelry", title: "Jewelry" }}` (same convention as Accessories).
- **Image source:** reuse an existing editorial asset from `src/assets/editorial/library/` (no new asset import, no fabricated content). Pick a jewelry-appropriate frame from `editorial-library.ts`; if none reads as jewelry, fall back to a neutral luxury still and pass it in via the same `accessoriesImage`-style prop wiring (add a sibling `jewelryImage?: ShopifyImg` prop). I'll confirm the chosen image filename before writing.
- **Copy (final, on-brand — no placeholder):**
  - eyebrow: `Shop`
  - title: `Jewelry`
- **Styling:** copy the Accessories tile classes verbatim (gradient, hover scale, centered bottom label) so the two read as a matched pair.

## Skeleton

Add a matching `<div className="col-span-6 md:col-span-4 lg:col-span-2 row-span-2 bg-canvas-raised animate-pulse" />` to `SummerBentoSkeleton` and trim the Men skeleton from `lg:col-span-5` to `lg:col-span-4` so the placeholder matches the new live layout (no CLS regression).

## Out of scope

- No new Shopify products, no BG re-imports.
- No new image generation in this pass — reuse existing editorial library asset. If you'd rather a freshly generated jewelry hero, say so and I'll add one step (premium imagegen, ~1200×1600).
- Header/nav, other sections untouched.

## Verification

After the edit: visual check at the current 1276px viewport that the row reads Women | Men | Accessories | Jewelry with equal heights and no overflow, plus a quick mobile-width check that the narrow pair stacks correctly.
