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
import { useRailImpression } from "@/hooks/use-rail-impression";

const SURFACE = "rail:on-sale";

export function OnSaleRail({
  dept = "Women",
  ctaTo = "/collections/sale",
}: {
  dept?: "Women" | "Men";
  ctaTo?: string;
}) {
  const query = `tag:${dept} AND available_for_sale:true`;
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

  const railRef = useRailImpression(SURFACE, data?.[0]?.node.handle);

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section
      ref={railRef as React.RefObject<HTMLElement>}
      data-rail-surface={SURFACE}
      className="py-section-sm md:py-16 bg-ink/5"
    >
      <div className="max-w-screen-2xl mx-auto px-5 md:px-10">
        <header className="mb-8">
          <p className="text-eyebrow uppercase text-bronze-deep">
            The Markdowns
          </p>
          <h2 className="mt-tight font-serif text-subhead-md md:text-subhead-lg tracking-subhead-open text-ink">
            On Sale — quietly reduced
          </h2>
        </header>

        <div className="flex gap-x-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-5 px-5 md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:snap-none md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-x-5 md:gap-y-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-canvas animate-pulse shrink-0 basis-[72%] snap-start md:basis-auto md:shrink"
                  aria-hidden="true"
                />
              ))
            : data?.map((p, i) => (
                <div key={p.node.id} className="shrink-0 basis-[72%] snap-start md:basis-auto md:shrink">
                  <ProductCard product={p} surface={SURFACE} position={i} />
                </div>
              ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to={ctaTo}
            className="inline-flex items-center h-tap-target px-7 bg-ink text-canvas text-cta-lg uppercase hover:bg-bronze transition-colors"
          >
            Shop the Sale
          </Link>
        </div>
      </div>
    </section>
  );
}
