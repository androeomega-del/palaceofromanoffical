// Static metadata for the three craftsmanship guides surfaced in /journal.
// The full article bodies live in the route files; this list lets the journal
// index render them alongside Shopify-published articles without an API call.

export type CraftsmanshipGuide = {
  slug: string;
  to: string;
  title: string;
  excerpt: string;
  publishedAt: string; // ISO
  readingMinutes: number;
};

export const CRAFTSMANSHIP_GUIDES: CraftsmanshipGuide[] = [
  {
    slug: "spot-real-italian-leather",
    to: "/journal/craftsmanship/spot-real-italian-leather",
    title: "How to Spot Real Italian Leather — A Buyer's Guide",
    excerpt:
      "The grain, the smell, the edge, the stitch. Six tests that separate a properly-made Italian leather piece from everything else.",
    publishedAt: "2026-05-12T09:00:00Z",
    readingMinutes: 7,
  },
  {
    slug: "made-in-italy-vs-designed-in-italy",
    to: "/journal/craftsmanship/made-in-italy-vs-designed-in-italy",
    title: "Made in Italy vs Designed in Italy — What the Label Really Means",
    excerpt:
      "A short lesson on country-of-origin law, what's enforceable, and how to read the label so you know what you're paying for.",
    publishedAt: "2026-05-14T09:00:00Z",
    readingMinutes: 6,
  },
  {
    slug: "caring-for-fine-leather",
    to: "/journal/craftsmanship/caring-for-fine-leather",
    title: "Caring for Fine Leather — A Maison-Level Guide",
    excerpt:
      "How the great leather houses condition, store, and rotate their pieces — and the simple home equivalents that keep yours alive for decades.",
    publishedAt: "2026-05-19T09:00:00Z",
    readingMinutes: 8,
  },
  {
    slug: "leather-quality-guide",
    to: "/journal/craftsmanship/leather-quality-guide",
    title: "Full-Grain vs Top-Grain Leather — The Wallet Buyer's Guide",
    excerpt:
      "What the leather grade on a luxury wallet actually means — how full-grain, top-grain, and corrected-grain Italian leather wear over a decade, and why the cheapest cut almost always costs the most.",
    publishedAt: "2026-06-06T09:00:00Z",
    readingMinutes: 9,
  },
  {
    slug: "the-investment-sunglasses-edit",
    to: "/journal/style/the-investment-sunglasses-edit",
    title: "The Investment Sunglasses Edit — Frames That Outlast a Trend",
    excerpt:
      "A considered guide to designer sunglasses worth keeping: acetate vs metal, face geometry, lens quality, and the maisons that still cut frames properly.",
    publishedAt: "2026-05-22T09:00:00Z",
    readingMinutes: 9,
  },
  {
    slug: "luxury-sneakers-as-modern-tailoring",
    to: "/journal/style/luxury-sneakers-as-modern-tailoring",
    title: "Luxury Sneakers as Modern Tailoring",
    excerpt:
      "How the designer sneaker became the cornerstone of an off-duty wardrobe — and how to wear it without losing the room.",
    publishedAt: "2026-05-23T09:00:00Z",
    readingMinutes: 10,
  },
  {
    slug: "the-cashmere-field-guide",
    to: "/journal/style/the-cashmere-field-guide",
    title: "The Cashmere Field Guide — Grade, Ply, and the Sweaters Worth Keeping",
    excerpt:
      "A maison-level guide to buying cashmere: where the fibre comes from, what grade and ply actually mean, and the houses still spinning it the way it should be spun.",
    publishedAt: "2026-05-24T09:00:00Z",
    readingMinutes: 9,
  },
];
