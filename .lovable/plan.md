Diagnosis
- The homepage rail handles are already correct: `the-riviera-edit` and `coastal-essentials` are wired in `HomeStudioLayout` and passed through `collectionRailQueryOptions(..., 8)` with manual collection ordering.
- The visible “blank rail” is not evidence of a collection mismatch. In the preview session, the client bundle failed to load/hydrate with 504 errors for React/TanStack modules and the TanStack Start client entry.
- Because hydration failed, the `ProductRail` client-side `useQuery(...)` never executed. Browser network inspection showed no Storefront fetch/XHR requests, so the front end never asked the backend/API for collection products.
- The server-rendered shell still shows the rail headings and CTA, but the product grid area remains an empty/faint loading area. That is why it looks like the backend is not mapping to the frontend.

Plan to make this robust
1. Keep the collection handles unchanged.
   - `the-riviera-edit`
   - `coastal-essentials`
   - Keep Shopify manual sort via the existing `collectionRailQueryOptions` factory.

2. Move homepage rail loading into the route loader.
   - Update `/` route loader to prefetch/ensure both homepage collection rail queries through the route `queryClient`.
   - This makes the products part of the initial route data path instead of relying only on post-hydration client fetching.

3. Render product cards from the primed query cache.
   - Leave `ProductRail` as the single visual primitive.
   - Ensure the rail can render populated products immediately when query data is already available, so the first visible homepage layout does not show blank rails.

4. Verify the actual signal.
   - Reopen `/` in preview.
   - Confirm both rail sections contain product-card links/images.
   - Confirm Storefront/API requests succeed when hydration is working, and that the rails no longer appear as blank headers + CTA only.