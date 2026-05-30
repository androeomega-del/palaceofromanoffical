import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { routeHead } from "@/lib/seo";
import heroSrc from "@/assets/women/edit-prada-hero.jpg";

const CHAPTERS: ThemedChapter[] = [
  {
    n: 8,
    eyebrow: "Chapter I — The Coat",
    title: "Black, belted, exact.",
    body:
      "The Prada coat reads from across the street — Re-Nylon, technical wool, sharp at the shoulder, drawn at the waist. A single object that finishes whatever it's worn over.",
    alt: "Prada black belted coat in technical fabric",
    spots: [
      { x: 50, y: 45, label: "The Coat", match: /coat|jacket|blazer/i },
      { x: 50, y: 80, label: "The Shoe", match: /pump|heel|loafer|sandal|espadrille/i },
    ],
  },
  {
    n: 24,
    eyebrow: "Chapter II — The Bag",
    title: "Nylon, triangle, repeat.",
    body:
      "The hobo, the tote, the small shoulder — the Prada bag is the season's quiet uniform. Re-Nylon for the day, leather for the evening, both for the woman who knows.",
    alt: "Prada Re-Nylon shoulder bag and leather tote on minimalist surface",
    flip: true,
    spots: [
      { x: 48, y: 55, label: "The Bag", match: /bag|tote|shoulder|hobo|crossbody/i },
    ],
  },
  {
    n: 42,
    eyebrow: "Chapter III — The Shoe",
    title: "Pointed, polished, low-key.",
    body:
      "A pointed leather pump, a slim loafer, a fabric espadrille for the resort. The Prada shoe is built for the way the woman walks — never for the way she's watched.",
    alt: "Prada leather pumps and slip-on loafers in editorial styling",
    spots: [
      { x: 50, y: 70, label: "The Shoe", match: /pump|loafer|espadrille|sandal|heel/i },
    ],
  },
];

export const Route = createFileRoute("/edits/the-prada-effect")({
  head: () => {
    const title = "The Prada Effect — Architectural Minimalism | Palace of Roman";
    const desc =
      "The Prada Effect at Palace of Roman — Re-Nylon, polished leather, architectural lines from Prada womenswear. Coats, bags, loafers and pumps in stock.";
    const rh = routeHead({ path: "/edits/the-prada-effect", title, description: desc, image: heroSrc, type: "article" });
    return { meta: [{ title }, { name: "description", content: desc }, ...rh.meta], links: rh.links };
  },
  component: () => (
    <ThemedEdit
      issueLabel="The Prada Effect"
      title={`The Prada\nEffect.`}
      subtitle="Architectural Minimalism — In Stock"
      intro="Re-Nylon, polished black, the lines that quietly run the season. The Prada wardrobe is the answer for the woman who decided long ago what she wears."
      heroN={1}
      heroSrc={heroSrc}
      heroAlt="The Prada Effect — model in a black Prada belted coat against polished concrete"
      manifesto="The shape is the statement. The colour is rarely required."
      chapters={CHAPTERS}
      productQuery="vendor:Prada AND tag:Women"
      shopTitle="Shop the Prada Effect"
      shopEyebrow="Prada — In Stock"
      outroCtas={[
        { label: "Women's Clothing", handle: "womens-clothing" },
        { label: "Women's Bags", handle: "womens-bags" },
        { label: "Women's Shoes", handle: "womens-shoes" },
      ]}
    />
  ),
});
