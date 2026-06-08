import { createFileRoute, Link } from "@tanstack/react-router";
import { CraftsmanshipArticle } from "@/components/craftsmanship-article";
import { routeHead, articleJsonLd, SITE_NAME } from "@/lib/seo";

const PATH = "/journal/craftsmanship/understanding-the-made-in-italy-label";
const TITLE = "Understanding the Made in Italy Label — A Buyer's Reference";
const DESC =
  "The legal definition behind authentic Italian luxury manufacturing — what the Made in Italy mark requires, who enforces it, and how to read it on a wallet, handbag, or shoe before you spend.";

export const Route = createFileRoute(
  "/journal/craftsmanship/understanding-the-made-in-italy-label",
)({
  head: () => {
    const rh = routeHead({
      path: PATH,
      title: `${TITLE} — ${SITE_NAME}`,
      description: DESC,
      type: "article",
    });
    return {
      meta: [
        { title: `${TITLE} — ${SITE_NAME}` },
        { name: "description", content: DESC },
        ...rh.meta,
      ],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            articleJsonLd({
              headline: TITLE,
              description: DESC,
              path: PATH,
              datePublished: "2026-06-08T09:00:00Z",
              dateModified: "2026-06-08T09:00:00Z",
              articleSection: "Craftsmanship",
              about: [
                { path: "/collections/italian-leather-wallets", name: "Italian Leather Wallets" },
                { path: "/collections/italian-leather-handbags", name: "Italian Leather Handbags" },
                { path: "/authentication", name: "Authentication" },
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
      dek="A short, plain-language reference for the most contested four words in luxury manufacturing — what the Made in Italy label legally guarantees, and what it doesn't."
      readingMinutes={7}
      body={
        <>
          <p>
            Four words carry more pricing power in luxury than almost any other phrase on a
            label: <em>Made in Italy</em>. They sit on the spine of a Bottega wallet, the inner
            lining of a Loro Piana jacket, the underside of a Tod's loafer. They are also, more
            than buyers realise, a regulated legal claim with a specific definition and a
            specific enforcement body behind it.
          </p>

          <h2>The legal definition</h2>
          <p>
            Italian Law 8/2013, layered on top of EU customs rules (Regulation 952/2013, Article
            60), restricts <em>Made in Italy</em> to goods whose <strong>last substantial
            transformation</strong> took place on Italian soil. For a handbag or wallet this
            means the cutting of the hide, the construction, the stitching, and the edge
            finishing all happen in Italy. For ready-to-wear it means the pattern cutting,
            sewing, and pressing. Importing finished goods and stitching on a label does not
            qualify and is treated as commercial fraud.
          </p>
          <p>
            Enforcement sits with the Guardia di Finanza. Seizures of mislabelled goods are
            published quarterly and run into the millions of euro each year. For an authorised
            European boutique to ship an item described as Italian-made, the supply chain has
            to be documented back to the Italian atelier or factory.
          </p>

          <h2>What the label has to disclose</h2>
          <p>
            EU consumer law (Regulation 2024/3110 and its predecessors) requires the country of
            manufacture to appear on the product or its packaging. On fine leather goods that
            disclosure is usually one of the following:
          </p>
          <ul>
            <li>An embossed <em>Made in Italy</em> stamp on the inner leather of a wallet or bag.</li>
            <li>A stitched label inside a garment or the tongue of a shoe.</li>
            <li>A foil-printed origin line on the dust bag or care card for small leather goods.</li>
          </ul>
          <p>
            A removable paper hangtag is the weakest of these. The version embossed or sewn
            into the piece itself is the one a brand cannot quietly walk back later.
          </p>

          <h2>Made in Italy vs adjacent phrases</h2>
          <p>
            Several phrases look related and are not legally equivalent.{" "}
            <Link to="/journal/craftsmanship/made-in-italy-vs-designed-in-italy">
              <em>Designed in Italy</em>, <em>Italian design</em>, and <em>Styled in Italy</em>
            </Link>{" "}
            are marketing language — none commit the manufacturer to Italian production.{" "}
            <em>Made in EU</em> usually means Italy, Portugal, or Romania, often to the same
            houses' specifications and frequently excellent, but it is a wider claim. Only{" "}
            <em>Made in Italy</em> guarantees the chain of Italian work the price implies.
          </p>

          <h2>What it does not guarantee</h2>
          <p>
            The label says where the substantial transformation happened. It does not certify
            the hide's country of tanning, the thread, the hardware, or the lining. A Tuscan
            atelier can lawfully use Spanish or German hardware on a Made in Italy wallet — and
            most do. For the tanning itself, the relevant marks are the{" "}
            <strong>Pelle Conciata al Vegetale in Toscana</strong> consortium stamp and the
            <strong> Vera Pelle Italiana</strong> trademark; read more in our companion piece
            on the{" "}
            <Link to="/journal/craftsmanship/the-art-of-italian-leather-tanning">
              art of Italian leather tanning
            </Link>
            .
          </p>

          <h2>How we use the label</h2>
          <p>
            Every Italian-made piece in our catalogue carries its country of manufacture in the
            product description, taken from the manufacturer's declaration to the authorised
            European distributor we source through. Where a piece is constructed outside Italy
            we say so plainly. The label is a fact, not a marketing device — and the price
            should reflect the truthful version. Read more on{" "}
            <Link to="/authentication">how we authenticate</Link> every item before it ships.
          </p>
        </>
      }
      related={[
        { to: "/collections/italian-leather-wallets", label: "Italian Leather Wallets" },
        { to: "/collections/italian-leather-handbags", label: "Italian Leather Handbags" },
        {
          to: "/journal/craftsmanship/the-art-of-italian-leather-tanning",
          label: "The Art of Italian Leather Tanning",
        },
        {
          to: "/journal/craftsmanship/made-in-italy-vs-designed-in-italy",
          label: "Made in Italy vs Designed in Italy",
        },
      ]}
    />
  );
}
