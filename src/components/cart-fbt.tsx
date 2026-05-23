import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { fetchProducts, formatPrice, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cart-store";

interface Props {
  productType: string | null;
  excludeHandles: Set<string>;
}

export function CartFbt({ productType, excludeHandles }: Props) {
  const [items, setItems] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!productType) return;
    let cancelled = false;
    setLoading(true);
    fetchProducts({ first: 12, query: `product_type:"${productType}"` })
      .then((edges) => {
        if (cancelled) return;
        const filtered = edges
          .filter((e) => !excludeHandles.has(e.node.handle))
          .filter((e) => e.node.variants.edges.some((v) => v.node.availableForSale))
          .sort(
            (a, b) =>
              parseFloat(a.node.priceRange.minVariantPrice.amount) -
              parseFloat(b.node.priceRange.minVariantPrice.amount),
          )
          .slice(0, 3);
        setItems(filtered);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [productType, excludeHandles]);

  if (!productType || (!loading && items.length === 0)) return null;

  const handleAdd = async (p: ShopifyProduct) => {
    const variant = p.node.variants.edges.find((v) => v.node.availableForSale)?.node;
    if (!variant) return;
    setAddingId(p.node.id);
    try {
      await addItem({
        product: p,
        variantId: variant.id,
        variantTitle: variant.title,
        price: variant.price,
        quantity: 1,
        selectedOptions: variant.selectedOptions,
      });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="border-t border-ink/10 px-6 py-5">
      <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-ink/70 mb-3">
        Frequently Bought Together
      </p>
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1 snap-x snap-mandatory scrollbar-none">
          {items.map((p) => {
            const img = p.node.images?.edges?.[0]?.node;
            return (
              <div
                key={p.node.id}
                className="relative w-32 flex-shrink-0 snap-start"
              >
                <div className="w-32 h-40 bg-muted overflow-hidden">
                  {img && (
                    <img
                      src={img.url}
                      alt={img.altText ?? p.node.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <button
                  onClick={() => handleAdd(p)}
                  disabled={addingId === p.node.id}
                  aria-label={`Add ${p.node.title} to bag`}
                  className="absolute top-1.5 right-1.5 w-7 h-7 bg-canvas/95 border border-ink/15 flex items-center justify-center hover:bg-ink hover:text-canvas transition-colors disabled:opacity-60"
                >
                  {addingId === p.node.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  )}
                </button>
                <p className="text-[9px] uppercase tracking-widest text-bronze mt-2 truncate">
                  {p.node.vendor}
                </p>
                <p className="text-[11px] leading-snug line-clamp-2 mt-0.5">{p.node.title}</p>
                <p className="text-[11px] mt-1">{formatPrice(p.node.priceRange.minVariantPrice)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
