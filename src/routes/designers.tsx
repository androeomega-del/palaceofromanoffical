/**
 * /designers — Alphabetical index of all designer houses currently stocked.
 *
 * Pulled from live Shopify vendors (no curated static list — the index
 * automatically tracks the catalog as SKUs come and go). Sticky alphabet
 * jump nav at the top scrolls to each letter group. Empty letters are
 * dimmed but kept for layout symmetry.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { fetchProducts } from "@/lib/shopify";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function vendorHandle(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const Route = createFileRoute("/designers")({
  loader: async () => {
    const edges = await fetchProducts({
      first: 250,
      sortKey: "BEST_SELLING",
      reverse: false,
    });
    const counts = new Map<string, number>();
    for (const e of edges) {
      const v = e.node.vendor?.trim();
      if (!v) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const vendors = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const byLetter: Record<string, typeof vendors> = {};
    for (const letter of ALPHABET) byLetter[letter] = [];
    byLetter["#"] = [];
    for (const v of vendors) {
      const first = v.name.charAt(0).toUpperCase();
      const key = ALPHABET.includes(first) ? first : "#";
      byLetter[key].push(v);
    }
    return { grouped: byLetter, totalVendors: vendors.length };
  },
  head: ({ loaderData }) => {
    const title = "Designers A–Z — Palace of Roman";
    const desc =
      "Every luxury house stocked at Palace of Roman, alphabetised. From Bottega Veneta to Versace — discover the maisons defining contemporary luxury.";
    const rh = routeHead({ path: "/designers", title, description: desc });

    const itemListElement = Object.values(loaderData.grouped)
      .flat()
      .map((v, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: v.name,
        url: `${absoluteUrl("/collections/" + vendorHandle(v.name))}`,
      }));

    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description: desc,
            url: absoluteUrl("/designers"),
            isPartOf: {
              "@type": "WebSite",
              name: SITE_NAME,
              url: absoluteUrl("/"),
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Designer brands at Palace of Roman",
            itemListOrder: "https://schema.org/ItemListOrderAscending",
            numberOfItems: loaderData.totalVendors,
            itemListElement,
          }),
        },
      ],
    };
  },
  component: DesignersPage,
});

function DesignersPage() {
  const { grouped, totalVendors } = Route.useLoaderData();

  const activeLetters = useMemo(
    () =>
      new Set(
        Object.entries(grouped)
          .filter(([, list]) => list.length > 0)
          .map(([k]) => k),
      ),
    [grouped],
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-6 pt-16 pb-10 border-b border-ink/10">
        <div className="max-w-screen-2xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">
            The Maisons
          </p>
          <h1 className="font-serif text-4xl md:text-6xl">Designers A–Z</h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-xl leading-relaxed">
            {totalVendors} houses currently stocked. Every piece sourced
            through our authorised distributor network and shipped with import
            duties handled on your behalf.
          </p>
        </div>
      </section>

      {/* Sticky alphabet jump nav */}
      <nav
        aria-label="Jump to letter"
        className="sticky top-0 z-30 bg-canvas/95 backdrop-blur border-b border-ink/10"
      >
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
          {["#", ...ALPHABET].map((letter) => {
            const active = activeLetters.has(letter);
            return (
              <a
                key={letter}
                href={active ? `#letter-${letter}` : undefined}
                aria-disabled={!active}
                className={`text-[11px] tracking-[0.2em] uppercase w-7 h-7 grid place-items-center transition-colors ${
                  active
                    ? "text-ink hover:bg-ink hover:text-canvas cursor-pointer"
                    : "text-ink/20 cursor-default"
                }`}
              >
                {letter}
              </a>
            );
          })}
        </div>
      </nav>

      {/* Letter groups */}
      <section className="px-6 py-16">
        <div className="max-w-screen-2xl mx-auto">
          {totalVendors === 0 ? (
            <p className="text-center py-32 text-sm text-muted-foreground">
              No designers stocked at the moment. Check back shortly.
            </p>
          ) : (
            <div className="space-y-16">
              {["#", ...ALPHABET].map((letter) => {
                const list = grouped[letter];
                if (!list || list.length === 0) return null;
                return (
                  <div
                    key={letter}
                    id={`letter-${letter}`}
                    className="scroll-mt-20 grid grid-cols-1 md:grid-cols-[100px_1fr] gap-6 md:gap-10 pb-12 border-b border-ink/5 last:border-0"
                  >
                    <p className="font-serif text-5xl md:text-6xl text-bronze leading-none">
                      {letter}
                    </p>
                    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                      {list.map((v) => (
                        <li key={v.name}>
                          <Link
                            to="/collections/$handle"
                            params={{ handle: vendorHandle(v.name) }}
                            className="group inline-flex items-baseline gap-2 hover:text-bronze transition-colors"
                          >
                            <span className="text-sm">{v.name}</span>
                            <span className="text-[10px] tabular-nums text-muted-foreground group-hover:text-bronze">
                              {v.count}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
