import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import summerHero from "@/assets/editorial/library/summer-edit-hero.jpg";
import summerShort from "@/assets/editorial/library/summer-edit-short.jpg";
import summerShirt from "@/assets/editorial/library/summer-edit-shirt.jpg";
import summerSlide from "@/assets/editorial/library/summer-edit-slide.jpg";

const HERO_N = 31;
const CHAPTERS: ThemedChapter[] = [
  {
    n: 0,
    src: summerShort,
    eyebrow: "Chapter I — The Short",
    title: "A swim short, cut for the afternoon.",
    body:
      "The men's summer edit starts at the waist. A clean five-inch rise, a quick-dry weave, gold-tipped drawcords — Bottega Veneta, Canali, Givenchy. Shorts that move from the pool to the bar without a second thought.",
    alt: "Navy designer swim short with gold-tipped drawcord on a teak deck against a sunlit travertine balustrade",
    spots: [
      { x: 50, y: 55, label: "The Short", match: /short|swim/i },
    ],
  },
  {
    n: 0,
    src: summerShirt,
    eyebrow: "Chapter II — The Shirt",
    title: "Linen, open at the throat.",
    body:
      "Pair the short with a cotton polo or a featherweight linen shirt — collar soft, hem untucked. The summer edit is restrained on purpose: one short, one shirt, the right footwear, and the rest is sun.",
    alt: "Man in an open off-white linen shirt over a cream cotton polo against a weathered Roman palazzo wall in golden light",
    flip: true,
    spots: [
      { x: 50, y: 55, label: "The Polo", match: /polo/i },
      { x: 50, y: 38, label: "The Linen", match: /linen|shirt/i },
    ],
  },
  {
    n: 0,
    src: summerSlide,
    eyebrow: "Chapter III — The Slide",
    title: "Footwear, kept to the essential.",
    body:
      "A leather slide carries the look from sand to stone. Worn with tortoiseshell aviators and a chain at the throat, the men's summer edit becomes a uniform — in stock, designed for the heat, and shipped from Europe within the week.",
    alt: "Brown woven leather slides with tortoiseshell aviators and a fine gold chain on a sunlit travertine terrace",
    spots: [
      { x: 36, y: 60, label: "The Slide", match: /slide|sandal/i },
      { x: 70, y: 55, label: "Aviators", match: /sunglasses|aviator/i },
    ],
  },
];

export const Route = createFileRoute("/editorial/summer-edit")({
  head: () => {
    const title = "The Summer Edit — Men's Shorts & Resort, In Stock | Palace of Roman";
    const desc =
      "Men's swim shorts, linen shirts and leather slides — the summer edit, in stock and ready to ship. Bottega Veneta, Canali, Givenchy and the maisons we carry.";
    const path = "/editorial/summer-edit";
    const image = summerHero;
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
      heroSrc={summerHero}
      heroAlt="Men's resort summer edit on the Tyrrhenian coast"
      manifesto="A man's summer wardrobe, cut down to its essentials."
      chapters={CHAPTERS}
      productQuery={'tag:Men AND (tag:"category:shorts" OR tag:"category:swimwear" OR tag:"category:sandals" OR tag:"category:belts" OR title:linen OR title:polo)'}
      shopTitle="Shop the Summer Edit"
      shopEyebrow="Men's — Shorts, Shirts, Slides & Belts"
      outroCtas={[
        { label: "Swimwear", handle: "swimwear-men" },
        { label: "Bermuda Shorts", handle: "bermuda-shorts" },
        { label: "Sandals & Slides", handle: "sandals-slides" },
        { label: "Belts", handle: "belts" },
      ]}
    />
  ),
});
