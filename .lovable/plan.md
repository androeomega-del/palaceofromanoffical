## Goal
Make checkout harder to break by separating two issues:

1. **Checkout flow** — keep Shopify Storefront API cart checkout exactly as the purchasing path.
2. **Lost views / indexed checkout domain** — fix through domain, redirect, and SEO recovery settings, not by rewriting checkout logic.

## What I found
- Checkout is already using the correct flow: Shopify cart mutations create/update a cart, then the app opens Shopify’s `checkoutUrl` in a new tab.
- The fragile part is the domain rewrite inside `formatCheckoutUrl()` and any future edits around cart state, checkout opening, abandoned-cart checkout links, or buy-now behavior.
- The traffic loss is still primarily a domain/indexing problem: `checkout.palaceofromanofficial.com` must not serve storefront-like traffic on `/`, `/products/*`, `/collections/*`, etc.

## Implementation plan

### 1. Add a checkout-protection guardrail in code comments
- Add a short, explicit “do not edit unless intentionally testing checkout” warning around the checkout URL formatting function.
- Keep the actual checkout flow unchanged.
- Preserve Storefront API cart creation, cart line updates, persisted cart state, and `window.open(url, "_blank")` behavior.

### 2. Make checkout URL formatting safer without changing the flow
- Keep `channel=online_store` always enforced.
- Keep branded checkout domain only for known legacy storefront hosts.
- Avoid expanding rewrite behavior beyond the approved host list.
- Do not touch product inventory, fulfillment, cart mutations, or Shopify locations.

### 3. Add a lightweight checkout health check route or utility only if safe
- Create a non-invasive diagnostic endpoint/page that reports whether the generated checkout URL host is expected.
- It will not create orders, modify products, or change cart state.
- This gives us a stable way to verify checkout after future edits.

### 4. Domain recovery checklist outside code
You’ll need to do these in Shopify/admin/DNS because code cannot force Shopify’s checkout subdomain to stop serving indexed paths:
- Primary storefront domain: `palaceofromanofficial.com`
- Checkout domain: `checkout.palaceofromanofficial.com`
- Redirect non-checkout paths on `checkout.*` back to apex:
  - `/` → `https://palaceofromanofficial.com/`
  - `/products/*` → `https://palaceofromanofficial.com/products/*`
  - `/collections/*` → `https://palaceofromanofficial.com/collections/*`
  - `/pages/*` → `https://palaceofromanofficial.com/pages/*`
  - `/blogs/*` → `https://palaceofromanofficial.com/blogs/*`
- Leave real checkout paths alone: `/checkouts/*`, `/cart`, `/account`, `/policies/*`, `/cdn/*`.

### 5. Verify after implementation
- Confirm app checkout still opens Shopify checkout with `channel=online_store`.
- Confirm apex canonicals/sitemap/robots stay on `https://palaceofromanofficial.com`.
- Confirm `checkout.palaceofromanofficial.com/` no longer returns a storefront-style 200 once your Shopify/domain redirects are applied.

## Out of scope
- No cart architecture rewrite.
- No fulfillment/inventory/location changes.
- No product import or catalog changes.
- No non-Shopify checkout.
- No Amazon checkout.
- No new domain migration inside code.