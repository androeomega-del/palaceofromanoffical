import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { routeHead } from "@/lib/seo";
import heroSrc from "@/assets/editorial/ss26/w-hero.jpg";
import swimSrc from "@/assets/editorial/ss26/w-swim.jpg";
import silkSrc from "@/assets/editorial/ss26/w-silk.jpg";
import codesSrc from "@/assets/editorial/ss26/w-codes.jpg";

const CHAPTERS: ThemedChapter[] = [
  {
    n: 1,
    src: swimSrc,
    eyebrow: "Chapter I — Riviera Swim",
    title: "The one-piece, gold at the shoulder.",
    body:
      "Black polyamide, gathered front, gold Medusa hardware at the strap. Cut high on the leg in the Versace tradition — a swimsuit that reads as a dress when the sun drops.",
    alt: "Versace black gathered one-piece swimsuit with gold Medusa hardware on a Mediterranean pool deck",
    spots: [
      { x: 50, y: 50, label: "The Swim", match: /swim|swimsuit|one-piece|polyamide/i },
    ],
  },
  {
    n: 2,
    src: silkSrc,
    eyebrow: "Chapter II — Slip & Silk",
    title: "Creamy yellow, ivory, bordeaux.",
    body:
      "The silk tank in a quiet sun-warmed yellow. The long satin skirt. The bordeaux slip waiting on the bed. Soft power, written in three pieces.",
    alt: "Tom Ford yellow silk tank top styled with an ivory silk slip skirt in morning Roman light",
    flip: true,
    spots: [
      { x: 50, y: 45, label: "The Silk", match: /silk|tank|satin|slip/i },
    ],
  },
  {
    n: 3,
    src: codesSrc,
    eyebrow: "Chapter III — House Codes",
    title: "Soft lamb, gold Medusa, vintage edge.",
    body:
      "The slip-on loafer in soft brown lamb leather, the gold Medusa plaque on the vamp. The house code worn at lunch on the terrace.",
    alt: "Versace brown lamb leather slip-on loafer with gold Medusa plaque on travertine in raking sun",
    spots: [
      { x: 50, y: 60, label: "The Loafer", match: /loafer|medusa|slip-on/i },
    ],
  },
];

export const Route = createFileRoute("/women/ss26")({
  head: () => {
    const title = "Spring/Summer 2026 — Women | Palace of Roman";
    const desc =
      "Spring/Summer 2026 for women — the Versace swim, the Tom Ford silk, the Medusa loafer. The pieces that define the season at Palace of Roman, in stock.";
    const rh = routeHead({
      path: "/women/ss26",
      title,
      description: desc,
      image: heroSrc,
      type: "article",
    });
    return { meta: [{ title }, { name: "description", content: desc }, ...rh.meta], links: rh.links };
  },
  component: () => (
    <ThemedEdit
      issueLabel="SS26 — Women"
      title={`Spring\nSummer 26.`}
      subtitle="The Women's Edit — In Stock"
      intro="Bone limestone, creamy yellow silk, a single bordeaux note. Three chapters for the spring — the swim that holds the eye, the silk that holds the room, the loafer that holds the season."
      heroN={1}
      heroSrc={heroSrc}
      heroPosition="center 30%"
      heroAlt="Palace of Roman Spring Summer 2026 women — model on a Mediterranean villa terrace in a creamy yellow Tom Ford silk tank"
      manifesto="Soft power, in Italian."
      chapters={CHAPTERS}
      productQuery='tag:Women AND (vendor:Versace OR vendor:"Tom Ford" OR vendor:"Dolce &amp; Gabbana" OR vendor:Jacquemus OR vendor:"Roberto Cavalli")'
      shopTitle="Shop SS26 — Women"
      shopEyebrow="Spring/Summer 26 — In Stock"
      outroCtas={[
        { label: "Women's Clothing", handle: "womens-clothing" },
        { label: "Women's Shoes", handle: "womens-shoes" },
        { label: "Italian Leather Loafers", handle: "italian-leather-loafers" },
      ]}
    />
  ),
});
