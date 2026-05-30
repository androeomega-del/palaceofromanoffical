import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemedEdit, type ThemedChapter } from "@/components/themed-edit";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import pHero from "@/assets/trends/pucci-hero.jpg";
import pC1 from "@/assets/trends/pucci-chapter-1.jpg";
import pC2 from "@/assets/trends/pucci-chapter-2.jpg";
import pC3 from "@/assets/trends/pucci-chapter-3.jpg";

const CHAPTERS: ThemedChapter[] = [
  {
    n: 0,
    src: pC1,
    eyebrow: "Chapter I",
    title: "The Sculpted Metal",
    body:
      "Round full-rim metal frames — purple on purple, rose-gold on grey. Slim temples, spring-free hinges, the kind of lightness you forget you're wearing. Worn from a marina lunch to the drive back at dusk.",
    alt: "Emilio Pucci round metal sunglasses on travertine stone.",
    spots: [
      { x: 50, y: 60, label: "The Round Metal", match: /metal.*sunglasses/i },
    ],
  },
  {
    n: 0,
    src: pC2,
    eyebrow: "Chapter II",
    title: "The Butterfly Shape",
    body:
      "Oversized butterfly silhouettes in rose-gold and burgundy — gradient lenses, sculpted brow line, a frame that flatters every angle of cheekbone. The Pucci answer to a Capri afternoon.",
    alt: "Emilio Pucci butterfly-shape sunglasses in editorial light.",
    flip: true,
    spots: [
      { x: 50, y: 45, label: "The Butterfly", match: /(rose gold|burgundy).*sunglasses/i },
    ],
  },
  {
    n: 0,
    src: pC3,
    eyebrow: "Chapter III",
    title: "The Print, Worn",
    body:
      "The Pucci print translated to acetate — multicolor swirls in turquoise, fuchsia, gold. A rectangular frame, a category-three lens, an object built for the brightest hour of the day.",
    alt: "Emilio Pucci multicolor printed acetate sunglasses on silk.",
    spots: [
      { x: 50, y: 55, label: "The Print", match: /multicolor.*sunglasses/i },
    ],
  },
];

export const Route = createFileRoute("/trends/pucci-eyewear")({
  head: () => {
    const title = "Pucci Eyewear: The Riviera Lens | Palace of Roman";
    const desc =
      "Emilio Pucci sunglasses — sculpted metals, oversized butterflies, the iconic multicolor print in acetate. Authentic, in stock, ready to ship.";
    const path = "/trends/pucci-eyewear";
    const image = pHero;
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
  component: PucciEyewearPage,
});

function PucciEyewearPage() {
  return (
    <ThemedEdit
      issueLabel="The Maison Edit"
      title="Pucci, The Riviera Lens."
      subtitle="Sculpted Metal · Butterfly · Multicolor Print"
      intro="Emilio Pucci's eyewear archive — the print translated to acetate, the silhouette of an Italian summer cast in metal. Built for the brightest hour, packed for the trip you haven't booked yet."
      heroN={0}
      heroSrc={pHero}
      heroAlt="Pucci editorial — butterfly sunglasses on a Capri terrace at golden hour."
      manifesto="Emilio Pucci dressed the jet set in print. The eyewear keeps that promise — a piece of the Riviera you can wear at any altitude."
      chapters={CHAPTERS}
      productQuery='vendor:"Emilio Pucci"'
      shopTitle="Shop the Pucci Edit"
      shopEyebrow="The Frames"
      outroCtas={[
        { label: "All Sunglasses", handle: "womens-sunglasses" },
        { label: "Accessories", handle: "womens-accessories" },
      ]}
      extra={
        <section className="border-t border-ink/10 py-12 text-center px-6 bg-canvas">
          <Link
            to="/brand/$vendor"
            params={{ vendor: "emilio-pucci" }}
            className="px-7 py-3 bg-ink text-canvas text-[11px] uppercase tracking-[0.3em] inline-block hover:bg-bronze transition-colors"
          >
            Shop All Pucci →
          </Link>
        </section>
      }
    />
  );
}
