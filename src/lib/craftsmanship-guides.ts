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
];
