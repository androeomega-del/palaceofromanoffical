/**
 * Men's Homepage — /men
 *
 * Editorial Farfetch-style gateway for menswear, written in Palace of
 * Roman's curatorial voice. Mirrors the 11-section CEO copy spec.
 *
 * Staged-launch: this page is intentionally NOT linked from primary nav
 * or the home edition body yet. It ships with the spec's revised copy,
 * verified Shopify handles (mens-tailoring / mens-swimwear / mens-shoes /
 * mens-sneakers / mens-bags / mens-sunglasses / mens-accessories /
 * mens-new-arrivals / mens-editor-picks) and existing marketing assets —
 * no new image generation in this pass.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Plane, RotateCcw, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Children, type ReactNode, useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

import { fetchCollection } from "@/lib/shopify";
import { cdnImage } from "@/lib/cdn-image";
import { ProductCard } from "@/components/product-card";

import marketingMenResort from "@/assets/marketing-men-resort-summer.jpg";
import marketingMen from "@/assets/marketing-men-summer.jpg";
import marketingAccessories from "@/assets/marketing-accessories-summer.jpg";
import editorialAsianMaleTailoring from "@/assets/editorial-asian-male-tailoring.jpg";
import editorialLatinoMaleEvening from "@/assets/editorial-latino-male-evening.jpg";
import editorialLinenSupermodel from "@/assets/editorial-linen-supermodel.jpg";
import editorialLoaferSupermodel from "@/assets/editorial-loafer-supermodel.jpg";

export const Route = createFileRoute("/men")({
  head: () => ({
    meta: [
      { title: "Menswear — Resort 2026 | Palace of Roman" },
      {
        name: "description",
        content:
          "Menswear Resort 2026 from Versace, Dolce & Gabbana, Brunello Cucinelli, Armani, Gucci and Prada. Tailored for the long hours of summer. Worldwide shipping, 100% authentic.",
      },
      { property: "og:title", content: "Menswear — Resort 2026 | Palace of Roman" },
      {
        property: "og:description",
        content:
          "Sun-bleached linens, sea-soaked silks, and the houses defining resort 2026. Curated from the world's leading maisons.",
      },
      { property: "og:url", content: "https://palaceofromanofficial.com/men" },
      {
        property: "og:image",
        content: `https://palaceofromanofficial.com${marketingMenResort}`,
      },
      {
        name: "twitter:image",
        content: `https://palaceofromanofficial.com${marketingMenResort}`,
      },
    ],
    links: [
      { rel: "canonical", href: "https://palaceofromanofficial.com/men" },
      { rel: "preload", as: "image", href: marketingMenResort, fetchPriority: "high" } as any,
    ],
  }),
  component: MenHomePage,
});

function MenHomePage() {
  // Sync the global dept store so the header's category rail switches to Men
  // for shoppers who land directly on /men.
  useEffect(() => {
    import("@/stores/dept-store").then((m) => m.useDeptStore.getState().setDept("men"));
  }, []);
  return (
    <>
      <HeroBanner />
      <NewInThisWeek />
      <BrandSpotlightRail />
      <SaleCarousel />
      <TrendingEditorials />
      <BrandSpotlightRailTwo />
      <FeaturedProductRail />
      <BrandsOfTheMoment />
      <EditorialSplit />
      <ShopByOccasion />
      <AccessoryCampaignBanner />
      <TrustStrip />
    </>
  );
}

type CarouselSectionProps = {
  ariaLabel: string;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  sectionClassName?: string;
  itemClassName?: string;
};

function CarouselSection({
  ariaLabel,
  eyebrow,
  title,
  description,
  actions,
  children,
  sectionClassName = "bg-canvas pt-16 md:pt-24",
  itemClassName = "basis-[68%] sm:basis-[42%] md:basis-[32%] lg:basis-[24%]",
}: CarouselSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section aria-label={ariaLabel} className={sectionClassName}>
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <div className="flex items-end justify-between mb-8 md:mb-10 gap-6">
          <div>
            {eyebrow ? (
              <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="font-serif text-3xl md:text-4xl text-ink mb-3">
              {title}
            </h2>
            {description ? (
              <p className="text-[14px] md:text-[15px] text-muted-foreground max-w-lg leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          <div className="hidden md:flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Previous ${ariaLabel}`}
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canPrev}
                className="w-10 h-10 grid place-items-center border border-ink/15 hover:border-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label={`Next ${ariaLabel}`}
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canNext}
                className="w-10 h-10 grid place-items-center border border-ink/15 hover:border-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            {actions}
          </div>
        </div>
        <div className="overflow-hidden -mx-2" ref={emblaRef}>
          <div className="flex">
            {Children.toArray(children).map((child, index) => (
              <div key={index} className={`px-2 shrink-0 ${itemClassName}`}>
                {child}
              </div>
            ))}
          </div>
        </div>
        {actions ? <div className="md:hidden mt-8 text-center">{actions}</div> : null}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  2. Hero Banner                                                     */
/* ─────────────────────────────────────────────────────────────────── */

function HeroBanner() {
  return (
    <section aria-label="Menswear Resort 2026 hero" className="bg-canvas">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[80vh] md:min-h-[78vh]">
        {/* Left: white editorial panel, copy centered */}
        <div className="order-2 md:order-1 flex items-center justify-center bg-canvas px-6 md:px-10 py-14 md:py-0">
          <div className="max-w-md text-center">
            <h1 className="font-serif text-[34px] md:text-[44px] leading-[1.1] text-ink mb-6 md:mb-8">
              Tailored for the long hours of summer
            </h1>
            <p className="text-[14px] md:text-[15px] text-ink/80 leading-relaxed mb-8 md:mb-10">
              Sun-bleached linens, sea-soaked silks, and the houses defining
              resort 2026 — from Versace, Dolce &amp; Gabbana, Brunello
              Cucinelli and more.
            </p>
            <Link
              to="/editorial/resort-2026"
              className="inline-flex items-center justify-center px-8 py-3 border border-ink text-[13px] text-ink hover:bg-ink hover:text-canvas transition-colors"
            >
              Shop Now
            </Link>
          </div>
        </div>
        {/* Right: full-bleed editorial image */}
        <div className="order-1 md:order-2 relative aspect-[4/5] md:aspect-auto bg-muted overflow-hidden">
          <img
            src={marketingMenResort}
            alt="Menswear Resort 2026 — sun-bleached linens and sea-soaked silks photographed in late Mediterranean light"
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}


/* ─────────────────────────────────────────────────────────────────── */
/*  3. New In This Week                                                */
/* ─────────────────────────────────────────────────────────────────── */

function NewInThisWeek() {
  const { data } = useQuery({
    queryKey: ["men", "new-arrivals"],
    queryFn: () => fetchCollection("mens-new-arrivals", 16),
    staleTime: 10 * 60 * 1000,
  });
  const products = data?.products?.edges ?? [];

  return (
    <CarouselSection
      ariaLabel="New in this week"
      eyebrow="New In This Week"
      title="Just Landed"
      description="New arrivals from Versace, Dolce & Gabbana, Brunello Cucinelli and the names defining resort 2026."
      actions={
        <Link
          to="/collections/$handle"
          params={{ handle: "mens-new-arrivals" }}
          className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze/50 pb-1 hover:text-bronze hover:border-bronze transition-colors"
        >
          Explore New In →
        </Link>
      }
    >
      {products.length > 0
        ? products.map((p) => <ProductCard key={p.node.id} product={p} />)
        : Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] por-shimmer bg-muted" />
          ))}
    </CarouselSection>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  4. Trending Categories Grid                                        */
/* ─────────────────────────────────────────────────────────────────── */

const TRENDING_TILES: { handle: string; label: string; alt: string }[] = [
  { handle: "mens-tailoring", label: "Tailoring", alt: "Men's tailoring — unstructured jackets and fluid trousers" },
  { handle: "mens-swimwear", label: "Swimwear", alt: "Men's swimwear — swim shorts and resort essentials" },
  { handle: "mens-shoes", label: "Footwear", alt: "Men's footwear — loafers, drivers and dress shoes" },
  { handle: "mens-sneakers", label: "Trainers", alt: "Men's trainers — designer sneakers" },
  { handle: "mens-bags", label: "Bags", alt: "Men's bags — briefcases, totes and weekenders" },
  { handle: "mens-sunglasses", label: "Sunglasses", alt: "Men's sunglasses — designer eyewear" },
];

function TrendingCategories() {
  return (
    <CarouselSection
      ariaLabel="Dress the season"
      title="Dress the Season"
      description="The resort wardrobe, arranged."
      itemClassName="basis-[58%] sm:basis-[36%] md:basis-[24%] lg:basis-[16.666%]"
    >
      {TRENDING_TILES.map((t) => (
        <TrendingTile key={t.handle} tile={t} />
      ))}
    </CarouselSection>
  );
}

function TrendingTile({ tile }: { tile: { handle: string; label: string; alt: string } }) {
  const { data } = useQuery({
    queryKey: ["men", "trending-tile", tile.handle],
    queryFn: () => fetchCollection(tile.handle, 1),
    staleTime: 10 * 60 * 1000,
  });
  const firstProduct = data?.products?.edges?.[0]?.node;
  const productImg = firstProduct?.images?.edges?.[0]?.node;
  const collectionImg = data?.image;
  const imgUrl = productImg?.url ?? collectionImg?.url ?? null;
  const alt = productImg?.altText ?? collectionImg?.altText ?? tile.alt;

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

/* ─────────────────────────────────────────────────────────────────── */
/*  5. Brand Spotlight Rail                                            */
/* ─────────────────────────────────────────────────────────────────── */

const SPOTLIGHT_BRANDS: { label: string; vendor: string; handle: string; alt: string }[] = [
  { label: "Versace", vendor: "versace", handle: "brand-versace", alt: "Versace menswear" },
  { label: "Dolce & Gabbana", vendor: "dolce-gabbana", handle: "brand-dolce-gabbana", alt: "Dolce & Gabbana menswear" },
];

function BrandSpotlightRail() {
  return (
    <section
      aria-label="Hero brands"
      className="bg-canvas-raised border-y border-ink/10 mt-16 md:mt-24 py-14 md:py-20"
    >
      <div className="max-w-screen-md mx-auto px-5 md:px-10 flex flex-col gap-6 md:gap-10">
        {SPOTLIGHT_BRANDS.map((b) => (
          <BrandSpotlightTile key={b.vendor} brand={b} />
        ))}
      </div>
    </section>
  );
}

function BrandSpotlightTile({
  brand,
}: {
  brand: { label: string; vendor: string; handle: string; alt: string };
}) {
  const { data } = useQuery({
    queryKey: ["men", "brand-spotlight", brand.handle],
    queryFn: () => fetchCollection(brand.handle, 1),
    staleTime: 15 * 60 * 1000,
  });
  const imgUrl =
    data?.image?.url ??
    data?.products?.edges?.[0]?.node?.images?.edges?.[0]?.node?.url ??
    null;
  const alt = data?.image?.altText ?? brand.alt;

  return (
    <Link
      to="/brand/$vendor"
      params={{ vendor: brand.vendor }}
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
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
        <p className="absolute inset-x-0 bottom-4 text-center text-[11px] md:text-[12px] uppercase tracking-[0.3em] text-canvas">
          {brand.label}
        </p>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  6. Editorial Split                                                 */
/* ─────────────────────────────────────────────────────────────────── */

function EditorialSplit() {
  return (
    <CarouselSection
      ariaLabel="Editorial features"
      eyebrow="Editorial"
      title="The Palace of Roman edit"
      description="Seasonal stories arranged as shoppable fashion chapters."
      itemClassName="basis-[86%] sm:basis-[64%] md:basis-[46%] lg:basis-[42%]"
    >
      <EditorialTile
        eyebrow="The Resort Edit"
        headline="Tailoring that breathes."
        body="Unstructured jackets, fluid trousers, and the linen that makes 35 degrees feel intentional."
        cta="Explore Resort Tailoring →"
        handle="mens-tailoring"
        image={marketingMen}
        alt="Resort tailoring — unstructured linen and fluid trousers photographed in soft Mediterranean light"
      />
      <EditorialTile
        eyebrow="Evening"
        headline="After dark."
        body="The dinner jacket, the silk shirt, the details that hold up under candlelight."
        cta="Explore Evening →"
        handle="mens-tailoring"
        image={marketingMenResort}
        alt="Evening menswear — the dinner jacket and silk shirt"
      />
    </CarouselSection>
  );
}

function EditorialTile({
  eyebrow,
  headline,
  body,
  cta,
  handle,
  image,
  alt,
}: {
  eyebrow: string;
  headline: string;
  body: string;
  cta: string;
  handle: string;
  image: string;
  alt: string;
}) {
  return (
    <Link
      to="/collections/$handle"
      params={{ handle }}
      className="group relative block aspect-[4/5] overflow-hidden bg-muted"
    >
      <img
        src={image}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-8 md:p-10 text-canvas">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">
          {eyebrow}
        </p>
        <h3 className="font-serif text-2xl md:text-4xl leading-[1.05] mb-4">
          {headline}
        </h3>
        <p className="text-[13px] md:text-[14px] text-canvas/85 leading-relaxed mb-5 max-w-md">
          {body}
        </p>
        <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-canvas border-b border-bronze pb-1 group-hover:text-bronze transition-colors">
          {cta}
        </span>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  7. Shop by Occasion                                                */
/* ─────────────────────────────────────────────────────────────────── */

const OCCASIONS: { label: string; handle: string }[] = [
  { label: "Workwear", handle: "mens-tailoring" },
  { label: "Weekend", handle: "mens-clothing" },
  { label: "Evening", handle: "mens-tailoring" },
  { label: "Travel", handle: "mens-bags" },
];

function ShopByOccasion() {
  return (
    <CarouselSection
      ariaLabel="Shop by occasion"
      title="Shop by Occasion"
      description="Four ways into the wardrobe."
      itemClassName="basis-[62%] sm:basis-[42%] md:basis-[28%] lg:basis-[22%]"
    >
      {OCCASIONS.map((o) => (
        <Link
          key={o.label}
          to="/collections/$handle"
          params={{ handle: o.handle }}
          className="min-h-36 md:min-h-44 border border-ink/10 bg-canvas hover:bg-canvas-raised transition-colors flex items-center justify-center text-center group"
        >
          <span className="font-serif text-xl md:text-2xl text-ink group-hover:text-bronze transition-colors">
            {o.label}
          </span>
        </Link>
      ))}
    </CarouselSection>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  8. Featured Product Rail — The Buyer's Pick                         */
/* ─────────────────────────────────────────────────────────────────── */

function FeaturedProductRail() {
  // Spec rule: source from mens-editor-picks; if empty, fall back to a
  // secondary curated source (here: mens-tailoring) so the rail is never
  // blank on the page.
  const picks = useQuery({
    queryKey: ["men", "editor-picks"],
    queryFn: () => fetchCollection("mens-editor-picks", 8),
    staleTime: 10 * 60 * 1000,
  });
  const fallback = useQuery({
    queryKey: ["men", "editor-picks-fallback"],
    queryFn: () => fetchCollection("mens-tailoring", 8),
    enabled: !!picks.data && (picks.data?.products?.edges?.length ?? 0) === 0,
    staleTime: 10 * 60 * 1000,
  });

  const fromPicks = picks.data?.products?.edges ?? [];
  const fromFallback = fallback.data?.products?.edges ?? [];
  const products = fromPicks.length > 0 ? fromPicks : fromFallback;
  const sourceHandle = fromPicks.length > 0 ? "mens-editor-picks" : "mens-tailoring";

  return (
    <CarouselSection
      ariaLabel="The Buyer's Pick"
      eyebrow="The Buyer's Pick"
      title="Chosen with intention."
      actions={
        <Link
          to="/collections/$handle"
          params={{ handle: sourceHandle }}
          className="inline-flex shrink-0 items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze/50 pb-1 hover:text-bronze hover:border-bronze transition-colors"
        >
          Explore the Edit →
        </Link>
      }
    >
      {products.length > 0
        ? products.slice(0, 8).map((p) => <ProductCard key={p.node.id} product={p} />)
        : Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] por-shimmer bg-muted" />
          ))}
    </CarouselSection>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  9. Secondary Campaign Banner — The Accessory Edit                  */
/* ─────────────────────────────────────────────────────────────────── */

function AccessoryCampaignBanner() {
  return (
    <CarouselSection
      ariaLabel="The Accessory Edit"
      eyebrow="Accessories"
      title="Finishing pieces"
      description="The belt, the sunglasses, the small pieces that carry a wardrobe's signature."
      itemClassName="basis-[86%] sm:basis-[64%] md:basis-[46%] lg:basis-[42%]"
    >
      <CampaignTile
        eyebrow="The Accessory Edit"
        headline="The Accessory Edit"
        body="The belt that holds the look together. The sunglasses that finish it."
        cta="Explore Accessories →"
        handle="mens-accessories"
        image={marketingAccessories}
        alt="Men's accessories — belts, sunglasses and the small pieces that carry a wardrobe's signature"
      />
      <CampaignTile
        eyebrow="Travel"
        headline="Pack for the long arrival."
        body="Weekend bags, eyewear, and resort essentials selected for movement."
        cta="Explore Travel →"
        handle="mens-bags"
        image={marketingMenResort}
        alt="Men's travel accessories arranged for a resort wardrobe"
      />
    </CarouselSection>
  );
}

function CampaignTile({
  eyebrow,
  headline,
  body,
  cta,
  handle,
  image,
  alt,
}: {
  eyebrow: string;
  headline: string;
  body: string;
  cta: string;
  handle: string;
  image: string;
  alt: string;
}) {
  return (
    <Link
      to="/collections/$handle"
      params={{ handle }}
      className="group grid grid-cols-1 md:grid-cols-2 items-stretch border border-ink/10 overflow-hidden bg-canvas h-full"
    >
      <div className="flex flex-col justify-center px-8 md:px-10 py-10 md:py-14 bg-canvas">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-5">
          {eyebrow}
        </p>
        <h3 className="font-serif text-3xl md:text-4xl leading-[1.05] text-ink mb-5 max-w-[16ch]">
          {headline}
        </h3>
        <p className="text-[14px] md:text-[15px] text-muted-foreground leading-relaxed max-w-md mb-8">
          {body}
        </p>
        <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze/50 pb-1 self-start group-hover:text-bronze group-hover:border-bronze transition-colors">
          {cta}
        </span>
      </div>
      <div className="relative aspect-[4/5] md:aspect-auto overflow-hidden bg-muted">
        <img
          src={image}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
        />
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  10. Heritage Block                                                 */
/* ─────────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────── */
/*  10. Service Carousel                                               */
/* ─────────────────────────────────────────────────────────────────── */

function TrustStrip() {
  const items = [
    { Icon: ShieldCheck, label: "100% Authentic" },
    { Icon: Plane, label: "Ships from EU" },
    { Icon: RotateCcw, label: "14-Day Returns" },
    { Icon: MessageCircle, label: "Personal Concierge" },
  ];
  return (
    <CarouselSection
      ariaLabel="Service promise"
      title="The service promise"
      description="Quiet assurances for a considered luxury purchase."
      sectionClassName="bg-canvas pt-16 md:pt-24 pb-10 md:pb-14"
      itemClassName="basis-[58%] sm:basis-[40%] md:basis-[28%] lg:basis-[22%]"
    >
      {items.map(({ Icon, label }) => (
        <div key={label} className="min-h-36 border border-ink/10 bg-canvas-raised flex flex-col items-center justify-center text-center px-6">
          <Icon className="w-5 h-5 text-bronze mb-3" strokeWidth={1.25} />
          <p className="text-[11px] uppercase tracking-[0.25em] text-ink">
            {label}
          </p>
        </div>
      ))}
    </CarouselSection>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  SS26 Sale — up to 50% off                                          */
/* ─────────────────────────────────────────────────────────────────── */

function SaleCarousel() {
  // Try a dedicated sale collection, fall back to mens-new-arrivals filtered
  // to anything with compareAtPrice. Surface raw products either way so the
  // rail is never empty during the staged launch.
  const sale = useQuery({
    queryKey: ["men", "ss26-sale"],
    queryFn: () => fetchCollection("mens-sale", 12),
    staleTime: 10 * 60 * 1000,
  });
  const fallback = useQuery({
    queryKey: ["men", "ss26-sale-fallback"],
    queryFn: () => fetchCollection("sale", 12),
    enabled: !!sale.data && (sale.data?.products?.edges?.length ?? 0) === 0,
    staleTime: 10 * 60 * 1000,
  });
  const fromSale = sale.data?.products?.edges ?? [];
  const fromFallback = fallback.data?.products?.edges ?? [];
  const products = fromSale.length > 0 ? fromSale : fromFallback;
  const sourceHandle = fromSale.length > 0 ? "mens-sale" : "sale";

  return (
    <CarouselSection
      ariaLabel="SS26 sale up to 50 percent off"
      eyebrow="SS26 Sale — Up to 50% Off"
      title="The end of season."
      description="A closing edit from the houses defining spring–summer 2026. While stock lasts."
      sectionClassName="bg-canvas-raised border-y border-bronze/30 mt-16 md:mt-24 py-14 md:py-20"
      actions={
        <Link
          to="/collections/$handle"
          params={{ handle: sourceHandle }}
          className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze pb-1 hover:text-bronze transition-colors"
        >
          Shop the Sale →
        </Link>
      }
    >
      {products.length > 0
        ? products.slice(0, 12).map((p) => <ProductCard key={p.node.id} product={p} />)
        : Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] por-shimmer bg-muted" />
          ))}
    </CarouselSection>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Trending Now — 4 editorials on the season's defining trends        */
/* ─────────────────────────────────────────────────────────────────── */

const TRENDING_EDITORIALS: {
  eyebrow: string;
  title: string;
  body: string;
  to: string;
  image: string;
  alt: string;
}[] = [
  {
    eyebrow: "Trend 01 — Quiet Luxury Tailoring",
    title: "The unstructured suit.",
    body: "Soft-shouldered jackets, fluid trousers, and the discreet codes of new menswear power.",
    to: "/editorial/mens-edit",
    image: editorialAsianMaleTailoring,
    alt: "Quiet luxury tailoring — soft-shouldered unstructured cream linen suit photographed in Mediterranean light",
  },
  {
    eyebrow: "Trend 02 — Mediterranean Resort",
    title: "Linen, at length.",
    body: "Sun-bleached linens, camp collars, and the wardrobe built for the long Mediterranean afternoon.",
    to: "/editorial/resort-2026",
    image: marketingMenResort,
    alt: "Mediterranean resort menswear — linen camp collars and sea-soaked silks",
  },
  {
    eyebrow: "Trend 03 — Heritage Leather",
    title: "The new loafer.",
    body: "Polished horsebits, suede drivers, and the footwear quietly reshaping the season.",
    to: "/trends/tom-ford-essentials",
    image: marketingAccessories,
    alt: "Heritage leather menswear — loafers, drivers and polished horsebit hardware",
  },
  {
    eyebrow: "Trend 04 — The New Evening",
    title: "Silk, after dark.",
    body: "The silk shirt, the dinner jacket, and the details holding up under candlelight.",
    to: "/editorial/the-new-evening",
    image: editorialLatinoMaleEvening,
    alt: "Evening menswear — black silk shirt and tailored dinner jacket photographed by candlelight",
  },
];

function TrendingEditorials() {
  return (
    <CarouselSection
      ariaLabel="Trending now in menswear"
      eyebrow="Trending Now"
      title="The edits defining the season."
      description="Four trends shaping menswear right now, written by the Palace of Roman buying desk."
      itemClassName="basis-[86%] sm:basis-[64%] md:basis-[46%] lg:basis-[28%]"
    >
      {TRENDING_EDITORIALS.map((e) => (
        <a
          key={e.title}
          href={e.to}
          className="group relative block aspect-[3/4] overflow-hidden bg-muted"
        >
          <img
            src={e.image}
            alt={e.alt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-7 text-canvas">
            <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-3">
              {e.eyebrow}
            </p>
            <h3 className="font-serif text-xl md:text-2xl leading-[1.1] mb-3">
              {e.title}
            </h3>
            <p className="text-[12px] md:text-[13px] text-canvas/85 leading-relaxed mb-4">
              {e.body}
            </p>
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-canvas border-b border-bronze pb-1 group-hover:text-bronze transition-colors">
              Read the Edit →
            </span>
          </div>
        </a>
      ))}
    </CarouselSection>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Hero Brands — Two more, by popular demand                          */
/* ─────────────────────────────────────────────────────────────────── */

const SPOTLIGHT_BRANDS_TWO: { label: string; vendor: string; handle: string; alt: string }[] = [
  { label: "Gucci", vendor: "gucci", handle: "brand-gucci", alt: "Gucci menswear" },
  { label: "Prada", vendor: "prada", handle: "brand-prada", alt: "Prada menswear" },
];

function BrandSpotlightRailTwo() {
  return (
    <section
      aria-label="Hero brands — by popular demand"
      className="bg-canvas-raised border-y border-ink/10 mt-16 md:mt-24 py-14 md:py-20"
    >
      <div className="max-w-screen-md mx-auto px-5 md:px-10 flex flex-col gap-6 md:gap-10">
        {SPOTLIGHT_BRANDS_TWO.map((b) => (
          <BrandSpotlightTile key={b.vendor} brand={b} />
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Brands of the Moment                                               */
/* ─────────────────────────────────────────────────────────────────── */

const BRANDS_OF_THE_MOMENT: { label: string; vendor: string; handle: string; alt: string }[] = [
  { label: "Brunello Cucinelli", vendor: "brunello-cucinelli", handle: "brand-brunello-cucinelli", alt: "Brunello Cucinelli menswear" },
  { label: "Giorgio Armani", vendor: "giorgio-armani", handle: "brand-giorgio-armani", alt: "Giorgio Armani menswear" },
  { label: "Tom Ford", vendor: "tom-ford", handle: "brand-tom-ford", alt: "Tom Ford menswear" },
  { label: "Saint Laurent", vendor: "saint-laurent", handle: "brand-saint-laurent", alt: "Saint Laurent menswear" },
  { label: "Loro Piana", vendor: "loro-piana", handle: "brand-loro-piana", alt: "Loro Piana menswear" },
  { label: "Bottega Veneta", vendor: "bottega-veneta", handle: "brand-bottega-veneta", alt: "Bottega Veneta menswear" },
];

function BrandsOfTheMoment() {
  return (
    <CarouselSection
      ariaLabel="Brands of the moment"
      eyebrow="Brands of the Moment"
      title="Houses in motion."
      description="The maisons our buying desk is watching this season."
      itemClassName="basis-[68%] sm:basis-[44%] md:basis-[30%] lg:basis-[22%]"
    >
      {BRANDS_OF_THE_MOMENT.map((b) => (
        <BrandSpotlightTile key={b.vendor} brand={b} />
      ))}
    </CarouselSection>
  );
}
