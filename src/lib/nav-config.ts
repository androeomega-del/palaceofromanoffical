// Megamenu structure. Handles map 1:1 to real Shopify collection handles
// confirmed live in the storefront. Items whose handle is missing at runtime
// are filtered out — the menu degrades gracefully.

export type MegaItem = { handle: string; label: string };
export type MegaColumn = { heading: string; items: MegaItem[] };
export type MegaFeature = {
  /** Collection to link the featured tile to. */
  handle: string;
  eyebrow: string;
  title: string;
};
export type MegaDepartment = {
  key: "women" | "men";
  label: string;
  /** Hero/department-wide landing collection. */
  rootHandle: string;
  columns: MegaColumn[];
  feature: MegaFeature;
};

export const DEPARTMENTS: MegaDepartment[] = [
  {
    key: "women",
    label: "Women",
    rootHandle: "womens-clothing",
    columns: [
      {
        heading: "Apparel",
        items: [
          { handle: "womens-clothing", label: "All Clothing" },
          { handle: "new-arrivals", label: "New Arrivals" },
        ],
      },
      {
        heading: "Shoes",
        items: [{ handle: "womens-shoes", label: "All Shoes" }],
      },
      {
        heading: "Bags & Leather",
        items: [
          { handle: "womens-bags", label: "Bags" },
          { handle: "womens-wallets", label: "Wallets" },
          { handle: "womens-belts", label: "Belts" },
        ],
      },
      {
        heading: "Fine Accessories",
        items: [
          { handle: "womens-jewelry", label: "Jewellery" },
          { handle: "womens-watches", label: "Watches" },
          { handle: "womens-scarves", label: "Scarves & Shawls" },
          { handle: "womens-hats", label: "Hats" },
          { handle: "womens-accessories-1", label: "All Accessories" },
        ],
      },
    ],
    feature: {
      handle: "womens-clothing",
      eyebrow: "The Spring Edit",
      title: "A study in considered dressing.",
    },
  },
  {
    key: "men",
    label: "Men",
    rootHandle: "mens-clothing",
    columns: [
      {
        heading: "Tailoring",
        items: [
          { handle: "mens-suits", label: "Suits" },
          { handle: "mens-jackets-coats", label: "Jackets & Coats" },
        ],
      },
      {
        heading: "Shirts & Knitwear",
        items: [
          { handle: "mens-shirts", label: "Shirts" },
          { handle: "mens-tshirts-polos", label: "T-Shirts & Polos" },
          { handle: "mens-sweaters-knitwear", label: "Sweaters & Knitwear" },
          { handle: "mens-hoodies-sweatshirts", label: "Hoodies & Sweatshirts" },
        ],
      },
      {
        heading: "Bottoms & Beach",
        items: [
          { handle: "mens-pants-trousers", label: "Pants & Trousers" },
          { handle: "mens-shorts", label: "Shorts" },
          { handle: "mens-activewear", label: "Activewear" },
          { handle: "mens-swimwear", label: "Swimwear" },
          { handle: "mens-underwear-loungewear", label: "Underwear & Lounge" },
        ],
      },
      {
        heading: "Shoes",
        items: [
          { handle: "mens-shoes", label: "All Shoes" },
          { handle: "mens-sneakers", label: "Sneakers" },
          { handle: "mens-boots", label: "Boots" },
          { handle: "mens-sandals-slides", label: "Sandals & Slides" },
        ],
      },
      {
        heading: "Accessories",
        items: [
          { handle: "mens-bags-wallets", label: "Bags & Wallets" },
          { handle: "mens-belts", label: "Belts" },
          { handle: "mens-watches-jewelry", label: "Watches & Jewellery" },
          { handle: "mens-accessories", label: "All Accessories" },
        ],
      },
    ],
    feature: {
      handle: "mens-suits",
      eyebrow: "The Tailoring Room",
      title: "Sharp lines, quiet codes.",
    },
  },
];
