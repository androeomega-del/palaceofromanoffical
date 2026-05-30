# Palace of Roman × Farfetch Alignment Plan
## Full Site Audit + SEO Tactics Analysis

---

## 1. Farfetch Site Audit — What They Do Well

### Navigation & Information Architecture
- **Two-row header**: Department tabs (Women / Men / Kids) + centred wordmark + utility cluster (search, account, wishlist, bag). Row 2 is a category rail with inline search.
- **Full-bleed megamenu**: Hover opens a panel with 3-column subcategory lists + an editorial feature tile. A complete alphabetical brand directory lives inside the Brands panel.
- **Mobile drawer**: Hamburger replaces the entire desktop IA cleanly.
- **Breadcrumb discipline**: Every deep page carries a minimal "Home / Category" trail.

### Homepage
- **Gateway, not catalogue**: Three large editorial tiles (Women / Men / Kids) dominate the fold. Below that, category quick-links (New In, Clothing, Bags, Shoes, Accessories, Jewellery) use product imagery as wayfinding.
- **No dense product grids above the fold**: The homepage curates entry points; it does not dump inventory.
- **Seasonal campaign banner**: A single themed hero rotates (e.g. "Beach bound") with short editorial copy and a CTA.

### PLP (Product Listing Page)
- **Editorial hero banner at the top of every PLP**: Themed imagery + 1-2 sentences of editorial copy + "Shop Now" CTA. Example: "Manifest laid-back, sun-filled days with styles from Jacquemus, Eres, Burberry and more."
- **Human headline**: "New in: handpicked daily from the world's best brands and boutiques" — editorial, not transactional.
- **Product cards**: Brand name (bold) + literal product name + price. "New Season" badge used as a freshness signal.
- **Clean grid**: 3-column on desktop, generous whitespace, minimal chrome.

### PDP (Product Detail Page)
- **Large image gallery**: 7+ images with thumbnail strip. Descriptive alt text: "Prada small leather bag | White | Image 1".
- **Brand logo SVG**: Rendered inline above the product name.
- **Minimal but complete**: Size selector, Add To Bag, one price. No information overload.
- **Cross-sell rail**: "Complete the look" with 3-4 pieces.

### Copy / Voice
- **Restrained, confident, editorial**: Short descriptive sentences. No urgency, no pressure, no hard sell.
- **Product naming is literal**: "small leather bag", "button-up bomber jacket", "printed cowl-neck mini dress".
- **Avoids promotional language**: Even sale banners are calm — "up to 50% off", not countdown timers or flash-sale pressure.

---

## 2. Farfetch SEO Tactics Analysis

### Domain Authority & Reach (Semrush US data)
- **102,290 organic keywords** ranking in the US
- **~1.06M estimated monthly organic visits**
- **Top traffic pages** (by traffic share):
  1. Homepage — ranks #1 for "farfetch"
  2. Brand + category combos — "hellstar hoodie", "essentials hoodie", "chrome hearts hat"
  3. Designer landing pages — "vivienne westwood", "miu miu", "diesel"
  4. Promotional content — "farfetch promo code" (voucher-codes page)
  5. Broad category pages — "designer shirts", "designer clothes"

### The 7 SEO Tactics Farfetch Uses

1. **Brand + Category Long-Tail Pages**
   - Creates a dedicated page for every designer + category combination.
   - URL pattern: `/shopping/{gender}/designer-{brand}/{category}/items.aspx`
   - Captures high-intent searches like "prada bags", "gucci sneakers", "versace sunglasses".

2. **Designer Landing Pages**
   - Every designer gets a standalone page that ranks for the brand name.
   - These pages aggregate all categories for that brand, creating strong topical authority.

3. **Promotional Content Marketing**
   - A dedicated voucher-codes page captures "promo code" and "discount" searches.
   - This is content marketing, not e-commerce — it drives massive top-of-funnel traffic.

4. **"New Season" Badge System**
   - Visual freshness signal on product cards. Implies recency to users and reinforces crawl frequency for search engines.

5. **Clean URL Hierarchy**
   - Despite the `.aspx` extension, the path structure is logical: `/shopping/gender/category/`
   - Gender, brand, and category are all explicit in the URL.

6. **Massive Internal Linking via Brand Directory**
   - The megamenu links to every designer page from every page on the site.
   - This distributes link equity deeply across the catalogue.

7. **Image SEO**
   - Alt text is descriptive and keyword-rich: brand + product type + colour + image number.
   - Example: `Prada small leather bag | White | Image 1`

---

## 3. Palace of Roman Gap Analysis

| Area | Farfetch | Palace of Roman (Current) | Gap |
|------|----------|---------------------------|-----|
| **Homepage approach** | Clean 3-tile gateway + category links | Dense bento storefront + trust strip + quiz + trending + for-you + shop-the-story + featured brands + editorial split + category grid + best sellers + new arrivals + newsletter | **Severe over-density**. The homepage tries to be every page at once. |
| **PLP editorial hero** | Themed banner + editorial copy on every PLP | Collection pages exist but need verification for editorial banners | **Missing or inconsistent** editorial lead-in on collection pages. |
| **Brand + category pages** | Dedicated combinatorial pages for every designer + category | Brand pages (`/brand/$vendor`) and collections exist, but long-tail combos are thin | **Under-developed**. Missing pages like "Gucci bags", "Prada shoes" as standalone SEO targets. |
| **Promo / voucher content** | Voucher-codes page is a top-3 traffic driver | No equivalent promotional content page | **Missing**. No top-of-funnel content for discount-intent searches. |
| **"New Season" badge** | Universal badge on product cards | ProductCard component exists — badge system needs audit | **Needs verification**. May be missing season freshness signals. |
| **PDP brand logo** | Inline SVG brand logo | `PdpBrandHeritage` component exists — implementation needs audit | **Needs verification**. |
| **Image alt text** | Keyword-rich: brand + type + colour + index | Uses product images from Shopify — alt text depends on Shopify admin input | **Inconsistent**. Needs structured alt-text generation. |
| **Internal linking** | Megamenu links to every designer from every page | Megamenu + brand directory exist and are well-built | **Strong**. This is already aligned. |
| **Header architecture** | Two-row: tabs + logo + utility / category rail + search | Two-row header already implemented with dept tabs, category rail, megamenu | **Strong**. Already Farfetch-aligned. |

---

## 4. Proposed Alignment Roadmap

### Phase 1 — Homepage Simplification (Highest Impact)
- Reduce the homepage from 10+ sections to a Farfetch-style gateway:
  - **Hero**: Three editorial tiles (Women / Men / Accessories) with large imagery
  - **Category quick-links**: 6 tiles (New In, Clothing, Shoes, Bags, Accessories, Jewellery) with product-led imagery
  - **Single campaign banner**: Rotating seasonal editorial with copy + CTA
  - **Remove**: bento grid, style quiz CTA, vacation stylist CTA, trending rail, for-you feed, shop-the-story rails, featured brands, editorial split, category grid, best sellers grid, new arrivals grid — **move these to their own dedicated pages or deeper in the browse flow**
- Rationale: Farfetch's homepage is an invitation, not a catalogue. P OF R's density creates decision paralysis and dilutes the editorial voice.

### Phase 2 — PLP Editorial Hero System
- Add a themed editorial hero banner to every major collection page:
  - Image + 1-2 sentences of editorial copy + "Shop the Edit" CTA
  - Copy in Palace of Roman voice: curatorial, restrained, confident
  - Examples: "The Amalfi linen edit — pieces that breathe." / "Evening bags that carry the room."
- This aligns with Farfetch's practice of leading every PLP with storytelling.

### Phase 3 — SEO-Long-Tail Pages (Brand + Category Combos)
- Generate dedicated pages for high-value brand + category combinations:
  - URL pattern: `/shop?brand={slug}&category={handle}` or dedicated routes like `/designers/{brand}/{category}`
  - Target keywords: "gucci bags", "prada shoes", "versace sunglasses", "armani suits"
  - Each page gets unique meta title, description, and a short editorial intro
- Rationale: This is Farfetch's #1 SEO growth engine. P OF R has the brand and category data but is not surfacing combinatorial pages to search engines.

### Phase 4 — Promotional Content Page
- Create a dedicated "Promotions & Codes" page:
  - Ranks for "palace of roman promo code", "palace of roman discount", "luxury fashion sale"
  - Lists current offers, sale collections, and loyalty perks
  - Updated seasonally
- Rationale: Farfetch's voucher-codes page is a top-3 traffic driver. P OF R has no equivalent top-of-funnel content for deal-intent searches.

### Phase 5 — Product Card & PDP Micro-Alignments
- **Product Card**: Add "New Season" or "New Arrival" badge based on `createdAt` date. Ensure brand name is bold, product name is literal, price is clear.
- **PDP**: Verify `PdpBrandHeritage` renders an inline brand logo or mark. Add structured alt text to image gallery: `{Brand} {product name} | {colour} | Image {n}`.
- **Image SEO**: Implement alt-text template that pulls from product data automatically.

### Phase 6 — Copy Voice Alignment
- Audit all homepage, PLP, and PDP copy against Farfetch's restraint:
  - Remove urgency language ("hurry", "limited time", "flash")
  - Replace with curatorial language ("handpicked", "the edit", "arrived this week")
  - Product descriptions should be literal and confident, not salesy
  - Editorial banners should feel like magazine captions, not ad copy

---

## 5. SEO Tactics to Adopt Immediately (No Code Changes)

These can be implemented via Shopify Admin or content changes:

1. **Alt-text template**: Update Shopify image alt texts to: `{Brand} {product name} | {colour} | Image {n}`
2. **Collection descriptions**: Write 2-3 sentences of editorial copy for every collection in Shopify Admin. These feed meta descriptions and PLP intros.
3. **Product descriptions**: Ensure every product has a literal, confident description (not just vendor-supplied boilerplate).
4. **Blog/Journal cadence**: Farfetch's editorial content supports SEO. P OF R's Journal should publish 2-4 times monthly targeting seasonal keywords ("summer wedding guest dresses", "resort wear 2026").

---

## 6. Technical Details

**Dependencies**: No new packages required. All changes use existing components, Shopify Storefront API, and TanStack Start patterns.

**SEO impact**: Phase 3 (long-tail pages) and Phase 4 (promo content) would have the highest search visibility impact. Phase 1 (homepage simplification) would improve engagement metrics (time on site, bounce rate) which indirectly improves rankings.

**Effort estimate**:
- Phase 1: Medium (restructuring homepage components)
- Phase 2: Small (adding hero banner to collection template)
- Phase 3: Medium (new route generation + SEO meta)
- Phase 4: Small (new content page)
- Phase 5: Small (badge logic + alt-text template)
- Phase 6: Medium (copy audit across all routes)

---

Approve this plan to proceed, or tell me which phases to prioritise or skip.