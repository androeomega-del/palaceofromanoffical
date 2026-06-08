import { createFileRoute, Link } from "@tanstack/react-router";
import { CraftsmanshipArticle } from "@/components/craftsmanship-article";
import { routeHead, articleJsonLd, SITE_NAME } from "@/lib/seo";

const PATH = "/journal/craftsmanship/the-art-of-italian-leather-tanning";
const TITLE = "The Art of Italian Leather Tanning — Vegetable, Chrome, and the Tuscan Tradition";
const DESC =
  "Inside the centuries-old Tuscan tanning tradition behind authentic Italian leather — vegetable vs chrome tanning, the Pelle Conciata al Vegetale consortium, and why the right tannery defines a wallet's next thirty years.";

export const Route = createFileRoute(
  "/journal/craftsmanship/the-art-of-italian-leather-tanning",
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
      eyebrow="Craftsmanship"
      title={TITLE}
      dek="A field guide to the tanneries behind the world's most recognisable leather goods — what vegetable, chrome, and combination tanning actually mean, and why one Tuscan valley still sets the standard."
      readingMinutes={9}
      body={
        <>
          <p>
            Every fine leather piece begins long before the cutting table. It begins in a
            tannery — typically a low concrete building somewhere between Pisa and Florence,
            where hides spend weeks rotating in wooden drums full of bark, water, and time.
            What happens in those drums determines almost everything about how a wallet ages:
            the colour, the smell, the way the surface softens, the way a corner wears after
            twenty years in a back pocket.
          </p>

          <h2>The two tanning systems</h2>
          <p>
            Roughly ninety percent of the world's leather is <strong>chrome tanned</strong>.
            Chromium salts fix the hide in a single day, produce a stable, soft, water-tolerant
            leather, and dominate footwear, automotive, and most contemporary luxury. The
            remaining ten percent is <strong>vegetable tanned</strong> — cured slowly over
            four to eight weeks in tannins drawn from chestnut, mimosa, and quebracho bark.
            Vegetable tanning is older, slower, and the basis of the Italian tradition.
          </p>
          <p>
            Neither is inherently superior; they produce different leathers for different uses.
            Vegetable-tanned leather develops a deep patina over years of handling — the
            honey-to-cognac shift you see on a well-used Berluti wallet or a saddle-leather
            tote. Chrome-tanned leather stays closer to its original colour and resists
            moisture; it is the right answer for a structured handbag or a dress shoe.
          </p>

          <h2>The Tuscan tradition</h2>
          <p>
            Italian vegetable tanning is concentrated in a single valley — the Valdarno,
            stretching from Santa Croce sull'Arno to Ponte a Egola, west of Florence. Roughly
            twenty tanneries here produce the leather behind a meaningful share of European
            luxury small leather goods. Most are family-run, several pre-date the Italian
            unification, and twenty-two of them belong to the{" "}
            <strong>Consorzio Vera Pelle Italiana Conciata al Vegetale</strong> — the
            consortium that polices the <em>Pelle Conciata al Vegetale in Toscana</em>{" "}
            certification.
          </p>
          <p>
            The consortium's mark — a metal medallion stamped with a serial number — appears
            on certified pieces and guarantees three things: Italian hides, vegetable tanning
            in a Tuscan member tannery, and no harmful azo dyes, nickel, or pentachlorophenol.
            On wallets and small leather goods the medallion is usually tucked into an
            interior pocket. It is one of the few independently audited authenticity marks in
            luxury leather.
          </p>

          <h2>What to look for on a real Italian-leather piece</h2>
          <ul>
            <li>
              <strong>A grain that varies.</strong> Real vegetable-tanned hide carries
              irregular pores, faint scars, neck wrinkles. Uniform, perfect grain usually
              means embossed top-grain or fully bonded leather.
            </li>
            <li>
              <strong>A clean, sweet smell.</strong> Vegetable-tanned leather smells of bark
              and resin; chrome-tanned leather is more neutral. A chemical or plastic note
              points to corrected leather or coatings hiding a poor cut.
            </li>
            <li>
              <strong>An edge that's painted or burnished, not folded over plastic.</strong>{" "}
              Edge finishing is where the tanning shows. A burnished, slightly waxed edge on
              vegetable-tanned leather will deepen with use; a hot-stamped polymer edge will
              crack.
            </li>
            <li>
              <strong>A consortium medallion, when it's present.</strong> Not every authentic
              Italian piece carries one — it's voluntary — but every piece that does is
              traceable to a member tannery by serial number.
            </li>
          </ul>
          <p>
            For the full at-the-counter test, read our companion guide on{" "}
            <Link to="/journal/craftsmanship/spot-real-italian-leather">
              how to spot real Italian leather
            </Link>
            .
          </p>

          <h2>How tanning interacts with the Made in Italy label</h2>
          <p>
            The two are not the same claim. <em>Made in Italy</em> certifies where the bag or
            wallet was constructed — see our reference on the{" "}
            <Link to="/journal/craftsmanship/understanding-the-made-in-italy-label">
              Made in Italy label
            </Link>
            . The tanning marks certify where the hide was finished and what was used to
            finish it. A piece can be Made in Italy from Tuscan vegetable-tanned hides
            (the full classical version), Made in Italy from chrome-tanned hides imported
            from Germany or France (very common, often excellent), or simply Italian-designed
            from imported leather (a different price tier entirely).
          </p>

          <h2>How we source</h2>
          <p>
            Every Italian-leather piece on our pages is sourced through authorised European
            distributors and ships with its origin and tanning information from the
            manufacturer — including the consortium serial where present. The point of a
            wallet at this price is the next thirty years; the tannery is where the next
            thirty years are decided. Read more on{" "}
            <Link to="/authentication">how we authenticate</Link> and the{" "}
            <Link to="/sourcing-architecture">sourcing architecture</Link> behind every order.
          </p>
        </>
      }
      related={[
        { to: "/collections/italian-leather-wallets", label: "Italian Leather Wallets" },
        { to: "/collections/italian-leather-handbags", label: "Italian Leather Handbags" },
        { to: "/collections/designer-belts", label: "Designer Belts" },
        {
          to: "/journal/craftsmanship/spot-real-italian-leather",
          label: "How to Spot Real Italian Leather",
        },
        {
          to: "/journal/craftsmanship/understanding-the-made-in-italy-label",
          label: "Understanding the Made in Italy Label",
        },
      ]}
    />
  );
}
