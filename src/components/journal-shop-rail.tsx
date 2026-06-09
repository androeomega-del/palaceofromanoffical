/**
 * JournalShopRail — pulls real catalog products from each related collection
 * handle and renders them as a horizontal rail beneath a journal article.
 *
 * Enforces the `tag-products-always` rule: every editorial/journal page must
 * surface shoppable catalog products, not just text links. Skips silently for
 * collections that 404 (preserves the rest of the rail).
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { fetchCollection, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";

type Source = { to: string; label: string };

function handleFromTo(to: string): string | null {
  const m = to.match(/^\/collections\/([a-z0-9-]+)/i);
  return m ? m[1] : null;
}

export function JournalShopRail({ sources, eyebrow = "From the catalog" }: { sources: Source[]; eyebrow?: string }) {
  const handles = sources.map((s) => handleFromTo(s.to)).filter((h): h is string => !!h);

  const q = useQuery({
    queryKey: ["journal-shop-rail", handles],
    queryFn: async (): Promise<Array<{ handle: string; label: string; products: ShopifyProduct[] }>> => {
      const results = await Promise.all(
        handles.map(async (handle, i) => {
          const c = await fetchCollection(handle, 8);
          if (!c) return null;
          const products: ShopifyProduct[] = c.products.edges
            .filter((e) => e.node.variants.edges.some((v) => v.node.availableForSale))
            .slice(0, 4)
            .map((e) => ({ node: e.node }));
          if (products.length === 0) return null;
          return { handle, label: sources[i].label, products };
        }),
      );
      return results.filter((r): r is NonNullable<typeof r> => r !== null);
    },
    staleTime: 5 * 60 * 1000,
    enabled: handles.length > 0,
  });

  if (handles.length === 0) return null;
  if (q.isLoading || !q.data || q.data.length === 0) return null;

  return (
    <section className="mt-16 border-t border-ink/10 pt-12">
      <p className="text-eyebrow uppercase text-bronze-deep mb-8 text-center">{eyebrow}</p>
      <div className="space-y-12">
        {q.data.map((group) => (
          <div key={group.handle}>
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-serif text-xl">{group.label}</h3>
              <Link
                to={`/collections/${group.handle}` as string}
                className="text-cta-lg uppercase text-bronze-deep hover:text-ink transition-colors"
              >
                Shop all →
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-5 px-5 md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:snap-none md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {group.products.map((p) => (
                <div key={p.node.id} className="shrink-0 basis-[72%] snap-start md:basis-auto md:shrink">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
