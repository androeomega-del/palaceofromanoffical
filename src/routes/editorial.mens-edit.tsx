import { createFileRoute } from "@tanstack/react-router";
import { EditorialStory, type StorySlide } from "@/components/editorial-story";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";

const SLIDES: StorySlide[] = [
  { n: 73, caption: "A jacket that earns its weight.", shopHandle: "mens-clothing", shopLabel: "Shop Men's" },
  { n: 74, caption: "Trouser, broken at the shoe." },
  { n: 75, caption: "The shirt, unbuttoned by one.", shopHandle: "mens-clothing" },
  { n: 76, caption: "Leather, lived in.", shopHandle: "mens-shoes", shopLabel: "Shop Shoes" },
  { n: 77, caption: "Knitwear, weighted." },
  { n: 78, caption: "A bag for the long day.", shopHandle: "mens-bags-wallets", shopLabel: "Shop Bags" },
  { n: 79, caption: "Coat over the arm." },
  { n: 80, caption: "The watch, simple.", shopHandle: "mens-accessories", shopLabel: "Shop Accessories" },
  { n: 81, caption: "Sneaker, white, kept clean.", shopHandle: "mens-sneakers", shopLabel: "Shop Sneakers" },
  { n: 82, caption: "Sophistication, without performance." },
];

export const Route = createFileRoute("/editorial/mens-edit")({
  head: () => {
    const title = "The Men's Edit — Effortless Sophistication | Palace of Roman";
    const desc = "Tailoring, knitwear, leather and the small things — a men's edit built on restraint.";
    const path = "/editorial/mens-edit";
    const image = img(73);
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
  component: MensEditPage,
});

function MensEditPage() {
  return (
    <EditorialStory
      issueNumber="The Men's Edit"
      title="Men"
      subtitle="Effortless Sophistication"
      intro="Tailoring, knitwear, leather and the small things — clothing built on restraint, made to be lived in."
      slides={SLIDES}
      outroCtas={[
        { label: "Men's Clothing", handle: "mens-clothing" },
        { label: "Men's Shoes", handle: "mens-shoes" },
        { label: "Men's Bags", handle: "mens-bags-wallets" },
        { label: "Men's Accessories", handle: "mens-accessories" },
      ]}
    />
  );
}
