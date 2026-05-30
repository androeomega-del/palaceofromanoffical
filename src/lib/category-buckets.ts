// Curated whitelist mapping for collection-page category chips.
//
// Shared by:
//   - src/lib/collection-category-counts.functions.ts  (server-side
//     aggregation walks every product in a collection and buckets it)
//   - src/routes/collections.$handle.tsx                (renders chips)
//
// Gender-aware curation:
//   - Women's collections (handle starts with "womens-" / "women-",
//     or includes "/women") surface buckets relevant to womenswear:
//     Dresses, Skirts, Jumpsuits, Pumps, etc.
//   - Men's collections surface menswear-specific buckets: Suits,
//     Shirts split from T-Shirts, Polos, Shorts, etc.
//   - Anything else (sale, layering, unisex edits, brand pages)
//     falls back to the generic 10-bucket set.
//
// Match priority is the array order — first hit wins. Dresses comes
// before Tops so a "Slip Dress" doesn't get pulled into Tops by the
// "slip"-adjacent vocabulary. Knitwear / Outerwear / Suits sit above
// Tops so a "knit top", "shirt jacket", or "suit shirt" routes to the
// more specific bucket.

export type CategoryBucketLabel = string;

export type CategoryBucket = {
  label: string;
  /** Tested against each of the product's tags AND the product title. */
  match: RegExp;
};

// Reusable building blocks (defined once, composed per gender below).
const B = {
  Dresses: {
    label: "Dresses",
    // "dress" alone only counts when it's the noun. Excludes adjective uses
    // like "dress shirt / pants / trousers / shorts / shoes / boots / socks
    // / tie / belt / coat / jacket / sweater / code / down" — common in
    // menswear titles and tags.
    match: /\b(gown|kaftan|caftan|sundress)s?\b|\b(maxi|midi|mini|slip|shift|wrap|sheath|tea|cocktail|evening)[\s-]?dress(es)?\b|\bdress(es)?\b(?!\s*[-]?\s*(shirt|pant|trouser|short|sock|tie|belt|shoe|boot|coat|jacket|sweater|code|down|up))/i,
  } satisfies CategoryBucket,
  Knitwear: {
    label: "Knitwear",
    match: /\b(knit|sweater|jumper|cardigan|cashmere|pullover|turtleneck)\b/i,
  } satisfies CategoryBucket,
  Outerwear: {
    label: "Outerwear",
    match: /\b(coat|jacket|parka|trench|blazer|overcoat|puffer|anorak|gilet|peacoat)\b/i,
  } satisfies CategoryBucket,
  Suits: {
    label: "Suits",
    match: /\b(suit|tuxedo|two[\s-]?piece|three[\s-]?piece)\b/i,
  } satisfies CategoryBucket,
  Shirts: {
    label: "Shirts",
    match: /\b(shirt|button[\s-]?down|button[\s-]?up|oxford)\b/i,
  } satisfies CategoryBucket,
  Polos: {
    label: "Polos",
    match: /\bpolo\b/i,
  } satisfies CategoryBucket,
  TShirts: {
    label: "T-Shirts",
    match: /\b(t[\s-]?shirt|tee|tank[\s-]?top|tank|camisole|bodysuit|hoodie|sweatshirt)\b/i,
  } satisfies CategoryBucket,
  Tops: {
    label: "Tops",
    match: /\b(t[\s-]?shirt|tee|shirt|blouse|top|tank|polo|camisole|bodysuit|hoodie|sweatshirt)\b/i,
  } satisfies CategoryBucket,
  Trousers: {
    label: "Trousers",
    match: /\b(trouser|pant|chino|legging|jogger|bermuda)\b/i,
  } satisfies CategoryBucket,
  Shorts: {
    label: "Shorts",
    match: /\bshort(s)?\b/i,
  } satisfies CategoryBucket,
  Denim: {
    label: "Denim",
    match: /\b(jean|denim)\b/i,
  } satisfies CategoryBucket,
  Skirts: {
    label: "Skirts",
    match: /\bskirt\b/i,
  } satisfies CategoryBucket,
  Jumpsuits: {
    label: "Jumpsuits",
    match: /\b(jumpsuit|playsuit|romper|catsuit)\b/i,
  } satisfies CategoryBucket,
  Swimwear: {
    label: "Swimwear",
    match: /\b(swim|bikini|swimsuit|board[\s-]?short|trunks?)\b/i,
  } satisfies CategoryBucket,
  Shoes: {
    label: "Shoes",
    match: /\b(shoe|sneaker|boot|loafer|sandal|heel|pump|mule|trainer|slipper|espadrille|oxford|derby|brogue)\b/i,
  } satisfies CategoryBucket,
  Bags: {
    label: "Bags",
    match: /\b(bag|tote|clutch|backpack|crossbody|handbag|pouch|satchel|briefcase|messenger|holdall|weekender|duffle|duffel)\b/i,
  } satisfies CategoryBucket,
  Wallets: {
    label: "Wallets",
    match: /\b(wallet|cardholder|card[\s-]?case|bifold|billfold|money[\s-]?clip)\b/i,
  } satisfies CategoryBucket,
  Accessories: {
    label: "Accessories",
    match: /\b(belt|scarf|hat|cap|glove|sunglass|jewel|necklace|ring|earring|bracelet|watch|tie|bandana|foulard|pochette|pocket[\s-]?square|cufflink)\b/i,
  } satisfies CategoryBucket,
} as const;

// ---------- Curated sets ----------

/** Generic / unisex / sale / brand pages — original 10-bucket set. */
export const CATEGORY_BUCKETS: ReadonlyArray<CategoryBucket> = [
  B.Dresses,
  B.Knitwear,
  B.Outerwear,
  B.Tops,
  B.Trousers,
  B.Denim,
  B.Skirts,
  B.Shoes,
  B.Bags,
  B.Accessories,
] as const;

/** Womenswear collections — adds Jumpsuits, keeps Dresses & Skirts on top. */
export const WOMENS_CATEGORY_BUCKETS: ReadonlyArray<CategoryBucket> = [
  B.Dresses,
  B.Jumpsuits,
  B.Knitwear,
  B.Outerwear,
  B.Tops,
  B.Trousers,
  B.Denim,
  B.Skirts,
  B.Swimwear,
  B.Shoes,
  B.Bags,
  B.Accessories,
] as const;

/** Menswear collections — Suits/Shirts/Polos/T-Shirts split, Wallets surfaced. */
export const MENS_CATEGORY_BUCKETS: ReadonlyArray<CategoryBucket> = [
  B.Suits,
  B.Outerwear,
  B.Knitwear,
  B.Shirts,
  B.Polos,
  B.TShirts,
  B.Trousers,
  B.Denim,
  B.Shorts,
  B.Swimwear,
  B.Shoes,
  B.Bags,
  B.Wallets,
  B.Accessories,
] as const;

/**
 * Pick the bucket set for a collection handle.
 * Detection is intentionally generous — any handle starting with "mens-",
 * "men-" or containing the segment "men" routes to the menswear set; same
 * for women. Anything else falls back to the generic set.
 */
export function bucketsForHandle(handle: string): ReadonlyArray<CategoryBucket> {
  const h = (handle || "").toLowerCase();
  // Order matters: "womens-…" must match before "men…" since it contains "men".
  if (/^(womens?|ladies)[-/]/.test(h) || /[-/](womens?|ladies)([-/]|$)/.test(h)) {
    return WOMENS_CATEGORY_BUCKETS;
  }
  if (/^mens?[-/]/.test(h) || /[-/]mens?([-/]|$)/.test(h)) {
    return MENS_CATEGORY_BUCKETS;
  }
  return CATEGORY_BUCKETS;
}

/**
 * Bucket a single product into at most one category. Tests product tags
 * first (authoritative), then falls back to the title. Returns null if
 * nothing matches — those products simply don't contribute to any chip.
 *
 * Pass `buckets` to scope matching to a curated set (e.g. men/women).
 * Defaults to the generic 10-bucket set for backward compatibility.
 */
export function bucketProduct(
  args: { title: string; tags: string[] },
  buckets: ReadonlyArray<CategoryBucket> = CATEGORY_BUCKETS,
): string | null {
  const haystacks = [...args.tags, args.title];
  for (const bucket of buckets) {
    if (haystacks.some((h) => bucket.match.test(h))) return bucket.label;
  }
  return null;
}
