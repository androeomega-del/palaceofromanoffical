## Goal

Stop the production homepage from throwing React **#418** by making the first client render match the server-rendered text exactly.

## Likely cause

`DeliverToButton` is already guarded correctly, so the remaining strongest suspect is the **reduced-motion toggle**:

- `useReducedMotion()` creates a module-level snapshot with `window/localStorage/matchMedia` logic.
- On the server it resolves to `system / full motion`.
- On the client’s first render it can resolve to a saved preference or OS reduced-motion value.
- That changes text attributes like `aria-label="Motion preferences (currently full/reduced)"` and may change the rendered icon state during hydration.

Secondary low-risk hardening: portal / overlay components should not render during SSR unless open, because their internals can differ between server and client.

## Implementation plan

1. **Fix reduced-motion initial snapshot**
   - Update `src/hooks/use-reduced-motion.ts` so the `useSyncExternalStore` server snapshot and the client’s first hydration snapshot are the same stable value: `{ pref: "system", reduced: false }`.
   - After mount/subscription, refresh from `localStorage` and `matchMedia` and emit the real client preference.
   - This keeps first paint deterministic while preserving user motion preferences immediately after hydration.

2. **Make `ReducedMotionToggle` hydration-neutral**
   - Keep the initial button label and icon deterministic until mounted.
   - After mount, show the real `full/reduced` state.
   - No visual design changes.

3. **Harden root-level client-only utilities**
   - Wrap `<Toaster />` in the existing client-only pattern in `src/routes/__root.tsx`.
   - Leave SEO/content-rendered page sections server-rendered.

4. **Improve production hydration diagnostics**
   - Extend `src/lib/hydration-monitor.ts` to also listen for `window.error` and `window.unhandledrejection` React minified hydration errors, not only `console.error` warnings.
   - Store them in `window.__hydrationMismatches` and log a `[hydration-mismatch]` breadcrumb with path and stack tail.

5. **Verify**
   - Use the preview console signal after reload to confirm the `#418` no longer appears.
   - If the diagnostic points to a different component, apply a targeted follow-up fix instead of broad client-only wrapping.

## Files to edit

- `src/hooks/use-reduced-motion.ts`
- `src/components/reduced-motion-toggle.tsx`
- `src/routes/__root.tsx`
- `src/lib/hydration-monitor.ts`

No database, Shopify, checkout, route tree, or product data changes.