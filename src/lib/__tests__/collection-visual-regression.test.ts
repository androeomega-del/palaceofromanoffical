// Visual regression snapshots for collection hero imagery.
//
// True pixel diffing requires a headless browser, which this stack doesn't
// run in CI. Instead we snapshot the *visual fingerprint* of every collection
// card (on /collections) and every megamenu feature tile: the resolved image
// file, alt text, and CSS object-position (focal point).
//
// Any future drift — a swapped hero image, a regressed alt string, a focal
// point pushed off-subject — will fail the snapshot and require explicit
// review via `vitest -u`. This catches the mismatches the QA dashboard
// surfaces, but at build time, not at runtime.

import { describe, it, expect } from "vitest";
import { basename } from "node:path";
import {
  collectionImage,
  collectionImageAlt,
  collectionImageFocal,
} from "@/lib/collection-image";

// All Shopify collection handles the storefront ships with. Kept in sync
// with collection-image.test.ts — any new handle must be added here too.
const COLLECTION_HANDLES = [
  "all-products",
  "new-arrivals",
  "best-selling-brands",
  "high-discounts",
  "womens-accessories",
  "womens-accessories-1",
  "womens-clothing",
  "womens-shoes",
  "womens-bags",
  "womens-wallets",
  "womens-belts",
  "womens-jewelry",
  "womens-watches",
  "womens-scarves",
  "womens-hats",
  "mens-accessories",
  "mens-clothing",
  "mens-shoes",
  "mens-jackets-coats",
  "mens-suits",
  "mens-shirts",
  "mens-tshirts-polos",
  "mens-sweaters-knitwear",
  "mens-hoodies-sweatshirts",
  "mens-pants-trousers",
  "mens-shorts",
  "mens-activewear",
  "mens-swimwear",
  "mens-underwear-loungewear",
  "mens-sneakers",
  "mens-boots",
  "mens-sandals-slides",
  "mens-bags-wallets",
  "mens-belts",
  "mens-watches-jewelry",
] as const;

// Mirrors how /collections renders each card — titles are humanised from the
// handle so the snapshot is stable across Shopify metadata edits.
function humanise(handle: string): string {
  return handle
    .replace(/^(mens|womens)-/, (_, g) => (g === "mens" ? "Men's " : "Women's "))
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type Fingerprint = {
  file: string;
  alt: string;
  focal: string;
};

function fingerprint(handle: string, title: string): Fingerprint {
  const src = collectionImage({ handle, title });
  return {
    file: basename(src.split("?")[0]).replace(/-[A-Za-z0-9_]{6,}\.jpg$/, ".jpg"),
    alt: collectionImageAlt({ handle, title }),
    focal: collectionImageFocal({ handle, title }),
  };
}

describe("visual regression — /collections cards", () => {
  it("every collection card renders a stable image / alt / focal fingerprint", () => {
    const snapshot: Record<string, Fingerprint> = {};
    for (const handle of COLLECTION_HANDLES) {
      snapshot[handle] = fingerprint(handle, humanise(handle));
    }
    expect(snapshot).toMatchSnapshot();
  });
});

// Megamenu feature tiles — these are the three "hero" tiles inside the
// Women / Men / Brands menus. Handles are pinned in src/lib/nav-config.ts.
const MENU_TILES = [
  { slot: "women", handle: "womens-clothing", title: "A study in considered dressing." },
  { slot: "men", handle: "mens-suits", title: "Sharp lines, quiet codes." },
  { slot: "brands", handle: "best-selling-brands", title: "Best-selling luxury fashion brands" },
] as const;

describe("visual regression — megamenu feature tiles", () => {
  it("every menu tile renders a stable image / alt / focal fingerprint", () => {
    const snapshot: Record<string, Fingerprint> = {};
    for (const { slot, handle, title } of MENU_TILES) {
      snapshot[slot] = fingerprint(handle, title);
    }
    expect(snapshot).toMatchSnapshot();
  });
});
