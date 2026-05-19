import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EditorialStory, type StorySlide } from "@/components/editorial-story";
import { img } from "@/lib/editorial-library";
import { routeHead } from "@/lib/seo";

const SLIDES: StorySlide[] = [
  { n: 34, caption: "Eveningwear, restated.", shopHandle: "womens-clothing", shopLabel: "Shop Women's" },
  { n: 36, caption: "Soft tailoring.", shopHandle: "womens-clothing" },
  { n: 38, caption: "The slip, refined.", shopHandle: "womens-clothing", shopLabel: "Shop Dresses" },
  { n: 40, caption: "Black, but warmer." },
  { n: 42, caption: "A heel that walks.", shopHandle: "womens-shoes", shopLabel: "Shop Heels" },
  { n: 44, caption: "Dinner, then nowhere in particular.", shopHandle: "mens-clothing", shopLabel: "Shop Men's" },
  { n: 46, caption: "Smoking, rewritten.", shopHandle: "mens-clothing" },
  { n: 48, caption: "Leather, broken in." },
  { n: 50, caption: "The quiet final hour.", shopHandle: "mens-shoes", shopLabel: "Shop Men's Shoes" },
  { n: 52, caption: "Lights out." },
];

export const Route = createFileRoute("/editorial/the-new-evening")({
  head: () => ({
    meta: [
      { title: "The New Evening — Editorial | Palace of Roman" },
      {
        name: "description",
        content:
          "The New Evening: eveningwear, restated. Soft tailoring, fluid surfaces and a quieter relationship with formality.",
      },
      { property: "og:title", content: "The New Evening — Editorial" },
      {
        property: "og:description",
        content: "Eveningwear, restated. Soft tailoring and a quieter relationship with formality.",
      },
      { property: "og:image", content: img(34) },
      { property: "og:url", content: "/editorial/the-new-evening" },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "/editorial/the-new-evening" }],
  }),
  component: NewEveningPage,
});

function NewEveningPage() {
  return (
    <>
      <SiteHeader />
      <EditorialStory
        issueNumber="Issue No. 06"
        title="The New Evening"
        subtitle="Eveningwear, restated"
        intro="Soft tailoring, fluid surfaces and a quieter relationship with formality — the way the season is actually being worn after dark."
        slides={SLIDES}
      />
      <SiteFooter />
    </>
  );
}
