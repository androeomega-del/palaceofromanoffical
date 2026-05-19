import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchCollection, fetchProducts } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/collections/$handle")({
  head: ({ params }) => {
    const title = titleizeHandle(params.handle);
    return {
      meta: [
        { title: `${title} — Palace of Roman` },
        { name: "description", content: `Shop ${title} from luxury designers at Palace of Roman.` },
        { property: "og:title", content: `${title} — Palace of Roman` },
      ],
    };
  },
  component: CollectionPage,
});

function titleizeHandle(handle: string) {
  return handle
    .replace(/-/g, " ")
    .replace(/\bs\b/g, "'s")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function CollectionPage() {
  const { handle } = Route.useParams();

  const collectionQ = useQuery({
    queryKey: ["collection", handle],
    queryFn: () => fetchCollection(handle, 48),
  });

  // Fallback: if collection handle doesn't exist on this store, do a tag/title search
  const fallbackQ = useQuery({
    queryKey: ["collection-fallback", handle],
    queryFn: () => fetchProducts({ first: 48, query: `tag:${handle} OR product_type:${titleizeHandle(handle)}` }),
    enabled: collectionQ.isFetched && !collectionQ.data,
  });

  const isLoading = collectionQ.isLoading || (collectionQ.isFetched && !collectionQ.data && fallbackQ.isLoading);
  const edges = collectionQ.data?.products?.edges ?? fallbackQ.data ?? [];
  const title = collectionQ.data?.title ?? titleizeHandle(handle);
  const description = collectionQ.data?.description;

  return (
    <div>
      {/* Collection header */}
      <section className="px-6 pt-16 pb-12 border-b border-ink/5">
        <div className="max-w-screen-2xl mx-auto">
          <Link to="/" className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink">
            ← Boutique
          </Link>
          <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="text-4xl md:text-6xl font-serif text-balance">{title}</h1>
            {edges.length > 0 && (
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {edges.length} {edges.length === 1 ? "Piece" : "Pieces"}
              </p>
            )}
          </div>
          {description && (
            <p className="mt-6 max-w-[64ch] text-sm text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-screen-2xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full aspect-[4/5] bg-muted mb-5" />
                  <div className="h-2 w-16 bg-muted mb-2" />
                  <div className="h-3 w-3/4 bg-muted" />
                </div>
              ))}
            </div>
          ) : edges.length === 0 ? (
            <div className="py-32 text-center">
              <p className="text-sm text-muted-foreground mb-6">No pieces in this collection yet.</p>
              <Link
                to="/"
                className="text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
              >
                Return to Boutique
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
              {edges.map((e) => (
                <ProductCard key={e.node.id} product={e} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
