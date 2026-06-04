/**
 * AsymmetricGrid — editorial 12-column asymmetric tile grid.
 *
 * Consumes products from the live "New In" rail
 * (`newThisWeekQueryOptions`), so every tile links to a verified Shopify
 * handle. Empty state shows curatorial copy — never fabricated tiles.
 */
import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/shopify";
import { palette, fontSans } from "./palette";

interface ProductNode {
  node: {
    id: string;
    handle: string;
    title: string;
    vendor?: string;
    images?: { edges?: Array<{ node: { url: string; altText?: string | null } }> };
    priceRange?: { minVariantPrice: { amount: string; currencyCode: string } };
  };
}

interface AsymmetricGridProps {
  products: ProductNode[];
}

export function AsymmetricGrid({ products }: AsymmetricGridProps) {
  if (products.length === 0) {
    return (
      <p className="text-sm" style={{ color: palette.muted, fontFamily: fontSans }}>
        The next edit is being curated.
      </p>
    );
  }

  const layout: Array<{ col: string; aspect: string; mt?: string }> = [
    { col: "md:col-start-1 md:col-span-5", aspect: "aspect-[3/4]" },
    { col: "md:col-start-7 md:col-span-6", aspect: "aspect-[16/10]", mt: "md:mt-24" },
    { col: "md:col-start-1 md:col-span-7", aspect: "aspect-[16/9]", mt: "md:mt-12" },
    { col: "md:col-start-9 md:col-span-4", aspect: "aspect-[3/4]", mt: "md:-mt-32" },
    { col: "md:col-start-2 md:col-span-5", aspect: "aspect-square", mt: "md:mt-16" },
    { col: "md:col-start-8 md:col-span-4", aspect: "aspect-[4/5]", mt: "md:mt-32" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-y-10 md:gap-y-0 md:gap-x-8">
      {products.map((p, idx) => {
        const slot = layout[idx % layout.length];
        const img = p.node.images?.edges?.[0]?.node;
        const price = p.node.priceRange?.minVariantPrice;
        return (
          <Link
            key={p.node.id}
            to="/product/$handle"
            params={{ handle: p.node.handle }}
            className={`studio-tile group block ${slot.col} ${slot.mt ?? ""}`}
            style={{ animationDelay: `${idx * 120}ms` }}
          >
            <div
              className={`relative overflow-hidden ${slot.aspect}`}
              style={{ background: palette.sandSoft }}
            >
              {img && (
                <img
                  src={img.url}
                  alt={img.altText ?? p.node.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={idx < 2 ? "eager" : "lazy"}
                />
              )}
            </div>
            <div
              className="mt-5 flex items-baseline justify-between gap-4"
              style={{ fontFamily: fontSans }}
            >
              <div className="min-w-0">
                {p.node.vendor && (
                  <p
                    className="text-[10px] uppercase tracking-[0.3em] mb-1.5"
                    style={{ color: palette.sand }}
                  >
                    {p.node.vendor}
                  </p>
                )}
                <p
                  className="text-sm md:text-base font-light truncate group-hover:opacity-70 transition-opacity"
                  style={{ color: palette.offwhite }}
                >
                  {p.node.title}
                </p>
              </div>
              {price && (
                <span className="text-[11px] tracking-[0.15em]" style={{ color: palette.muted }}>
                  {formatPrice(price)}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
