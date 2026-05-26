import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";

const HERO_N = 87;
const CHAPTERS: ThemedChapter[] = [
  {
    n: 88,
    eyebrow: "Chapter I — Eyewear",
    title: "The frame, before the face.",
    body:
      "Black acetate from Zegna, gold metal aviators, wraparound silhouettes — eyewear that sets the tone before a single word is spoken. The accessories edit opens at the temple, where the day begins and ends in the same gesture.",
    alt: "Designer eyewear flatlay on a stone surface",
  },
  {
    n: 91,
    eyebrow: "Chapter II — The Scarf",
    title: "Wool, silk, fringe.",
    body:
      "A Givenchy wool scarf, a striped Missoni wrap, a square of monogrammed silk — soft accessories that finish a coat or a low neckline. Carried over the arm in summer; folded at the throat in winter. The piece that does the most quiet work.",
    alt: "Designer wool and silk scarves in considered editorial styling",
    flip: true,
  },
  {
    n: 95,
    eyebrow: "Chapter III — The Small Things",
    title: "Belts, chains, leather.",
    body:
      "A gold-buckle belt, a single chain at the throat, a slim card-holder, a watch kept simple. The accessories edit is the punctuation — the marks that turn a sentence into a statement. All authentic, all in stock, all shipped from Europe.",
    alt: "Designer belts, chains and small leather goods flatlay",
  },
];

export const Route = createFileRoute("/editorial/accessories")({
  head: () => {
    const title = "Accessories — Shop the Edit | Palace of Roman";
    const desc =
      "Eyewear, scarves, belts and small leather goods — the accessories edit, in stock and ready to ship. Zegna, Givenchy, Missoni, Versace and the maisons we carry.";
    const path = "/editorial/accessories";
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
      issueLabel="The Accessories Edit"
      title={`The Small\nThings.`}
      subtitle="Punctuation — In Stock"
      intro="Eyewear, scarves, belts, chains and small leather goods — the pieces that finish a look. The accessories edit, in stock and ready to ship."
      heroN={HERO_N}
      heroAlt="Designer accessories editorial — eyewear, scarves, belts and leather"
      manifesto="Accessories are the punctuation. Without them, the sentence trails off."
      chapters={CHAPTERS}
      productQuery="tag:Accessories"
      shopTitle="Shop the Accessories Edit"
      shopEyebrow="Accessories — In Stock"
      outroCtas={[
        { label: "Bags", handle: "bags" },
        { label: "Accessories", handle: "accessories" },
        { label: "Women's Accessories", handle: "womens-accessories-1" },
        { label: "Men's Accessories", handle: "mens-accessories" },
      ]}
    />
  ),
});
