import { describe, it, expect } from "vitest";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  collectionImage,
  resolveCollectionImage,
  qaCollectionImage,
} from "@/lib/collection-image";

// ───────────────────────────────────────────────────────────────────────
// The full set of Shopify collection handles this storefront ships with.
// Each handle MUST resolve to its own dedicated image (no silent fallback)
// and that image file MUST exist on disk.
// ───────────────────────────────────────────────────────────────────────

const HANDLE_TO_FILE: Record<string, string> = {
  "all-products": "all-products.jpg",
  "new-arrivals": "new-arrivals.jpg",
  "best-selling-brands": "best-selling-brands.jpg",
  "high-discounts": "high-discounts.jpg",

  "womens-accessories": "womens-accessories-1.jpg",
  "womens-accessories-1": "womens-accessories-1.jpg",
  "womens-clothing": "womens-clothing.jpg",
  "womens-shoes": "womens-shoes.jpg",
  "womens-bags": "womens-bags.jpg",
  "womens-wallets": "womens-wallets.jpg",
  "womens-belts": "womens-belts.jpg",
  "womens-jewelry": "womens-jewelry.jpg",
  "womens-watches": "womens-watches.jpg",
  "womens-scarves": "womens-scarves.jpg",
  "womens-hats": "womens-hats.jpg",

  "mens-accessories": "mens-accessories.jpg",
  "mens-clothing": "mens-clothing.jpg",
  "mens-shoes": "mens-shoes.jpg",
  "mens-jackets-coats": "mens-jackets-coats.jpg",
  "mens-suits": "mens-suits.jpg",
  "mens-shirts": "mens-shirts.jpg",
  "mens-tshirts-polos": "mens-tshirts-polos.jpg",
  "mens-sweaters-knitwear": "mens-sweaters-knitwear.jpg",
  "mens-hoodies-sweatshirts": "mens-hoodies-sweatshirts.jpg",
  "mens-pants-trousers": "mens-pants-trousers.jpg",
  "mens-shorts": "mens-shorts.jpg",
  "mens-activewear": "mens-activewear.jpg",
  "mens-swimwear": "mens-swimwear.jpg",
  "mens-underwear-loungewear": "mens-underwear-loungewear.jpg",
  "mens-sneakers": "mens-sneakers.jpg",
  "mens-boots": "mens-boots.jpg",
  "mens-sandals-slides": "mens-sandals-slides.jpg",
  "mens-bags-wallets": "mens-bags-wallets.jpg",
  "mens-belts": "mens-belts.jpg",
  "mens-watches-jewelry": "mens-watches-jewelry.jpg",
};

const ASSET_DIR = resolve(process.cwd(), "src/assets/collections/auto");

describe("collection-image — handle → file mapping", () => {
  it.each(Object.entries(HANDLE_TO_FILE))(
    "%s resolves to its dedicated hero image (%s)",
    (handle, file) => {
      const resolved = resolveCollectionImage({ handle });
      expect(resolved.source).toBe("handle");
      // Vite import URLs end with the filename (and may carry a hash in build).
      expect(resolved.src).toMatch(new RegExp(file.replace(".", "\\.")));
    },
  );

  it.each(Object.values(HANDLE_TO_FILE))(
    "asset file %s exists on disk and is non-empty",
    (file) => {
      const fullPath = resolve(ASSET_DIR, file);
      expect(existsSync(fullPath), `Missing asset: ${fullPath}`).toBe(true);
      expect(statSync(fullPath).size).toBeGreaterThan(0);
    },
  );

  it("collectionImage() matches resolveCollectionImage() for every handle", () => {
    for (const handle of Object.keys(HANDLE_TO_FILE)) {
      expect(collectionImage({ handle })).toBe(
        resolveCollectionImage({ handle }).src,
      );
    }
  });

  it("dynamicMap (Shopify sync) wins over the bundled handle map", () => {
    const handle = "mens-shoes";
    const fake = "https://cdn.example.com/mens-shoes-override.jpg";
    const resolved = resolveCollectionImage({
      handle,
      dynamicMap: { [handle]: fake },
    });
    expect(resolved.source).toBe("dynamic");
    expect(resolved.src).toBe(fake);
  });

  it("unknown handle falls through to a regex rule, not the all-products default", () => {
    const resolved = resolveCollectionImage({
      handle: "mens-running-sneakers-2026",
      title: "Men's Running Sneakers",
    });
    expect(resolved.source).toBe("rule");
    expect(resolved.topic).toBe("mens-sneakers");
  });
});

describe("collection-image — QA semantic match", () => {
  // Plausible titles per handle, used to confirm the QA helper would
  // give each curated handle a clean bill of health.
  const TITLES: Record<string, string> = {
    "all-products": "All Products",
    "new-arrivals": "New Arrivals",
    "best-selling-brands": "Best-Selling Designer Brands",
    "high-discounts": "High Discounts — Sale",
    "womens-clothing": "Women's Clothing",
    "womens-shoes": "Women's Shoes",
    "womens-bags": "Women's Bags",
    "womens-wallets": "Women's Wallets",
    "womens-belts": "Women's Belts",
    "womens-jewelry": "Women's Jewelry",
    "womens-watches": "Women's Watches",
    "womens-scarves": "Women's Scarves",
    "womens-hats": "Women's Hats",
    "womens-accessories": "Women's Accessories",
    "womens-accessories-1": "Women's Accessories",
    "mens-clothing": "Men's Clothing",
    "mens-shoes": "Men's Shoes",
    "mens-jackets-coats": "Men's Jackets & Coats",
    "mens-suits": "Men's Suits",
    "mens-shirts": "Men's Shirts",
    "mens-tshirts-polos": "Men's T-Shirts & Polos",
    "mens-sweaters-knitwear": "Men's Sweaters & Knitwear",
    "mens-hoodies-sweatshirts": "Men's Hoodies & Sweatshirts",
    "mens-pants-trousers": "Men's Pants & Trousers",
    "mens-shorts": "Men's Shorts",
    "mens-activewear": "Men's Activewear",
    "mens-swimwear": "Men's Swimwear",
    "mens-underwear-loungewear": "Men's Underwear & Loungewear",
    "mens-sneakers": "Men's Sneakers",
    "mens-boots": "Men's Boots",
    "mens-sandals-slides": "Men's Sandals & Slides",
    "mens-bags-wallets": "Men's Bags & Wallets",
    "mens-belts": "Men's Belts",
    "mens-watches-jewelry": "Men's Watches & Jewelry",
    "mens-accessories": "Men's Accessories",
  };

  it.each(Object.entries(TITLES))(
    "%s passes QA with its expected title",
    (handle, title) => {
      const qa = qaCollectionImage({ handle, title });
      expect(qa.status, `${handle}: ${qa.reason}`).toBe("ok");
    },
  );

  it("flags a women's collection wearing a men's image as mismatch", () => {
    // mens-shoes is in BY_HANDLE; pairing it with a women's title forces a gender clash.
    const qa = qaCollectionImage({
      handle: "mens-shoes",
      title: "Women's Heels",
      description: "Designer women's pumps and stilettos.",
    });
    expect(qa.status).toBe("mismatch");
  });

  it("flags a fallback regex match as review (not silently ok)", () => {
    const qa = qaCollectionImage({
      handle: "fall-2026-mens-running",
      title: "Fall 2026 Men's Running",
    });
    expect(qa.status).toBe("review");
    expect(qa.source).toBe("rule");
  });

  it("flags the generic default as mismatch", () => {
    const qa = qaCollectionImage({
      handle: "mystery-bucket-xyz",
      title: "Mystery Bucket",
    });
    expect(qa.status).toBe("mismatch");
    expect(qa.source).toBe("default");
  });

  it("trusts dynamic (Shopify/sync) imagery", () => {
    const qa = qaCollectionImage({
      handle: "anything",
      title: "Anything",
      dynamicMap: { anything: "https://cdn.example.com/anything.jpg" },
    });
    expect(qa.status).toBe("ok");
    expect(qa.source).toBe("dynamic");
  });
});

// ───────────────────────────────────────────────────────────────────────
// Graceful handling of missing / renamed handles
// ───────────────────────────────────────────────────────────────────────
import {
  normalizeHandle,
  getUnresolvedHandleReport,
  resetUnresolvedHandleReport,
} from "@/lib/collection-image";

describe("collection-image — handle normalization & aliasing", () => {
  it("strips Shopify's -N duplicate suffix and matches the canonical handle", () => {
    const resolved = resolveCollectionImage({ handle: "mens-shoes-2" });
    expect(resolved.source).toBe("alias");
    expect(resolved.topic).toBe("mens-shoes");
    expect(resolved.matchedVia).toBe("mens-shoes");
  });

  it("normalises underscores and whitespace into the canonical separator", () => {
    expect(normalizeHandle("Mens_Shoes")).toBe("mens-shoes");
    expect(normalizeHandle("  womens  bags  ")).toBe("womens-bags");
    const resolved = resolveCollectionImage({ handle: "Mens_Shoes" });
    expect(resolved.source).toBe("alias");
    expect(resolved.topic).toBe("mens-shoes");
  });

  it("maps known renames via HANDLE_ALIASES (mens-footwear → mens-shoes)", () => {
    const resolved = resolveCollectionImage({ handle: "mens-footwear" });
    expect(resolved.source).toBe("alias");
    expect(resolved.topic).toBe("mens-shoes");
  });

  it("dynamicMap also accepts the normalised form", () => {
    const url = "https://cdn.example.com/x.jpg";
    const resolved = resolveCollectionImage({
      handle: "Mens_Shoes",
      dynamicMap: { "mens-shoes": url },
    });
    expect(resolved.source).toBe("dynamic");
    expect(resolved.src).toBe(url);
  });
});

describe("collection-image — alerting on unresolved handles", () => {
  it("records rule + default fallbacks so the admin QA page can list them", () => {
    resetUnresolvedHandleReport();
    // Rule-match: known gender keyword, unknown handle
    collectionImage({ handle: "mens-mystery-knit-drop", title: "Men's Knit" });
    // Default: nothing matches
    collectionImage({ handle: "totally-unknown-bucket-xyz" });
    // Duplicate of the rule case should bump the count, not add a row
    collectionImage({ handle: "mens-mystery-knit-drop", title: "Men's Knit" });

    const report = getUnresolvedHandleReport();
    const knit = report.find((r) => r.handle === "mens-mystery-knit-drop");
    const xyz = report.find((r) => r.handle === "totally-unknown-bucket-xyz");

    expect(knit).toBeDefined();
    expect(knit?.via).toBe("rule");
    expect(knit?.count).toBe(2);

    expect(xyz).toBeDefined();
    expect(xyz?.via).toBe("default");
    expect(xyz?.topic).toBe("all-products");
  });

  it("does NOT report aliased handles — they resolved cleanly", () => {
    resetUnresolvedHandleReport();
    collectionImage({ handle: "mens-shoes-2" });
    collectionImage({ handle: "mens-footwear" });
    expect(getUnresolvedHandleReport()).toHaveLength(0);
  });
});
