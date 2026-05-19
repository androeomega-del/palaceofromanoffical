// Each Shopify collection gets a dedicated, semantically-accurate hero image.
// Mapped explicitly by handle so every card is both unique and on-topic.
// Fallback rules cover any future collections that haven't been mapped yet.

import allProducts from "@/assets/collections/auto/all-products.jpg";
import womensAccessories from "@/assets/collections/auto/womens-accessories-1.jpg";
import mensAccessories from "@/assets/collections/auto/mens-accessories.jpg";
import mensClothing from "@/assets/collections/auto/mens-clothing.jpg";
import mensShoesImg from "@/assets/collections/auto/mens-shoes.jpg";
import newArrivals from "@/assets/collections/auto/new-arrivals.jpg";
import bestSelling from "@/assets/collections/auto/best-selling-brands.jpg";
import highDiscounts from "@/assets/collections/auto/high-discounts.jpg";
import womensBags from "@/assets/collections/auto/womens-bags.jpg";
import womensWallets from "@/assets/collections/auto/womens-wallets.jpg";
import womensBelts from "@/assets/collections/auto/womens-belts.jpg";
import womensJewelry from "@/assets/collections/auto/womens-jewelry.jpg";
import womensWatches from "@/assets/collections/auto/womens-watches.jpg";
import womensScarves from "@/assets/collections/auto/womens-scarves.jpg";
import womensHats from "@/assets/collections/auto/womens-hats.jpg";
import mensJacketsCoats from "@/assets/collections/auto/mens-jackets-coats.jpg";
import mensSuits from "@/assets/collections/auto/mens-suits.jpg";
import mensShirts from "@/assets/collections/auto/mens-shirts.jpg";
import mensTshirtsPolos from "@/assets/collections/auto/mens-tshirts-polos.jpg";
import mensSweaters from "@/assets/collections/auto/mens-sweaters-knitwear.jpg";
import mensHoodies from "@/assets/collections/auto/mens-hoodies-sweatshirts.jpg";
import mensPants from "@/assets/collections/auto/mens-pants-trousers.jpg";
import mensShorts from "@/assets/collections/auto/mens-shorts.jpg";
import mensActivewear from "@/assets/collections/auto/mens-activewear.jpg";
import mensSwimwear from "@/assets/collections/auto/mens-swimwear.jpg";
import mensUnderwear from "@/assets/collections/auto/mens-underwear-loungewear.jpg";
import mensSneakers from "@/assets/collections/auto/mens-sneakers.jpg";
import mensBoots from "@/assets/collections/auto/mens-boots.jpg";
import mensSandals from "@/assets/collections/auto/mens-sandals-slides.jpg";
import mensBagsWallets from "@/assets/collections/auto/mens-bags-wallets.jpg";
import mensBelts from "@/assets/collections/auto/mens-belts.jpg";
import mensWatchesJewelry from "@/assets/collections/auto/mens-watches-jewelry.jpg";
import womensClothing from "@/assets/collections/auto/womens-clothing.jpg";
import womensShoes from "@/assets/collections/auto/womens-shoes.jpg";

const BY_HANDLE: Record<string, string> = {
  "all-products": allProducts,
  "womens-accessories-1": womensAccessories,
  "womens-accessories": womensAccessories,
  "mens-accessories": mensAccessories,
  "mens-clothing": mensClothing,
  "mens-shoes": mensShoesImg,
  "new-arrivals": newArrivals,
  "best-selling-brands": bestSelling,
  "high-discounts": highDiscounts,
  "womens-bags": womensBags,
  "womens-wallets": womensWallets,
  "womens-belts": womensBelts,
  "womens-jewelry": womensJewelry,
  "womens-watches": womensWatches,
  "womens-scarves": womensScarves,
  "womens-hats": womensHats,
  "mens-jackets-coats": mensJacketsCoats,
  "mens-suits": mensSuits,
  "mens-shirts": mensShirts,
  "mens-tshirts-polos": mensTshirtsPolos,
  "mens-sweaters-knitwear": mensSweaters,
  "mens-hoodies-sweatshirts": mensHoodies,
  "mens-pants-trousers": mensPants,
  "mens-shorts": mensShorts,
  "mens-activewear": mensActivewear,
  "mens-swimwear": mensSwimwear,
  "mens-underwear-loungewear": mensUnderwear,
  "mens-sneakers": mensSneakers,
  "mens-boots": mensBoots,
  "mens-sandals-slides": mensSandals,
  "mens-bags-wallets": mensBagsWallets,
  "mens-belts": mensBelts,
  "mens-watches-jewelry": mensWatchesJewelry,
  "womens-clothing": womensClothing,
  "womens-shoes": womensShoes,
};

// Fallback rules — first match wins. Used only for handles not in BY_HANDLE.
const FALLBACK_RULES: { test: RegExp; img: string }[] = [
  { test: /\bmen('?s)?\b.*(suit|tuxedo|tailoring)/, img: mensSuits },
  { test: /\bmen('?s)?\b.*(shirt|polo)/, img: mensShirts },
  { test: /\bmen('?s)?\b.*(coat|outerwear|jacket|parka|trench)/, img: mensJacketsCoats },
  { test: /\bmen('?s)?\b.*(boot)/, img: mensBoots },
  { test: /\bmen('?s)?\b.*(sneaker)/, img: mensSneakers },
  { test: /\bmen('?s)?\b.*(sandal|slide)/, img: mensSandals },
  { test: /\bmen('?s)?\b.*(shoe|loafer|oxford|derby|footwear)/, img: mensShoesImg },
  { test: /\bmen('?s)?\b.*(knit|sweater|cashmere|jumper|cardigan)/, img: mensSweaters },
  { test: /\bmen('?s)?\b.*(hoodie|sweatshirt)/, img: mensHoodies },
  { test: /\bmen('?s)?\b.*(pant|trouser)/, img: mensPants },
  { test: /\bmen('?s)?\b.*(short)/, img: mensShorts },
  { test: /\bmen('?s)?\b.*(swim)/, img: mensSwimwear },
  { test: /\bmen('?s)?\b.*(active|sport|gym)/, img: mensActivewear },
  { test: /\bmen('?s)?\b.*(underwear|lounge|pajama|sleep)/, img: mensUnderwear },
  { test: /\bmen('?s)?\b.*(watch|jewel)/, img: mensWatchesJewelry },
  { test: /\bmen('?s)?\b.*(bag|wallet|brief)/, img: mensBagsWallets },
  { test: /\bmen('?s)?\b.*(belt)/, img: mensBelts },
  { test: /\bmen('?s)?\b.*(access)/, img: mensAccessories },
  { test: /\bmen('?s)?\b/, img: mensClothing },
  { test: /\bwomen('?s)?\b.*(dress|gown|evening)/, img: womensClothing },
  { test: /\bwomen('?s)?\b.*(blouse|shirt|top)/, img: womensClothing },
  { test: /\bwomen('?s)?\b.*(shoe|heel|pump|sandal|mule|stiletto|boot)/, img: womensShoes },
  { test: /\bwomen('?s)?\b.*(bag|tote|clutch|handbag|purse)/, img: womensBags },
  { test: /\bwomen('?s)?\b.*(wallet)/, img: womensWallets },
  { test: /\bwomen('?s)?\b.*(belt)/, img: womensBelts },
  { test: /\bwomen('?s)?\b.*(jewel)/, img: womensJewelry },
  { test: /\bwomen('?s)?\b.*(watch)/, img: womensWatches },
  { test: /\bwomen('?s)?\b.*(scarf|shawl)/, img: womensScarves },
  { test: /\bwomen('?s)?\b.*(hat|cap)/, img: womensHats },
  { test: /\bwomen('?s)?\b.*(access)/, img: womensAccessories },
  { test: /\bwomen('?s)?\b/, img: womensClothing },
  { test: /\b(new|arrival|fresh)\b/, img: newArrivals },
  { test: /\b(brand|maison|designer)\b/, img: bestSelling },
  { test: /\b(sale|discount|deal|outlet)\b/, img: highDiscounts },
];

export function collectionImage(input: {
  title?: string;
  handle?: string;
  description?: string | null;
}): string {
  const handle = (input.handle ?? "").trim().toLowerCase();
  if (handle && BY_HANDLE[handle]) return BY_HANDLE[handle];

  const hay = `${input.title ?? ""} ${handle} ${input.description ?? ""}`
    .toLowerCase()
    .replace(/[-_]+/g, " ");
  for (const rule of FALLBACK_RULES) {
    if (rule.test.test(hay)) return rule.img;
  }
  return allProducts;
}
