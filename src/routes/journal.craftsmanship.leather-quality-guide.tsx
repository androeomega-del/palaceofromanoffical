import { createFileRoute, Link } from "@tanstack/react-router";
import { CraftsmanshipArticle } from "@/components/craftsmanship-article";
import { routeHead, articleJsonLd, SITE_NAME } from "@/lib/seo";

const PATH = "/journal/craftsmanship/leather-quality-guide";
const TITLE = "Full-Grain vs Top-Grain Leather — The Wallet Buyer's Guide";
const DESC =
  "What the leather grade on a luxury wallet actually means — how full-grain, top-grain, and corrected-grain Italian leather wear over a decade, and why the cheapest cut almost always costs the most.";

export const Route = createFileRoute("/journal/craftsmanship/leather-quality-guide")({
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
              datePublished: "2026-06-06T09:00:00Z",
              dateModified: "2026-06-06T09:00:00Z",
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
      dek="A luxury wallet lives in a pocket for ten years. The grade of leather it's cut from decides whether it ages into something better — or quietly falls apart by year three."
      readingMinutes={9}
      body={
        <>
          <p>
            Almost every leather wallet sold above three figures uses the word "genuine," "premium," or "real Italian
            leather" somewhere on the box. None of those phrases describe quality. The word that does is the{" "}
            <em>grade</em> — which layer of the hide the wallet was actually cut from. Three grades make up almost the
            entire luxury market, and the difference between them is the difference between a piece that softens with
            use and a piece that cracks before its first resole.
          </p>

          <h2>What a hide actually is</h2>
          <p>
            A cow hide is layered. The outermost surface — the part that faced the world — is dense, tightly packed,
            and structurally the strongest. Underneath it sits a looser, fibrous middle layer, and beneath that the
            soft, weak split that's mostly used for suede or industrial backing. When a tannery splits a hide, what it
            does with the top surface is what determines the grade — and the price.
          </p>

          <h2>Full-grain — the only grade that improves with time</h2>
          <p>
            Full-grain leather keeps the entire top surface of the hide intact. Nothing is sanded, buffed, or coated.
            Every pore, every fibre, every faint stretch mark from the animal stays where it was, which is exactly why
            full-grain is the only grade that develops a true patina: as the natural oils in the surface react to your
            hands and the light, the leather darkens, deepens, and gains a glow no factory can imitate.
          </p>
          <p>
            It's also the strongest layer of the hide — the fibres haven't been cut through — so a full-grain wallet
            keeps its edge crispness, holds its stitching, and survives being sat on for years instead of months. It is
            the leather the great Florentine and Tuscan workshops cut their billfolds from, and it is the leather you
            should expect when a maison uses the phrase <em>pelle pieno fiore</em> on the spec card.
          </p>

          <h2>Top-grain — the polished compromise</h2>
          <p>
            Top-grain leather starts from the same upper layer as full-grain, but the surface is lightly sanded to
            remove imperfections, then a thin pigment or finish is sprayed on to even the colour. The result is a more
            uniform, more predictable hide — easier to mass-produce, easier to colour-match across a season — and one
            that the leather industry can charge mid-luxury prices for without risking visual flaws on the shelf.
          </p>
          <p>
            What you give up is the patina. The sanding and the finish layer seal the pores, which means the surface
            can't breathe and react the way full-grain does. A top-grain wallet stays close to the colour it was sold
            in for its entire life — and when the finish layer finally wears through (usually around the corners and
            the inner card slots first), it does so as a visible scuff rather than a gentle darkening. Many beautiful
            designer wallets are top-grain. They are not full-grain.
          </p>

          <h2>Corrected-grain and "genuine leather" — what to avoid in a wallet</h2>
          <p>
            Corrected-grain leather has been sanded heavily, then embossed with an artificial grain pattern and sealed
            with a thick polymer finish. "Genuine leather" is, in plain English, the marketing term for the lower
            splits of the hide — bonded scraps held together with adhesive, then surface-printed. Both are real leather
            in the strict legal sense, and both belong on low-cost goods, not on a piece you intend to keep. In a
            wallet specifically, corrected-grain and bonded leather are the grades that crack along the fold lines
            within eighteen months. If a luxury wallet description doesn't tell you what grade was used, assume the
            answer is one of these two — and walk.
          </p>

          <h2>How to tell at the counter, in thirty seconds</h2>
          <ul>
            <li>
              <strong>Look at the grain pattern.</strong> Full-grain is irregular — pores of different sizes, the
              occasional natural mark. Corrected-grain is suspiciously uniform, like a stamped pattern, because that's
              what it is.
            </li>
            <li>
              <strong>Press the surface with your thumb.</strong> Full-grain depresses slightly, lightens for a second,
              then recovers — that's the hide breathing. A sealed corrected-grain finish stays flat under pressure and
              feels plastic-like under the nail.
            </li>
            <li>
              <strong>Look at the cut edge.</strong> Full-grain shows the full thickness of dense fibre, edge-painted
              or burnished cleanly. Bonded leather reveals a layered, almost laminated cross-section — that's the
              glue.
            </li>
            <li>
              <strong>Smell it.</strong> Real, properly tanned Italian leather smells warm, faintly sweet, and earthy.
              Heavy finishes smell chemical.
            </li>
          </ul>

          <h2>Why this is actually a value argument</h2>
          <p>
            A well-made full-grain Italian wallet from a maison like Bottega Veneta, Loro Piana, or a serious
            small-batch workshop costs in the region of three to seven hundred dollars and is engineered to last
            fifteen to twenty years in daily use. Across that life it patinas, the corners darken, the fold-line
            softens to your pocket. A high-street wallet at one-tenth the price is almost always corrected-grain or
            bonded — it will fail at the fold within two to three years and be replaced four or five times in the same
            window. The math, quietly, runs the other way around.
          </p>
          <p>
            This is what we look for when we curate. Every wallet in our{" "}
            <Link to="/collections/italian-leather-wallets">Italian leather wallets</Link> edit is full-grain — the
            same grade the workshop chose for its own house pieces — and the same logic carries through to our{" "}
            <Link to="/collections/italian-leather-handbags">Italian leather handbags</Link> and{" "}
            <Link to="/collections/designer-belts">designer belts</Link>. If a piece doesn't meet that bar, it doesn't
            make the edit.
          </p>

          <h2>The short answer</h2>
          <p>
            For a luxury wallet that will sit in your pocket for the next decade, the only grade worth paying for is
            full-grain. Top-grain is acceptable on a seasonal piece. Corrected-grain and "genuine leather" belong
            elsewhere. The grade is the wallet — everything else is finishing.
          </p>
        </>
      }
      related={[
        { to: "/collections/italian-leather-wallets", label: "Italian Leather Wallets" },
        { to: "/collections/italian-leather-handbags", label: "Italian Leather Handbags" },
        { to: "/collections/designer-belts", label: "Designer Belts" },
        { to: "/journal/craftsmanship/spot-real-italian-leather", label: "How to Spot Real Italian Leather" },
        { to: "/journal/craftsmanship/caring-for-fine-leather", label: "Caring for Fine Leather" },
      ]}
    />
  );
}
