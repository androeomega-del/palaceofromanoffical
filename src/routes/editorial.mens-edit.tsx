import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";

const HERO_N = 73;
const CHAPTERS: ThemedChapter[] = [
  {
    n: 75,
    eyebrow: "Chapter I — The Shirt",
    title: "Cotton, ironed once, worn forever.",
    body:
      "The men's edit begins with a proper shirt — a Roberto Cavalli navy dress shirt, a Jil Sander tee, a Thom Browne crewneck. Cut from cotton heavy enough to drape, light enough for the day. The kind of piece that earns its place in the closet.",
    alt: "Men's cotton dress shirt and tailoring in considered styling",
    spots: [
      { x: 48, y: 38, label: "The Shirt", match: /shirt|tee|knit/i },
      { x: 55, y: 72, label: "The Trouser", match: /trouser|pants/i },
    ],
  },
  {
    n: 78,
    eyebrow: "Chapter II — The Jacket",
    title: "Outerwear with intent.",
    body:
      "A Cavalli Class technical jacket, a Brunello Cucinelli linen blazer, a leather piece kept simple. Effortless sophistication is not about layering for show — it is about choosing one outerwear piece that does the work of three.",
    alt: "Men's tailored jacket and leather outerwear in editorial light",
    flip: true,
    spots: [
      { x: 50, y: 40, label: "The Jacket", match: /jacket|blazer|coat/i },
      { x: 40, y: 70, label: "Underneath", match: /shirt|knit|tee/i },
    ],
  },
  {
    n: 82,
    eyebrow: "Chapter III — The Finish",
    title: "Loafer, watch, nothing else.",
    body:
      "The men's edit closes restrained — a polished loafer, a single watch, a leather card-holder. The point is not to be noticed. The point is to be remembered correctly. Every piece arrives with maison tags and an authenticity card.",
    alt: "Men's loafer, watch and leather goods flatlay",
    spots: [
      { x: 50, y: 70, label: "The Loafer", match: /loafer|shoe/i },
      { x: 35, y: 35, label: "The Scarf", match: /scarf|knit/i },
    ],
  },
];

export const Route = createFileRoute("/editorial/mens-edit")({
  head: () => {
    const title = "The Men's Edit — Effortless Sophistication | Palace of Roman";
    const desc =
      "Shirts, jackets, loafers and the small things — the men's edit, in stock and ready to ship. Roberto Cavalli, Jil Sander, Thom Browne, Brunello Cucinelli and the maisons we carry.";
    const path = "/editorial/mens-edit";
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
      issueLabel="The Men's Edit"
      title={`Men.\nEffortless.`}
      subtitle="Sophistication, Without Performance"
      intro="Tailoring, knitwear, leather and the small things — the men's edit, built on restraint, in stock and ready to ship."
      heroN={HERO_N}
      heroAlt="Men's editorial — tailoring and leather in considered light"
      manifesto="The point is not to be noticed. The point is to be remembered correctly."
      chapters={CHAPTERS}
      productQuery="tag:Men AND (title:shirt OR title:trouser OR title:loafer OR title:jacket OR title:knit)"
      shopTitle="Shop the Men's Edit"
      shopEyebrow="Men — In Stock"
      outroCtas={[
        { label: "Men's Clothing", handle: "mens-clothing" },
        { label: "Men's Shoes", handle: "mens-shoes" },
        { label: "Men's Bags", handle: "mens-bags-wallets" },
        { label: "Men's Accessories", handle: "mens-accessories" },
      ]}
    />
  ),
});
