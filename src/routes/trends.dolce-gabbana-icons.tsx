import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import dgHero from "@/assets/trends/dg-hero.jpg";
import dgC1 from "@/assets/trends/dg-chapter-1.jpg";
import dgC2 from "@/assets/trends/dg-chapter-2.jpg";
import dgC3 from "@/assets/trends/dg-chapter-3.jpg";

const CHAPTERS: ThemedChapter[] = [
  {
    n: 0,
    src: dgC1,
    eyebrow: "Chapter I",
    title: "The Sicilian Black Lace",
    body:
      "Floral lace cut close to the body — the silhouette Domenico and Stefano have refined for three decades. Worn under a tailored blazer at noon, alone after dark.",
    alt: "Dolce & Gabbana black floral lace dress in editorial light.",
    spots: [
      { x: 36, y: 52, label: "The Dress", match: /lace|sicily|floral.*sheath/i },
    ],
  },
  {
    n: 0,
    src: dgC2,
    eyebrow: "Chapter II",
    title: "Baroque, Buttoned",
    body:
      "Print on print, held in tension by Italian tailoring. The Dolce & Gabbana suit asks the room to slow down — gold buttons, double-breasted cut, the patterned silk lining only you know is there.",
    alt: "Dolce & Gabbana baroque-print double-breasted suit.",
    flip: true,
    spots: [
      { x: 60, y: 45, label: "The Suit", match: /(double.?breasted|baroque|brocade).*(blazer|jacket|suit)/i },
    ],
  },
  {
    n: 0,
    src: dgC3,
    eyebrow: "Chapter III",
    title: "Crystal & Cocktail",
    body:
      "The Star Collection sheath — Swarovski hand-set across stretch silk, the kind of dress that ends an evening or begins one. One of one, in stock now.",
    alt: "Dolce & Gabbana crystal-embellished cocktail dress.",
    spots: [
      { x: 50, y: 48, label: "The Star Dress", match: /(crystal|swarovski|sequin|embellish).*dress/i },
    ],
  },
];

export const Route = createFileRoute("/trends/dolce-gabbana-icons")({
  head: () => {
    const title = "Dolce & Gabbana Icons — In Stock | Palace of Roman";
    const desc =
      "The Dolce & Gabbana pieces that define the maison — Sicilian lace, baroque tailoring, crystal eveningwear. Authentic, in stock, ready to ship.";
    const path = "/trends/dolce-gabbana-icons";
    const image = dgHero;
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
  component: DolceGabbanaIconsPage,
});

function DolceGabbanaIconsPage() {
  return (
    <>
      <ThemedEdit
        issueLabel="The Maison Edit"
        title="Dolce & Gabbana, Iconic."
        subtitle="Sicily · Baroque · Crystal — In Stock Now"
        intro="The pieces that define Domenico and Stefano's house — pulled from the mainline collection, authenticated, and ready to ship through our authorised boutique network."
        heroN={0}
        heroSrc={dgHero}
        heroAlt="Dolce & Gabbana editorial — Sicilian baroque in close detail."
        manifesto="Romance is a discipline. Dolce & Gabbana have spent forty years proving it — in lace, in print, in the weight of a single crystal sewn by hand."
        chapters={CHAPTERS}
        productQuery='vendor:"Dolce & Gabbana"'
        shopTitle="Shop the D&G Edit"
        shopEyebrow="The Pieces"
        outroCtas={[
          { label: "Women's Clothing", handle: "womens-clothing" },
          { label: "Men's Clothing", handle: "mens-clothing" },
          { label: "Bags", handle: "bags" },
          { label: "Shoes", handle: "shoes" },
        ]}
        extra={
          <section className="border-t border-ink/10 py-12 text-center px-6 bg-canvas">
            <Link
              to="/brand/$vendor"
              params={{ vendor: "dolce-gabbana" }}
              className="px-7 py-3 bg-ink text-canvas text-[11px] uppercase tracking-[0.3em] inline-block hover:bg-bronze transition-colors"
            >
              Shop All Dolce &amp; Gabbana →
            </Link>
          </section>
        }
      />
    </>
  );
}
