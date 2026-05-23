## Goal

Bring back the progressive-disclosure trust strip arrangement on the PDP:

- "AUTHENTICITY & SECURE SHIPPING • 14-DAY RETURNS" sits flush, full-width, **directly under the Add to Bag button** with a dashed underline indicating interactivity.
- Clicking it opens the existing `PdpShippingSheet` panel (delivery-windows matrix + 14-day returns).
- The zip-code + delivery-date badge (`PdpDeliveryBadge`) stays exactly where it is — nothing about it changes.

## Changes

### 1. `src/routes/product.$handle.tsx` (around lines 596–622)

Currently `<PdpShippingSheet />` is the third child inside the `flex gap-4` row that holds the quantity stepper and Add to Bag button, so on narrow widths it wraps beside the CTA instead of sitting under it.

- Remove `<PdpShippingSheet />` from inside that flex row.
- Re-render it as its own sibling block immediately after the row's closing `</div>` (and before `<PdpDeliveryBadge … />`), so it spans the full CTA column on every viewport.
- No other JSX, props, ordering, or imports change.
- `PdpDeliveryBadge` stays at its current position — the zip code + estimated delivery date remains visible.

### 2. No changes to

- `src/components/pdp-shipping-sheet.tsx` (sheet content, trigger styling, dashed underline already correct).
- `src/components/pdp-delivery-badge.tsx` / `shipping-meta.tsx` (zip + ETA preserved).
- `src/components/pdp-authenticity-strip.tsx` (3-pillar strip further down the page).
- Cart store, checkout URL builder, Shopify mutations, routing — fully compliant with `mem://constraints/checkout-protocol`.

## Result

```text
[ − 1 + ] [  Add to Bag — $X  ]
─────────────────────────────────
 AUTHENTICITY & SECURE SHIPPING • 14-DAY RETURNS   ← clickable, dashed
 Ships from Italy · Get it by Dec 2 – Dec 5        ← zip + ETA (unchanged)
```

Clicking the trust strip opens the side/bottom sheet with the full delivery-windows matrix and returns terms — exactly the progressive-disclosure pattern you described.
