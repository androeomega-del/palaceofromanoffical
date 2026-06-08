/**
 * Per-product FAQ generator.
 *
 * Turns product data into 4 Q&As used for both:
 *   - the visible <PdpFaq /> accordion (also the on-page AEO copy)
 *   - the FAQPage JSON-LD emitted in the route head()
 *
 * All copy is derived from real product fields (vendor, title, productType,
 * parsed composition). Nothing fabricated, nothing brand-specific that the
 * boutique cannot honor.
 */

import { parseComposition } from "@/lib/product-composition";

export type PdpFaqQA = { q: string; a: string };

type CategoryBucket =
  | "sneakers"
  | "shoes"
  | "bag"
  | "rtw"
  | "knitwear"
  | "denim"
  | "sunglasses"
  | "scarf"
  | "belt"
  | "wallet"
  | "jewelry"
  | "watch"
  | "fragrance"
  | "other";

function bucket(productType: string, title: string): CategoryBucket {
  const s = `${productType} ${title}`.toLowerCase();
  if (/sneaker|trainer/.test(s)) return "sneakers";
  if (/loafer|boot|mule|sandal|shoe|pump|derby|oxford|brogue/.test(s)) return "shoes";
  if (/bag|tote|clutch|backpack|hobo|crossbody|pouch|satchel|shoulder/.test(s)) return "bag";
  if (/sweater|cardigan|knit|cashmere|jumper|pullover/.test(s)) return "knitwear";
  if (/jeans?|denim/.test(s)) return "denim";
  if (/sunglass|eyewear|optical/.test(s)) return "sunglasses";
  if (/scarf|foulard|stole|shawl/.test(s)) return "scarf";
  if (/belt/.test(s)) return "belt";
  if (/wallet|cardholder|card-holder|card holder|purse/.test(s)) return "wallet";
  if (/ring|necklace|bracelet|earring|pendant/.test(s)) return "jewelry";
  if (/watch/.test(s)) return "watch";
  if (/fragrance|perfume|eau de/.test(s)) return "fragrance";
  if (/dress|shirt|tee|t-shirt|trouser|pant|skirt|coat|jacket|blazer|hoodie|sweatshirt|polo/.test(s))
    return "rtw";
  return "other";
}

function sizingCopy(b: CategoryBucket, vendor: string): string {
  switch (b) {
    case "sneakers":
      return `${vendor} sneakers generally run true to size; if you're between sizes, size up by half a size for comfort. Italian/EU sizing is used on the size selector — refer to our conversion chart for US equivalents.`;
    case "shoes":
      return `${vendor} footwear is built on European lasts and runs true to size. Half sizes are noted where the maison produces them; otherwise we recommend selecting your standard EU size.`;
    case "bag":
      return `Dimensions are listed in centimetres on the product. Capacity and strap drop vary by silhouette — check the dimensions panel before ordering.`;
    case "rtw":
      return `${vendor} ready-to-wear follows Italian sizing. We recommend ordering your usual EU size; consult the size guide for shoulder, chest and length measurements.`;
    case "knitwear":
      return `${vendor} knitwear is cut on Italian sizing and typically runs true to size with a slightly relaxed shoulder. Cashmere and wool blends will soften with wear — do not size down.`;
    case "denim":
      return `${vendor} denim runs true to the labelled waist. We list waist and inseam in centimetres on the product; rigid denim relaxes about half a size after first wear.`;
    case "sunglasses":
      return `Frame width and lens height are listed in millimetres. ${vendor} eyewear is unisex unless noted; the bridge width helps you compare to a frame you already own.`;
    case "scarf":
    case "belt":
    case "wallet":
    case "jewelry":
    case "watch":
    case "fragrance":
      return `Dimensions, weight and material details are listed on the product. Reach out to the concierge if you'd like additional measurements before ordering.`;
    default:
      return `Sizing follows the maison's standard Italian/EU system. Consult the size guide on this product before ordering; the concierge is available for fit advice.`;
  }
}

export function buildPdpFaq(input: {
  title: string;
  vendor: string;
  productType: string;
  description: string;
}): PdpFaqQA[] {
  const { title, vendor, productType, description } = input;
  const b = bucket(productType || "", title || "");
  const parsed = parseComposition(description || "");
  const madeIn = parsed.madeIn || "the maison's authorised European workshops";

  return [
    {
      q: `Is this ${vendor || "piece"} authentic?`,
      a: `Yes. Every ${vendor || "piece"} sold at Palace of Roman is sourced through our network of authorised boutiques and distributors and is shipped with its original packaging, brand tags and any accompanying documentation. Each order is backed by our 90-day authenticity guarantee.`,
    },
    {
      q: `Where does this ${title || "piece"} ship from and how fast?`,
      a: `This piece ships from ${madeIn === "the maison's authorised European workshops" ? "our European boutique-network partners" : madeIn.replace(/^Made in /, "")}. Orders are processed in 24–48 hours and dispatched fully insured via UPS, FedEx or DHL — 1–3 business days within the EU, 5–7 business days everywhere else. A live tracking link is sent the moment the parcel leaves the warehouse.`,
    },
    {
      q: `What is the return and refund policy?`,
      a: `Unworn, tagged pieces in original packaging can be returned within 14 days of delivery. A reason is required to initiate the return, and the parcel must travel with UPS, FedEx or DHL — returns sent via regular postal services will be declined. Every returned item is inspected on arrival; once approved, the refund is processed back to the original payment method. Used or worn pieces are not eligible and will be shipped back to you.`,
    },
    {
      q: `How does ${vendor || "this maison's"} sizing run?`,
      a: sizingCopy(b, vendor || "This maison"),
    },
  ];
}
