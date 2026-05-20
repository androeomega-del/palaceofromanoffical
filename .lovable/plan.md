## Goal

Every `/collections/<handle>` link on the site resolves to a real Shopify collection — no more empty/404 category pages. Where Shopify is missing an obvious category, we create it as a smart collection.

## Step 1 — Create missing Shopify smart collections

New script `scripts/shopify/create-category-collections.mjs` (modeled after the existing `create-smart-collections.mjs`). Idempotent: skips handles that already exist.

Collections to create (handle → rules, all conjunctive `all`):

**Women columns**
- `womens-bags` — Tag=Women AND Type=Bags
- `womens-accessories` — Tag=Women AND Type=Accessories
- `womens-jewelry` — Tag=Women AND Type=Jewelry
- `womens-watches` — Tag=Women AND Type=Watches
- `womens-scarves` — Tag=Women AND Type=Scarves
- `womens-hats` — Tag=Women AND Type=Hats
- `womens-belts` — Tag=Women AND Type=Belts
- `womens-wallets` — Tag=Women AND Type=Wallets
- `womens-dresses` — Tag=Women AND Type=Dresses
- `womens-skirts` — Tag=Women AND Type=Skirts

**Men columns**
- `mens-bags-wallets` — Tag=Men AND Type=Bags (catch-all bags+wallets)
- `mens-accessories` — Tag=Men AND Type=Accessories
- `mens-suits` — Tag=Men AND Type=Suits
- `mens-jackets-coats` — Tag=Men AND (Type contains Jacket OR Type contains Coat) [disjunctive sub, see Technical]
- `mens-shirts` — Tag=Men AND Type=Shirts
- `mens-tshirts-polos` — Tag=Men AND (Type contains T-Shirt OR Type contains Polo)
- `mens-sweaters-knitwear` — Tag=Men AND (Type contains Sweater OR Type contains Knitwear)
- `mens-hoodies-sweatshirts` — Tag=Men AND (Type contains Hoodie OR Type contains Sweatshirt)
- `mens-pants-trousers` — Tag=Men AND (Type contains Pants OR Type contains Trousers)
- `mens-shorts` — Tag=Men AND Type=Shorts
- `mens-activewear` — Tag=Men AND Type=Activewear
- `mens-swimwear` — Tag=Men AND Type=Swimwear
- `mens-underwear-loungewear` — Tag=Men AND (Type contains Underwear OR Type contains Loungewear)
- `mens-sneakers` — Tag=Men AND Type=Sneakers
- `mens-boots` — Tag=Men AND Type=Boots
- `mens-sandals-slides` — Tag=Men AND (Type contains Sandal OR Type contains Slide)
- `mens-belts` — Tag=Men AND Type=Belts
- `mens-watches-jewelry` — Tag=Men AND (Type contains Watch OR Type contains Jewelry)

**Generic (referenced by collections index + footer)**
- `dresses`, `loafers`, `belts`, `wallets`, `jewelry`, `scarves`, `sunglasses` — each Type=<X>

Each created with `published: true`, `sort_order: 'best-selling'`, and a short body_html. Dry-run first, then commit at ~2 req/s.

## Step 2 — Update code references

**`src/lib/nav-config.ts`** — leave WOMEN_RULES / MEN_RULES as-is. They already match the suffix scheme; once the collections exist in Shopify they'll auto-populate the megamenu. Add the new categories to the rule lists (`womens-jewelry`, `womens-watches`, etc.) so they actually slot in.

**`src/components/site-footer.tsx`** — keep existing handles (`womens-clothing`, `mens-clothing`, etc.); they're real. No change needed.

**`src/components/site-header.tsx`** — already uses real handles (`new-arrivals`, `best-sellers`). No change.

**`src/routes/index.tsx`** — verify the four `*_HANDLE` constants point to real Shopify handles; remap if any are wrong (`mens-clothing`, `womens-clothing`, `mens-shoes`, `womens-shoes` all exist — likely fine).

**`src/routes/editorial.may-2026.tsx`** — repoint:
- `womens-bags` → (after Step 1 creates it) keep as-is
- `womens-accessories-1` → `womens-accessories`
- `mens-sweaters-knitwear`, `mens-bags-wallets`, `mens-sneakers` → all created in Step 1, keep
- Hero fallback `womens-bags` → keep

**`src/routes/collections.index.tsx`** — broaden `MAIN_HANDLE_ALLOWLIST` and `CANONICAL_HANDLE` to include the new handles. Collapse pairs the same way (e.g. `women-bags` ↔ `womens-bags`).

**`src/lib/nav-config.ts` megamenu feature** — `mens-suits` will be real after Step 1, keep.

## Step 3 — Verify

- Re-fetch the Shopify collection list and assert every handle referenced by `rg "params={{ handle: \"" src/` exists.
- Load `/collections` and confirm the cards render with their images.
- Click through Women + Men megamenu items and the footer; none should land on an empty page.

## Technical notes

- Shopify smart collections support disjunctive rules via `disjunctive: true` at the collection level — that applies OR to ALL rules in the collection. For the "Tag=Men AND (Type=A OR Type=B)" pattern, smart collections can't natively combine AND + OR. **Fallback:** for those handles I'll create them as `Tag=Men, Type contains <broadest single keyword>` (e.g. `mens-jackets-coats` → Type contains "Coat" — covers "Coat" and "Jacket Coat" listings) OR create as a custom collection populated by a one-time tag scan. I'll prefer the first; if hit rate is low I'll convert to custom collections in a follow-up.
- All scripts go in `scripts/shopify/`, never imported by the app.
- Dry-run output will be shown before any writes hit Shopify.

## Out of scope

- Brand vendor collections (already work).
- Fulfillment / inventory / product tag changes.
- Hero imagery or focal points (separate workflow).
