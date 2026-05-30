import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { img } from "@/lib/editorial-library";
import { routeHead } from "@/lib/seo";
import heroSrc from "@/assets/women/edit-cucinelli-hero.jpg";

const CHAPTERS: ThemedChapter[] = [
  {
    n: 12,
    eyebrow: "Chapter I — The Knit",
    title: "Cashmere, considered.",
    body:
      "Ribbed turtlenecks, soft cardigans, a featherweight crewneck — the Cucinelli wardrobe begins with knit. Worn loose over a slim trouser, tucked into wool, or alone with nothing said.",
    alt: "Brunello Cucinelli cashmere knit, ivory ribbed turtleneck",
    spots: [
      { x: 50, y: 40, label: "The Knit", match: /cashmere|sweater|turtleneck|knit|cardigan/i },
      { x: 45, y: 75, label: "The Trouser", match: /pant|trouser/i },
    ],
  },
  {
    n: 28,
    eyebrow: "Chapter II — The Trouser",
    title: "Wool that falls right.",
    body:
      "Wide-leg ivory wool, pleated camel flannel, a fluid linen — the Cucinelli trouser does the work of an entire outfit. Pair with the cashmere; stop there.",
    alt: "Brunello Cucinelli wool trousers in ivory and camel",
    flip: true,
    spots: [
      { x: 50, y: 60, label: "The Trouser", match: /pant|trouser/i },
      { x: 50, y: 30, label: "The Knit", match: /cashmere|knit|sweater|t-shirt/i },
    ],
  },
  {
    n: 36,
    eyebrow: "Chapter III — The Finish",
    title: "Suede, leather, the quiet hardware.",
    body:
      "A suede mule, a calfskin belt, a soft espadrille — the Cucinelli finish is never the loudest piece in the room. It's the one that holds the rest together.",
    alt: "Brunello Cucinelli suede mule and calf leather belt flatlay",
    spots: [
      { x: 45, y: 55, label: "The Shoe", match: /loafer|mule|espadrille|sandal/i },
      { x: 60, y: 30, label: "The Belt", match: /belt/i },
    ],
  },
];

export const Route = createFileRoute("/edits/the-cucinelli-edit")({
  head: () => {
    const title = "The Cucinelli Edit — Quiet Cashmere | Palace of Roman";
    const desc =
      "The Cucinelli Edit at Palace of Roman — cashmere knitwear, wool trousers, suede and calfskin from Brunello Cucinelli. Considered dressing, in stock and ready to ship.";
    const rh = routeHead({ path: "/edits/the-cucinelli-edit", title, description: desc, image: heroSrc, type: "article" });
    return { meta: [{ title }, { name: "description", content: desc }, ...rh.meta], links: rh.links };
  },
  component: () => (
    <ThemedEdit
      issueLabel="The Cucinelli Edit"
      title={`The Cucinelli\nEdit.`}
      subtitle="Quiet Cashmere — In Stock"
      intro="Soft tailoring, monastic neutrals, cashmere worn on the long afternoon. The Cucinelli wardrobe is the wardrobe that lets the woman wearing it speak last."
      heroN={1}
      heroSrc={heroSrc}
      heroAlt="The Cucinelli Edit — model in ivory cashmere turtleneck and wool trousers in an Italian villa interior"
      manifesto="The cut does the talking. The cashmere does the rest."
      chapters={CHAPTERS}
      productQuery='vendor:"Brunello Cucinelli" AND tag:Women'
      shopTitle="Shop the Cucinelli Edit"
      shopEyebrow="Brunello Cucinelli — In Stock"
      outroCtas={[
        { label: "Women's Clothing", handle: "womens-clothing" },
        { label: "Women's Shoes", handle: "womens-shoes" },
        { label: "Women's Accessories", handle: "women-accessories" },
      ]}
    />
  ),
});
