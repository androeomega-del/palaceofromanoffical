/**
 * Preloved product tile — image-led, single condition badge on top-right,
 * native TanStack <Link> with a keyword-dense aria-label. Reserved
 * aspect-ratio + `contain: layout` keeps CLS at 0 during hydration.
 */
import { Link } from "@tanstack/react-router";
import { cdnImage, cdnSrcSet } from "@/lib/cdn-image";
import { buildLuxuryListingAlt } from "@/lib/product-alt";
import { PriceTag } from "@/components/price-tag";
import type { ShopifyProductNode } from "@/lib/shopify";

type Props = {
  product: ShopifyProductNode;
  /** Condition badge shown on the card (e.g. "PRISTINE"). */
  condition: string;
  /** 0-indexed slot — first 4 cards eager-load. */
  position?: number;
};

export function PrelovedProductTile({ product, condition, position = 99 }: Props) {
  const img = product.images?.edges?.[0]?.node;
  const alt = buildLuxuryListingAlt({ title: product.title, vendor: product.vendor });
  const eager = position < 4;
  const ariaLabel = `Preloved ${condition} condition ${product.vendor ?? ""} ${product.title} — authenticated pre-owned designer fashion`.replace(/\s+/g, " ").trim();

  return (
    <Link
      to="/product/$handle"
      params={{ handle: product.handle }}
      aria-label={ariaLabel}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
      style={{ contain: "layout" }}
    >
      <div
        className="relative w-full overflow-hidden bg-canvas-raised"
        style={{ aspectRatio: "3 / 4", contain: "layout", minHeight: "1px" }}
      >
        {img ? (
          <img
            src={cdnImage(img.url, { width: 800, format: "webp" })}
            srcSet={cdnSrcSet(img.url, [400, 700, 1000, 1400])}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw"
            alt={alt}
            width={800}
            height={1067}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={eager ? "high" : "auto"}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : null}
        <span
          className="absolute right-3 top-3 rounded-sm bg-white/95 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-ink shadow-sm"
          aria-hidden="true"
        >
          {condition}
        </span>
      </div>
      <div className="mt-3 flex min-h-[3.25rem] flex-col gap-1" style={{ contain: "layout" }}>
        {product.vendor ? (
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">
            {product.vendor}
          </span>
        ) : null}
        <span className="line-clamp-2 text-sm text-ink">{product.title}</span>
        <PriceTag money={product.priceRange.minVariantPrice} />
      </div>
    </Link>
  );
}
