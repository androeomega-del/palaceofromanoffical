import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";

const HERO_N = 31;
const CHAPTERS: ThemedChapter[] = [
  {
    n: 33,
    eyebrow: "Chapter I — The Short",
    title: "A swim short, cut for the afternoon.",
    body:
      "The men's summer edit starts at the waist. A clean five-inch rise, a quick-dry weave, gold-tipped drawcords — Bottega Veneta, Canali, Givenchy. Shorts that move from the pool to the bar without a second thought.",
    alt: "Men's tailored swim short on a teak deck",
    spots: [
      { x: 50, y: 62, label: "The Short", match: /short|swim/i },
      { x: 40, y: 30, label: "Up Top", match: /polo|shirt|tee/i },
    ],
  },
  {
    n: 37,
    eyebrow: "Chapter II — The Shirt",
    title: "Linen, open at the throat.",
    body:
      "Pair the short with a cotton polo or a featherweight linen shirt — collar soft, hem untucked. The summer edit is restrained on purpose: one short, one shirt, the right footwear, and the rest is sun.",
    alt: "Linen shirt and polo styling for resort dressing",
    flip: true,
    spots: [
      { x: 48, y: 35, label: "The Polo", match: /polo/i },
      { x: 55, y: 70, label: "The Linen", match: /linen|shirt/i },
    ],
  },
  {
    n: 40,
    eyebrow: "Chapter III — The Slide",
    title: "Footwear, kept to the essential.",
    body:
      "A leather slide carries the look from sand to stone. Worn with tortoiseshell aviators and a chain at the throat, the men's summer edit becomes a uniform — in stock, designed for the heat, and shipped from Europe within the week.",
    alt: "Designer leather slides and aviator sunglasses on a resort terrace",
    spots: [
      { x: 50, y: 70, label: "The Slide", match: /slide|sandal/i },
      { x: 40, y: 30, label: "The Polo", match: /polo|tee|shirt/i },
    ],
  },
];

export const Route = createFileRoute("/editorial/summer-edit")({
  head: () => {
    const title = "The Summer Edit — Men's Shorts & Resort, In Stock | Palace of Roman";
    const desc =
      "Men's swim shorts, linen shirts and leather slides — the summer edit, in stock and ready to ship. Bottega Veneta, Canali, Givenchy and the maisons we carry.";
    const path = "/editorial/summer-edit";
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
      issueLabel="The Summer Edit"
      title={`Shorts &\nResort.`}
      subtitle="Men's — In Stock, Ready to Ship"
      intro="One short, one shirt, one pair of slides, and the sea. The men's summer edit, edited down to what matters."
      heroN={HERO_N}
      heroAlt="Men's resort summer edit on the Tyrrhenian coast"
      manifesto="A man's summer wardrobe, cut down to its essentials."
      chapters={CHAPTERS}
      productQuery="tag:Men AND (title:short OR title:swim OR title:linen OR title:slide OR title:polo)"
      shopTitle="Shop the Summer Edit"
      shopEyebrow="Men's — In Stock"
      outroCtas={[
        { label: "Swimwear", handle: "swimwear" },
        { label: "Men's Clothing", handle: "mens-clothing" },
        { label: "Men's Shoes", handle: "mens-shoes" },
        { label: "Men's Accessories", handle: "mens-accessories" },
      ]}
    />
  ),
});
