## Objective
Move all headwear (hats, caps, beanies, bucket hats, visors) from the Capsule `Accessory` slot to the `Outerwear` slot so they appear alongside jackets and coats instead of bags and jewelry.

## Background
The live catalog contains 71+ hat products (bucket hats, baseball caps, beanies) sourced from Jacquemus, Moncler, Prada, Gucci, Balenciaga, Marine Serre, and Liu Jo. Their Shopify data carries terms like `Hats`, `Bucket Hats`, `Caps (Baseball Hat)`, `Beanie`, and `Visor` in productType, tags, and titles. Currently these match the `Accessory` taxonomy keyword `"Hats"`, causing them to populate the Accessory drawer and, when productType is empty, leak into the `Top` seed slot via the weak PDP classifier.

## Changes

### 1. Capsule taxonomy update (`src/components/CapsuleBuilder.tsx`)
In the `CAPSULE_TAXONOMY` constant:

- **Remove from `Accessory`:** `"Hats"`
- **Add to `Outerwear`:** `"Hats"`, `"Hat"`, `"Bucket Hats"`, `"Bucket Hat"`, `"Caps"`, `"Cap"`, `"Baseball Cap"`, `"Baseball Hat"`, `"Beanie"`, `"Beanies"`, `"Visor"`, `"Visors"`

No other taxonomy arrays are touched.

### 2. Pre-ship dry-run verification
Before committing, run the full catalog (250 products) through the updated `classifyKind` rules and output a summary showing:
- How many products now map to `Outerwear` (expected: ~71 headwear items)
- Confirm zero headwear items still map to `Accessory`
- Confirm zero headwear items fall back to `Top`

If the dry-run reveals any headwear products still misclassified, the taxonomy will be tightened (e.g., adding missing singular/plural forms or brand-specific tag fragments) before shipping.

## What is NOT changing
- `TAXONOMY_PRIORITY` order (Footwear → Accessory → Outerwear → Bottom → Top) — hats simply move from Accessory keywords to Outerwear keywords.
- Outerwear sub-taxonomy (`OUTERWEAR_SUBTAXONOMY`) — hats will appear in the general Outerwear picker without a dedicated sub-filter.
- Picker filtering logic, cart store, drawer, checkout, or PDP seed slot wiring.
- Any non-headwear Accessory keywords (bags, belts, jewelry, scarves, etc.) remain in Accessory.

## Files touched
- `src/components/CapsuleBuilder.tsx` only.

## Risks & mitigation
| Risk | Mitigation |
|------|------------|
| False positives (e.g. `"Cap"` matching inside unrelated words) | All taxonomy matching uses `\b...\b` word-boundary regex; standalone `"Cap"` will not match inside `"Capacity"` or `"Escape"`. |
| Headwear products with empty tags/title still fall back to `Top` | The PDP `classifyKind` (strong classifier, 4-signal) will catch them via handle/title; the dry-run will expose any stragglers. |