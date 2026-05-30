import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { routeHead } from "@/lib/seo";
import heroSrc from "@/assets/women/edit-bags-hero.jpg";

const CHAPTERS: ThemedChapter[] = [
  {
    n: 22,
    eyebrow: "Chapter I — The Top Handle",
    title: "Structured, formal, kept.",
    body:
      "Calfskin, polished hardware, a frame that holds its shape from morning to dinner. The top-handle bag is the one a woman carries into a room before she's introduced.",
    alt: "Designer top-handle calfskin bag on travertine surface",
    spots: [
      { x: 50, y: 55, label: "The Bag", match: /top.?handle|tote|handle/i },
    ],
  },
  {
    n: 38,
    eyebrow: "Chapter II — The Shoulder",
    title: "Quilted, chained, on the body.",
    body:
      "Lambskin quilting, a fine gold chain, a shape that sits at the hip. The shoulder bag is the bag of the long evening — small enough to forget, structured enough to keep.",
    alt: "Quilted lambskin shoulder bag with gold chain on linen",
    flip: true,
    spots: [
      { x: 50, y: 55, label: "The Bag", match: /shoulder|crossbody|chain|quilted/i },
    ],
  },
  {
    n: 54,
    eyebrow: "Chapter III — The Tote",
    title: "Canvas, leather, in motion.",
    body:
      "The everyday answer — a canvas-and-leather tote for the train, a soft calfskin shopper for the city, a structured carryall for the office. Bags that go where the woman goes.",
    alt: "Designer canvas and calfskin tote bags",
    spots: [
      { x: 50, y: 50, label: "The Tote", match: /tote|shopper|shopping/i },
    ],
  },
];

export const Route = createFileRoute("/edits/the-bag-vault")({
  head: () => {
    const title = "The Bag Vault — Investment Bags | Palace of Roman";
    const desc =
      "The Bag Vault at Palace of Roman — top-handle, shoulder and tote bags from Prada, Brunello Cucinelli, Dolce & Gabbana and the houses defining the season. In stock.";
    const rh = routeHead({ path: "/edits/the-bag-vault", title, description: desc, image: heroSrc, type: "article" });
    return { meta: [{ title }, { name: "description", content: desc }, ...rh.meta], links: rh.links };
  },
  component: () => (
    <ThemedEdit
      issueLabel="The Bag Vault"
      title={`The Bag\nVault.`}
      subtitle="Investment Bags — In Stock"
      intro="Calfskin, lambskin, structured top-handle, the canvas tote that lasts a decade. The bags chosen for the women who already know what they carry."
      heroN={1}
      heroSrc={heroSrc}
      heroAlt="The Bag Vault — four designer handbags arranged on travertine with leather gloves and gold chain"
      manifesto="A bag isn't a season. It's a decade."
      chapters={CHAPTERS}
      productQuery="tag:Women AND tag:Bags"
      shopTitle="Shop the Bag Vault"
      shopEyebrow="Investment Bags — In Stock"
      outroCtas={[
        { label: "Women's Bags", handle: "womens-bags" },
        { label: "Women's Accessories", handle: "women-accessories" },
        { label: "Women's Jewellery", handle: "womens-jewelry" },
      ]}
    />
  ),
});
