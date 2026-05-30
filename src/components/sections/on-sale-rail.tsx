/**
 * On Sale — 4-product rail with strikethrough pricing.
 *
 * Farfetch reference: "SS26 sale: up to 50% off" — four cards with original
 * price + discount badge + Shop Now CTA. We fetch by department tag, then
 * client-filter to products whose Shopify `compareAtPriceRange.minVariantPrice`
 * exceeds the live price. ProductCard already renders the strikethrough +
 * "On Sale" badge — we just supply the right products. Section hides itself
 * if no sale products exist (catalog-truth rule).
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";

export function OnSaleRail({
  dept = "Women",
  ctaTo = "/collections/sale",
}: {
  dept?: "Women" | "Men";
  ctaTo?: string;
}) {
  const query = `tag:${dept}`;
  const { data, isLoading } = useQuery({
    queryKey: ["section-on-sale", dept],
    queryFn: async () => {
      // Pull a wide window then filter — Storefront API has no native
      // compareAtPrice filter and we'd rather show the freshest 4 markdowns
      // than guess via a Shopify "sale" tag that may not exist.
      const all = await fetchProducts({ first: 60, query });
      const onSale = all.filter((p) => {
        const cmp = p.node.compareAtPriceRange?.minVariantPrice?.amount;
        const price = p.node.priceRange.minVariantPrice.amount;
        return cmp && parseFloat(cmp) > parseFloat(price);
      });
      return onSale.slice(0, 4);
    },
    staleTime: 5 * 60_000,
  });

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="py-10 md:py-16 bg-ink/5">
      <div className="max-w-screen-2xl mx-auto px-5 md:px-10">
        <header className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.32em] text-bronze">
            The Markdowns
          </p>
          <h2 className="mt-2 font-serif text-2xl md:text-3xl tracking-[0.04em] text-ink">
            On Sale — quietly reduced
          </h2>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-canvas animate-pulse"
                  aria-hidden="true"
                />
              ))
            : data?.map((p) => <ProductCard key={p.node.id} product={p} />)}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to={ctaTo}
            className="inline-flex items-center h-11 px-7 bg-ink text-canvas text-[11px] uppercase tracking-[0.3em] hover:bg-bronze transition-colors"
          >
            Shop the Sale
          </Link>
        </div>
      </div>
    </section>
  );
}
