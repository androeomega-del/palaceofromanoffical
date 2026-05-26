import { createFileRoute } from "@tanstack/react-router";
import { EditorialStory, type StorySlide } from "@/components/editorial-story";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";

const SLIDES: StorySlide[] = [
  { n: 87, caption: "The bag, considered.", shopHandle: "bags", shopLabel: "Shop Bags" },
  { n: 88, caption: "Eyewear, sharp at the temple.", shopHandle: "accessories", shopLabel: "Shop Accessories" },
  { n: 89, caption: "A belt, gold at the buckle." },
  { n: 90, caption: "Silk, knotted loose.", shopHandle: "accessories" },
  { n: 91, caption: "Watch on the wrist, hours kept." },
  { n: 92, caption: "Card-holder, slim leather." },
  { n: 93, caption: "Chain, polished to a shine." },
  { n: 94, caption: "Hat, brim low." },
  { n: 95, caption: "The small things that finish a look.", shopHandle: "accessories" },
  { n: 96, caption: "Accessories — the punctuation." },
];

export const Route = createFileRoute("/editorial/accessories")({
  head: () => {
    const title = "Accessories — Shop Accessories | Palace of Roman";
    const desc = "Bags, eyewear, belts, watches and small leather goods — the small things that finish the look.";
    const path = "/editorial/accessories";
    const image = img(87);
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
  component: AccessoriesEditPage,
});

function AccessoriesEditPage() {
  return (
    <EditorialStory
      issueNumber="Accessories"
      title="Accessories"
      subtitle="Shop Accessories"
      intro="Bags, eyewear, belts, watches and small leather goods — the punctuation that finishes a look."
      slides={SLIDES}
      outroCtas={[
        { label: "Bags", handle: "bags" },
        { label: "Accessories", handle: "accessories" },
        { label: "Women's Accessories", handle: "womens-accessories-1" },
        { label: "Men's Accessories", handle: "mens-accessories" },
      ]}
    />
  );
}
