/**
 * Look-bundle helpers — shared by the PDP route loader (for SEO meta /
 * JSON-LD generation) and the PDP component (for rendering the
 * "Shop the Look" rail). Keeping these in a single module guarantees the
 * search-index payload and the rendered UI agree on which companion
 * products belong to a given anchor.
 */
import type { ShopifyProductNode, ShopifyProductLite } from "@/lib/shopify";

export type LookCategory =
  | "top" | "bottom" | "outerwear" | "dress" | "shoes" | "bag" | "accessory" | "unknown";

export function classifyLookCategory(p: { productType?: string; title?: string }): LookCategory {
  const hay = `${p.productType ?? ""} ${p.title ?? ""}`.toLowerCase();
  if (/\b(dress|gown|robe|kaftan|caftan)\b/.test(hay)) return "dress";
  if (/\b(coat|jacket|blazer|parka|trench|puffer|overcoat|cardigan)\b/.test(hay)) return "outerwear";
  if (/\b(shirt|t-shirt|tee|top|blouse|knit|sweater|jumper|hoodie|polo|sweatshirt|tank|bodysuit)\b/.test(hay)) return "top";
  if (/\b(trouser|pant|jean|short|skirt|legging|chino|bermuda|joggers?)\b/.test(hay)) return "bottom";
  if (/\b(shoe|sneaker|trainer|boot|loafer|mule|sandal|heel|pump|moccasin|espadrille|derby|brogue)\b/.test(hay)) return "shoes";
  if (/\b(bag|tote|clutch|backpack|wallet|cardholder|pouch|crossbody|hobo|satchel|messenger|duffel)\b/.test(hay)) return "bag";
  if (/\b(belt|scarf|hat|cap|beanie|glove|sunglass|tie|jewel|necklace|bracelet|ring|earring|pocket\s?square|wallet|cardholder)\b/.test(hay)) return "accessory";
  return "unknown";
}

export const COMPLEMENTARY_MAP: Record<LookCategory, LookCategory[]> = {
  top:       ["bottom", "shoes", "outerwear", "bag", "accessory"],
  bottom:    ["top", "shoes", "outerwear", "bag", "accessory"],
  outerwear: ["top", "bottom", "shoes", "bag", "accessory"],
  dress:     ["shoes", "bag", "outerwear", "accessory"],
  shoes:     ["bottom", "top", "bag", "outerwear", "accessory"],
  bag:       ["top", "bottom", "shoes", "outerwear", "accessory"],
  accessory: ["top", "bottom", "shoes", "outerwear", "bag"],
  unknown:   ["bag", "shoes", "accessory", "top", "bottom", "outerwear"],
};

export function categoryQueryFragment(cats: LookCategory[]): string {
  const terms: string[] = [];
  for (const c of cats) {
    switch (c) {
      case "top": terms.push("product_type:Shirt", "product_type:T-shirt", "product_type:Top", "product_type:Sweater", "product_type:Knitwear", "product_type:Polo"); break;
      case "bottom": terms.push("product_type:Trousers", "product_type:Pants", "product_type:Jeans", "product_type:Shorts", "product_type:Skirt"); break;
      case "outerwear": terms.push("product_type:Jacket", "product_type:Coat", "product_type:Blazer"); break;
      case "dress": terms.push("product_type:Dress"); break;
      case "shoes": terms.push("product_type:Shoes", "product_type:Sneakers", "product_type:Boots", "product_type:Loafers"); break;
      case "bag": terms.push("product_type:Bag", "product_type:Tote", "product_type:Backpack", "product_type:Clutch", "product_type:Wallet"); break;
      case "accessory": terms.push("product_type:Belt", "product_type:Scarf", "product_type:Hat", "product_type:Sunglasses", "product_type:Jewelry"); break;
      default: break;
    }
  }
  return terms.length ? `(${terms.join(" OR ")})` : "";
}

export function toLite(n: ShopifyProductNode): ShopifyProductLite {
  return {
    id: n.id,
    title: n.title,
    handle: n.handle,
    vendor: n.vendor,
    availableForSale: n.variants.edges.some((e) => e.node.availableForSale),
    priceRange: n.priceRange,
    compareAtPriceRange: n.compareAtPriceRange,
    images: { edges: n.images.edges.slice(0, 2) },
    variants: { edges: n.variants.edges.slice(0, 1) },
  };
}

export function pickCompanions(
  candidates: ShopifyProductNode[],
  anchor: { handle: string; vendor: string; productType?: string; title?: string },
  want: number,
): ShopifyProductLite[] {
  const anchorCat = classifyLookCategory(anchor);
  const seenHandles = new Set<string>([anchor.handle]);
  const seenCats = new Set<LookCategory>([anchorCat]);
  const out: ShopifyProductLite[] = [];
  for (const preferDifferentVendor of [true, false]) {
    for (const c of candidates) {
      if (out.length >= want) break;
      if (seenHandles.has(c.handle)) continue;
      if (preferDifferentVendor && c.vendor === anchor.vendor) continue;
      const cat = classifyLookCategory(c);
      if (seenCats.has(cat)) continue;
      out.push(toLite(c));
      seenHandles.add(c.handle);
      seenCats.add(cat);
    }
    if (out.length >= want) break;
  }
  return out;
}
