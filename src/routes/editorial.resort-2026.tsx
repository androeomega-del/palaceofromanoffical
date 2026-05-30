import { createFileRoute } from "@tanstack/react-router";

import { EditorialStory, type StorySlide } from "@/components/editorial-story";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";

import heroImg from "@/assets/editorial/resort-2026/01-hero.jpg";
import linenImg from "@/assets/editorial/resort-2026/02-linen.jpg";
import sandalImg from "@/assets/editorial/resort-2026/03-sandal.jpg";
import shuttersImg from "@/assets/editorial/resort-2026/04-shutters.jpg";
import tonalImg from "@/assets/editorial/resort-2026/05-tonal.jpg";
import colonnadeImg from "@/assets/editorial/resort-2026/06-colonnade.jpg";
import travelImg from "@/assets/editorial/resort-2026/07-travel.jpg";
import terraceImg from "@/assets/editorial/resort-2026/08-terrace.jpg";
import loaferImg from "@/assets/editorial/resort-2026/09-loafer.jpg";
import goldenhourImg from "@/assets/editorial/resort-2026/10-goldenhour.jpg";

const SLIDES: StorySlide[] = [
  {
    n: 1,
    src: heroImg,
    alt: "Woman in ivory column linen dress framed by a travertine archway, hard noon Mediterranean shadow",
    caption: "Light as architecture.",
    shopHandle: "womens-clothing",
    shopLabel: "Shop Women's",
  },
  {
    n: 2,
    src: linenImg,
    alt: "Ecru linen shirt cuff resting on a sunlit travertine wall",
    caption: "The weave of the linen, considered.",
    shopHandle: "mens-clothing",
    shopLabel: "Shop Men's",
  },
  {
    n: 3,
    src: sandalImg,
    alt: "Bronze leather flat sandal on a sun-warmed travertine step",
    caption: "Bronze leather. Travertine step.",
    shopHandle: "womens-shoes",
    shopLabel: "Shop Sandals",
  },
  {
    n: 4,
    src: shuttersImg,
    alt: "Woman in ivory silk blouse in profile, late afternoon light through louvered shutters",
    caption: "Late afternoon, through the shutters.",
    shopHandle: "womens-clothing",
  },
  {
    n: 5,
    src: tonalImg,
    alt: "Sand-coloured cashmere knit against a matching limestone wall in golden light",
    caption: "Tonal study — sand on sand.",
    shopHandle: "womens-clothing",
    shopLabel: "Shop Knitwear",
  },
  {
    n: 6,
    src: colonnadeImg,
    alt: "Man in unstructured ivory linen suit walking through a travertine colonnade",
    caption: "Resort tailoring, in the colonnade.",
    shopHandle: "mens-clothing",
  },
  {
    n: 7,
    src: travelImg,
    alt: "Tan leather weekender bag on a bleached terrazzo floor at a stone threshold",
    caption: "A weekender, set down at the door.",
    shopHandle: "womens-bags",
    shopLabel: "Shop Bags",
  },
  {
    n: 8,
    src: terraceImg,
    alt: "Woman in loose ivory linen at an open shuttered terrace overlooking the Mediterranean",
    caption: "Loose linen, salt air, open shutters.",
    shopHandle: "womens-clothing",
  },
  {
    n: 9,
    src: loaferImg,
    alt: "Polished dark brown leather penny loafer on warm terracotta tile, long crisp shadow",
    caption: "Footwear without ceremony.",
    shopHandle: "mens-shoes",
    shopLabel: "Shop Men's Shoes",
  },
  {
    n: 10,
    src: goldenhourImg,
    alt: "Ivory linen drape lifting against an ochre lime-washed wall, cobalt sea through an arched window",
    caption: "End of the long day.",
  },
];

export const Route = createFileRoute("/editorial/resort-2026")({
  head: () => {
    const title = "Resort 2026 — Light as Architecture | Palace of Roman";
    const desc =
      "Resort 2026: a quiet study of cut and shade across the season's most considered pieces, photographed in late Mediterranean light.";
    const path = "/editorial/resort-2026";
    const image = heroImg;
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
  component: ResortPage,
});

function ResortPage() {
  return (
    <EditorialStory
      issueNumber="Issue No. 07"
      title="Resort 2026"
      subtitle="Light as Architecture"
      intro="A study of cut and shade across the season's most considered resort pieces, photographed in the late Mediterranean light."
      slides={SLIDES}
    />
  );
}
