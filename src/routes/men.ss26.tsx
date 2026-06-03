import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { routeHead } from "@/lib/seo";
import heroSrc from "@/assets/editorial/ss26/m-hero.jpg";
import swimSrc from "@/assets/editorial/ss26/m-swim.jpg";
import linenSrc from "@/assets/editorial/ss26/m-linen.jpg";
import loaferSrc from "@/assets/editorial/ss26/m-loafer.jpg";

const CHAPTERS: ThemedChapter[] = [
  {
    n: 1,
    src: swimSrc,
    eyebrow: "Chapter I — Poolside Trunks",
    title: "Bicolor, short cut, snap and zip.",
    body:
      "Tom Ford's polyester swim short — close-fitting silhouette, two-tone construction, the snap-hook-zip fastening that signals it's a piece, not a costume.",
    alt: "Tom Ford bicolor polyester swim shorts at the edge of a turquoise Tuscan pool",
    spots: [
      { x: 50, y: 60, label: "The Trunks", match: /swim|trunk|short.*polyester|bicolor/i },
    ],
  },
  {
    n: 2,
    src: linenSrc,
    eyebrow: "Chapter II — Mediterranean Linen",
    title: "Cotton-linen stripes, bone shirt, espresso.",
    body:
      "The Dolce & Gabbana striped cotton-linen short worn with an open bone-white linen shirt. Built for cobblestones in Palermo and the table after.",
    alt: "Dolce and Gabbana white and black striped cotton-linen shorts with bone linen shirt in a Sicilian alley",
    flip: true,
    spots: [
      { x: 50, y: 60, label: "The Linen", match: /linen|stripe|striped|cotton/i },
    ],
  },
  {
    n: 3,
    src: loaferSrc,
    eyebrow: "Chapter III — The Italian Loafer",
    title: "Black calf, gold Medusa, mirror polish.",
    body:
      "Versace's calfskin slip-on — slightly elongated round toe, leather block heel, the gold Medusa plaque set into the vamp. The shoe that does the work after midnight.",
    alt: "Versace black calfskin slip-on loafer with gold Medusa plaque on terracotta tile in late Roman sun",
    spots: [
      { x: 50, y: 60, label: "The Loafer", match: /loafer|medusa|slip-on|calf/i },
    ],
  },
];

export const Route = createFileRoute("/men/ss26")({
  head: () => {
    const title = "Spring/Summer 2026 — Men | Palace of Roman";
    const desc =
      "Spring/Summer 2026 for men — Tom Ford trunks, Dolce & Gabbana striped linen, the Versace Medusa loafer. The pieces that define the season at Palace of Roman, in stock.";
    const rh = routeHead({
      path: "/men/ss26",
      title,
      description: desc,
      image: heroSrc,
      type: "article",
    });
    return { meta: [{ title }, { name: "description", content: desc }, ...rh.meta], links: rh.links };
  },
  component: () => (
    <ThemedEdit
      issueLabel="SS26 — Men"
      title={`Spring\nSummer 26.`}
      subtitle="The Men's Edit — In Stock"
      intro="Cobalt water, bone linen, gold Medusa on black calf. Three chapters for the spring — the trunk that earns the pool, the linen that earns the table, the loafer that earns the night."
      heroN={1}
      heroSrc={heroSrc}
      heroPosition="center 35%"
      heroAlt="Palace of Roman Spring Summer 2026 men — model in striped Dolce and Gabbana linen shorts and bone linen shirt at a Tuscan pool terrace"
      manifesto="Sprezzatura, in stock."
      chapters={CHAPTERS}
      productQuery='tag:Men AND (vendor:Versace OR vendor:"Tom Ford" OR vendor:"Dolce &amp; Gabbana" OR vendor:Jacquemus)'
      shopTitle="Shop SS26 — Men"
      shopEyebrow="Spring/Summer 26 — In Stock"
      outroCtas={[
        { label: "Men's Clothing", handle: "mens-clothing" },
        { label: "Men's Swim", handle: "mens-swim" },
        { label: "Men's Shoes", handle: "mens-shoes" },
      ]}
    />
  ),
});
