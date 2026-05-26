import { createFileRoute } from "@tanstack/react-router";
import { EditorialStory, type StorySlide } from "@/components/editorial-story";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";

const SLIDES: StorySlide[] = [
  { n: 45, caption: "A line, drawn cleanly.", shopHandle: "womens-clothing", shopLabel: "Shop Women's" },
  { n: 46, caption: "Silk, in motion.", shopHandle: "womens-clothing" },
  { n: 47, caption: "Sandal, sun, stone.", shopHandle: "womens-shoes", shopLabel: "Shop Shoes" },
  { n: 48, caption: "The dress that travels.", shopHandle: "womens-clothing" },
  { n: 49, caption: "Bag in hand, nothing rushed.", shopHandle: "womens-bags", shopLabel: "Shop Bags" },
  { n: 50, caption: "Tailoring, softened." },
  { n: 51, caption: "Heel and hem, considered.", shopHandle: "womens-shoes" },
  { n: 52, caption: "Cotton, linen, breath.", shopHandle: "womens-clothing" },
  { n: 53, caption: "Gold, but quietly.", shopHandle: "womens-accessories-1", shopLabel: "Shop Accessories" },
  { n: 54, caption: "An evening that begins slowly." },
];

export const Route = createFileRoute("/editorial/womens-edit")({
  head: () => {
    const title = "The Women's Edit — Shop the Edit | Palace of Roman";
    const desc = "Curated women's clothing, shoes, bags, and accessories from the season's most considered houses.";
    const path = "/editorial/womens-edit";
    const image = img(45);
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
  component: WomensEditPage,
});

function WomensEditPage() {
  return (
    <EditorialStory
      issueNumber="The Women's Edit"
      title="Women"
      subtitle="Shop the Edit"
      intro="A season of considered cuts — clothing, shoes, bags and the small things that finish the look."
      slides={SLIDES}
      outroCtas={[
        { label: "Women's Clothing", handle: "womens-clothing" },
        { label: "Women's Shoes", handle: "womens-shoes" },
        { label: "Women's Bags", handle: "womens-bags" },
        { label: "Women's Accessories", handle: "womens-accessories-1" },
      ]}
    />
  );
}
