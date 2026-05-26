import { createFileRoute, Link } from "@tanstack/react-router";
import { CraftsmanshipArticle } from "@/components/craftsmanship-article";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";

const PATH = "/journal/craftsmanship/caring-for-fine-leather";
const TITLE = "Caring for Fine Leather — A Maison-Level Guide";
const DESC =
  "How the great leather houses condition, store, and rotate their pieces — and the simple home equivalents that keep yours alive for decades.";

export const Route = createFileRoute("/journal/craftsmanship/caring-for-fine-leather")({
  head: () => {
    const rh = routeHead({ path: PATH, title: `${TITLE} — ${SITE_NAME}`, description: DESC, type: "article" });
    return {
      meta: [{ title: `${TITLE} — ${SITE_NAME}` }, { name: "description", content: DESC }, ...rh.meta],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: TITLE,
            description: DESC,
            datePublished: "2026-05-19T09:00:00Z",
            author: { "@type": "Organization", name: SITE_NAME },
            publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
            mainEntityOfPage: absoluteUrl(PATH),
          }),
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
      dek="The small, undramatic habits that separate a leather piece that lasts thirty years from one that fails in three."
      readingMinutes={8}
      body={
        <>
          <p>
            Fine leather is a once-living surface. It behaves like skin: it dries, it stretches, it darkens with use, it
            reacts to humidity, and — like skin — it survives or fails depending entirely on how it's treated in the
            quiet weeks between wears.
          </p>
          <p>
            What follows is the maintenance routine used inside the maisons themselves — the same sequence the Loro
            Piana repair workshop in Quarona runs on a brought-in jacket, scaled down to what you can do at home with a
            soft cloth and ten minutes a month.
          </p>

          <h2>Condition before you need to</h2>
          <p>
            The single biggest mistake luxury owners make is waiting until the leather looks dry to feed it. By the time
            visible cracking appears, the upper layers of the hide have already lost their flex and won't fully recover.
            Apply a small amount of a neutral conditioning balm — Saphir Renovateur, Famaco Crème Délicate, or the
            equivalent — to a clean cloth, work it into the leather in light circles, leave it for ten minutes, then
            buff with a separate dry cloth. For shoes and bags in regular rotation, once a month. For pieces in storage,
            once a season.
          </p>

          <h2>Let it rest between wearings</h2>
          <p>
            Leather shoes need at least 24 hours between wears so the moisture absorbed from your foot can evaporate.
            Without that rest, the lining stays damp, the welt softens, and the structure breaks down in months instead
            of years. Insert unvarnished cedar shoe trees the moment you take them off — the cedar wicks moisture and
            holds the toe in shape. The same principle applies to handbags: empty them at the end of the day, stuff them
            lightly with acid-free tissue, and let them sit unpinched overnight.
          </p>

          <h2>Store away from light, heat, and plastic</h2>
          <p>
            Direct sunlight bleaches and dries vegetable-tanned leather; radiators do the same. Plastic bags trap
            humidity and grow mould. The correct combination is a cotton dust bag — the one the piece came in — kept in
            a wardrobe that breathes. For handbags, stand them upright with light tissue support so the panels don't
            crease against themselves.
          </p>

          <h2>Treat marks immediately, but gently</h2>
          <p>
            Water spots: blot, don't rub, then dry slowly at room temperature. Once dry, condition the whole panel — not
            just the mark — so the colour evens out. Surface scuffs on smooth calfskin: a clean fingertip with a drop of
            water, rubbed in tiny circles, will resolve most of them. Anything deeper than that goes to a cobbler or
            specialist leather workshop; home pigment touch-ups almost always make a mark worse.
          </p>

          <h2>What to never do</h2>
          <ul>
            <li>Mink oil or saddle soap on dress leather — both are for work boots, not maison goods.</li>
            <li>A hairdryer to speed up drying — it cracks the surface from the inside.</li>
            <li>Coloured polish on a different shade — once it's in the grain, it stays.</li>
            <li>Storing in the original cardboard box long-term — the cardboard absorbs moisture from the leather.</li>
          </ul>

          <h2>The thirty-year piece</h2>
          <p>
            Treated this way, a properly-made Italian wallet outlives the wallet you replace every two years by a
            factor of fifteen. A pair of welted leather loafers, resoled twice in their life, will see you into a
            different decade of style. This is the actual luxury argument — not the price tag, but the math of pieces
            you keep.
          </p>

          <p>
            Browse the pieces this guide was written for in our{" "}
            <Link to="/collections/italian-leather-wallets">Italian leather wallets</Link>,{" "}
            <Link to="/collections/italian-leather-loafers">Italian leather loafers</Link>, and{" "}
            <Link to="/collections/italian-leather-handbags">Italian leather handbags</Link> edits.
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
