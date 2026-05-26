import { createFileRoute, Link } from "@tanstack/react-router";
import { CraftsmanshipArticle } from "@/components/craftsmanship-article";
import { routeHead, articleJsonLd, SITE_NAME } from "@/lib/seo";

const PATH = "/journal/style/luxury-sneakers-as-modern-tailoring";
const TITLE = "Luxury Sneakers as Modern Tailoring";
const DESC =
  "How the designer sneaker became the cornerstone of an off-duty wardrobe — and how to wear it without losing the room. A guide to construction, proportion, and the houses still doing it well.";

export const Route = createFileRoute("/journal/style/luxury-sneakers-as-modern-tailoring")({
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
              datePublished: "2026-05-23T09:00:00Z",
              dateModified: "2026-05-26T09:00:00Z",
              articleSection: "Style",
              about: [
                { path: "/collections/luxury-sneakers", name: "Luxury Sneakers" },
                { path: "/collections/designer-mens-shirts", name: "Designer Men's Shirts" },
                { path: "/collections/designer-belts", name: "Designer Belts" },
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
      dek="The luxury sneaker has quietly replaced the loafer as the daily shoe of well-dressed men. A short brief on what to look for, what to avoid, and how to build the wardrobe around it."
      readingMinutes={10}
      body={
        <>
          <p>
            Ten years ago a sneaker with a designer name still felt like a costume piece — a Sunday
            shoe at best, a statement at worst. Today it is the most-worn item in most luxury
            wardrobes. The shift is partly cultural, partly practical: the rise of softer tailoring,
            unstructured jackets and pleated trousers has created a uniform that asks for a quieter
            shoe, not a louder one. Done correctly, a pair of well-cut leather sneakers does for a
            modern outfit what a Goodyear-welted derby once did — it grounds it.
          </p>

          <h2>The two construction methods that matter</h2>
          <p>
            Luxury sneakers are usually made one of two ways: <strong>cup-soled</strong>, where the
            upper is stitched and glued into a moulded rubber unit, and{" "}
            <strong>vulcanised</strong>, where the rubber is bonded under heat directly to the
            upper. Cup soles (Common Projects, Maison Margiela, Tod's No_Code) hold their shape
            for years and can be resoled by a specialist. Vulcanised builds (Saint Laurent SL/10,
            Lanvin DDB1) are softer underfoot but flex more aggressively at the toe-box. Both are
            legitimate; what you should avoid is a glued construction with no visible welt or
            cup — those fail in months.
          </p>

          <h2>Proportion is the whole conversation</h2>
          <p>
            The single mistake that ruins a luxury sneaker outfit is breaking the line of the
            trouser at the wrong place. The shoe should sit cleanly under a half-break trouser, with
            no more than a finger of sock showing during stride. Wide-leg pleated trousers want a
            cleaner, lower-profile silhouette (Margiela Replica, Brunello Cucinelli low-tops). Slim
            tailored trousers can carry a slightly chunkier sole (Lanvin Curb, Balenciaga Track).
          </p>

          <h2>Colour is the second conversation</h2>
          <p>
            White leather is the universal solvent — it goes with grey flannel, cream linen, navy
            cotton, dark denim, almost anything. Black is more difficult than people think: it
            reads formal and asks for a softer trouser, never a chino. Off-white, bone, and pale
            taupe are the colours that look the most considered and photograph the best. Coloured
            soles and metallic accents date faster than anything else in the category.
          </p>

          <h2>The houses doing it properly</h2>
          <p>
            <strong>Common Projects</strong> remains the reference for an unbranded, well-cut
            leather sneaker — the gold-stamped serial number on the heel is the entire branding.{" "}
            <strong>Saint Laurent</strong> builds its SL/10 and Andy lines in a small factory in
            Veneto with vegetable-tanned leather that ages noticeably over the first year.{" "}
            <strong>Maison Margiela</strong> Replica trainers are sourced from a discontinued
            German army training shoe and reissued unchanged — the patina you see in store is
            applied by hand, piece by piece. <strong>Tod's</strong> and <strong>Brunello
            Cucinelli</strong> approach the category from the opposite direction, building a
            sneaker with the construction logic of a driving moccasin.
          </p>

          <h2>Building the wardrobe around the shoe</h2>
          <p>
            A pair of clean leather sneakers wants three things from the rest of the outfit: a
            shirt with enough body to hold its own shape, a trouser cut for clean break, and a
            belt that disappears. The mistake is wearing them with overly-decorated pieces.
            Start with a well-cut button-down from the{" "}
            <Link to="/collections/designer-mens-shirts">designer men's shirts</Link> edit, a
            considered belt from the <Link to="/collections/designer-belts">designer belts</Link>{" "}
            collection, and finish with a pair from the{" "}
            <Link to="/collections/luxury-sneakers">luxury sneakers</Link> selection. The total
            silhouette should be quieter than the sum of its parts.
          </p>

          <h2>A short note on care</h2>
          <p>
            Wipe leather uppers with a slightly damp cloth after each wear and condition with a
            neutral cream every six to eight weeks. Cedar shoe trees are not strictly necessary
            for sneakers, but rotating between two pairs is — the foam midsoles need 24 hours to
            decompress. Suede sneakers want a soft brush, a protective spray before first wear, and
            no contact with water if possible.
          </p>

          <h2>Where to begin</h2>
          <p>
            The{" "}
            <Link to="/collections/luxury-sneakers">luxury sneakers</Link> edit is the right place
            to start — every pair is from a house with an established sneaker line and a
            constructional argument behind it. Pair with a piece from the{" "}
            <Link to="/collections/designer-mens-shirts">men's shirts</Link> collection and a belt
            from the <Link to="/collections/designer-belts">designer belts</Link> selection for
            the full silhouette.
          </p>
        </>
      }
      related={[
        { to: "/collections/luxury-sneakers", label: "Luxury Sneakers" },
        { to: "/collections/designer-mens-shirts", label: "Designer Men's Shirts" },
        { to: "/collections/designer-belts", label: "Designer Belts" },
      ]}
    />
  );
}
