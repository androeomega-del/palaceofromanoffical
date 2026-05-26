import { createFileRoute, Link } from "@tanstack/react-router";
import { CraftsmanshipArticle } from "@/components/craftsmanship-article";
import { routeHead, articleJsonLd, SITE_NAME } from "@/lib/seo";

const PATH = "/journal/craftsmanship/made-in-italy-vs-designed-in-italy";
const TITLE = "Made in Italy vs Designed in Italy — What the Label Really Means";
const DESC =
  "A short lesson on country-of-origin law for luxury goods, what's actually enforceable, and how to read the label so you know what you're paying for.";

export const Route = createFileRoute("/journal/craftsmanship/made-in-italy-vs-designed-in-italy")({
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
              datePublished: "2026-05-14T09:00:00Z",
              dateModified: "2026-05-26T09:00:00Z",
              articleSection: "Craftsmanship",
              about: [
                { path: "/collections/italian-leather-wallets", name: "Italian Leather Wallets" },
                { path: "/collections/italian-leather-handbags", name: "Italian Leather Handbags" },
                { path: "/collections/designer-mens-shirts", name: "Designer Men's Shirts" },
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
      eyebrow="Craftsmanship"
      title={TITLE}
      dek="Two phrases that look almost identical and mean entirely different things. A guide to country-of-origin law for luxury buyers."
      readingMinutes={6}
      body={
        <>
          <p>
            Walk through any boutique in Milan or any luxury floor in New York and you will see two phrases printed,
            embossed, or stitched onto labels: <em>Made in Italy</em> and <em>Designed in Italy</em>. They look like
            close cousins. Legally, and practically, they are not related at all.
          </p>

          <h2>"Made in Italy" is a regulated phrase</h2>
          <p>
            Under EU and Italian law (specifically Law 8/2013, building on EU customs rules), a product can only be
            labelled <em>Made in Italy</em> when the last <strong>substantial transformation</strong> happened in Italy.
            For a leather wallet or a handbag that means the cutting of the hide, the assembly, the stitching, the edge
            finishing, and the quality control all take place on Italian soil. For tailoring it means the construction of
            the garment — pattern cutting, sewing, pressing — happens in Italy, not just the final button or label.
          </p>
          <p>
            Customs enforces this. Misrepresenting origin is a fraud offence in Italy with real consequences; the
            Guardia di Finanza seizes counterfeit-origin goods every week. When a brand prints <em>Made in Italy</em> on
            a Ferragamo loafer or a Loro Piana sweater, they are committing to that chain of work.
          </p>

          <h2>"Designed in Italy" means almost nothing</h2>
          <p>
            <em>Designed in Italy</em>, <em>Styled in Italy</em>, <em>Italian design</em>, and the vaguer <em>From Italy</em>
            are all marketing phrases. None are legally protected. A piece can be designed in a studio in Florence,
            manufactured in Vietnam or Bangladesh, and still carry one of those phrases on the label.
          </p>
          <p>
            This isn't necessarily bad. Some great Italian houses operate factories in eastern Europe or north Africa
            with the same quality control as their domestic ateliers, and the result is excellent. But you are paying for
            design — for a name — not for Italian craftsmanship. That distinction matters when the price is four figures.
          </p>

          <h2>Where the law gets quiet</h2>
          <p>
            EU rules require the country of manufacture to appear on the product or its packaging, but enforcement on
            small leather goods is uneven. A wallet may have its true origin stamped only on a removable paper tag. If
            you're buying secondhand or in a market, look for the country of origin embossed into the leather or sewn
            into a permanent seam — that's the version a brand can't easily walk back.
          </p>

          <h2>The honest reading</h2>
          <p>
            <em>Made in Italy</em> — Italian materials, Italian hands, Italian quality control. Worth a premium.{" "}
            <em>Made in EU</em> — usually Italy, Romania, or Portugal, often to the same houses' specifications.
            Frequently excellent.{" "}
            <em>Designed in Italy</em> — Italian aesthetic, manufactured elsewhere. Judge by the piece, not the line.
          </p>
          <p>
            Every product on{" "}
            <Link to="/collections/italian-leather-wallets">our Italian leather pages</Link> carries the country of
            origin in the description, taken from the manufacturer's own declaration to our authorised distributor. If a
            piece is made outside Italy we say so — it's the only honest way to sell at this level. Read more on{" "}
            <Link to="/authentication">how we authenticate</Link>.
          </p>
        </>
      }
      related={[
        { to: "/collections/italian-leather-wallets", label: "Italian Leather Wallets" },
        { to: "/collections/italian-leather-handbags", label: "Italian Leather Handbags" },
        { to: "/collections/designer-mens-shirts", label: "Designer Men's Shirts" },
      ]}
    />
  );
}
