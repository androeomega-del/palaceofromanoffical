// Maps a Shopify collection (by title + handle + description) to the most
// thematically appropriate editorial image from src/assets/collections.

import womenBlouse from "@/assets/collections/women-blouse.jpg";
import womenDress from "@/assets/collections/women-dress.jpg";
import womenOuterwear from "@/assets/collections/women-outerwear.jpg";
import womenShoes from "@/assets/collections/women-shoes.jpg";
import knitwear from "@/assets/collections/knitwear.jpg";
import bags from "@/assets/collections/bags.jpg";
import accessories from "@/assets/collections/accessories.jpg";
import menSuit from "@/assets/collections/men-suit.jpg";
import menShirt from "@/assets/collections/men-shirt.jpg";
import menOuterwear from "@/assets/collections/men-outerwear.jpg";
import menShoes from "@/assets/collections/men-shoes.jpg";
import defaultImg from "@/assets/collections/default.jpg";

type Rule = { test: RegExp; img: string };

// Order matters — first match wins. More specific rules go on top.
const RULES: Rule[] = [
  // Men-first (catch "men's suits", "menswear", etc. before generic suit rule)
  { test: /\bmen('?s)?\b.*(suit|tailoring|tuxedo|blazer)/, img: menSuit },
  { test: /\bmen('?s)?\b.*(shirt|polo)/, img: menShirt },
  { test: /\bmen('?s)?\b.*(coat|outerwear|jacket|parka|trench)/, img: menOuterwear },
  { test: /\bmen('?s)?\b.*(shoe|sneaker|loafer|boot|oxford|derby)/, img: menShoes },
  { test: /\b(suit|tuxedo|tailoring)\b/, img: menSuit },
  // Women
  { test: /\bwomen('?s)?\b.*(blouse|shirt|top)/, img: womenBlouse },
  { test: /\bwomen('?s)?\b.*(dress|gown|evening)/, img: womenDress },
  { test: /\bwomen('?s)?\b.*(coat|outerwear|jacket|trench|parka)/, img: womenOuterwear },
  { test: /\bwomen('?s)?\b.*(shoe|heel|pump|sandal|mule|stiletto|boot)/, img: womenShoes },
  { test: /\b(blouse|silk\s*shirt)\b/, img: womenBlouse },
  { test: /\b(dress|gown|evening)\b/, img: womenDress },
  { test: /\b(heel|pump|stiletto|sandal|mule)\b/, img: womenShoes },
  // Category agnostic
  { test: /\b(knit|knitwear|sweater|cashmere|jumper|cardigan)\b/, img: knitwear },
  { test: /\b(bag|handbag|tote|clutch|purse|leather\s*goods)\b/, img: bags },
  { test: /\b(accessor|scarf|belt|sunglass|jewel|jewellery|jewelry|watch)\b/, img: accessories },
  { test: /\b(coat|outerwear|trench|parka|overcoat)\b/, img: menOuterwear },
  { test: /\b(shoe|sneaker|loafer|boot|footwear)\b/, img: menShoes },
  { test: /\bshirt\b/, img: menShirt },
  // Gender fallbacks last
  { test: /\bmen('?s)?\b|\bmenswear\b/, img: menSuit },
  { test: /\bwomen('?s)?\b|\bwomenswear\b|\bladies\b/, img: womenBlouse },
];

export function collectionImage(input: {
  title?: string;
  handle?: string;
  description?: string | null;
}): string {
  const hay = `${input.title ?? ""} ${input.handle ?? ""} ${input.description ?? ""}`
    .toLowerCase()
    .replace(/[-_]+/g, " ");
  for (const r of RULES) {
    if (r.test.test(hay)) return r.img;
  }
  return defaultImg;
}
