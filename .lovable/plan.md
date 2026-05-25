# Full pass: PDP validation UX, PLP quick-add polish, cart badge refresh

Goal: apply the prompt's UX rules to the existing Palace of Roman store without rewriting from scratch. Smallest diff that delivers the behavior. Keep the editorial aesthetic (ink / canvas / bronze, serif headings, restrained motion) — no generic e-comm look. Respect the checkout protocol lockdown: no edits to `cart-store`, `cart-drawer`, `use-cart-sync`, `formatCheckoutUrl`, or any cart mutations.

## 1. PDP — never-disabled Add to Bag + size-required validation
File: `src/routes/product.$handle.tsx` (+ `VariantOption` in the same file)

Current behavior: `firstAvailable` variant is pre-selected, so the size error never fires. The ATC button greys out when the variant is unavailable. Both contradict the spec.

Changes:
- **No default size selection.** Initialize `selectedVariantId` to `undefined`. Keep `firstAvailable` only as a fallback for price preview when no size is picked (so price stays visible) — but treat `selectedVariant` as `undefined` for cart purposes until the shopper actually picks one.
- **Track which option groups are required** (any option with >1 value, e.g. Size, Colour). Compute `missingOptions: string[]`.
- **Never disable the ATC button.** Remove the `disabled={isLoading || !selectedVariant?.availableForSale}` flag from both the inline ATC (line 608) and the mobile sticky ATC (line 828). The button stays fully opaque ink/bronze. The only states that should change the label are loading (spinner) and a chosen-but-sold-out variant ("Sold Out").
- **Validation on click:** in `handleAdd`, if `missingOptions.length > 0`:
  1. Set `sizeError = true` and `errorMessage = "Please select a ${name} to continue."` (uses the actual missing option name, e.g. Size).
  2. Smooth-scroll the `buyRef` into view (`block: "center"`) if not already visible.
  3. Auto-clear `sizeError` after 2.4s or when the shopper picks any value (whichever first).
  4. Do NOT toast — the inline error is the signal.
- **Error visual** on `VariantOption` (passed via new optional `invalid?: boolean` prop): when invalid, render a bronze→red treatment that fits the brand:
  - Red bottom border + red label text on the option header (currently `border-[var(--studio-rule)]`).
  - Red ring around the pill row container.
  - Above the pills, a small italic serif line in red: "Please select a {option.name} to continue." with a `shake` animation (3 quick translateX cycles, 350ms total, respects `prefers-reduced-motion`).
  - Red = an editorial muted red token, not pure `#ef4444`. Reuse the existing `oklch(0.52 0.11 25)` already used for low-stock or define `--studio-alert: oklch(0.52 0.13 25)` in `src/styles.css`.
- **Add the `shake` keyframe** to `src/styles.css` (gated by `@media (prefers-reduced-motion: no-preference)`).

## 2. PLP — desktop hover size pills + mobile quick-add bottom sheet
File: `src/components/product-card.tsx` (already imports `QuickViewSheet`)

Current behavior: hover reveals a "Quick Add" button that opens the bottom sheet for multi-variant items. The spec asks for size pills inline on hover (desktop) and the sheet on mobile. Mobile flow already matches.

Changes:
- For products with a single Size option (the common case), on desktop hover (`lg:` breakpoint, `@media (hover: hover)`), replace the "Quick Add" button with a horizontal row of size pills overlaid at the bottom of the image. Clicking a pill calls the existing `addItem` path with that variant (no detour, no sheet) and fires the existing analytics (`cart`, optional `scarcity_cart`).
- Sold-out variants render as line-through pills, not clickable.
- For products without a Size option (colour-only, etc.), keep the current "Quick Add" → `QuickViewSheet` flow.
- Mobile: keep current behavior — small bag icon in the corner opens the sheet. (Already present; verify it stays visible at <440px since user is on mobile viewport.)
- Pills must be styled in brand: `bg-canvas/90 backdrop-blur` background strip, ink text, bronze on hover/active. Not the generic black/white from the prompt.

## 3. Header — cart badge refinement
File: `src/components/site-header.tsx`

Current behavior: shows `({totalItems})` inline next to the bag icon. The spec wants a notification badge.

Changes:
- Replace the inline `(N)` with a small circular badge pinned to the top-right of the `ShoppingBag` icon — bronze background, canvas text, `min-w-[16px] h-[16px]`, `text-[9px]`, tabular-nums.
- Hide badge when `totalItems === 0` (currently always shown).
- Add a one-shot `scale-in` animation on the badge whenever `totalItems` increases (track previous via `useRef`). Respects reduced motion.
- No icon/library/structural change to `<CartDrawer />` — out of scope per checkout lockdown.

## 4. Toast position sanity check
The shopify-cart-checkout guide requires toasts NOT in the bottom-right. Sonner toaster placement lives in `src/routes/__root.tsx`. Verify; if it defaults to bottom-right, set `position="top-center"` to match the editorial feel and not collide with the new mobile sticky ATC. (No-op if already correct.)

## Out of scope (intentionally)
- No changes to `src/stores/cart-store.ts`, `src/components/cart-drawer.tsx`, `src/hooks/use-cart-sync.ts`, `formatCheckoutUrl`, or any Storefront cart mutation — per the checkout-protocol memory.
- No new pages, no nav changes, no copy launches — staged-launches rule.
- No analytics schema changes — last fix already restored `cart_events` grants.

## Verification
1. PDP for a multi-size product: button is fully opaque on load with no size chosen; clicking it shakes the size row + shows red inline error + scrolls into view; choosing a size clears the error; second click adds to bag and opens the drawer.
2. PDP for a single-variant product: button works on first click (no size required, no error).
3. PLP desktop: hover a multi-size card → size pills appear in the image footer; click S → toast + drawer + analytics row in `cart_events`.
4. PLP mobile (440px viewport): bag icon visible top-right of image; tap → bottom sheet; pick size; toast + drawer.
5. Header: badge hidden at 0; pop animation on add; correct count after add/remove.
6. `cart_events` table receives `add_to_cart` rows from both PLP pills and PDP after the size flow (confirms analytics still wired).

## Technical notes (for me)
- `VariantOption` is defined at the bottom of `product.$handle.tsx`; thread `invalid` + `errorText` via props. Lift `sizeError` state to `ProductView` and pass `invalid` only to the size option (match by `/size/i`).
- Use `requestAnimationFrame` before `scrollIntoView` so the ring/red border have painted before the scroll lands.
- Shake keyframe (CSS): `@keyframes por-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }` with `animation: por-shake 350ms ease-in-out`.
- Cart badge previous-count tracking: `const prev = useRef(totalItems); useEffect(() => { if (totalItems > prev.current) trigger(); prev.current = totalItems; }, [totalItems])`.
