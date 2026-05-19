import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EditorialStory, type StorySlide } from "@/components/editorial-story";
import { img } from "@/lib/editorial-library";
import { routeHead } from "@/lib/seo";

const SLIDES: StorySlide[] = [
  { n: 12, caption: "Light as architecture.", shopHandle: "womens-clothing", shopLabel: "Shop Women's" },
  { n: 14, caption: "Linen, considered.", shopHandle: "womens-clothing", shopLabel: "Shop Women's" },
  { n: 16, caption: "Sandal and stone.", shopHandle: "womens-shoes", shopLabel: "Shop Sandals" },
  { n: 18, caption: "Late afternoon shade.", shopHandle: "womens-clothing" },
  { n: 20, caption: "Tonal study — sand on sand.", shopHandle: "mens-clothing", shopLabel: "Shop Men's" },
  { n: 22, caption: "Resort tailoring.", shopHandle: "mens-clothing" },
  { n: 24, caption: "Travel cases, slowly opened.", shopHandle: "high-discounts", shopLabel: "Shop the Sale" },
  { n: 26, caption: "Loose cotton, salt air." },
  { n: 28, caption: "Footwear without ceremony.", shopHandle: "mens-shoes", shopLabel: "Shop Men's Shoes" },
  { n: 30, caption: "End of the long day." },
];

export const Route = createFileRoute("/editorial/resort-2026")({
  head: () => {
    const title = "Resort 2026 — Light as Architecture | Palace of Roman";
    const desc = "Resort 2026: a quiet study of cut and shade across the season's most considered pieces, photographed in late Mediterranean light.";
    const rh = routeHead({ path: "/editorial/resort-2026", title, description: desc, image: img(12), type: "article" });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
    };
  },
  component: ResortPage,
});

function ResortPage() {
  return (
    <>
      <SiteHeader />
      <EditorialStory
        issueNumber="Issue No. 07"
        title="Resort 2026"
        subtitle="Light as Architecture"
        intro="A study of cut and shade across the season's most considered resort pieces, photographed in the late Mediterranean light."
        slides={SLIDES}
      />
      <SiteFooter />
    </>
  );
}
