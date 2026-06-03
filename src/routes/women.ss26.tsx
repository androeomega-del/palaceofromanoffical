import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProducts } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { isCurrentOrUpcomingSeason } from "@/lib/season-badge";
import { routeHead } from "@/lib/seo";
import heroSrc from "@/assets/editorial/ss26/w-hero.jpg";

export const Route = createFileRoute("/women/ss26")({
  head: () => {
    const title = "Spring/Summer 2026 — Women | Palace of Roman";
    const desc =
      "The SS26 women's edit — every piece in stock carrying the New Season mark. Curated from Versace, Tom Ford, Dolce & Gabbana, Jacquemus and Roberto Cavalli.";
    const rh = routeHead({
      path: "/women/ss26",
      title,
      description: desc,
      image: heroSrc,
      type: "article",
    });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
    };
  },
  component: WomenSS26,
});

function WomenSS26() {
  const q = useQuery({
    queryKey: ["ss26", "women"],
    queryFn: () =>
      fetchProducts({
        first: 100,
        query: "tag:Women",
        sortKey: "CREATED_AT",
        reverse: true,
      }),
    staleTime: 5 * 60_000,
  });

  const products = useMemo(
    () => (q.data ?? []).filter((p) => isCurrentOrUpcomingSeason(p.node.description)),
    [q.data],
  );

  return (
    <main className="bg-canvas text-ink">
      {/* Hero */}
      <section className="relative h-[64vh] min-h-[480px] w-full overflow-hidden">
        <img
          src={heroSrc}
          alt="Palace of Roman Spring/Summer 2026 — Women"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "center 30%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
        <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-10 text-canvas md:px-12 md:pb-14">
          <p className="font-serif text-xs uppercase tracking-[0.3em] opacity-90">
            Spring/Summer 26 — Women
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-[0.95] md:text-6xl">
            The SS26 Edit
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-90 md:text-base">
            Every piece below carries the New Season mark — handpicked from the
            spring deliveries we have in stock today.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 md:px-8 md:py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-ink/60">
              In Stock — New Season
            </p>
            <h2 className="mt-1 font-serif text-2xl md:text-3xl">
              {q.isLoading ? "Loading…" : `${products.length} pieces`}
            </h2>
          </div>
          <Link
            to="/collections/$handle"
            params={{ handle: "womens-clothing" }}
            className="hidden text-xs uppercase tracking-[0.2em] underline-offset-4 hover:underline md:inline"
          >
            All Women's Clothing
          </Link>
        </div>

        {q.isError ? (
          <p className="text-sm text-ink/60">Couldn't load the edit. Try again shortly.</p>
        ) : !q.isLoading && products.length === 0 ? (
          <p className="text-sm text-ink/60">
            No SS26 pieces are tagged in stock right now. New deliveries land weekly.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard
                key={p.node.id}
                product={p}
                surface="page:ss26-women"
                position={i}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
