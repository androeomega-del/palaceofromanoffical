import { createFileRoute } from "@tanstack/react-router";
import { EditorialStory, type StorySlide } from "@/components/editorial-story";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";

const SLIDES: StorySlide[] = [
  { n: 31, caption: "Sun, salt, and a clean cut.", shopHandle: "swimwear", shopLabel: "Shop Swim" },
  { n: 32, caption: "Shorts cut for long afternoons.", shopHandle: "mens-clothing", shopLabel: "Shop Men's" },
  { n: 33, caption: "Linen, loose at the shoulder.", shopHandle: "mens-clothing" },
  { n: 34, caption: "The pool deck, unhurried." },
  { n: 35, caption: "A printed brief, a quiet swagger.", shopHandle: "swimwear", shopLabel: "Shop Swim" },
  { n: 36, caption: "Slides, sun, nothing else.", shopHandle: "mens-shoes", shopLabel: "Shop Sandals" },
  { n: 37, caption: "Polo, pressed by hand." },
  { n: 38, caption: "Light cotton, late light.", shopHandle: "mens-clothing" },
  { n: 39, caption: "Eyes shaded, signature gold.", shopHandle: "mens-accessories", shopLabel: "Shop Accessories" },
  { n: 40, caption: "End of season, beginning of the next." },
];

export const Route = createFileRoute("/editorial/summer-edit")({
  head: () => {
    const title = "The Summer Edit — Men's Shorts & Resort | Palace of Roman";
    const desc = "Men's swim, shorts, and resort tailoring — in stock and ready for the season.";
    const path = "/editorial/summer-edit";
    const image = img(31);
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
  component: SummerEditPage,
});

function SummerEditPage() {
  return (
    <EditorialStory
      issueNumber="The Summer Edit"
      title="Shorts & Resort"
      subtitle="Men's — In Stock"
      intro="Swim, shorts, and resort tailoring. Cut for heat and long afternoons, in stock and ready to ship."
      slides={SLIDES}
      outroCtas={[
        { label: "Swimwear", handle: "swimwear" },
        { label: "Men's Clothing", handle: "mens-clothing" },
        { label: "Men's Shoes", handle: "mens-shoes" },
        { label: "Men's Accessories", handle: "mens-accessories" },
      ]}
    />
  );
}
