/**
 * Commerce-forward sections that interleave with the Edition lookbook spine.
 * Tone: shop-first (5/5) — these are the marketable bands that pair with the
 * editorial hero/masonry to drive add-to-cart, while staying Palace of Roman
 * in voice.
 *
 * Exports:
 *  - NewArrivalsRail        — fresh-in horizontal rail (CREATED_AT desc)
 *  - BestSellersGrid        — most-loved this season (BEST_SELLING)
 *  - ShopByCategoryTiles    — six editorial category tiles → /collections/:handle
 *  - PriceTierShop          — Under $500 / Under $1,000 / Investment
 *  - EditorsPicksTriptych   — three curated picks pulled from latest BEST_SELLING
 *  - BrandSpotlight         — full-bleed maison-of-the-moment band
 *  - NewsletterVIPBand      — bronze-bordered VIP capture (wraps NewsletterForm)
 *  - TrustReassuranceBand   — auth / shipping / returns reassurance
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Plane, RefreshCw, ArrowRight } from "lucide-react";

import { fetchProducts, formatPrice, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { imgForKey } from "@/lib/editorial-library";
import { NewsletterForm } from "@/components/newsletter-form";
import { cdnImage } from "@/lib/cdn-image";

// ─────────────────────────────────────────────────────────────────────────────
// NEW ARRIVALS — horizontal scroll rail
// ─────────────────────────────────────────────────────────────────────────────
export function NewArrivalsRail() {
  const { data, isLoading } = useQuery({
    queryKey: ["home", "new-arrivals", "v1"],
    queryFn: () =>
      fetchProducts({ first: 12, sortKey: "CREATED_AT", reverse: true }),
    staleTime: 15 * 60 * 1000,
  });

  if (isLoading) return <RailSkeleton label="Just In" />;
  if (!data || data.length === 0) return null;

  return (
    <section className="bg-canvas border-t border-ink/5">
      <div className="max-w-screen-2xl mx-auto px-6 py-16 md:py-20">
        <div className="flex items-end justify-between gap-6 mb-8 md:mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-3">
              Just In
            </p>
            <h2 className="text-3xl md:text-4xl font-serif leading-tight">
              The newest arrivals from the floor.
            </h2>
          </div>
          <Link
            to="/shop"
            search={{ sort: "CREATED-true" } as never}
            className="hidden md:inline-block text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors whitespace-nowrap"
          >
            Shop new arrivals →
          </Link>
        </div>
        <div
          className="-mx-6 px-6 flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-testid="new-arrivals-rail"
        >
          {data.slice(0, 12).map((p: ShopifyProduct) => (
            <div
              key={p.node.id}
              className="snap-start shrink-0 w-[64vw] sm:w-[40vw] md:w-[28vw] lg:w-[22vw] xl:w-[18vw]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        <div className="md:hidden mt-6 text-center">
          <Link
            to="/shop"
            search={{ sort: "CREATED-true" } as never}
            className="text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors"
          >
            Shop new arrivals →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BEST SELLERS — 4×2 grid
// ─────────────────────────────────────────────────────────────────────────────
export function BestSellersGrid() {
  const { data, isLoading } = useQuery({
    queryKey: ["home", "best-sellers", "v1"],
    queryFn: () => fetchProducts({ first: 8, sortKey: "BEST_SELLING" }),
    staleTime: 30 * 60 * 1000,
  });

  if (isLoading) return <RailSkeleton label="Most-Loved" />;
  if (!data || data.length === 0) return null;

  return (
    <section className="bg-canvas-raised border-t border-ink/5">
      <div className="max-w-screen-2xl mx-auto px-6 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <p className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-3">
            Most-Loved This Season
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif leading-tight text-balance">
            The pieces shoppers keep coming back to.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground italic">
            Ranked by best-selling across the boutique — the wardrobe staples our
            clientele requests by name.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {data.slice(0, 8).map((p: ShopifyProduct) => (
            <ProductCard key={p.node.id} product={p} />
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            to="/shop"
            search={{ sort: "BEST_SELLING-false" } as never}
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-ink text-canvas text-[11px] uppercase tracking-[0.28em] hover:bg-bronze transition-colors"
          >
            Shop the bestsellers <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOP BY CATEGORY — six editorial tiles
// ─────────────────────────────────────────────────────────────────────────────
// 40% Women · 40% Men · 20% Unisex — 10 tiles (4 / 4 / 2). Order alternates
// gender to keep visual rhythm across the grid.
const CATEGORY_TILES: Array<{ handle: string; label: string; eyebrow: string; imgKey: string }> = [
  { handle: "women-bags", label: "Handbags", eyebrow: "Women", imgKey: "tile-bags-women" },
  { handle: "men-bags", label: "Bags", eyebrow: "Men", imgKey: "tile-bags-men" },
  { handle: "womens-shoes", label: "Shoes", eyebrow: "Women", imgKey: "tile-shoes-women" },
  { handle: "men-shoes", label: "Shoes", eyebrow: "Men", imgKey: "tile-shoes-men" },
  { handle: "dresses", label: "Dresses", eyebrow: "Women", imgKey: "tile-dresses" },
  { handle: "mens-clothing", label: "Tailoring", eyebrow: "Men", imgKey: "tile-menswear" },
  { handle: "coats-women", label: "Outerwear", eyebrow: "Women", imgKey: "tile-outerwear-women" },
  { handle: "men-accessories", label: "Accessories", eyebrow: "Men", imgKey: "tile-accessories-men" },
  { handle: "sunglasses", label: "Sunglasses", eyebrow: "Unisex", imgKey: "tile-sunglasses" },
  { handle: "accessories", label: "Small Leather", eyebrow: "Unisex", imgKey: "tile-leather-unisex" },
];

export function ShopByCategoryTiles() {
  return (
    <section className="bg-canvas border-t border-ink/5">
      <div className="max-w-screen-2xl mx-auto px-6 py-20 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-3">
              Shop by Category
            </p>
            <h2 className="text-3xl md:text-4xl font-serif leading-tight max-w-[24ch]">
              Enter the floor — choose your aisle.
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors self-start md:self-auto whitespace-nowrap"
          >
            All categories →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {CATEGORY_TILES.map((tile, i) => (
            <motion.div
              key={tile.handle}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to="/collections/$handle"
                params={{ handle: tile.handle }}
                className="group relative block aspect-[4/5] overflow-hidden bg-canvas-raised"
              >
                <img
                  src={cdnImage(imgForKey(tile.imgKey), { width: 800 })}
                  alt={`${tile.label} — Palace of Roman`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6 text-canvas">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-canvas/80 mb-1.5">
                    {tile.eyebrow}
                  </p>
                  <p className="font-serif text-2xl md:text-3xl leading-tight">
                    {tile.label}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                    Shop {tile.label.toLowerCase()} <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICE TIER SHOP — Under $500 / $1,000 / Investment
// ─────────────────────────────────────────────────────────────────────────────
const PRICE_TIERS: Array<{ max?: number; min?: number; label: string; sub: string; imgKey: string }> = [
  { max: 500, label: "Under $500", sub: "Entry-point luxury — accessories, sunglasses, signature pieces.", imgKey: "tier-500" },
  { max: 1000, label: "Under $1,000", sub: "The weekend wardrobe — ready-to-wear, leather goods, shoes.", imgKey: "tier-1000" },
  { min: 1000, label: "Investment Pieces", sub: "Made to outlast trends — outerwear, statement bags, fine knits.", imgKey: "tier-investment" },
];

export function PriceTierShop() {
  return (
    <section className="bg-canvas-raised border-t border-ink/5">
      <div className="max-w-screen-2xl mx-auto px-6 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
          <p className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-3">
            Shop by Tier
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif leading-tight text-balance">
            Find your entry point.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground italic">
            From considered first buys to forever-piece investments — three doors into the boutique.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {PRICE_TIERS.map((tier, i) => (
            <motion.div
              key={tier.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to="/shop"
                search={(tier.min ? { min: tier.min } : { max: tier.max }) as never}
                className="group relative block aspect-[4/5] overflow-hidden bg-ink"
              >
                <img
                  src={cdnImage(imgForKey(tier.imgKey), { width: 900 })}
                  alt={tier.label}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-70 transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-90 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/10" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 text-canvas">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-3">
                    Tier {String.fromCharCode(73 + i)}
                  </p>
                  <p className="font-serif text-3xl md:text-4xl leading-tight">{tier.label}</p>
                  <p className="mt-3 text-[12px] md:text-[13px] text-canvas/75 leading-relaxed max-w-[34ch]">
                    {tier.sub}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] border-b border-bronze/60 pb-1 w-fit group-hover:border-canvas transition-colors">
                    Shop the tier <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITOR'S PICKS — three-up curated triptych
// ─────────────────────────────────────────────────────────────────────────────
export function EditorsPicksTriptych() {
  const { data, isLoading } = useQuery({
    queryKey: ["home", "editors-picks", "v1"],
    queryFn: () => fetchProducts({ first: 6, sortKey: "BEST_SELLING" }),
    staleTime: 30 * 60 * 1000,
  });

  if (isLoading) return null;
  if (!data || data.length < 3) return null;

  const picks = data.slice(0, 3);
  const blurbs = [
    "The piece our buying floor keeps returning to — versatile, unmistakable, season-proof.",
    "A modern classic with quiet authority. Wears as well in year ten as in year one.",
    "The investment buy. Heirloom craftsmanship at a price that earns its keep.",
  ];

  return (
    <section className="bg-canvas border-t border-ink/5">
      <div className="max-w-screen-2xl mx-auto px-6 py-20 md:py-24">
        <div className="grid grid-cols-12 gap-6 mb-12 md:mb-14">
          <div className="col-span-12 md:col-span-7">
            <p className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-3">
              Editor's Picks
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif leading-tight text-balance max-w-[22ch]">
              Three pieces our buying floor stands behind — this week.
            </h2>
          </div>
          <p className="col-span-12 md:col-span-5 md:pt-2 text-sm text-muted-foreground leading-relaxed italic md:text-right">
            A small, weekly edit. No algorithm, no quotas — just the three pieces we
            would buy ourselves.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {picks.map((p, i) => {
            const node = p.node;
            const img = node.images?.edges?.[0]?.node;
            return (
              <article key={node.id} className="flex flex-col">
                <Link
                  to="/product/$handle"
                  params={{ handle: node.handle }}
                  className="group block aspect-[3/4] overflow-hidden bg-canvas-raised relative"
                >
                  {img ? (
                    <img
                      src={cdnImage(img.url, { width: 900 })}
                      alt={img.altText ?? node.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                    />
                  ) : null}
                  <span className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.32em] text-bronze bg-canvas/90 px-3 py-1.5">
                    No. {String(i + 1).padStart(2, "0")}
                  </span>
                </Link>
                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">
                    {node.vendor}
                  </p>
                  <Link
                    to="/product/$handle"
                    params={{ handle: node.handle }}
                    className="font-serif text-lg md:text-xl leading-snug hover:text-bronze transition-colors"
                  >
                    {node.title}
                  </Link>
                  <p className="mt-2 text-[13px] text-muted-foreground italic leading-relaxed">
                    {blurbs[i]}
                  </p>
                  <p className="mt-3 text-sm tracking-wide">
                    {formatPrice(node.priceRange.minVariantPrice)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAND SPOTLIGHT — full-bleed maison-of-the-moment
// ─────────────────────────────────────────────────────────────────────────────
export function BrandSpotlight() {
  return (
    <section className="bg-ink text-canvas border-t border-ink/10">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[80vh]">
        <Link
          to="/brand/$vendor"
          params={{ vendor: "versace" }}
          className="relative block min-h-[60vh] md:min-h-full overflow-hidden group"
        >
          <img
            src={cdnImage(imgForKey("spotlight-versace"), { width: 1400 })}
            alt="Versace at Palace of Roman"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
        </Link>
        <div className="flex items-center justify-center p-10 md:p-16 lg:p-20">
          <div className="max-w-md">
            <p className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-5">
              House in Focus
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6">
              Versace.
              <br />
              <span className="italic text-canvas/70">A maison of pure spectacle.</span>
            </h2>
            <p className="text-[13px] md:text-sm leading-relaxed text-canvas/75 mb-8">
              Baroque tailoring, gilded hardware, the unmistakable Medusa. This week
              the boutique leans into the maison that turned Italian glamour into a
              global language. Shop the current Versace edit — ready-to-wear,
              accessories, signature prints.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link
                to="/brand/$vendor"
                params={{ vendor: "versace" }}
                className="inline-flex items-center gap-3 px-7 py-3.5 bg-canvas text-ink text-[11px] uppercase tracking-[0.28em] hover:bg-bronze hover:text-canvas transition-colors"
              >
                Enter the Versace edit <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Link>
              <Link
                to="/brands"
                className="text-[11px] uppercase tracking-[0.25em] border-b border-canvas/40 pb-1 hover:text-bronze hover:border-bronze transition-colors"
              >
                All maisons →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEWSLETTER VIP BAND
// ─────────────────────────────────────────────────────────────────────────────
export function NewsletterVIPBand() {
  return (
    <section className="bg-canvas-raised border-t border-ink/5">
      <div className="max-w-screen-2xl mx-auto px-6 py-20 md:py-24">
        <div className="grid grid-cols-12 gap-8 md:gap-12 items-center border border-bronze/30 bg-canvas px-6 md:px-12 py-12 md:py-16">
          <div className="col-span-12 md:col-span-6">
            <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-bronze mb-4">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              The VIP Dispatch
            </p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight mb-5 text-balance">
              First in line — before the floor opens.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[48ch]">
              Edition previews, single-piece drops, and the occasional private code.
              One considered dispatch a week — never the firehose.
            </p>
          </div>
          <div className="col-span-12 md:col-span-6">
            <NewsletterForm />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRUST REASSURANCE BAND
// ─────────────────────────────────────────────────────────────────────────────
const TRUST_PILLARS: Array<{ icon: typeof ShieldCheck; title: string; copy: string; href: string; cta: string }> = [
  {
    icon: ShieldCheck,
    title: "100% Authentic",
    copy: "Every piece sourced through our official BrandsGateway partnership — direct from the maisons or their authorised distributors.",
    href: "/authentication",
    cta: "How we authenticate",
  },
  {
    icon: Plane,
    title: "Tracked Worldwide",
    copy: "Ships from the European Union with full tracking and duties handled at checkout. Most orders arrive in 5–9 business days.",
    href: "/shipping-returns",
    cta: "Shipping & duties",
  },
  {
    icon: RefreshCw,
    title: "14-Day Returns",
    copy: "Not quite right? Return any unworn piece within fourteen days of delivery — no restocking fee, no questions about taste.",
    href: "/shipping-returns",
    cta: "Returns policy",
  },
];

export function TrustReassuranceBand() {
  return (
    <section className="bg-ink text-canvas border-t border-ink/10">
      <div className="max-w-screen-2xl mx-auto px-6 py-20 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-3">
            Why Shop Palace of Roman
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight text-balance">
            Designer fashion, handled like it should be.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {TRUST_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="flex flex-col items-start text-left border-t border-canvas/15 pt-8">
                <Icon className="w-6 h-6 text-bronze mb-5" strokeWidth={1.25} />
                <h3 className="font-serif text-xl md:text-2xl mb-3">{pillar.title}</h3>
                <p className="text-[13px] text-canvas/70 leading-relaxed mb-5">
                  {pillar.copy}
                </p>
                <Link
                  to={pillar.href as never}
                  className="text-[11px] uppercase tracking-[0.25em] border-b border-bronze/50 pb-1 hover:text-bronze hover:border-bronze transition-colors"
                >
                  {pillar.cta} →
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared rail skeleton — editorial-neutral, no spinner
// ─────────────────────────────────────────────────────────────────────────────
function RailSkeleton({ label }: { label: string }) {
  return (
    <section className="bg-canvas border-t border-ink/5">
      <div className="max-w-screen-2xl mx-auto px-6 py-16 md:py-20">
        <p className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-3">
          {label}
        </p>
        <div className="h-9 w-72 max-w-full bg-canvas-raised mb-10" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-canvas-raised" />
          ))}
        </div>
      </div>
    </section>
  );
}
