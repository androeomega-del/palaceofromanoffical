import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { type ShopifyProductNode } from "@/lib/shopify";

export default function AIRecommendations({ product }: { product: ShopifyProductNode }) {
  const q = useQuery({
    queryKey: ["ai-recs", product.handle],
    queryFn: async () => {
      const res = await fetch("/api/public/ai/recommendations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle: product.handle }),
      });
      if (!res.ok) throw new Error("Failed to load AI recommendations");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  if (q.isLoading) return null;
  const recommendations: Array<{ product: ShopifyProductNode; reason?: string }> = q.data?.recommendations ?? [];
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto mt-32 pt-20 border-t border-[var(--studio-rule)]" style={{ contain: "layout" }}>
      <div className="flex items-end justify-between mb-10">
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.32em] uppercase text-[var(--studio-bronze)] font-semibold">You Might Also Like</p>
          <h2 className="font-serif text-3xl md:text-4xl">Recommended For This Look</h2>
        </div>
      </div>

      <div className="flex gap-5 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-6 px-6" role="region" aria-label="AI recommended products">
        {recommendations.map((r) => (
          <div key={r.product.id} className="snap-start flex-shrink-0 w-[68%] sm:w-[42%] md:w-[28%] lg:w-[22%]">
            <ProductCard product={{ node: r.product }} />
            {r.reason && <p className="mt-2 text-[12px] text-[var(--studio-muted)]">{r.reason}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
