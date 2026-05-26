import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";

const HERO_N = 45;
const CHAPTERS: ThemedChapter[] = [
  {
    n: 48,
    eyebrow: "Chapter I — Silhouette",
    title: "Dressing, considered.",
    body:
      "The women's edit favours line over ornament. A Versace Jeans shift dress, a Jil Sander knit, a Roberto Cavalli silk — pieces that hold the body without insisting on it. The cut does the talking; the woman wearing it speaks last.",
    alt: "Considered tailoring and silk dressing on a quiet interior set",
    spots: [
      { x: 48, y: 40, label: "The Dress", match: /dress/i },
      { x: 40, y: 75, label: "Tailoring", match: /pants|trouser|skirt|jeans/i },
    ],
  },
  {
    n: 52,
    eyebrow: "Chapter II — The Shoe",
    title: "A heel, low and confident.",
    body:
      "Jimmy Choo Amika pumps, Versace satin sandals — footwear that reads from across the room without raising its voice. The edit pairs them with cropped tailoring, a slim trouser, or nothing at all but the dress.",
    alt: "Designer pumps and satin sandals in editorial styling",
    flip: true,
    spots: [
      { x: 50, y: 78, label: "The Heel", match: /pump|sandal|heel/i },
      { x: 45, y: 30, label: "The Top", match: /top|blouse|sweater|tank/i },
    ],
  },
  {
    n: 56,
    eyebrow: "Chapter III — The Finish",
    title: "A bag, a chain, the rest is posture.",
    body:
      "A crossbody in canvas-leather jacquard, a single gold chain, a wool scarf for the cooler hour. The women's edit closes on the small things — the ones that turn an outfit into a presence.",
    alt: "Women's designer crossbody bag and gold jewellery flatlay",
    spots: [
      { x: 50, y: 55, label: "The Bag", match: /bag|crossbody|tote/i },
      { x: 35, y: 30, label: "The Top", match: /silk|top|dress/i },
    ],
  },
];

export const Route = createFileRoute("/editorial/womens-edit")({
  head: () => {
    const title = "Women's Edit — Shop the Edit | Palace of Roman";
    const desc =
      "The women's edit at Palace of Roman — dresses, knitwear, pumps, sandals and the small things. Versace Jeans, Jimmy Choo, Jil Sander and the maisons we carry, in stock and ready to ship.";
    const path = "/editorial/womens-edit";
    const image = img(HERO_N);
    const rh = routeHead({ path, title, description: desc, image, type: "article" });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            description: desc,
            image: absoluteUrl(image),
            url: absoluteUrl(path),
            publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
            mainEntityOfPage: absoluteUrl(path),
          }),
        },
      ],
    };
  },
  component: () => (
    <ThemedEdit
      issueLabel="The Women's Edit"
      title={`Women.\nShop the Edit.`}
      subtitle="Considered Dressing, In Stock"
      intro="The women's edit favours line over ornament — silk, knit, leather, gold. Pieces chosen for the woman who already knows."
      heroN={HERO_N}
      heroAlt="Women's editorial — silk dress and considered tailoring"
      manifesto="The cut does the talking. The woman wearing it speaks last."
      chapters={CHAPTERS}
      productQuery="tag:Women"
      shopTitle="Shop the Women's Edit"
      shopEyebrow="Women — In Stock"
      outroCtas={[
        { label: "Women's Clothing", handle: "womens-clothing" },
        { label: "Women's Shoes", handle: "womens-shoes" },
        { label: "Women's Bags", handle: "womens-bags" },
        { label: "Women's Accessories", handle: "womens-accessories-1" },
      ]}
    />
  ),
});
