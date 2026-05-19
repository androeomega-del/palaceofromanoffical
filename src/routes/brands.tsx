import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProducts } from "@/lib/shopify";

export const Route = createFileRoute("/brands")({
  head: () => ({
    meta: [
      { title: "Brands — Palace of Roman" },
      { name: "description", content: "The houses we carry. Browse luxury designers stocked at Palace of Roman." },
      { property: "og:title", content: "Brands — Palace of Roman" },
    ],
  }),
  component: BrandsPage,
});

function BrandsPage() {
  // Sample first 250 products to extract a vendor list. (Storefront API has no direct vendor index.)
  const sampleQ = useQuery({
    queryKey: ["brands-sample"],
    queryFn: () => fetchProducts({ first: 250, sortKey: "BEST_SELLING" }),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of sampleQ.data ?? []) {
      const v = e.node.vendor?.trim();
      if (!v) continue;
      map.set(v, (map.get(v) ?? 0) + 1);
    }
    const list = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const byLetter = new Map<string, Array<{ vendor: string; count: number }>>();
    for (const [vendor, count] of list) {
      const letter = vendor[0]?.toUpperCase() ?? "#";
      const key = /[A-Z]/.test(letter) ? letter : "#";
      if (!byLetter.has(key)) byLetter.set(key, []);
      byLetter.get(key)!.push({ vendor, count });
    }
    return Array.from(byLetter.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [sampleQ.data]);

  return (
    <div className="px-6 py-16">
      <div className="max-w-screen-2xl mx-auto">
        <Link to="/" className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink">
          ← Boutique
        </Link>
        <div className="mt-8 mb-20 max-w-[60ch]">
          <span className="text-xs uppercase tracking-[0.25em] text-bronze mb-4 block">Index</span>
          <h1 className="text-5xl md:text-7xl font-serif text-balance mb-6">The Houses</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A curated edit of the world's most significant designers — from legacy maisons to contemporary ateliers,
            each represented through carefully selected silhouettes.
          </p>
        </div>

        {sampleQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading brand index…</p>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-muted-foreground">No brands found.</p>
        ) : (
          <div className="space-y-16">
            {grouped.map(([letter, vendors]) => (
              <section key={letter} className="grid grid-cols-12 gap-6 border-t border-ink/10 pt-10">
                <div className="col-span-12 md:col-span-2">
                  <p className="text-5xl font-serif text-bronze">{letter}</p>
                </div>
                <div className="col-span-12 md:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3">
                  {vendors.map(({ vendor, count }) => (
                    <Link
                      key={vendor}
                      to="/brand/$vendor"
                      params={{ vendor: vendor.toLowerCase().replace(/\s+/g, "-") }}
                      className="group flex items-baseline justify-between border-b border-ink/5 py-2 hover:border-ink transition-colors"
                    >
                      <span className="text-sm group-hover:text-bronze transition-colors">{vendor}</span>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{count}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
