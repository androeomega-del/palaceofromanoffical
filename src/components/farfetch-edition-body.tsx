/**
 * FarfetchEditionBody — Farfetch-style homepage gateway.
 *
 * Replaces the dense, multi-section DefaultEditionBody with a focused
 * Farfetch-inspired flow:
 *
 *   1. Department gateway — 3 large editorial tiles (Women / Men / Accessories)
 *   2. Seasonal campaign banner — a single, themed hero with editorial copy
 *   3. Category quick-links — 6 product-led tiles using live Shopify imagery
 *   4. Discrete trust strip — 1 row of confidence-builders, no urgency
 *
 * Voice: curatorial, restrained, confident. No urgency timers, no flash-sale
 * pressure, no dense product grids above the fold. The homepage is an
 * invitation to browse — not a catalogue.
 *
 * DefaultEditionBody stays in the repo unused so Phase 1 is reversible by
 * swapping the import in <EditionLayout/> back.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ShieldCheck, Plane, RotateCcw, MessageCircle } from "lucide-react";

import { fetchCollection, fetchProducts } from "@/lib/shopify";
import { cdnImage } from "@/lib/cdn-image";
import { ProductCard } from "@/components/product-card";

import marketingWomen from "@/assets/marketing-women-summer.jpg";
import marketingMen from "@/assets/marketing-men-summer.jpg";
import marketingAccessories from "@/assets/marketing-accessories-summer.jpg";
import marketingMensResort from "@/assets/marketing-men-resort-summer.jpg";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Public component                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

export function FarfetchEditionBody({ aiBlocks }: { aiBlocks?: ReactNode } = {}) {
  return (
    <>
      <DepartmentGateway />
      <NewInRail />
      <SeasonalCampaignBanner />
      <CategoryQuickLinks />
      {aiBlocks}
      <DiscreteTrustStrip />
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  1. Department gateway — 3 large tiles                                     */
/* ────────────────────────────────────────────────────────────────────────── */

const DEPARTMENTS: {
  label: string;
  to: string;
  params?: { handle: string };
  image: string;
  alt: string;
}[] = [
  {
    label: "Womenswear",
    to: "/collections/$handle",
    params: { handle: "womens-clothing" },
    image: marketingWomen,
    alt: "Womenswear — curated luxury from the world's leading houses",
  },
  {
    label: "Menswear",
    to: "/men",
    image: marketingMen,
    alt: "Menswear — tailoring, ready-to-wear, and designer essentials",
  },
  {
    label: "Accessories",
    to: "/collections/$handle",
    params: { handle: "womens-accessories" },
    image: marketingAccessories,
    alt: "Accessories — bags, eyewear, scarves and fine pieces",
  },
];

function DepartmentGateway() {
  return (
    <section
      aria-label="Shop by department"
      className="bg-canvas pt-6 md:pt-10"
    >
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <p className="text-center text-[10px] uppercase tracking-[0.4em] text-bronze-deep mb-6 md:mb-8">
          The Edit — Resort 2026
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {DEPARTMENTS.map((d, i) => (
            <a
              key={d.label}
              href={d.params ? `/collections/${d.params.handle}` : d.to}
              className="group relative block aspect-[4/5] lg:aspect-[3/4] overflow-hidden bg-muted"
            >
              <img
                src={d.image}
                alt={d.alt}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex items-end justify-center">
                <span className="font-serif text-[1.6rem] md:text-2xl lg:text-3xl xl:text-4xl text-canvas tracking-[0.02em] uppercase leading-none max-w-full px-1 text-center break-words">
                  {d.label}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  2. New In — horizontal commerce rail                                      */
/* ────────────────────────────────────────────────────────────────────────── */

function NewInRail() {
  const { data, isLoading } = useQuery({
    queryKey: ["home", "farfetch-new-in"],
    queryFn: () => fetchProducts({ first: 12, sortKey: "CREATED_AT", reverse: true }),
    staleTime: 10 * 60 * 1000,
  });
  const products = data ?? [];

  return (
    <section aria-label="New in" className="bg-canvas pt-14 md:pt-20">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <div className="flex items-end justify-between gap-6 mb-7 md:mb-9">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-bronze-deep mb-2">
              New In
            </p>
            <h2 className="font-serif text-2xl md:text-3xl text-ink">
              Just landed at Palace of Roman
            </h2>
          </div>
          <Link
            to="/collections/$handle"
            params={{ handle: "new-arrivals" }}
            className="hidden sm:inline-flex text-[11px] uppercase tracking-[0.25em] border-b border-ink/25 pb-1 hover:text-bronze hover:border-bronze transition-colors"
          >
            Shop all →
          </Link>
        </div>
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[46vw] sm:w-[30vw] lg:w-[19vw] xl:w-[15vw]">
                <div className="aspect-[3/4] por-shimmer mb-3" />
                <div className="h-2 w-20 por-shimmer mb-2" />
                <div className="h-3 w-3/4 por-shimmer" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="flex gap-4 md:gap-5 overflow-x-auto pb-4 -mx-6 md:-mx-10 px-6 md:px-10 snap-x snap-mandatory scrollbar-hide">
            {products.map((p) => (
              <div key={p.node.id} className="shrink-0 w-[46vw] sm:w-[30vw] lg:w-[19vw] xl:w-[15vw] snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  3. Seasonal campaign banner — single editorial hero                       */
/* ────────────────────────────────────────────────────────────────────────── */

function SeasonalCampaignBanner() {
  return (
    <section
      aria-label="Resort 2026 campaign"
      className="bg-canvas pt-16 md:pt-24"
    >
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <Link
          to="/editorial/resort-2026"
          className="group grid grid-cols-1 md:grid-cols-2 items-stretch border border-ink/10 overflow-hidden"
        >
          <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[520px] overflow-hidden bg-muted order-1 md:order-2">
            <img
              src={marketingMensResort}
              alt="Resort 2026 — sun-bleached linens, sea-soaked silks, the Mediterranean rendered in cloth"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
            />
          </div>
          <div className="flex flex-col justify-center px-8 md:px-14 py-8 md:py-16 order-2 md:order-1 bg-canvas">
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-5">
              The Resort Edit
            </p>
            <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] text-ink mb-5 max-w-[18ch]">
              The Mediterranean, rendered in cloth.
            </h2>
            <p className="text-[14px] md:text-[15px] text-muted-foreground leading-relaxed max-w-md mb-8">
              Sun-bleached linens, sea-soaked silks, and the houses that know
              the difference between dressing for warmth and dressing for light.
              Curated from Versace, Dolce &amp; Gabbana, Brunello Cucinelli and
              the maisons defining the season.
            </p>
            <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze/50 pb-1 self-start group-hover:text-bronze group-hover:border-bronze transition-colors">
              Explore the Edit →
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  3. Category quick-links — 6 product-led tiles                             */
/* ────────────────────────────────────────────────────────────────────────── */

type CategoryTile = {
  handle: string;
  label: string;
  fallbackAlt: string;
};

const CATEGORY_TILES: CategoryTile[] = [
  { handle: "new-arrivals", label: "New In", fallbackAlt: "New arrivals — fresh pieces this week" },
  { handle: "womens-clothing", label: "Clothing", fallbackAlt: "Designer clothing" },
  { handle: "womens-shoes", label: "Shoes", fallbackAlt: "Designer shoes" },
  { handle: "italian-leather-handbags", label: "Bags", fallbackAlt: "Designer handbags" },
  { handle: "designer-sunglasses", label: "Eyewear", fallbackAlt: "Designer sunglasses" },
  { handle: "silk-scarves", label: "Silk & Scarves", fallbackAlt: "Silk scarves" },
];

function CategoryQuickLinks() {
  return (
    <section aria-label="Shop by category" className="bg-canvas pt-16 md:pt-24">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <div className="flex items-baseline justify-between mb-8 md:mb-10">
          <h2 className="font-serif text-2xl md:text-3xl text-ink">
            Shop by category
          </h2>
          <Link
            to="/shop"
            className="text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze/40 pb-1 hover:text-bronze hover:border-bronze transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {CATEGORY_TILES.map((tile) => (
            <CategoryTile key={tile.handle} tile={tile} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryTile({ tile }: { tile: CategoryTile }) {
  const { data } = useQuery({
    queryKey: ["home", "category-tile", tile.handle],
    queryFn: () => fetchCollection(tile.handle, 1),
    staleTime: 10 * 60 * 1000,
  });
  const firstProduct = data?.products?.edges?.[0]?.node;
  const productImg = firstProduct?.images?.edges?.[0]?.node;
  const collectionImg = data?.image;
  const imgUrl = productImg?.url ?? collectionImg?.url ?? null;
  const alt =
    productImg?.altText ??
    collectionImg?.altText ??
    tile.fallbackAlt;

  return (
    <Link
      to="/collections/$handle"
      params={{ handle: tile.handle }}
      className="group block"
    >
      <div className="relative aspect-[3/4] bg-muted overflow-hidden mb-3">
        {imgUrl ? (
          <img
            src={cdnImage(imgUrl, { width: 600 })}
            alt={alt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div className="absolute inset-0 por-shimmer" aria-hidden="true" />
        )}
      </div>
      <p className="text-[12px] md:text-[13px] uppercase tracking-[0.2em] text-ink text-center group-hover:text-bronze transition-colors">
        {tile.label}
      </p>
    </Link>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  4. Discrete trust strip — single row, no urgency                          */
/* ────────────────────────────────────────────────────────────────────────── */

function DiscreteTrustStrip() {
  const items = [
    { Icon: ShieldCheck, label: "100% Authentic", caption: "Global boutique partners" },
    { Icon: Plane, label: "Ships from EU", caption: "Tracked worldwide" },
    { Icon: RotateCcw, label: "14-Day Returns", caption: "Hassle-free" },
    { Icon: MessageCircle, label: "Personal Concierge", caption: "Replies within 24h" },
  ];
  return (
    <section
      aria-label="Why shop Palace of Roman"
      className="bg-canvas-raised border-y border-ink/10 mt-20 md:mt-32"
    >
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-10 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          {items.map(({ Icon, label, caption }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <Icon className="w-5 h-5 text-bronze mb-3" strokeWidth={1.25} />
              <p className="text-[11px] uppercase tracking-[0.25em] text-ink mb-1.5">
                {label}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
