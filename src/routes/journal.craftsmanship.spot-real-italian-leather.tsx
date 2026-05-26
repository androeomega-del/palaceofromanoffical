import { createFileRoute, Link } from "@tanstack/react-router";
import { CraftsmanshipArticle } from "@/components/craftsmanship-article";
import { routeHead, articleJsonLd, SITE_NAME } from "@/lib/seo";

const PATH = "/journal/craftsmanship/spot-real-italian-leather";
const TITLE = "How to Spot Real Italian Leather — A Buyer's Guide";
const DESC =
  "Six practical tests — grain, smell, edge, stitch, weight, fold — that separate properly-made Italian leather from everything else. From the Palace of Roman Journal.";

export const Route = createFileRoute("/journal/craftsmanship/spot-real-italian-leather")({
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
              datePublished: "2026-05-12T09:00:00Z",
              dateModified: "2026-05-26T09:00:00Z",
              articleSection: "Craftsmanship",
              about: [
                { path: "/collections/italian-leather-wallets", name: "Italian Leather Wallets" },
                { path: "/collections/italian-leather-loafers", name: "Italian Leather Loafers" },
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
      eyebrow="Craftsmanship"
      title={TITLE}
      dek="A wallet, a loafer, a handbag — the small physical tells that separate a properly-made Italian leather piece from a convincing imitation. Six tests you can run in under a minute."
      readingMinutes={7}
      body={
        <>
          <p>
            Italy makes more fine leather goods than any other country in the world. It also has the deepest counterfeit
            economy. The distance between a properly-made Bottega wallet and a clever fake is sometimes only a few
            millimetres of edge paint and a hundred grams of weight — but those millimetres are everything.
          </p>
          <p>
            What follows is the same six-test sequence the experienced buyers at our partner distribution houses run on
            anything that crosses their bench. None of it requires special equipment. All of it can be done in a shop, at
            a tailor's, or against the lamp on your kitchen table.
          </p>

          <h2>1. The grain has to look unfinished</h2>
          <p>
            Real full-grain Italian leather — the kind you'll find on a Prada loafer or a Ferragamo wallet — keeps the
            outer surface of the hide intact. That surface is never uniform. You should see faint stretch marks, the
            occasional pore, the small variation in colour where one part of the animal lay differently against another.
            A perfectly regular surface, especially one that looks slightly plasticised under raking light, is corrected
            grain or bonded leather. Both are still leather. Neither is what you're paying for.
          </p>

          <h2>2. The smell is rich, not chemical</h2>
          <p>
            Vegetable-tanned Italian leather — the slow tannery process associated with Tuscany — has a deep, woody,
            faintly sweet smell that doesn't dissipate. Chrome-tanned leather is sharper and cleaner. Both are fine.
            What isn't fine is the petroleum-and-glue smell of a finished synthetic. If a wallet smells like a new car
            interior, it isn't full-grain leather no matter what the label says.
          </p>

          <h2>3. The edge tells the truth</h2>
          <p>
            Turn the piece over and look at the cut edges of the leather — the inside of a loafer's tongue, the spine of
            a wallet, the trim of a handbag. Properly-made Italian goods have either a folded edge (the leather is
            bevelled, glued back on itself, and stitched) or a painted edge (a craftsman lays down four to six coats of
            edge paint, sanding between each). Both methods take time and show care. A raw, fuzzy edge — or a thick,
            uneven gob of black paint — is the surest sign you're looking at fast goods.
          </p>

          <h2>4. The stitch is small, even, and slightly angled</h2>
          <p>
            Italian saddle-stitching runs around eight to ten stitches per inch on fine work, with the thread sitting at
            a consistent shallow angle that comes from a saddler's awl. Machine lockstitch on cheaper goods is straight,
            larger, and often gathers the leather slightly. If you can see the back of the stitch through a wallet's
            interior compartments, the same angle and density should be visible from both sides.
          </p>

          <h2>5. The weight is heavier than you expect</h2>
          <p>
            This is the test you can do with your eyes closed. A real Italian calfskin wallet weighs noticeably more than
            a similar-sized synthetic. A pair of leather-soled loafers will feel like proper shoes in the hand, not
            slippers. The density comes from the hide itself; nothing else replicates it.
          </p>

          <h2>6. The fold is the final test</h2>
          <p>
            Fold a piece of the leather over itself — gently, on a strap or an unused flap. Full-grain leather creases
            and recovers cleanly; the surface lightens slightly along the crease and returns. Corrected or coated
            leather develops a thin white crack along the fold line that doesn't go away. Once you've seen that crack
            once, you'll recognise it forever.
          </p>

          <h2>The shortcut</h2>
          <p>
            None of these tests replace knowing where a piece came from. Every Palace of Roman product is sourced
            through our authorised distribution network and shipped from Europe with full chain-of-custody — see{" "}
            <Link to="/authentication">our authentication policy</Link> for the details. The six tests above are for the
            rest of the world, where you can't always trust the box.
          </p>
        </>
      }
      related={[
        { to: "/collections/italian-leather-wallets", label: "Italian Leather Wallets" },
        { to: "/collections/italian-leather-loafers", label: "Italian Leather Loafers" },
        { to: "/collections/italian-leather-handbags", label: "Italian Leather Handbags" },
      ]}
    />
  );
}
