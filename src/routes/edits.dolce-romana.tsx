import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { routeHead } from "@/lib/seo";
import heroSrc from "@/assets/women/edit-dg-hero.jpg";

const CHAPTERS: ThemedChapter[] = [
  {
    n: 18,
    eyebrow: "Chapter I — The Dress",
    title: "Black lace, painted in flowers.",
    body:
      "The Dolce dress is a piece of theatre — corseted lace, hand-embroidered florals, crystal at the bust. Worn once and remembered for a decade.",
    alt: "Dolce & Gabbana black floral lace dress on a Sicilian courtyard stair",
    spots: [
      { x: 50, y: 50, label: "The Dress", match: /dress|lace|sheath/i },
      { x: 45, y: 85, label: "The Heel", match: /sandal|heel|pump/i },
    ],
  },
  {
    n: 32,
    eyebrow: "Chapter II — The Jewellery",
    title: "Filigree, drop, and chandelier.",
    body:
      "Gold filigree drop earrings, baroque chandelier studs, the cross pendant on a fine chain. The Sicilian codes, scaled for the modern dinner.",
    alt: "Dolce & Gabbana gold filigree earrings and pendant",
    flip: true,
    spots: [
      { x: 50, y: 45, label: "The Earring", match: /earring|jewel|necklace|pendant|chain/i },
    ],
  },
  {
    n: 46,
    eyebrow: "Chapter III — The Heel",
    title: "Satin, strap, a single line.",
    body:
      "The strappy black satin sandal, the patent slingback, the crystal-buckle pump — the Dolce heel finishes a dress that already finishes a room.",
    alt: "Dolce & Gabbana strappy black satin heels in baroque light",
    spots: [
      { x: 50, y: 70, label: "The Heel", match: /sandal|heel|pump|slingback/i },
    ],
  },
];

export const Route = createFileRoute("/edits/dolce-romana")({
  head: () => {
    const title = "Dolce Romana — Sicilian Romance | Palace of Roman";
    const desc =
      "Dolce Romana at Palace of Roman — lace dresses, filigree gold jewellery, satin heels from Dolce & Gabbana womenswear. The Italian holiday wardrobe, in stock.";
    const rh = routeHead({ path: "/edits/dolce-romana", title, description: desc, image: heroSrc, type: "article" });
    return { meta: [{ title }, { name: "description", content: desc }, ...rh.meta], links: rh.links };
  },
  component: () => (
    <ThemedEdit
      issueLabel="Dolce Romana"
      title={`Dolce\nRomana.`}
      subtitle="Sicilian Romance — In Stock"
      intro="Lace, embroidery, gold filigree — the holiday wardrobe written in Italian. The dress worn at dinner under bougainvillea, with the heel that holds the eye and the gold that holds the throat."
      heroN={1}
      heroSrc={heroSrc}
      heroAlt="Dolce Romana — model in a black floral lace dress in a Sicilian baroque courtyard"
      manifesto="Romance, but specific. Theatre, but worn."
      chapters={CHAPTERS}
      productQuery='vendor:"Dolce &amp; Gabbana" AND tag:Women'
      shopTitle="Shop Dolce Romana"
      shopEyebrow="Dolce &amp; Gabbana — In Stock"
      outroCtas={[
        { label: "Women's Clothing", handle: "womens-clothing" },
        { label: "Women's Shoes", handle: "womens-shoes" },
        { label: "Women's Jewellery", handle: "womens-jewelry" },
      ]}
    />
  ),
});
