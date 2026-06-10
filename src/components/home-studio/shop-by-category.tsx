/**
 * Shop by Category — four editorial tiles under the hero on After Dark.
 *
 * Image fallback chain (per tile):
 *   1. Collection-backed tiles (Riviera Edit, Coastal Essentials):
 *        collection.image  →  first product's featured image  →  noir block
 *   2. Gender tiles (Menswear, Womenswear): NOT collections — no collection
 *      image exists. Pull from a representative collection's lead product:
 *        Menswear    → the-riviera-edit  lead product image
 *        Womenswear  → womens-dresses    lead product image
 *      Then noir-block fallback.
 *   3. Final fallback: bg-noir-panel block with ivory label. A console.warn
 *      fires so silent image failures are visible.
 *
 * Order: Menswear, Womenswear, The Riviera Edit, Coastal Essentials.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowUpRight } from "lucide-react";

import { collectionRailQueryOptions } from "@/lib/rails/queries";
import { collectionHeroImageQueryOptions } from "@/lib/collection-hero-image";

type CategoryTile = {
  label: string;
  /** Collection handle used to resolve a hero image (and first product). */
  imageHandle: string;
  /** Use the collection image as the primary source. False for gender tiles
   * (which are not collections themselves). */
  useCollectionImage: boolean;
  to: string;
  params?: Record<string, string>;
};

const TILES: CategoryTile[] = [
  // Menswear leads.
  {
    label: "Menswear",
    imageHandle: "the-riviera-edit",
    useCollectionImage: false,
    to: "/men",
  },
  {
    label: "Womenswear",
    imageHandle: "womens-dresses",
    useCollectionImage: false,
    to: "/women",
  },
  {
    label: "The Riviera Edit",
    imageHandle: "the-riviera-edit",
    useCollectionImage: true,
    to: "/collections/$handle",
    params: { handle: "the-riviera-edit" },
  },
  {
    label: "Coastal Essentials",
    imageHandle: "coastal-essentials",
    useCollectionImage: true,
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
  const { data: hero } = useQuery(
    collectionHeroImageQueryOptions(tile.imageHandle),
  );

  const leadImg = rail?.[0]?.node.images?.edges?.[0]?.node ?? null;

  // Apply per-tile fallback chain.
  const primary = tile.useCollectionImage ? hero ?? null : null;
  const secondary = leadImg;
  const src = primary?.url ?? secondary?.url ?? null;
  const alt =
    primary?.altText ?? secondary?.altText ?? tile.label;

  // Surface silent image failures to the console once both queries resolve.
  useEffect(() => {
    if (rail === undefined || hero === undefined) return; // still loading
    if (!src) {
      // eslint-disable-next-line no-console
      console.warn(
        `[ShopByCategory] Tile "${tile.label}" fell through to noir fallback. ` +
          `Checked collection "${tile.imageHandle}" (hero=${
            hero ? "present" : "null"
          }, leadProduct=${leadImg ? "present" : "null"}).`,
      );
    }
  }, [rail, hero, src, leadImg, tile.label, tile.imageHandle]);

  const inner = (
    <div
      className="relative w-full bg-noir-panel"
      style={{ aspectRatio: "4 / 5" }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.04]"
          style={{ filter: "brightness(0.72) contrast(1.05) saturate(0.95)" }}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        // Final fallback: noir-panel block with ivory label.
        <div
          className="absolute inset-0 grid place-items-end justify-start p-6 bg-noir-panel"
          aria-hidden="true"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-canvas/50">
            {tile.label}
          </span>
        </div>
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(5,5,5,0.82) 0%, rgba(5,5,5,0.28) 55%, rgba(5,5,5,0) 100%)",
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 px-6 py-7 flex items-end justify-between gap-4">
        <h3 className="text-[11px] md:text-[12px] uppercase tracking-[0.32em] text-ivory">
          {tile.label}
        </h3>
        <ArrowUpRight
          className="w-4 h-4 text-ivory/80 group-hover:text-gold transition-colors"
          strokeWidth={1.25}
        />
      </div>
    </div>
  );

  const className = "group relative block bg-luxury-dark overflow-hidden";

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
    <Link
      to={tile.to as "/men" | "/women"}
      className={className}
      aria-label={tile.label}
    >
      {inner}
    </Link>
  );
}
