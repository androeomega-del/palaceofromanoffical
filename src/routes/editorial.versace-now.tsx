import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import versaceNowHero from "@/assets/editorial/library/versace-now-hero.jpg";

const HERO_N = 60;
const CHAPTERS: ThemedChapter[] = [
  {
    n: 59,
    eyebrow: "Chapter I — Medusa, In Close-Up",
    title: "The house mark, kept close.",
    body:
      "Versace begins at the hardware. A gold Medusa on the buckle, a small print at the cuff, the monogram in silk lining. The Palace of Roman selection chooses the pieces that wear the house quietly — and the ones that do not, on purpose.",
    alt: "Versace Medusa hardware in close-up",
    spots: [
      { x: 48, y: 38, label: "The Top", match: /top|shirt|polo|bustier/i },
      { x: 55, y: 70, label: "The Trouser", match: /pants|trouser|jeans/i },
    ],
  },
  {
    n: 64,
    eyebrow: "Chapter II — Engineered Theatre",
    title: "Footwear that announces itself.",
    body:
      "Versace shoes are designed to enter a room first. Greca low-tops, satin flat sandals, leather pumps with the gold heel-cap. We hold them in stock across the most-asked sizes, ready to ship from the European warehouse within forty-eight hours.",
    alt: "Versace sneakers and satin sandals styled on marble",
    flip: true,
    spots: [
      { x: 45, y: 70, label: "The Shoe", match: /sneaker|sandal|pump/i },
      { x: 55, y: 30, label: "The Top", match: /top|polo|shirt|bustier/i },
    ],
  },
  {
    n: 67,
    eyebrow: "Chapter III — The Bag, Sculpted",
    title: "Carried, not displayed.",
    body:
      "A canvas-leather crossbody in Versace black, a jacquard tote in caramel — bags shaped with intent. The Versace presentation closes on the everyday pieces, the ones a Palace of Roman customer reaches for on a Tuesday, not only at the gala.",
    alt: "Versace crossbody and jacquard tote bag flatlay",
    spots: [
      { x: 50, y: 55, label: "The Bag", match: /bag|tote|crossbody/i },
      { x: 35, y: 30, label: "Up Top", match: /top|polo|shirt/i },
    ],
  },
];

export const Route = createFileRoute("/editorial/versace-now")({
  head: () => {
    const title = "Versace — In Stock Now | Palace of Roman";
    const desc =
      "The full Versace presentation at Palace of Roman — Baroque print, gold Medusa hardware, engineered footwear and sculpted bags. In stock, authentic, shipped worldwide.";
    const path = "/editorial/versace-now";
    const image = versaceNowHero;
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
      issueLabel="Maison Spotlight"
      title={`Versace.\nNow.`}
      subtitle="In Stock — Ready to Ship"
      intro="The full Versace presentation at Palace of Roman — Baroque print, gold hardware, engineered theatre. In stock, authentic, shipped from Europe."
      heroN={HERO_N}
      heroSrc={versaceNowHero}
      heroPosition="center 35%"
      heroAlt="Palazzo interior — baroque silk shirt and tailored black trousers under a golden spotlight"
      manifesto="Versace does not whisper. It does not need to."
      chapters={CHAPTERS}
      productQuery="vendor:Versace"
      shopTitle="Shop Versace — In Stock"
      shopEyebrow="The Maison"
      outroCtas={[
        { label: "Women's Clothing", handle: "womens-clothing" },
        { label: "Men's Clothing", handle: "mens-clothing" },
        { label: "Shoes", handle: "shoes" },
        { label: "Bags", handle: "bags" },
      ]}
      extra={
        <section className="border-t border-ink/10 py-12 text-center px-6 bg-canvas">
          <Link
            to="/brand/$vendor"
            params={{ vendor: "versace" }}
            className="px-7 py-3 bg-ink text-canvas text-[11px] uppercase tracking-[0.3em] inline-block hover:bg-bronze transition-colors"
          >
            Shop All Versace →
          </Link>
        </section>
      }
    />
  ),
});
