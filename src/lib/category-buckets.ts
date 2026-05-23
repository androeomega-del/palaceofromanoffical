// Curated whitelist mapping for collection-page category chips.
//
// Shared by:
//   - src/lib/collection-category-counts.functions.ts  (server-side
//     aggregation walks every product in a collection and buckets it)
//   - src/routes/collections.$handle.tsx                (renders chips)
//
// Per the master architecture doc (Phase 1): exactly ten buckets, no
// raw-tag passthrough. A typo-tagged product in Shopify admin (e.g.
// "Dresss") falls into NO bucket rather than spawning a junk chip.
//
// Match priority is the array order — first hit wins. Dresses comes
// before Tops so a "Slip Dress" doesn't get pulled into Tops by the
// "slip"-adjacent vocabulary. Knitwear / Outerwear sit above Tops so a
// "knit top" or "shirt jacket" routes to the more specific bucket.

export type CategoryBucketLabel =
  | "Dresses"
  | "Knitwear"
  | "Outerwear"
  | "Tops"
  | "Trousers"
  | "Denim"
  | "Skirts"
  | "Shoes"
  | "Bags"
  | "Accessories";

export type CategoryBucket = {
  label: CategoryBucketLabel;
  /** Tested against each of the product's tags AND the product title. */
  match: RegExp;
};

export const CATEGORY_BUCKETS: ReadonlyArray<CategoryBucket> = [
  { label: "Dresses",     match: /\b(dress|gown|kaftan|caftan)\b/i },
  { label: "Knitwear",    match: /\b(knit|sweater|jumper|cardigan|cashmere|pullover|turtleneck)\b/i },
  { label: "Outerwear",   match: /\b(coat|jacket|parka|trench|blazer|overcoat|puffer|anorak|gilet)\b/i },
  { label: "Tops",        match: /\b(t[\s-]?shirt|tee|shirt|blouse|top|tank|polo|camisole|bodysuit|hoodie|sweatshirt)\b/i },
  { label: "Trousers",    match: /\b(trouser|pant|chino|legging|jogger|bermuda|short)\b/i },
  { label: "Denim",       match: /\b(jean|denim)\b/i },
  { label: "Skirts",      match: /\bskirt\b/i },
  { label: "Shoes",       match: /\b(shoe|sneaker|boot|loafer|sandal|heel|pump|mule|trainer|slipper|espadrille)\b/i },
  { label: "Bags",        match: /\b(bag|tote|clutch|backpack|crossbody|handbag|pouch|satchel|wallet)\b/i },
  { label: "Accessories", match: /\b(belt|scarf|hat|cap|glove|sunglass|jewel|necklace|ring|earring|bracelet|watch|tie|bandana|foulard)\b/i },
] as const;

/**
 * Bucket a single product into at most one category. Tests product tags
 * first (authoritative), then falls back to the title. Returns null if
 * nothing matches — those products simply don't contribute to any chip.
 */
export function bucketProduct(args: { title: string; tags: string[] }): CategoryBucketLabel | null {
  const haystacks = [...args.tags, args.title];
  for (const bucket of CATEGORY_BUCKETS) {
    if (haystacks.some((h) => bucket.match.test(h))) return bucket.label;
  }
  return null;
}
