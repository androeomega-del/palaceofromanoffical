## Fix duplicates + unique images on /collections

### Problem
Shopify returns paired handles for the same category (`women-clothing` **and** `womens-clothing`, `men-shoes` **and** `mens-shoes`, etc.). My current allowlist accepts both, so each appears twice on the page. Several entries also share the same image asset (e.g. `women` and `womens-clothing` both resolve to `womensClothing.jpg`).

### Fix — two surgical edits, no new images required for the dedupe itself

**Edit 1 — `src/routes/collections.index.tsx`**
Replace the allowlist + `isMainCollection` with a canonical-handle approach so each category appears exactly once.

- Add a `CANONICAL_HANDLE` map that collapses Shopify's pairs:
  - `women-clothing` → `womens-clothing`
  - `women-shoes` → `womens-shoes`
  - `women-bags` → `womens-bags`
  - `women-accessories` → `womens-accessories`
  - `men-clothing` → `mens-clothing`
  - `men-shoes` → `mens-shoes`
  - `men-bags` → `mens-bags-wallets`
  - `men-accessories` → `mens-accessories`
- Build the displayed list by: filter via allowlist → map to canonical handle → dedupe by canonical handle (first occurrence wins).
- Final unique main list (33 entries, no repeats):
  `new-arrivals, women, men, unisex, womens-clothing, womens-shoes, women-bags, women-accessories, mens-clothing, mens-shoes, men-bags, men-accessories, accessories, bags, clothing, shoes, handbags, backpacks, clutch-bags, crossbody-bags, shoulder-bags, tote-bags, boots, loafers, hats, gloves, watches, shirts, skirts, suits, swimwear, sleepwear, other-accessories`

**Edit 2 — `src/lib/collection-image.ts`**
Re-point bare/entry handles so no two displayed collections share an image. Only the 6 highlighted rows below change; everything else keeps its current dedicated asset.

| Handle | Current image | New image |
|---|---|---|
| `women` | `womensClothing` (dup) | **generate** `women.jpg` — editorial full-length female portrait, no garment focus |
| `men` | `mensClothing` (dup) | **generate** `men.jpg` — editorial full-length male portrait |
| `unisex` | fallback | **generate** `unisex.jpg` — gender-neutral pair, minimal |
| `clothing` | `womensClothing` (dup) | **generate** `clothing.jpg` — garment rack, mixed pieces |
| `shoes` | `womensShoes` (dup) | **generate** `shoes.jpg` — lineup of mixed footwear |
| `bags` | `womensBags` (dup) | **generate** `bags.jpg` — lineup of mixed handbags |
| `accessories` | `womensAccessories` (dup) | **generate** `accessories.jpg` — flatlay sunglasses/jewelry/belt |
| `gloves` | `womensAccessories` (dup) | **generate** `gloves.jpg` — leather gloves close-up |
| `shirts` | `womensTops` (dup) | **generate** `shirts.jpg` — folded/hung shirts |
| `sleepwear` | `womensUnderwear` (dup) | **generate** `sleepwear.jpg` — silk pyjama editorial |
| `other-accessories` | fallback | **generate** `other-accessories.jpg` — small leather goods, cufflinks |
| `women-bags` (via canonical) | currently fallback | **generate** `women-bags.jpg` — woman carrying handbag, editorial |

12 new images generated into `src/assets/collections/auto/`, all matching the Palace of Roman editorial style (muted, warm, film-grain, single subject), then wired into `BY_HANDLE`.

### Verification (after implementation)
- `data-testid="collection-card"` count = 33 unique handles
- Iterate displayed cards and assert no two share the same `img.src` (manual check via preview)
- No `women-clothing`, `men-shoes`, `men-clothing`, `women-shoes` cards in DOM

### Out of scope
- No changes to product pages, /collections/[handle], or any business logic
- Brand collections (Gucci, Prada, etc.) — still excluded from the index by design