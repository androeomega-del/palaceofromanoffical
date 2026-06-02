// /maison — hub listing all maison heritage pages.
// Staged: only published maisons appear here. Linked from footer once
// the full set is ready (per staged-launch memory).

import { createFileRoute, Link } from "@tanstack/react-router";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import { allMaisons } from "@/lib/maisons";

export const Route = createFileRoute("/maison/")({
  head: () => {
    const path = "/maison";
    const title = `Maisons — Heritage, Ateliers & Signature Codes | ${SITE_NAME}`;
    const desc =
      "Long-form heritage essays on the houses we carry — founder stories, atelier philosophy and the signature codes that define each maison.";
    const rh = routeHead({ path, title, description: desc });
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        ...rh.meta,
      ],
      links: rh.links,
    };
  },
  component: MaisonsHub,
});

function MaisonsHub() {
  const maisons = allMaisons();
  return (
    <div className="px-6 md:px-10 py-16 md:py-24 max-w-screen-2xl mx-auto">
      <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-6">
        Editorial
      </p>
      <h1 className="text-4xl md:text-6xl font-serif text-balance mb-6">
        The Maisons.
      </h1>
      <p className="max-w-2xl text-base md:text-lg text-muted-foreground mb-16">
        Heritage essays on the houses we carry — written for clients who want
        to understand the atelier, the codes, and the craft behind the piece
        before they buy it.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 border-t border-ink/10 pt-12">
        {maisons.map((m) => (
          <Link
            key={m.slug}
            to="/maison/$slug"
            params={{ slug: m.slug }}
            className="group block"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">
              {m.meta}
            </p>
            <h2 className="text-2xl md:text-3xl font-serif mb-3 group-hover:text-bronze transition-colors">
              {m.brand}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {m.tagline}
            </p>
            <span className="mt-4 inline-block text-[11px] uppercase tracking-[0.25em] underline underline-offset-4">
              Read the maison →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
