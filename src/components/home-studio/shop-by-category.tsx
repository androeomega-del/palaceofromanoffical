/**
 * Shop by Category — four large editorial tiles inserted directly under
 * the hero on the After Dark homepage. Each tile pulls its image from the
 * lead product of an associated collection via the Storefront API; falls
 * back to a dark token block with the label if no image resolves.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";

import { collectionRailQueryOptions } from "@/lib/rails/queries";
import { collectionHeroImageQueryOptions } from "@/lib/collection-hero-image";

type CategoryTile = {
  label: string;
  /** Collection handle used purely to resolve a hero image. */
  imageHandle: string;
  /** Destination route. */
  to: string;
  params?: Record<string, string>;
};

const TILES: CategoryTile[] = [
  { label: "Menswear", imageHandle: "suits", to: "/men" },
  { label: "Womenswear", imageHandle: "womens-dresses", to: "/women" },
  {
    label: "The Riviera Edit",
    imageHandle: "the-riviera-edit",
    to: "/collections/$handle",
    params: { handle: "the-riviera-edit" },
  },
  {
    label: "Coastal Essentials",
    imageHandle: "coastal-essentials",
    to: "/collections/$handle",
    params: { handle: "coastal-essentials" },
  },
];

export function ShopByCategorySection() {
  return (
    <section className="bg-ink border-t border-canvas/10">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-14 pt-16 md:pt-24 pb-2">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.45em] text-bronze">
          Shop by Category
        </p>
      </div>
      <div className="max-w-screen-2xl mx-auto px-6 md:px-14 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-canvas/10">
          {TILES.map((t) => (
            <CategoryTileCard key={t.label} tile={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryTileCard({ tile }: { tile: CategoryTile }) {
  const { data: rail } = useQuery(collectionRailQueryOptions(tile.imageHandle, 1));
  const { data: hero } = useQuery(collectionHeroImageQueryOptions(tile.imageHandle));

  const leadImg = rail?.[0]?.node.images?.edges?.[0]?.node;
  const src = leadImg?.url ?? hero?.url ?? null;
  const alt = leadImg?.altText ?? hero?.altText ?? tile.label;

  const inner = (
    <div className="relative w-full bg-black" style={{ aspectRatio: "3 / 4" }}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.04]"
          style={{ filter: "brightness(0.72) contrast(1.05) saturate(0.95)" }}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="absolute inset-0 bg-canvas/5" aria-hidden="true" />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 px-6 py-7 flex items-end justify-between gap-4">
        <h3 className="text-[11px] md:text-[12px] uppercase tracking-[0.32em] text-canvas">
          {tile.label}
        </h3>
        <ArrowUpRight
          className="w-4 h-4 text-canvas/80 group-hover:text-bronze transition-colors"
          strokeWidth={1.25}
        />
      </div>
    </div>
  );

  const className = "group relative block bg-ink overflow-hidden";

  if (tile.params) {
    return (
      <Link
        to={tile.to as "/collections/$handle"}
        params={tile.params as { handle: string }}
        className={className}
        aria-label={tile.label}
      >
        {inner}
      </Link>
    );
  }
  return (
    <Link to={tile.to as "/men" | "/women"} className={className} aria-label={tile.label}>
      {inner}
    </Link>
  );
}
