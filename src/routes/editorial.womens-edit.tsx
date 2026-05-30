import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import womensEditDG from "@/assets/editorial/library/womens-edit-dg.jpg";
import womensEditMaxMara from "@/assets/editorial/library/womens-edit-maxmara.jpg";
import womensEditValentino from "@/assets/editorial/library/womens-edit-valentino.jpg";
import womensEditMoschino from "@/assets/editorial/library/womens-edit-moschino.jpg";

const HERO_N = 45;
const CHAPTERS: ThemedChapter[] = [
  {
    n: 0,
    src: womensEditDG,
    eyebrow: "Chapter I — Dolce & Gabbana",
    title: "Sicilian black lace, in Palermo light.",
    body:
      "The women's edit opens with the house of Sicily — a Dolce & Gabbana corseted black lace dress, crystal-set at the bust and waist, photographed against a baroque ochre palazzo in the late Mediterranean afternoon. House codes carried forward exactly: the lace, the corsetry, the crystal, the unapologetic femininity of southern Italy.",
    alt: "Woman in a Dolce & Gabbana black Sicilian lace corset dress with crystal embellishment against a sunlit ochre palazzo wall in Palermo",
    spots: [
      { x: 50, y: 45, label: "The Dress", match: /dolce.*gabbana.*dress|lace dress/i },
    ],
  },
  {
    n: 0,
    src: womensEditMaxMara,
    eyebrow: "Chapter II — Max Mara",
    title: "The camel coat, the Milanese standard.",
    body:
      "Then to Milan, and the house that defined the camel coat. An oversized Max Mara double-breasted teddy in pure virgin wool, worn over an ivory cashmere turtleneck — walked down a quiet northern colonnade in winter daylight. No ornament. No logo. Only the cut, the fibre, and the discipline of a maison that has been making this exact coat, properly, for sixty years.",
    alt: "Woman in an oversized Max Mara camel teddy coat over an ivory cashmere turtleneck in a Milanese colonnade",
    flip: true,
    spots: [
      { x: 50, y: 55, label: "The Coat", match: /max mara.*coat|teddy|camel coat/i },
      { x: 50, y: 30, label: "The Knit", match: /turtleneck|cashmere/i },
    ],
  },
  {
    n: 0,
    src: womensEditValentino,
    eyebrow: "Chapter III — Valentino Garavani",
    title: "Rockstud. Nude leather. Valentino red.",
    body:
      "From Rome, the Valentino Garavani Rockstud — a pair of nude calfskin stiletto pumps with the signature pyramid hardware at the topline, set on travertine beside a small crossbody in Valentino red with matching studded flap. Two pieces that have outlasted every trend since 2010. The maison hardware. The Roman palette. Quietly the most recognisable footwear in modern luxury.",
    alt: "Valentino Garavani Rockstud nude leather stiletto pumps and a Valentino-red Rockstud crossbody bag on a sunlit travertine surface",
    spots: [
      { x: 35, y: 65, label: "The Pump", match: /valentino.*pump|rockstud.*pump|rockstud.*stiletto/i },
      { x: 72, y: 55, label: "The Bag", match: /valentino.*bag|rockstud.*bag|rockstud.*cross/i },
    ],
  },
  {
    n: 0,
    src: womensEditMoschino,
    eyebrow: "Chapter IV — Moschino",
    title: "The black dress, the gold chain.",
    body:
      "The edit closes on Italian wit. A Moschino tailored black mini in fluid crepe, anchored by an oversized gold chain belt and a chain-link shoulder bag — Milanese maximalism with a wink. The piece does the styling for you; the woman wearing it simply walks into the room. Every piece arrives with maison tags and an authenticity card.",
    alt: "Woman in a Moschino black mini dress with an oversized gold chain belt and gold chain-link shoulder bag on a black-and-white checkerboard floor",
    flip: true,
    spots: [
      { x: 50, y: 50, label: "The Dress", match: /moschino.*dress|moschino.*mini/i },
      { x: 40, y: 55, label: "The Chain Bag", match: /moschino.*bag|chain.*bag/i },
    ],
  },
];

export const Route = createFileRoute("/editorial/womens-edit")({
  head: () => {
    const title = "The Women's Edit — Four Maisons | Palace of Roman";
    const desc =
      "The women's edit at Palace of Roman — four maisons, four house codes. Dolce & Gabbana Sicilian lace, Max Mara camel, Valentino Garavani Rockstud and Moschino gold-chain dressing, in stock and ready to ship.";
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
      title={`Women.\nFour Maisons.`}
      subtitle="House Codes, In Stock"
      intro="Four houses, four signatures — Dolce & Gabbana, Max Mara, Valentino Garavani, Moschino. Pieces chosen for the woman who already knows."
      heroN={HERO_N}
      heroAlt="Women's editorial — Italian house dressing, photographed in considered light"
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
