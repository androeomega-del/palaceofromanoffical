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
import { ShieldCheck, Plane, RotateCcw, MessageCircle } from "lucide-react";

import { fetchCollection } from "@/lib/shopify";
import { cdnImage } from "@/lib/cdn-image";
import { ProductCard } from "@/components/product-card";

import marketingMenResort from "@/assets/marketing-men-resort-summer.jpg";
import marketingMen from "@/assets/marketing-men-summer.jpg";
import marketingAccessories from "@/assets/marketing-accessories-summer.jpg";

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
  return (
    <main>
      <PromoStrip />
      <HeroBanner />
      <NewInThisWeek />
      <TrendingCategories />
      <BrandSpotlightRail />
      <EditorialSplit />
      <ShopByOccasion />
      <FeaturedProductRail />
      <AccessoryCampaignBanner />
      <HeritageBlock />
      <TrustStrip />
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  1. Promo Strip                                                     */
/* ─────────────────────────────────────────────────────────────────── */

function PromoStrip() {
  return (
    <div className="w-full bg-ink text-canvas text-[10px] md:text-[11px] py-2.5 uppercase tracking-[0.32em] text-center">
      Complimentary worldwide shipping on orders over $500
      <span className="opacity-50 mx-2">·</span>
      <span className="text-bronze">Resort 2026 now in</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  2. Hero Banner                                                     */
/* ─────────────────────────────────────────────────────────────────── */

function HeroBanner() {
  return (
    <section aria-label="Menswear Resort 2026 hero" className="bg-canvas">
      <div className="relative w-full aspect-[4/5] md:aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={marketingMenResort}
          alt="Menswear Resort 2026 — sun-bleached linens and sea-soaked silks photographed in late Mediterranean light"
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent md:bg-gradient-to-r md:from-ink/65 md:via-ink/20 md:to-transparent" />
        <div className="absolute inset-0 flex items-end md:items-center">
          <div className="max-w-screen-2xl w-full mx-auto px-6 md:px-10 pb-10 md:pb-0">
            <div className="max-w-xl text-canvas">
              <p className="text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-bronze mb-4 md:mb-5">
                Menswear — Resort 2026
              </p>
              <h1 className="font-serif text-3xl md:text-6xl leading-[1.05] mb-5 md:mb-6">
                Tailored for the long hours of summer.
              </h1>
              <p className="text-[14px] md:text-[15px] text-canvas/85 leading-relaxed mb-7 md:mb-8 max-w-md">
                Sun-bleached linens, sea-soaked silks, and the houses that know
                the difference between dressing for warmth and dressing for
                light. Curated from Versace, Dolce &amp; Gabbana, Brunello
                Cucinelli and the maisons defining the season.
              </p>
              <Link
                to="/editorial/resort-2026"
                className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-canvas border-b border-bronze pb-1 hover:text-bronze transition-colors"
              >
                Explore the Edit →
              </Link>
            </div>
          </div>
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
    queryFn: () => fetchCollection("mens-new-arrivals", 8),
    staleTime: 10 * 60 * 1000,
  });
  const products = data?.products?.edges ?? [];

  return (
    <section aria-label="New in this week" className="bg-canvas pt-16 md:pt-24">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <div className="flex items-end justify-between mb-8 md:mb-10 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">
              New In This Week
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-ink mb-4">
              Just Landed
            </h2>
            <p className="text-[14px] md:text-[15px] text-muted-foreground max-w-lg leading-relaxed">
              New arrivals from Versace, Dolce &amp; Gabbana, Brunello Cucinelli
              and the names defining resort 2026.
            </p>
          </div>
          <Link
            to="/collections/$handle"
            params={{ handle: "mens-new-arrivals" }}
            className="hidden md:inline-flex shrink-0 items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze/50 pb-1 hover:text-bronze hover:border-bronze transition-colors"
          >
            Explore New In →
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] por-shimmer bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.node.id} product={p} />
            ))}
          </div>
        )}
        <div className="md:hidden mt-8 text-center">
          <Link
            to="/collections/$handle"
            params={{ handle: "mens-new-arrivals" }}
            className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze/50 pb-1"
          >
            Explore New In →
          </Link>
        </div>
      </div>
    </section>
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
    <section aria-label="Dress the season" className="bg-canvas pt-16 md:pt-24">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-3">
            Dress the Season
          </h2>
          <p className="text-[14px] text-muted-foreground">
            The resort wardrobe, arranged.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
          {TRENDING_TILES.map((t) => (
            <TrendingTile key={t.handle} tile={t} />
          ))}
        </div>
      </div>
    </section>
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

const SPOTLIGHT_BRANDS = [
  { label: "Versace", vendor: "versace" },
  { label: "Dolce & Gabbana", vendor: "dolce-gabbana" },
  { label: "Brunello Cucinelli", vendor: "brunello-cucinelli" },
  { label: "Armani", vendor: "armani" },
  { label: "Gucci", vendor: "gucci" },
  { label: "Prada", vendor: "prada" },
];

function BrandSpotlightRail() {
  return (
    <section aria-label="Brand spotlight" className="bg-canvas-raised border-y border-ink/10 mt-16 md:mt-24 py-10 md:py-14">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <p className="text-center text-[10px] uppercase tracking-[0.4em] text-bronze mb-6 md:mb-8">
          The Houses
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 md:gap-x-14">
          {SPOTLIGHT_BRANDS.map((b) => (
            <Link
              key={b.vendor}
              to="/brand/$vendor"
              params={{ vendor: b.vendor }}
              className="text-[11px] md:text-[12px] uppercase tracking-[0.3em] text-ink hover:text-bronze transition-colors"
            >
              {b.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  6. Editorial Split                                                 */
/* ─────────────────────────────────────────────────────────────────── */

function EditorialSplit() {
  return (
    <section aria-label="Editorial features" className="bg-canvas pt-16 md:pt-24">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
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
      </div>
    </section>
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
    <section aria-label="Shop by occasion" className="bg-canvas pt-16 md:pt-24">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <h2 className="font-serif text-3xl md:text-4xl text-ink text-center mb-10 md:mb-12">
          Shop by Occasion
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink/10 border border-ink/10">
          {OCCASIONS.map((o) => (
            <Link
              key={o.label}
              to="/collections/$handle"
              params={{ handle: o.handle }}
              className="bg-canvas hover:bg-canvas-raised transition-colors py-10 md:py-14 text-center group"
            >
              <span className="font-serif text-xl md:text-2xl text-ink group-hover:text-bronze transition-colors">
                {o.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
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
    <section aria-label="The Buyer's Pick" className="bg-canvas pt-16 md:pt-24">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <div className="flex items-end justify-between mb-8 md:mb-10 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">
              The Buyer's Pick
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-ink">
              Chosen with intention.
            </h2>
          </div>
          <Link
            to="/collections/$handle"
            params={{ handle: sourceHandle }}
            className="hidden md:inline-flex shrink-0 items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze/50 pb-1 hover:text-bronze hover:border-bronze transition-colors"
          >
            Explore the Edit →
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] por-shimmer bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.node.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  9. Secondary Campaign Banner — The Accessory Edit                  */
/* ─────────────────────────────────────────────────────────────────── */

function AccessoryCampaignBanner() {
  return (
    <section aria-label="The Accessory Edit" className="bg-canvas pt-16 md:pt-24">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <Link
          to="/collections/$handle"
          params={{ handle: "mens-accessories" }}
          className="group grid grid-cols-1 md:grid-cols-2 items-stretch border border-ink/10 overflow-hidden"
        >
          <div className="flex flex-col justify-center px-8 md:px-14 py-12 md:py-20 bg-canvas">
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-5">
              The Accessory Edit
            </p>
            <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] text-ink mb-5 max-w-[18ch]">
              The Accessory Edit
            </h2>
            <p className="text-[14px] md:text-[15px] text-muted-foreground leading-relaxed max-w-md mb-8">
              The belt that holds the look together. The sunglasses that finish
              it. The small pieces that carry a wardrobe's signature.
            </p>
            <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze/50 pb-1 self-start group-hover:text-bronze group-hover:border-bronze transition-colors">
              Explore Accessories →
            </span>
          </div>
          <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[480px] overflow-hidden bg-muted">
            <img
              src={marketingAccessories}
              alt="Men's accessories — belts, sunglasses and the small pieces that carry a wardrobe's signature"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
            />
          </div>
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  10. Heritage Block                                                 */
/* ─────────────────────────────────────────────────────────────────── */

function HeritageBlock() {
  return (
    <section aria-label="About Palace of Roman" className="bg-canvas-raised mt-16 md:mt-24 py-16 md:py-24 border-y border-ink/10">
      <div className="max-w-screen-md mx-auto px-6 md:px-10 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-5">
          The House
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-ink mb-6 leading-[1.1]">
          A curated boutique, not a catalogue.
        </h2>
        <p className="text-[14px] md:text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
          Every piece is sourced through our authorised European distribution
          partners and arrives with full authenticity guaranteed. We ship
          worldwide.
        </p>
        <Link
          to="/about"
          className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze pb-1 hover:text-bronze transition-colors"
        >
          Our Story →
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  11. Trust Strip                                                    */
/* ─────────────────────────────────────────────────────────────────── */

function TrustStrip() {
  const items = [
    { Icon: ShieldCheck, label: "100% Authentic" },
    { Icon: Plane, label: "Ships from EU" },
    { Icon: RotateCcw, label: "14-Day Returns" },
    { Icon: MessageCircle, label: "Personal Concierge" },
  ];
  return (
    <section aria-label="Service promise" className="bg-canvas">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-10 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          {items.map(({ Icon, label }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <Icon className="w-5 h-5 text-bronze mb-3" strokeWidth={1.25} />
              <p className="text-[11px] uppercase tracking-[0.25em] text-ink">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
