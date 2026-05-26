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
    eyebrow: "Chapter I — The Polo",
    title: "Cotton, ironed once, worn forever.",
    body:
      "The men's edit begins with a proper shirt — the Burberry blue cotton polo with the house's Archivio Check at the collar, half-tucked into wool trousers. Cut from cotton heavy enough to drape, light enough for the day. The kind of piece that earns its place in the closet.",
    alt: "Man in a Burberry navy cotton polo with Archivio Check collar, in a travertine palazzo colonnade",
    spots: [
      { x: 50, y: 35, label: "The Polo", match: /polo/i },
    ],
  },
  {
    n: 0,
    src: mensEditJacket,
    eyebrow: "Chapter II — The Blazer",
    title: "Tailoring, unstructured.",
    body:
      "The Brunello Cucinelli white linen blazer — single-breasted, notch lapel, a soft deconstructed shoulder and the house's contrast caramel cuff buttons. Linen that has been pressed but not subdued. Worn here over chambray, the way the Italians do it in late summer in Rome.",
    alt: "Man in a Brunello Cucinelli off-white linen blazer with caramel cuff buttons against a sunlit Roman palazzo wall",
    flip: true,
    spots: [
      { x: 50, y: 42, label: "The Linen Blazer", match: /linen blazer|white linen|linen jacket/i },
    ],
  },
  {
    n: 0,
    src: mensEditFinish,
    eyebrow: "Chapter III — The Finish",
    title: "Boot, wallet, pocket square.",
    body:
      "The men's edit closes restrained — a calf-suede lace-up boot, the MCM brown fabric wallet, the Brunello Cucinelli gray silk pochette folded once. The point is not to be noticed. The point is to be remembered correctly. Every piece arrives with maison tags and an authenticity card.",
    alt: "Brown calf-suede lace-up boots, an MCM brown fabric bifold wallet and a Brunello Cucinelli gray silk pochette on walnut",
    spots: [
      { x: 28, y: 32, label: "The Boot", match: /boot|lace-up/i },
      { x: 38, y: 80, label: "The Wallet", match: /brown fabric wallet/i },
      { x: 78, y: 60, label: "The Pocket Square", match: /gray silk scarf|silk pochette|pochette/i },
    ],
  },
];

export const Route = createFileRoute("/editorial/mens-edit")({
  head: () => {
    const title = "The Men's Edit — Effortless Sophistication | Palace of Roman";
    const desc =
      "Polo, shell jacket, boots and the small things — the men's edit, in stock and ready to ship. Burberry, Brunello Cucinelli, MCM and the maisons we carry.";
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
      productQuery={'tag:Men AND (title:polo OR title:"shell jacket" OR title:jacket OR title:blazer OR title:coat OR title:boot OR title:lace-up OR title:wallet OR title:scarf OR title:pochette)'}
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
