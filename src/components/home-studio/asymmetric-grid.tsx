/**
 * AsymmetricGrid — segmented editorial 12-column asymmetric tile grid.
 *
 * Defaults to the Men's ("Homme") catalog as primary focus, with a quiet
 * Femme toggle. Each segment consumes its own live "New In" rail
 * (`newThisWeekQueryOptions("Men" | "Women")`), so every tile links to a
 * verified Shopify handle. No cross-contamination between segments.
 */
import { useState } from "react";
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
  menProducts: ProductNode[];
  womenProducts: ProductNode[];
}

type Segment = "men" | "women";

export function AsymmetricGrid({ menProducts, womenProducts }: AsymmetricGridProps) {
  // Default to Men's — the brand's primary audience focus.
  const [segment, setSegment] = useState<Segment>("men");
  const products = segment === "men" ? menProducts : womenProducts;

  // Editorial print rhythm: alternate vertical 4:5 portraits with 1:1 squares,
  // anchored by one wider landscape midway through the spread. Each row is
  // intentionally offset so the eye drifts diagonally, mimicking a magazine
  // double-page editorial rather than a uniform grid.
  const layout: Array<{ col: string; aspect: string; mt?: string }> = [
    { col: "md:col-start-1 md:col-span-5", aspect: "aspect-[4/5]" },
    { col: "md:col-start-7 md:col-span-4", aspect: "aspect-square",  mt: "md:mt-28" },
    { col: "md:col-start-1 md:col-span-7", aspect: "aspect-[16/9]",  mt: "md:mt-16" },
    { col: "md:col-start-9 md:col-span-4", aspect: "aspect-[4/5]",   mt: "md:-mt-40" },
    { col: "md:col-start-2 md:col-span-4", aspect: "aspect-square",  mt: "md:mt-20" },
    { col: "md:col-start-7 md:col-span-5", aspect: "aspect-[4/5]",   mt: "md:mt-36" },
  ];

  const SegmentButton = ({ value, label }: { value: Segment; label: string }) => {
    const active = segment === value;
    return (
      <button
        onClick={() => setSegment(value)}
        className="relative pb-2 text-[10px] tracking-[0.4em] uppercase transition-all duration-500"
        style={{
          color: active ? palette.offwhite : palette.muted,
          fontFamily: fontSans,
          fontWeight: active ? 500 : 300,
        }}
      >
        {label}
        <span
          className="absolute left-0 right-0 -bottom-px h-px transition-all duration-500"
          style={{
            background: palette.sand,
            transform: active ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left",
          }}
        />
      </button>
    );
  };

  return (
    <div>
      {/* Segmented controller — Homme primary, Femme secondary */}
      <div
        className="flex items-center gap-10 mb-10 md:mb-14 pb-6 border-b"
        style={{ borderColor: "rgba(244,241,236,0.08)" }}
      >
        <SegmentButton value="men" label="Homme / Men" />
        <SegmentButton value="women" label="Femme / Women" />
        <span
          className="ml-auto hidden md:inline text-[10px] tracking-[0.32em] uppercase"
          style={{ color: palette.muted, fontFamily: fontSans }}
        >
          Curated pieces · {segment === "men" ? "Homme" : "Femme"} archive
        </span>
      </div>

      {products.length === 0 ? (
        <p className="text-sm" style={{ color: palette.muted, fontFamily: fontSans }}>
          The next {segment === "men" ? "Homme" : "Femme"} edit is being curated.
        </p>
      ) : (
        <div
          key={segment}
          className="grid grid-cols-1 md:grid-cols-12 gap-y-10 md:gap-y-0 md:gap-x-8 animate-[studioFade_.7s_ease-out_both]"
        >
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
                      decoding={idx === 0 ? "sync" : "async"}
                      // First tile is the LCP candidate on this section — hint
                      // the browser to fetch it ahead of below-the-fold media.
                      {...(idx === 0 ? { fetchPriority: "high" as const } : {})}
                      width={1000}
                      height={1250}
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
      )}
    </div>
  );
}
