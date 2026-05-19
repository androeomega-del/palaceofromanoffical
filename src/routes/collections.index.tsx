import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchCollections } from "@/lib/shopify";

export const Route = createFileRoute("/collections/")({
  head: () => ({
    meta: [
      { title: "All Collections — Palace of Roman" },
      { name: "description", content: "Browse every curated collection at Palace of Roman — women's, men's, designer edits and seasonal capsules." },
      { property: "og:title", content: "All Collections — Palace of Roman" },
    ],
  }),
  component: CollectionsIndexPage,
});

function CollectionsIndexPage() {
  const q = useQuery({
    queryKey: ["collections-all"],
    queryFn: () => fetchCollections(100),
  });

  const collections = q.data ?? [];

  return (
    <div>
      <section className="px-6 pt-12 pb-8 border-b border-ink/5">
        <div className="max-w-screen-2xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.25em] text-bronze mb-3">The Index</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="text-4xl md:text-6xl font-serif">All Collections</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {q.isLoading ? "Loading…" : `${collections.length} ${collections.length === 1 ? "Collection" : "Collections"}`}
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-screen-2xl mx-auto">
          {q.isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full aspect-[3/4] bg-muted mb-5" />
                  <div className="h-3 w-3/4 bg-muted" />
                </div>
              ))}
            </div>
          ) : collections.length === 0 ? (
            <p className="py-24 text-center text-sm text-muted-foreground">No collections found.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-14">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  to="/collections/$handle"
                  params={{ handle: c.handle }}
                  className="group block"
                >
                  <div className="w-full aspect-[3/4] bg-muted overflow-hidden mb-5 relative">
                    {c.image ? (
                      <img
                        src={c.image.url}
                        alt={c.image.altText ?? c.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                          {c.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-base md:text-lg font-serif group-hover:text-bronze transition-colors">
                    {c.title}
                  </h2>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
