import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import mensEditShirt from "@/assets/editorial/library/mens-edit-shirt.jpg";
import mensEditJacket from "@/assets/editorial/library/mens-edit-jacket.jpg";
import mensEditFinish from "@/assets/editorial/library/mens-edit-finish.jpg";

const HERO_N = 73;
const CHAPTERS: ThemedChapter[] = [
  {
    n: 0,
    src: mensEditShirt,
    eyebrow: "Chapter I — The Shirt",
    title: "Cotton, ironed once, worn forever.",
    body:
      "The men's edit begins with a proper shirt — a Roberto Cavalli navy dress shirt, a Jil Sander cotton tee, a Thom Browne crewneck. Cut from cotton heavy enough to drape, light enough for the day. The kind of piece that earns its place in the closet.",
    alt: "Man in a navy cotton dress shirt and charcoal wool trousers in a travertine palazzo",
    spots: [
      { x: 50, y: 38, label: "The Shirt", match: /shirt|tee|t-shirt|crewneck/i },
    ],
  },
  {
    n: 0,
    src: mensEditJacket,
    eyebrow: "Chapter II — The Jacket",
    title: "Outerwear with intent.",
    body:
      "A Cavalli Class technical jacket, a Brioni wool check blazer, a Bottega Veneta leather piece kept simple. Effortless sophistication is not about layering for show — it is about choosing one outerwear piece that does the work of three.",
    alt: "Man in a blue wool check blazer against a weathered Roman wall",
    flip: true,
    spots: [
      { x: 50, y: 42, label: "The Jacket", match: /jacket|blazer|coat/i },
    ],
  },
  {
    n: 0,
    src: mensEditFinish,
    eyebrow: "Chapter III — The Finish",
    title: "Boot, wallet, nothing else.",
    body:
      "The men's edit closes restrained — a calf-suede lace-up boot, a leather card-holder, a wool scarf folded in the hand. The point is not to be noticed. The point is to be remembered correctly. Every piece arrives with maison tags and an authenticity card.",
    alt: "Brown calf-suede lace-up boots, a black leather bifold wallet and a charcoal wool scarf on walnut",
    spots: [
      { x: 32, y: 40, label: "The Boot", match: /boot|lace-up/i },
      { x: 40, y: 78, label: "The Wallet", match: /wallet|card[- ]?holder/i },
      { x: 78, y: 60, label: "The Scarf", match: /scarf/i },
    ],
  },
];

export const Route = createFileRoute("/editorial/mens-edit")({
  head: () => {
    const title = "The Men's Edit — Effortless Sophistication | Palace of Roman";
    const desc =
      "Shirts, jackets, boots and the small things — the men's edit, in stock and ready to ship. Roberto Cavalli, Jil Sander, Thom Browne, Brioni, Bottega Veneta and the maisons we carry.";
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
      intro="Tailoring, outerwear, leather and the small things — the men's edit, built on restraint, in stock and ready to ship."
      heroN={HERO_N}
      heroAlt="Men's editorial — tailoring and leather in considered light"
      manifesto="The point is not to be noticed. The point is to be remembered correctly."
      chapters={CHAPTERS}
      productQuery={'tag:Men AND (title:shirt OR title:tee OR title:t-shirt OR title:crewneck OR title:jacket OR title:blazer OR title:coat OR title:boot OR title:lace-up OR title:wallet OR title:scarf)'}
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
