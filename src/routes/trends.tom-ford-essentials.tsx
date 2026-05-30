import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import tfHero from "@/assets/trends/tf-hero.jpg";
import tfC1 from "@/assets/trends/tf-chapter-1.jpg";
import tfC2 from "@/assets/trends/tf-chapter-2.jpg";
import tfC3 from "@/assets/trends/tf-chapter-3.jpg";

const CHAPTERS: ThemedChapter[] = [
  {
    n: 0,
    src: tfC1,
    eyebrow: "Chapter I",
    title: "Silk, Sleeveless",
    body:
      "The Tom Ford silk tank — round neck, fluid drape, label sewn discreet at the nape. Worn under a single-button blazer or alone with high-waist trousers. Pink, yellow, the colours of a Tom Ford summer.",
    alt: "Tom Ford silk sleeveless top in editorial light.",
    spots: [
      { x: 48, y: 38, label: "The Silk Tank", match: /silk.*(tank|top)/i },
    ],
  },
  {
    n: 0,
    src: tfC2,
    eyebrow: "Chapter II",
    title: "The Leather Belt",
    body:
      "Crystal-set logo buckle on black-and-white leather. The kind of belt that does the talking — paired with cigarette trousers, or knotted high over a slip dress.",
    alt: "Tom Ford crystal-buckle leather belt.",
    flip: true,
    spots: [
      { x: 52, y: 50, label: "The Belt", match: /(leather|velvet).*belt/i },
    ],
  },
  {
    n: 0,
    src: tfC3,
    eyebrow: "Chapter III",
    title: "The Private Pieces",
    body:
      "Triangle lace, satin shorts in antique pink, the intimates Tom Ford designs with the same precision as a tuxedo. Worn for one person — or for the discipline of getting dressed.",
    alt: "Tom Ford intimates and silk shorts editorial.",
    spots: [
      { x: 46, y: 55, label: "The Shorts", match: /(satin|viscose|silk).*short/i },
    ],
  },
];

export const Route = createFileRoute("/trends/tom-ford-essentials")({
  head: () => {
    const title = "Tom Ford Essentials — In Stock | Palace of Roman";
    const desc =
      "Studied sensuality from Tom Ford — silk tanks, crystal-buckle belts, satin intimates. Authentic, in stock, ready to ship.";
    const path = "/trends/tom-ford-essentials";
    const image = tfHero;
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
  component: TomFordEssentialsPage,
});

function TomFordEssentialsPage() {
  return (
    <>
      <ThemedEdit
        issueLabel="The Maison Edit"
        title="Tom Ford, Essentials."
        subtitle="Silk · Leather · Intimates — In Stock Now"
        intro="The pieces Tom Ford has been refining since 2005 — silk tanks cut for movement, leather belts engineered as jewellery, intimates designed with tailoring precision."
        heroN={0}
        heroSrc={tfHero}
        heroAlt="Tom Ford editorial — silk and skin in close detail."
        manifesto="Glamour is a discipline. Tom Ford built a house on the idea that getting dressed — slowly, deliberately — is itself a form of power."
        chapters={CHAPTERS}
        productQuery='vendor:"Tom Ford"'
        shopTitle="Shop the Tom Ford Edit"
        shopEyebrow="The Pieces"
        outroCtas={[
          { label: "Women's Clothing", handle: "womens-clothing" },
          { label: "Belts", handle: "womens-belts" },
          { label: "Underwear", handle: "womens-underwear" },
          { label: "Shoes", handle: "shoes" },
        ]}
        extra={
          <section className="border-t border-ink/10 py-12 text-center px-6 bg-canvas">
            <Link
              to="/brand/$vendor"
              params={{ vendor: "tom-ford" }}
              className="px-7 py-3 bg-ink text-canvas text-[11px] uppercase tracking-[0.3em] inline-block hover:bg-bronze transition-colors"
            >
              Shop All Tom Ford →
            </Link>
          </section>
        }
      />
    </>
  );
}
