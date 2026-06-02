## Goal

Stop traffic from landing on `checkout.palaceofromanofficial.com` instead of the storefront, and recover the lost views to the apex `palaceofromanofficial.com`.

Two surfaces need fixing:
- **A. Shopify admin** (you click — I can't reach it; I'll give exact paths)
- **B. Code/SEO signals on the storefront** (I do — small, surgical diffs)

## A. Shopify admin — settings to fix (you click)

Do these in order. Each is one screen.

1. **Settings → Domains**
   - `palaceofromanofficial.com` = **Primary domain** ✅
   - `palaceofroman.com` and `www.palaceofromanofficial.com` (if present) = set to **Redirect to primary**
   - `checkout.palaceofromanofficial.com` = leave as the checkout subdomain only; do **not** mark it as a storefront domain.

2. **Settings → Checkout → Checkout domain**
   - Confirm "Checkout domain" is `checkout.palaceofromanofficial.com`. Don't change it.

3. **Online Store → Preferences**
   - Scroll to "Password protection" — confirm **off** for the storefront (so checkout works without password).
   - Scroll to "Search engine listing preview" — confirm the storefront has title + description (this is for the Shopify-served pages; harmless even though our storefront is Lovable).

4. **Online Store → Navigation → URL redirects** — add these 5 redirects so any traffic landing on the checkout host gets bounced to the storefront:
   | From (on `checkout.palaceofromanofficial.com`) | To |
   |---|---|
   | `/` | `https://palaceofromanofficial.com/` |
   | `/products/*` | `https://palaceofromanofficial.com/products/*` |
   | `/collections/*` | `https://palaceofromanofficial.com/collections/*` |
   | `/pages/*` | `https://palaceofromanofficial.com/pages/*` |
   | `/blogs/*` | `https://palaceofromanofficial.com/blogs/*` |
   
   Shopify keeps `/checkouts/*`, `/cart`, `/account`, `/policies/*`, `/cdn/*` on the checkout host automatically — don't redirect those.

5. **Google Search Console**
   - If `checkout.palaceofromanofficial.com` is verified as its own property, open it → **Indexing → Removals → New request → Temporary removal** → `https://checkout.palaceofromanofficial.com/` with "Remove all URLs with this prefix".
   - Then **delete the property** so Google stops treating it as a separate site.
   - On the apex property, submit `https://palaceofromanofficial.com/sitemap.xml` under **Sitemaps**.

## B. Code/SEO — what I'll change (one focused pass)

All edits are small and stay inside the checkout-protocol lockdown (no cart, mutation, or `formatCheckoutUrl` behavior changes).

1. **`public/robots.txt`** — confirm it allows crawling of the apex and references the sitemap. Add a one-line `Sitemap:` directive if missing.
2. **`public/llms.txt`** — confirm every URL is on the canonical apex (no `checkout.*`, no `palaceofroman.com`).
3. **Spot-audit canonicals** on these route files (read-only first, edit only on mismatch):
   - `src/routes/index.tsx`
   - `src/routes/__root.tsx` (must NOT carry a `<link rel="canonical">`)
   - `src/routes/product.$handle.tsx`
   - `src/routes/brand.$vendor.tsx`
   - `src/routes/collections.$handle.tsx`
   - `src/routes/faq.tsx`
   
   Every leaf `head()` must return `canonical` and `og:url` on `https://palaceofromanofficial.com/...`. Fix any that drift.
4. **Sitemap** — confirm `src/lib/sitemap-xml.ts` (and the route that serves it) uses `https://palaceofromanofficial.com` as the only base URL.
5. **One-line safety** in `src/stores/cart-store.ts`: add `www.palaceofromanofficial.com` to the existing host-rewrite allow-list inside `formatCheckoutUrl`. No other change to that file.
6. **Mark related SEO findings fixed** in the SEO panel after the canonical/robots audit passes.

## Out of scope (will NOT touch)
- Cart store mutations, Zustand shape, `cart-drawer`, `use-cart-sync`, or the rewrite logic of `formatCheckoutUrl` beyond the single allow-list addition.
- Routing cart to Amazon or any non-Shopify checkout.
- Shopify products, inventory, fulfillment locations, or any BG importer.
- Custom-domain changes in Lovable settings (apex stays on Lovable, checkout stays on Shopify — no DNS edits).

## Verification after changes
- Visit `https://checkout.palaceofromanofficial.com/` in an incognito tab → should 301 to `https://palaceofromanofficial.com/`.
- Visit `https://checkout.palaceofromanofficial.com/products/some-handle` → should 301 to the apex product page.
- Add to cart on apex → checkout button still opens `https://checkout.palaceofromanofficial.com/checkouts/...?channel=online_store`.
- Re-run the SEO scan from the SEO & AI search tab; canonical/host findings should clear.

## What I need from you to start
Reply **"build it"** (or click Implement) and I'll execute section B end-to-end and report back. Section A you do yourself in Shopify admin — tell me when each step is done and I'll re-verify with a fetch.