import { createFileRoute } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";

const HERO_N = 1;
const CHAPTERS: ThemedChapter[] = [
  {
    n: 4,
    eyebrow: "Chapter I — Salt Air",
    title: "A wardrobe built for the horizon.",
    body:
      "Resort 2026 begins at the shoreline. Bleached linens, sun-dried cottons, a swim short cut clean at the thigh — pieces that wear easily between the dunes and the dinner table. The Mediterranean dictates the palette: chalk, sand, sea-glass, salt.",
    alt: "Sun-bleached resort tailoring on a coastal walkway",
    spots: [
      { x: 42, y: 38, label: "Resort Silk", match: /silk/i },
      { x: 62, y: 64, label: "The Linen", match: /linen|swim/i },
    ],
  },
  {
    n: 11,
    eyebrow: "Chapter II — The Long Afternoon",
    title: "Soft tailoring, undone at the cuff.",
    body:
      "Open-collar shirts, drawstring trousers, a single linen jacket carried over the arm. The shoreline edit favours weight and drape over structure — clothing that breathes, then folds away by evening. Worn with the slowness the season demands.",
    alt: "Linen open-collar shirt and tailored trouser in late afternoon light",
    flip: true,
    spots: [
      { x: 48, y: 35, label: "The Top", match: /silk|tank|blouse|shirt/i },
      { x: 40, y: 70, label: "The Trouser", match: /pants|trouser|skirt/i },
    ],
  },
  {
    n: 23,
    eyebrow: "Chapter III — Last Light",
    title: "Evening, by the water.",
    body:
      "As the light drops, the edit shifts. A washed silk over the shoulder, a leather sandal kept simple, the day's salt still on the skin. Resort 2026 is not dressed up — it is dressed down on purpose. The horizon does the rest.",
    alt: "Silk evening piece against a calm sea at dusk",
    spots: [
      { x: 50, y: 45, label: "Evening Silk", match: /silk|dress/i },
      { x: 30, y: 78, label: "The Finish", match: /bow|tie|sweater/i },
    ],
  },
];

export const Route = createFileRoute("/editorial/shoreline-perspective")({
  head: () => {
    const title = "2026 Collection — The Shoreline Perspective | Palace of Roman";
    const desc =
      "Resort 2026 from the shoreline up — bleached linens, washed silks, swim and soft tailoring built for long Mediterranean days. Authentic, in stock, shipped worldwide.";
    const path = "/editorial/shoreline-perspective";
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
      issueLabel="The 2026 Collection"
      title={`The Shoreline\nPerspective.`}
      subtitle="Resort 2026 — From the Coast Up"
      intro="A season seen from sea level. Linen, silk, swim and soft tailoring — the pieces that survive the salt and still belong at dinner."
      heroN={HERO_N}
      heroAlt="Resort 2026 — sun-bleached shoreline tailoring"
      manifesto="The horizon does most of the work. The clothing only has to keep up."
      chapters={CHAPTERS}
      productQuery="(tag:Resort OR tag:Swim OR title:linen OR title:silk) AND status:active"
      shopTitle="The Shoreline Edit"
      shopEyebrow="Resort 2026"
      outroCtas={[
        { label: "Swimwear", handle: "swimwear" },
        { label: "Women's Clothing", handle: "womens-clothing" },
        { label: "Men's Clothing", handle: "mens-clothing" },
        { label: "Shoes", handle: "shoes" },
      ]}
    />
  ),
});
