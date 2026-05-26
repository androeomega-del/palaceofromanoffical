import { createFileRoute, Link } from "@tanstack/react-router";
import { CraftsmanshipArticle } from "@/components/craftsmanship-article";
import { routeHead, articleJsonLd, SITE_NAME } from "@/lib/seo";

const PATH = "/journal/style/the-investment-sunglasses-edit";
const TITLE = "The Investment Sunglasses Edit — Frames That Outlast a Trend";
const DESC =
  "A considered guide to designer sunglasses worth keeping: acetate vs metal, face geometry, lens quality, and the maisons that still cut frames properly.";

export const Route = createFileRoute("/journal/style/the-investment-sunglasses-edit")({
  head: () => {
    const rh = routeHead({ path: PATH, title: `${TITLE} — ${SITE_NAME}`, description: DESC, type: "article" });
    return {
      meta: [{ title: `${TITLE} — ${SITE_NAME}` }, { name: "description", content: DESC }, ...rh.meta],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            articleJsonLd({
              headline: TITLE,
              description: DESC,
              path: PATH,
              datePublished: "2026-05-22T09:00:00Z",
              dateModified: "2026-05-26T09:00:00Z",
              articleSection: "Style",
              about: [
                { path: "/collections/designer-sunglasses", name: "Designer Sunglasses" },
                { path: "/collections/italian-leather-handbags", name: "Italian Leather Handbags" },
              ],
            }),
          ),
        },
      ],
    };
  },
  component: Page,
});

function Page() {
  return (
    <CraftsmanshipArticle
      eyebrow="Style"
      title={TITLE}
      dek="Sunglasses are the smallest piece of a wardrobe and, season for season, the one most often bought badly. A short field guide to choosing frames you'll still want in ten years."
      readingMinutes={9}
      body={
        <>
          <p>
            Few categories in luxury have been more diluted by trend cycles than eyewear. A frame that
            cost €380 last year quietly disappears from the next collection, replaced by a slimmer
            silhouette, a different bridge, a new colourway designed to make the previous one feel
            dated. The maisons that still take eyewear seriously — Cartier, Tom Ford, Saint Laurent,
            Persol, Dior — design against that drift, not with it. Knowing what to look for is what
            separates an impulse buy from a piece that earns its place in a wardrobe.
          </p>

          <h2>The frame is the investment, not the lens</h2>
          <p>
            Polarised lenses can be re-cut at any competent optician for a fraction of the original
            price. The frame itself — the cellulose-acetate billet pressed and tumbled for weeks, or
            the Japanese β-titanium milled to micron tolerance — cannot be reproduced. That is where
            the value lives, and that is what you are paying for. Always evaluate frames first;
            lenses second.
          </p>

          <h2>Acetate or metal — and why it matters</h2>
          <p>
            Acetate is a plant-derived plastic with depth and saturation no injected polycarbonate
            can match. It warms slightly to the skin and adjusts to the shape of your head over the
            first few weeks of wear. Italian Mazzucchelli acetate is the benchmark; if the brand
            says nothing about the material, it usually isn't using it. Metal frames — titanium,
            Monel, gold-fill — are lighter and disappear on the face, but they don't forgive a poor
            fitting. Buy metal only if you can have the temples adjusted in person.
          </p>

          <h2>Geometry beats brand</h2>
          <p>
            The single best decision you can make is choosing a frame that contradicts the geometry
            of your face. Round faces are quieted by angular frames (D-frame, navigator, square
            wayfarer). Angular faces soften under round or panto shapes. A frame that simply traces
            your existing lines reads as decoration; a frame that opposes them reads as design.
          </p>

          <h2>What to check before you commit</h2>
          <ul>
            <li>
              Bridge fit — the frame should sit on the bridge of the nose without pinching, and the
              pads should not leave a deep mark after twenty minutes of wear.
            </li>
            <li>
              Temple length — the arm should follow the side of the head and curl behind the ear,
              not stop at it. A frame that lifts off your ear is too short.
            </li>
            <li>
              Lens curvature — flat lenses photograph well but distort peripheral vision. A subtle
              6- to 8-base curve is the sweet spot for everyday wear.
            </li>
            <li>
              Hinge — pin hinges (visible barrel) on acetate, spring hinges on metal. A glued hinge
              on a €400 frame is a refusal to engineer the product properly.
            </li>
          </ul>

          <h2>The houses worth knowing</h2>
          <p>
            <strong>Cartier</strong> still produces its Santos and Première frames with brushed
            18-karat finishes and screw-set temples that can be serviced indefinitely.{" "}
            <strong>Tom Ford</strong> builds its acetate frames in Italy with deeply polished
            surfaces and the unmistakable T-bar temple.{" "}
            <strong>Saint Laurent</strong> remains the reference for clean, oversize silhouettes —
            the SL 276 Mica is the modern descendant of a frame Yves himself wore.{" "}
            <strong>Persol</strong>, founded in Turin in 1917, is the only major eyewear house to
            still hand-finish every Meflecto temple in its own factory.{" "}
            <strong>Dior</strong> and <strong>Versace</strong> have both invested heavily in
            archive-led collections — frames designed to outlast the season they were released in.
          </p>

          <h2>Care, briefly</h2>
          <p>
            Keep frames in the case they came in — not on your head when not in use, which is the
            single most common cause of a stretched bridge. Clean lenses with the supplied
            microfibre and a drop of dish soap; never use a shirt tail (the weave is abrasive
            enough to scratch an anti-reflective coating in months). If a hinge loosens, walk
            them into the boutique — the houses listed above will tighten or replace it without
            charge.
          </p>

          <h2>Where to begin</h2>
          <p>
            Our edit is small by design — every frame has been chosen for the four checks above.
            Start with the{" "}
            <Link to="/collections/designer-sunglasses">designer sunglasses edit</Link>, then
            consider the matching pieces in{" "}
            <Link to="/collections/accessories">accessories</Link> and the leather goods in the{" "}
            <Link to="/collections/italian-leather-handbags">Italian leather handbags</Link>{" "}
            collection.
          </p>
        </>
      }
      related={[
        { to: "/collections/designer-sunglasses", label: "Designer Sunglasses" },
        { to: "/collections/accessories", label: "Accessories" },
        { to: "/collections/italian-leather-handbags", label: "Italian Leather Handbags" },
      ]}
    />
  );
}
