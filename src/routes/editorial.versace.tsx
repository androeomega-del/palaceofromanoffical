import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialStory, type StorySlide } from "@/components/editorial-story";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import { ShopTheStoryStrip } from "@/components/shop-the-story-strip";

const SLIDES: StorySlide[] = [
  { n: 59, caption: "Medusa, in close-up." },
  { n: 60, caption: "Baroque, restrained." },
  { n: 61, caption: "Print on print, held in tension." },
  { n: 62, caption: "Gold hardware, polished." },
  { n: 63, caption: "Silk, monogrammed." },
  { n: 64, caption: "The Versace shoe — engineered theatre." },
  { n: 65, caption: "A heel that announces itself." },
  { n: 66, caption: "Eveningwear, made for entrances." },
  { n: 67, caption: "The bag, sculpted." },
  { n: 68, caption: "In stock. Ready to ship." },
];

export const Route = createFileRoute("/editorial/versace")({
  head: () => {
    const title = "Versace — In Stock Now | Palace of Roman";
    const desc = "Versace clothing, shoes, bags and accessories — in stock and ready to ship from Palace of Roman.";
    const path = "/editorial/versace";
    const image = img(59);
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
  component: VersaceEditPage,
});

function VersaceEditPage() {
  return (
    <>
      <EditorialStory
        issueNumber="Maison Spotlight"
        title="Versace"
        subtitle="In Stock Now"
        intro="The full Versace presentation at Palace of Roman — Baroque print, gold hardware, engineered theatre. In stock and ready to ship."
        slides={SLIDES}
        outroCtas={[
          { label: "Women's Clothing", handle: "womens-clothing" },
          { label: "Men's Clothing", handle: "mens-clothing" },
          { label: "Shoes", handle: "shoes" },
          { label: "Bags", handle: "bags" },
        ]}
      />
      <section className="border-t border-ink/10 py-12 text-center px-6 bg-canvas">
        <Link
          to="/brand/$vendor"
          params={{ vendor: "versace" }}
          className="px-7 py-3 bg-ink text-canvas text-[11px] uppercase tracking-[0.3em] inline-block hover:bg-bronze transition-colors"
        >
          Shop All Versace →
        </Link>
      </section>
    </>
  );
}
