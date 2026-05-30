// Curated taxonomy for the /shop facets. Verified live against
// mwuwqi-vy.myshopify.com — these handles all resolve to non-empty
// collections in the BrandsGateway catalog.

export type Gender = "Women" | "Men" | "Unisex";

export const GENDERS: { value: Gender; label: string }[] = [
  { value: "Women", label: "Women" },
  { value: "Men", label: "Men" },
];

export type Category = {
  handle: string;
  label: string;
  group: Gender;
};

export const CATEGORY_COLLECTIONS: Category[] = [
  // Women
  { handle: "womens-clothing", label: "Clothing", group: "Women" },
  { handle: "dresses", label: "Dresses", group: "Women" },
  { handle: "knitwear-women", label: "Knitwear", group: "Women" },
  { handle: "jackets-women", label: "Jackets", group: "Women" },
  { handle: "coats-women", label: "Coats", group: "Women" },
  { handle: "denim-women", label: "Denim", group: "Women" },
  { handle: "shirts-women", label: "Shirts", group: "Women" },
  { handle: "tshirts-women", label: "T-Shirts", group: "Women" },
  { handle: "shorts-women", label: "Shorts", group: "Women" },
  { handle: "swimwear-women", label: "Swimwear", group: "Women" },
  { handle: "womens-shoes", label: "Shoes", group: "Women" },
  { handle: "women-bags", label: "Bags", group: "Women" },
  { handle: "women-accessories", label: "Accessories", group: "Women" },

  // Men
  { handle: "mens-clothing", label: "Clothing", group: "Men" },
  { handle: "shirts-men", label: "Shirts", group: "Men" },
  { handle: "polo-shirts", label: "Polo Shirts", group: "Men" },
  { handle: "long-sleeve-tees", label: "Long-Sleeve Tees", group: "Men" },
  { handle: "sweaters-men", label: "Sweaters", group: "Men" },
  { handle: "hoodies", label: "Hoodies", group: "Men" },
  { handle: "sweatshirts", label: "Sweatshirts", group: "Men" },
  { handle: "cardigans", label: "Cardigans", group: "Men" },
  { handle: "jackets-men", label: "Jackets", group: "Men" },
  { handle: "coats-men", label: "Coats", group: "Men" },
  { handle: "denim-men", label: "Denim", group: "Men" },
  { handle: "swimwear-men", label: "Swimwear", group: "Men" },
  { handle: "mens-shoes", label: "Shoes", group: "Men" },
  { handle: "men-bags", label: "Bags", group: "Men" },
  { handle: "men-accessories", label: "Accessories", group: "Men" },

];

export function findCategory(handle?: string): Category | undefined {
  if (!handle) return undefined;
  return CATEGORY_COLLECTIONS.find((c) => c.handle === handle);
}
