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
import { vendorSlug } from "@/lib/nav-config";
import {
  EditorialLinksRail,
  HOMEPAGE_EDITORIAL_LINKS,
} from "@/components/editorial-links-rail";

import marketingWomen from "@/assets/marketing-women-editorial.jpg";
import marketingMen from "@/assets/marketing-men-editorial.jpg";

import marketingMensResort from "@/assets/marketing-men-resort-summer.jpg";

import brandGucci from "@/assets/brand-gucci.jpg";
import brandPrada from "@/assets/brand-prada.jpg";
import brandBottega from "@/assets/brand-bottega-veneta.jpg";
import brandSaintLaurent from "@/assets/brand-saint-laurent.jpg";
import brandTomFord from "@/assets/brand-tom-ford.jpg";
import brandDolce from "@/assets/brand-dolce-gabbana.jpg";
import brandVersace from "@/assets/brand-versace.jpg";


/* ────────────────────────────────────────────────────────────────────────── */
/*  Public component                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

export function FarfetchEditionBody({ aiBlocks }: { aiBlocks?: ReactNode } = {}) {
  return (
    <>
      <DepartmentGateway />
      <BestSellersRail />
      <SeasonalCampaignBanner />
      <NewInRail />
      <CategoryQuickLinks />
      {aiBlocks}
      <EditorialLinksRail
        links={HOMEPAGE_EDITORIAL_LINKS}
        eyebrow="From the Editorial"
        heading="Read, then shop"
      />
      <DiscreteTrustStrip />
      <BrandStatement />
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
];

function DepartmentGateway() {
  return (
    <section
      aria-label="Shop by department"
      className="bg-canvas pt-6 md:pt-10"
    >
      <div className="max-w-screen-2xl mx-auto md:px-10">
        <h1 className="text-center font-serif text-headline-sm md:text-headline-md text-ink mb-3 px-6 md:px-0">
          Palace of Roman — The Maisons Defining the Seasons
        </h1>
        <p className="text-center text-eyebrow uppercase text-bronze-deep mb-6 md:mb-8 px-6 md:px-0">
          The Edit — Resort 2026
        </p>
        {/* Mobile: horizontal-scroll, 82vw tiles, second tile peeks at 18vw to signal scroll.
            Desktop (md+): standard two-column grid. */}
        <div
          className="flex md:grid md:grid-cols-2 gap-4 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory pl-6 pr-6 md:pl-0 md:pr-0 -mx-px md:mx-0 scrollbar-hide"
          style={{ scrollPaddingLeft: "1.5rem" }}
        >
          {DEPARTMENTS.map((d, i) => (
            <a
              key={d.label}
              href={d.params ? `/collections/${d.params.handle}` : d.to}
              className="group relative block aspect-[4/5] lg:aspect-[3/4] overflow-hidden bg-muted shrink-0 snap-start w-[82vw] md:w-auto"
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

const BRAND_TILES: ReadonlyArray<{ name: string; image: string }> = [
  { name: "Gucci", image: brandGucci },
  { name: "Prada", image: brandPrada },
  { name: "Bottega Veneta", image: brandBottega },
  { name: "Saint Laurent", image: brandSaintLaurent },
  { name: "Tom Ford", image: brandTomFord },
  { name: "Dolce & Gabbana", image: brandDolce },
  { name: "Versace", image: brandVersace },
];

function NewInRail() {
  return (
    <section aria-label="The Euphoria Edit" className="bg-canvas pt-14 md:pt-20">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <div className="flex items-end justify-between gap-6 mb-7 md:mb-9">
          <div>
            <h2 className="font-serif text-subhead-md md:text-subhead-lg text-ink mb-2">
              The Euphoria Edit
            </h2>
            <p className="text-eyebrow uppercase text-bronze-deep">
              The maisons defining the seasons
            </p>
          </div>
          <Link
            to="/brands"
            className="hidden sm:inline-flex text-cta-md uppercase border-b border-ink/25 pb-1 hover:text-bronze hover:border-bronze transition-colors"
          >
            All brands →
          </Link>
        </div>
        <div className="flex gap-4 md:gap-5 overflow-x-auto pb-4 -mx-6 md:-mx-10 px-6 md:px-10 snap-x snap-mandatory scrollbar-hide">
          {BRAND_TILES.map((b) => (
            <Link
              key={b.name}
              to="/brand/$vendor"
              params={{ vendor: vendorSlug(b.name) }}
              className="group shrink-0 w-[46vw] sm:w-[30vw] lg:w-[19vw] xl:w-[15vw] snap-start"
              aria-label={`Shop ${b.name}`}
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-ink/5">
                <img
                  src={b.image}
                  alt={`Shop ${b.name} at Palace of Roman`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                  <h3 className="font-serif text-[22px] md:text-[26px] leading-none text-white tracking-tight">
                    {b.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ────────────────────────────────────────────────────────────────────────── */
/*  2b. Best Sellers — horizontal commerce rail                               */
/* ────────────────────────────────────────────────────────────────────────── */

function BestSellersRail() {
  const { data, isLoading } = useQuery({
    queryKey: ["home", "best-sellers"],
    queryFn: () => fetchProducts({ first: 12, sortKey: "BEST_SELLING" }),
    staleTime: 10 * 60 * 1000,
  });
  const products = data ?? [];

  return (
    <section aria-label="Best sellers" className="bg-canvas pt-14 md:pt-20">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <div className="mb-7 md:mb-9">
          <h2 className="font-serif text-subhead-md md:text-subhead-lg text-ink mb-2">
            Releases you missed
          </h2>
          <p className="text-eyebrow uppercase text-bronze-deep">
            STILL AVAILABLE — FOR NOW
          </p>
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
          <div className="flex flex-col justify-center px-6 md:px-10 lg:px-14 py-8 md:py-16 order-2 md:order-1 bg-canvas">
            <p className="text-eyebrow uppercase text-bronze-deep mb-5">
              The Resort Edit
            </p>
            <h2 className="font-serif text-headline-md md:text-display-sm text-ink mb-5 max-w-[18ch]">
              The Mediterranean, rendered in cloth.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md mb-8">
              Sun-bleached linens, sea-soaked silks, and the houses that know
              the difference between dressing for warmth and dressing for light.
              Curated from Versace, Dolce &amp; Gabbana, Brunello Cucinelli and
              the maisons defining the season.
            </p>
            <span className="inline-flex items-center gap-3 text-cta-lg uppercase text-ink border-b border-bronze/50 pb-1 self-start group-hover:text-bronze group-hover:border-bronze transition-colors">
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
  /** Local editorial hero. Always used in preference to the Shopify
   *  collection image / first product image so the homepage holds a
   *  consistent, art-directed look. */
  image: string;
};

import newArrivalsImg from "@/assets/home-categories/new-arrivals.jpg";
import clothingImg from "@/assets/home-categories/clothing.jpg";
import shoesImg from "@/assets/home-categories/shoes.jpg";
import bagsImg from "@/assets/home-categories/bags.jpg";
import sunglassesImg from "@/assets/home-categories/sunglasses.jpg";
import accessoriesImg from "@/assets/home-categories/accessories.jpg";

const CATEGORY_TILES: CategoryTile[] = [
  { handle: "new-arrivals", label: "New In",      fallbackAlt: "New arrivals — fresh pieces this week",          image: newArrivalsImg },
  { handle: "clothing",     label: "Clothing",    fallbackAlt: "Designer clothing across menswear and womenswear", image: clothingImg },
  { handle: "shoes",        label: "Shoes",       fallbackAlt: "Designer shoes — loafers, sneakers, boots and more", image: shoesImg },
  { handle: "bags",         label: "Bags",        fallbackAlt: "Designer handbags, totes and crossbody",         image: bagsImg },
  { handle: "sunglasses",   label: "Sunglasses",  fallbackAlt: "Designer sunglasses",                            image: sunglassesImg },
  { handle: "accessories",  label: "Accessories", fallbackAlt: "Belts, wallets, jewellery and fine accessories", image: accessoriesImg },
];

function CategoryQuickLinks() {
  return (
    <section aria-label="Shop by category" className="bg-canvas pt-16 md:pt-24">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <p className="text-eyebrow uppercase text-bronze-deep mb-5">
          SHOP BY WHAT YOU ACTUALLY NEED
        </p>
        <div className="flex items-baseline justify-between mb-8 md:mb-10">
          <h2 className="font-serif text-subhead-md md:text-subhead-lg text-ink">
            Shop by category
          </h2>
          <Link
            to="/shop"
            className="text-cta-lg uppercase text-ink border-b border-bronze/40 pb-1 hover:text-bronze hover:border-bronze transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-5">
          {CATEGORY_TILES.map((tile) => (
            <CategoryTile key={tile.handle} tile={tile} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryTile({ tile }: { tile: CategoryTile }) {
  return (
    <Link
      to="/collections/$handle"
      params={{ handle: tile.handle }}
      className="group block"
    >
      <div className="relative aspect-[3/4] bg-muted overflow-hidden mb-3">
        <img
          src={tile.image}
          alt={tile.fallbackAlt}
          loading="lazy"
          width={768}
          height={1024}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
        />
      </div>
      <p className="text-cta-sm uppercase text-ink text-center group-hover:text-bronze-deep transition-colors">
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
              <Icon className="w-5 h-5 text-bronze-deep mb-3" strokeWidth={1.25} />
              <p className="text-cta-md uppercase text-ink mb-1.5">
                {label}
              </p>
              <p className="text-eyebrow text-muted-foreground leading-relaxed normal-case tracking-normal">
                {caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Brand statement                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

function BrandStatement() {
  return (
    <section className="bg-canvas pt-16 md:pt-24">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10 text-center">
        <p className="font-serif text-headline-sm md:text-headline-md text-ink max-w-3xl mx-auto">
          While everyone else stocks everything, we stock the right things.
        </p>
      </div>
    </section>
  );
}
