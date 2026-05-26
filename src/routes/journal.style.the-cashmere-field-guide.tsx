import { createFileRoute, Link } from "@tanstack/react-router";
import { CraftsmanshipArticle } from "@/components/craftsmanship-article";
import { routeHead, articleJsonLd, SITE_NAME } from "@/lib/seo";

const PATH = "/journal/style/the-cashmere-field-guide";
const TITLE = "The Cashmere Field Guide — Grade, Ply, and the Sweaters Worth Keeping";
const DESC =
  "A maison-level guide to buying cashmere: where the fibre comes from, what grade and ply actually mean, and the houses still spinning it the way it should be spun.";

export const Route = createFileRoute("/journal/style/the-cashmere-field-guide")({
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
              datePublished: "2026-05-24T09:00:00Z",
              dateModified: "2026-05-26T09:00:00Z",
              articleSection: "Style",
              about: [
                { path: "/collections/cashmere-sweaters", name: "Cashmere Sweaters" },
                { path: "/collections/silk-scarves", name: "Silk Scarves" },
                { path: "/collections/designer-crossbody-bags", name: "Designer Crossbody Bags" },
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
      eyebrow="Material"
      title={TITLE}
      dek="Cashmere is the most misunderstood material in luxury fashion. A short brief on where it comes from, why two sweaters at the same price can be wildly different, and what to look for before you buy."
      readingMinutes={9}
      body={
        <>
          <p>
            A €180 cashmere crewneck and a €1,200 cashmere crewneck can look identical on the
            hanger. They are not the same garment. The difference is invisible from across a room
            and obvious within a season: one pills, sags at the shoulder and loses its colour by
            the second winter; the other softens, holds its shape, and quietly becomes the piece
            you reach for first. The variables are well-understood inside the industry, almost
            never disclosed at point of sale, and not difficult to learn.
          </p>

          <h2>Where the fibre comes from</h2>
          <p>
            Cashmere is the soft undercoat of the cashmere goat, combed out by hand once a year as
            the animal moults. The vast majority of the world's supply comes from the high plains
            of Inner Mongolia, where extreme winters force the goat to grow the longest, finest
            fibres. Cashmere combed elsewhere — Iran, Afghanistan, parts of Western China — tends
            to be shorter and coarser, which is the first reason two sweaters at the same price
            behave differently.
          </p>

          <h2>Grade A, B, and C — what they actually mean</h2>
          <p>
            There is no international cashmere certification, but the trade uses three informal
            grades based on fibre diameter and length:
          </p>
          <ul>
            <li>
              <strong>Grade A</strong> — fibre under 14 microns thick, longer than 34 mm. This is
              what Loro Piana, Brunello Cucinelli and the Scottish mills (Johnstons of Elgin,
              Hawick) work with. It feels almost wet to the touch and holds its shape for decades.
            </li>
            <li>
              <strong>Grade B</strong> — 15 to 19 microns, 28–32 mm. The bulk of designer-house
              cashmere. Good quality, will pill modestly in the first season then stabilise.
            </li>
            <li>
              <strong>Grade C</strong> — over 19 microns, under 28 mm. Often blended with wool or
              acrylic and sold as cashmere; pills aggressively, loses shape within a year.
            </li>
          </ul>

          <h2>Ply is not thickness</h2>
          <p>
            A 2-ply sweater is made by twisting two single strands of yarn together before knitting;
            a 4-ply uses four. More ply means a denser, more durable garment — but the gauge
            (stitches per inch) matters as much. A 12-gauge 2-ply is light and ideal under a
            jacket; an 8-gauge 4-ply is the weighty piece you wear over a shirt in deep winter.
            Houses that quote ply on the label are usually proud of it.
          </p>

          <h2>The three-finger test</h2>
          <p>
            Take a sleeve between thumb and two fingers. Squeeze gently and release. A good
            cashmere sweater will spring back almost instantly with no creasing; a poorly-knitted
            one will hold the impression of your fingers for several seconds. Then turn the sweater
            inside out and look at the seams — the stitching should be even, fine, and free of
            loose threads. The smell test, while less polite, also works: real cashmere has a
            faint, sweet, almost lanolin smell. A chemical or plastic note means the fibre has
            been heavily treated.
          </p>

          <h2>The houses worth knowing</h2>
          <p>
            <strong>Loro Piana</strong> sources its baby cashmere from the first combing of a goat
            kid in Hyrcania, weaves and finishes it in Quarona; the result is the benchmark.{" "}
            <strong>Brunello Cucinelli</strong> built an entire town in Umbria around its cashmere
            workshop and still hand-finishes every neck and cuff.{" "}
            <strong>Versace</strong> and <strong>Dolce &amp; Gabbana</strong> produce their
            knitwear in Northern Italy with Italian-spun yarn — distinct from the brands that have
            quietly moved production to Eastern Europe.
          </p>

          <h2>How to care for it</h2>
          <p>
            Cashmere wants to be worn, rested, and washed — not dry-cleaned. Solvents strip the
            natural oils that make the fibre soft. Hand-wash in cool water with a wool-specific
            detergent (The Laundress, Eucalan), press the water out with a towel (never wring),
            and dry flat. A small de-piller will remove the few bobbles that appear in the first
            month of wear and leave the surface looking new. Store folded with a cedar block, never
            on a hanger — the weight will distort the shoulders permanently.
          </p>

          <h2>Where to begin</h2>
          <p>
            Our knitwear edit favours houses we can trace back to the mill. Start with the{" "}
            <Link to="/collections/cashmere-sweaters">cashmere sweaters</Link> selection. Layer
            with a piece from the <Link to="/collections/silk-scarves">silk scarves</Link>{" "}
            edit, and complete the outfit with a quiet shoulder bag from the{" "}
            <Link to="/collections/designer-crossbody-bags">designer crossbody bags</Link>{" "}
            collection.
          </p>
        </>
      }
      related={[
        { to: "/collections/cashmere-sweaters", label: "Cashmere Sweaters" },
        { to: "/collections/silk-scarves", label: "Silk Scarves" },
        { to: "/collections/designer-crossbody-bags", label: "Designer Crossbody Bags" },
      ]}
    />
  );
}
