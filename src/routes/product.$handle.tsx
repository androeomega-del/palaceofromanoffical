import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { fetchProductByHandle, fetchProducts, formatPrice, type ShopifyVariant } from "@/lib/shopify";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/product/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `${humanize(params.handle)} — Palace of Roman` },
      { property: "og:title", content: `${humanize(params.handle)} — Palace of Roman` },
    ],
  }),
  component: ProductPage,
});

function humanize(h: string) {
  return h.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProductPage() {
  const { handle } = Route.useParams();

  const productQ = useQuery({
    queryKey: ["product", handle],
    queryFn: () => fetchProductByHandle(handle),
  });

  if (productQ.isLoading) return <ProductSkeleton />;
  if (!productQ.data) throw notFound();

  const product = productQ.data;
  return <ProductView product={product} />;
}

function ProductView({ product }: { product: NonNullable<Awaited<ReturnType<typeof fetchProductByHandle>>> }) {
  const images = product.images.edges.map((e) => e.node);
  const variants = product.variants.edges.map((e) => e.node);
  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(firstAvailable?.id);
  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? firstAvailable,
    [variants, selectedVariantId, firstAvailable]
  );

  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);

  const handleAdd = async () => {
    if (!selectedVariant) return;
    if (!selectedVariant.availableForSale) {
      toast.error("This variant is currently unavailable.");
      return;
    }
    await addItem({
      product: { node: product },
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions ?? [],
    });
    toast.success("Added to bag");
  };

  const relatedQ = useQuery({
    queryKey: ["related", product.vendor],
    queryFn: () => fetchProducts({ first: 4, query: `vendor:${product.vendor}` }),
  });
  const related = (relatedQ.data ?? []).filter((e) => e.node.handle !== product.handle).slice(0, 4);

  return (
    <div className="px-6 py-12">
      <div className="max-w-screen-2xl mx-auto">
        <Link to="/" className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink">
          ← Boutique
        </Link>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3">
            {images.length === 0 ? (
              <div className="md:col-span-2 w-full aspect-[4/5] bg-muted" />
            ) : (
              images.map((img, i) => (
                <div
                  key={img.url}
                  className={`bg-muted overflow-hidden ${
                    images.length === 1 ? "md:col-span-2 aspect-[4/5]" :
                    i === 0 ? "md:col-span-2 aspect-[4/5]" : "aspect-[3/4]"
                  }`}
                >
                  <img src={img.url} alt={img.altText ?? product.title} className="w-full h-full object-cover" />
                </div>
              ))
            )}
          </div>

          {/* Info column (sticky on desktop) */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">{product.vendor}</p>
            <h1 className="text-3xl md:text-4xl font-serif leading-tight mb-4 text-balance">{product.title}</h1>
            <p className="text-lg mb-10">{formatPrice(selectedVariant?.price ?? product.priceRange.minVariantPrice)}</p>

            {/* Variant selector — grouped by option */}
            {product.options
              .filter((o) => o.values.length > 1 || o.name.toLowerCase() !== "title")
              .map((option) => (
                <VariantOption
                  key={option.name}
                  option={option}
                  variants={variants}
                  selected={selectedVariant}
                  onSelect={(v) => setSelectedVariantId(v.id)}
                />
              ))}

            <Button
              onClick={handleAdd}
              disabled={isLoading || !selectedVariant?.availableForSale}
              className="w-full bg-ink text-canvas hover:bg-ink/90 rounded-none h-14 text-[11px] uppercase tracking-[0.3em] font-medium mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : selectedVariant?.availableForSale ? (
                "Add to Bag"
              ) : (
                "Sold Out"
              )}
            </Button>

            {product.description && (
              <div className="mt-12 pt-12 border-t border-ink/10">
                <h2 className="text-[10px] uppercase tracking-[0.25em] mb-4 font-medium">Description</h2>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-32 pt-16 border-t border-ink/10">
            <h2 className="text-xs uppercase tracking-[0.3em] text-center mb-12">More from {product.vendor}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {related.map((e) => (
                <ProductCard key={e.node.id} product={e} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function VariantOption({
  option,
  variants,
  selected,
  onSelect,
}: {
  option: { name: string; values: string[] };
  variants: ShopifyVariant[];
  selected?: ShopifyVariant;
  onSelect: (v: ShopifyVariant) => void;
}) {
  const selectedValue = selected?.selectedOptions.find((o) => o.name === option.name)?.value;
  return (
    <div className="mb-8">
      <div className="flex justify-between items-baseline mb-3">
        <p className="text-[10px] uppercase tracking-[0.25em] font-medium">{option.name}</p>
        {selectedValue && <p className="text-xs text-muted-foreground">{selectedValue}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {option.values.map((value) => {
          // pick a variant where this option = value AND matches the other currently-selected options where possible
          const candidate =
            variants.find((v) => {
              if (!selected) return v.selectedOptions.some((o) => o.name === option.name && o.value === value);
              return v.selectedOptions.every((o) =>
                o.name === option.name
                  ? o.value === value
                  : selected.selectedOptions.find((so) => so.name === o.name)?.value === o.value
              );
            }) ??
            variants.find((v) => v.selectedOptions.some((o) => o.name === option.name && o.value === value));
          const active = selectedValue === value;
          const unavailable = candidate && !candidate.availableForSale;
          return (
            <button
              key={value}
              onClick={() => candidate && onSelect(candidate)}
              disabled={!candidate}
              className={`px-4 py-2 text-xs uppercase tracking-widest border transition-colors
                ${active ? "border-ink bg-ink text-canvas" : "border-ink/15 hover:border-ink"}
                ${unavailable ? "line-through opacity-50" : ""}`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="px-6 py-12 max-w-screen-2xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        <div className="w-full aspect-[4/5] bg-muted animate-pulse" />
        <div className="space-y-4">
          <div className="h-3 w-24 bg-muted animate-pulse" />
          <div className="h-8 w-3/4 bg-muted animate-pulse" />
          <div className="h-6 w-32 bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
