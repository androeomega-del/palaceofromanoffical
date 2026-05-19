import { Link } from "@tanstack/react-router";
import { formatPrice, type ShopifyProduct } from "@/lib/shopify";

export function ProductCard({ product }: { product: ShopifyProduct }) {
  const p = product.node;
  const img = p.images?.edges?.[0]?.node;
  const img2 = p.images?.edges?.[1]?.node;
  const compareAt = p.compareAtPriceRange?.minVariantPrice;
  const price = p.priceRange.minVariantPrice;
  const onSale = compareAt && parseFloat(compareAt.amount) > parseFloat(price.amount);

  const altBase = p.vendor ? `${p.title} — ${p.vendor}` : p.title;
  return (
    <Link to="/product/$handle" params={{ handle: p.handle }} className="group block">
      <div className="w-full aspect-[4/5] bg-muted relative overflow-hidden mb-5">
        {img && (
          <img
            src={img.url}
            alt={img.altText ?? altBase}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 group-hover:opacity-0"
          />
        )}
        {img2 ? (
          <img
            src={img2.url}
            alt={img2.altText ?? altBase}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          />
        ) : (
          img && (
            <img
              src={img.url}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover scale-105 opacity-0 group-hover:opacity-100 transition-all duration-700"
            />
          )
        )}
      </div>
      <p className="text-[10px] uppercase tracking-widest mb-1 text-bronze">{p.vendor}</p>
      <h3 className="text-sm font-medium leading-snug line-clamp-2 text-balance">{p.title}</h3>
      <div className="flex items-baseline gap-3 mt-1.5">
        <p className="text-sm">{formatPrice(price)}</p>
        {onSale && <p className="text-xs text-muted-foreground line-through">{formatPrice(compareAt)}</p>}
      </div>
    </Link>
  );
}
