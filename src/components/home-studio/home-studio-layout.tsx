/**
 * HomeStudioLayout — editorial-luxury homepage repositioned around
 * men's resort & coastal fashion, womenswear secondary.
 *
 * Light canvas, oversized imagery, restrained type. Uses existing
 * design tokens (canvas / ink / bronze-deep / sand), ProductRail
 * primitive, and the existing concierge drawer.
 *
 * Variant prop is kept for the /studio route's standalone preview.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { useChromeStore } from "@/stores/chrome-store";

import { ConciergeDrawer } from "./concierge-drawer";
import { PalaceHeader } from "./palace-header";
import { ProductRail } from "@/components/sections/product-rail";
import { collectionRailQueryOptions } from "@/lib/rails/queries";
import { vendorSlug } from "@/lib/nav-config";
import heroImage from "@/assets/home-hero.jpg";

interface HomeStudioLayoutProps {
  variant?: "embedded" | "standalone";
}

const BRANDS = [
  "Dolce & Gabbana",
  "Brunello Cucinelli",
  "Saint Laurent",
  "Versace",
  "Gucci",
  "Prada",
  "Balenciaga",
  "Fendi",
] as const;

// Hand-curated tile list — collection handles are real, copy is verbatim.
const TILES = [
  { handle: "new-arrivals", title: "New In" },
  { handle: "suits", title: "Tailoring for Warm Latitudes" },
  { handle: "mens-loafers", title: "The Loafer Edit" },
] as const;

export function HomeStudioLayout({ variant = "embedded" }: HomeStudioLayoutProps) {
  const setSuppressed = useChromeStore((s) => s.setSuppressed);
  const isStandalone = variant === "standalone";

  useEffect(() => {
    if (!isStandalone) return;
    setSuppressed({ header: true, footer: true });
    return () => setSuppressed({ header: false, footer: false });
  }, [isStandalone, setSuppressed]);

  const [conciergeOpen, setConciergeOpen] = useState(false);

  return (
    <div className="w-full bg-canvas text-ink">
      {isStandalone && <PalaceHeader onOpenConcierge={() => setConciergeOpen(true)} />}

      {/* ───────────── Section 1 — Hero ───────────── */}
      <section className="relative w-full overflow-hidden bg-canvas-raised" style={{ contain: "layout" }}>
        <div className="relative w-full" style={{ aspectRatio: "16 / 9", minHeight: "70vh" }}>
          <img
            src={heroImage}
            alt="Coastal Mediterranean editorial — linen and sea light"
            className="absolute inset-0 w-full h-full object-cover home-hero-img"
            fetchPriority="high"
            decoding="async"
          />
          {/* Soft bottom scrim for legibility, restrained */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 38%, rgba(0,0,0,0) 70%)" }}
            aria-hidden="true"
          />

          <div className="absolute inset-x-0 bottom-0 px-6 md:px-14 pb-12 md:pb-20">
            <div className="max-w-screen-2xl mx-auto">
              <div className="max-w-3xl text-white">
                <h1
                  className="font-serif font-light tracking-[-0.015em] text-balance text-[12vw] md:text-[5.5vw] leading-[0.95]"
                >
                  The quiet <em className="italic">art</em> of coastal luxury.
                </h1>
                <p className="mt-6 md:mt-8 max-w-xl text-base md:text-lg leading-relaxed font-light text-white/85">
                  Linen, silk, and sun-built tailoring from Dolce &amp; Gabbana,
                  Brunello Cucinelli, Saint Laurent, and the maisons of the
                  Mediterranean — new, current-season, shipped worldwide from
                  Europe.
                </p>
                <div className="mt-8 md:mt-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <Link
                    to="/men"
                    className="inline-flex items-center justify-center gap-3 px-7 py-3 bg-white text-ink text-[11px] uppercase tracking-[0.32em] transition-opacity hover:opacity-90"
                  >
                    Shop Menswear
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
                  </Link>
                  <Link
                    to="/women"
                    className="inline-flex items-center justify-center gap-3 px-7 py-3 border border-white text-white text-[11px] uppercase tracking-[0.32em] transition-colors hover:bg-white hover:text-ink"
                  >
                    Shop Womenswear
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
                  </Link>
                </div>
                <div className="mt-5">
                  <button
                    onClick={() => setConciergeOpen(true)}
                    className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/80 hover:text-white transition-colors"
                  >
                    Or begin with the Concierge
                    <ArrowUpRight className="w-3 h-3" strokeWidth={1.25} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Section 2 — Brand line ───────────── */}
      <section className="border-y border-ink/8 bg-canvas">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-14 py-7 md:py-8">
          <div className="flex md:justify-center gap-x-8 md:gap-x-12 overflow-x-auto md:overflow-visible whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {BRANDS.map((b, i) => (
              <Link
                key={b}
                to="/brand/$vendor"
                params={{ vendor: vendorSlug(b) }}
                className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-bronze-deep hover:text-ink transition-colors shrink-0"
              >
                {b}
                {i < BRANDS.length - 1 && (
                  <span aria-hidden="true" className="ml-8 md:ml-12 text-ink/30">·</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Section 3 — The Riviera Edit ───────────── */}
      <EditorialSplit
        handle="the-riviera-edit"
        eyebrow="The Riviera Edit"
        headline="Linen for harbors, silk for evenings."
        body="A cross-category edit of Mediterranean summer — drawstring linen, silk polos, sailing sneakers, and the colors of the Amalfi coast."
        ctaLabel="Shop the edit"
        ctaTo="/collections/the-riviera-edit"
      />
      <ProductRail
        surface="rail:home-riviera"
        queryOptions={collectionRailQueryOptions("the-riviera-edit", 8)}
        eyebrow=""
        title=""
        ctaTo="/collections/the-riviera-edit"
        ctaLabel="Shop The Riviera Edit"
        headless
      />

      {/* ───────────── Section 4 — Coastal Essentials ───────────── */}
      <ProductRail
        surface="rail:home-coastal"
        queryOptions={collectionRailQueryOptions("coastal-essentials", 8)}
        eyebrow="Coastal Essentials"
        title="Swim, slides, and the pieces that live in a weekend bag."
        ctaTo="/collections/coastal-essentials"
        ctaLabel="Shop Coastal Essentials"
      />

      {/* ───────────── Section 5 — Sourcing ───────────── */}
      <section className="bg-canvas-raised">
        <div className="max-w-3xl mx-auto px-6 md:px-14 py-section-sm md:py-24 text-center">
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.45em] text-bronze-deep mb-7">
            Sourcing
          </p>
          <h2 className="font-serif font-light text-[8vw] md:text-[3.2vw] leading-[1.1] tracking-[-0.01em] text-balance mb-7 text-ink">
            Direct from Europe. Never secondary market.
          </h2>
          <p className="text-sm md:text-base leading-[1.75] font-light text-bronze-deep mb-10 mx-auto max-w-xl">
            Every piece at Palace of Roman is new, unworn, and current or
            recent season — sourced through established European distribution
            partners and shipped to you in original packaging, with tags and
            authenticity cards where the maison provides them. No consignment.
            No pre-owned. No gray-market resale chains. One piece, one owner:
            you.
          </p>
          <Link
            to="/sourcing-architecture"
            className="inline-flex items-center gap-3 pb-2 text-[11px] uppercase tracking-[0.32em] border-b border-bronze text-ink hover:gap-5 transition-all duration-500"
          >
            Read how we source
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
          </Link>
        </div>
      </section>

      {/* ───────────── Section 6 — Three editorial tiles ───────────── */}
      <section className="bg-canvas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink/8">
          {TILES.map((t) => (
            <EditorialTile key={t.handle} handle={t.handle} title={t.title} />
          ))}
        </div>
      </section>

      {/* ───────────── Section 7 — Womenswear ───────────── */}
      <WomenswearBlock />
      <ProductRail
        surface="rail:home-womens"
        queryOptions={collectionRailQueryOptions("womens-dresses", 8)}
        eyebrow=""
        title=""
        ctaTo="/women"
        ctaLabel="Shop Womenswear"
        headless
      />

      {/* ───────────── Section 8 — Concierge band ───────────── */}
      <section className="bg-canvas-raised border-y border-ink/8">
        <div className="max-w-3xl mx-auto px-6 md:px-14 py-section-sm md:py-28 text-center">
          <h2 className="font-serif font-light text-[8vw] md:text-[3vw] leading-[1.1] tracking-[-0.01em] text-balance mb-7 text-ink">
            A human on the other end.
          </h2>
          <p className="text-sm md:text-base leading-[1.75] font-light text-bronze-deep mb-10 mx-auto max-w-xl">
            Tell the Concierge what you're dressing for — a wedding in Positano,
            a week on the water, a season in the sun — and receive a considered
            edit within a day.
          </p>
          <button
            onClick={() => setConciergeOpen(true)}
            className="inline-flex items-center gap-3 pb-2 text-[11px] uppercase tracking-[0.32em] border-b border-bronze text-ink hover:gap-5 transition-all duration-500"
          >
            Begin with the Concierge
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
          </button>
        </div>
      </section>

      {/* ───────────── Section 9 — Trust strip ───────────── */}
      <section className="bg-canvas border-t border-ink/8">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-14 py-8 md:py-10">
          <ul className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 md:gap-12 text-center">
            {[
              "Express worldwide shipping from Europe",
              "New & current-season, original packaging",
              "Secure checkout",
            ].map((item) => (
              <li
                key={item}
                className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-bronze-deep"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {isStandalone && (
        <footer className="px-6 md:px-14 py-10 border-t border-ink/8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <span className="text-[10px] uppercase tracking-[0.32em] text-bronze-deep">
            Palace of Roman — Studio draft
          </span>
          <Link to="/" className="text-[10px] uppercase tracking-[0.32em] text-bronze-deep hover:text-ink transition-colors">
            ← Return to the live boutique
          </Link>
        </footer>
      )}

      <ConciergeDrawer open={conciergeOpen} onClose={() => setConciergeOpen(false)} />

      <style>{`
        @keyframes homeHeroScale {
          from { transform: scale(1); }
          to   { transform: scale(1.04); }
        }
        .home-hero-img {
          animation: homeHeroScale 18s ease-out forwards;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .home-hero-img { animation: none; }
        }
      `}</style>
    </div>
  );
}

// ───────────────────────── Sub-components ─────────────────────────

function EditorialSplit({
  handle,
  eyebrow,
  headline,
  body,
  ctaLabel,
  ctaTo,
}: {
  handle: string;
  eyebrow: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaTo: string;
}) {
  const { data, isLoading } = useQuery(collectionRailQueryOptions(handle, 8));
  const lead = data?.[0]?.node.images?.edges?.[0]?.node;

  // Hide silently when the collection is genuinely empty.
  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="bg-canvas">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-0">
        <div className="md:col-span-7 relative bg-canvas-raised">
          <div className="relative w-full" style={{ aspectRatio: "4 / 5" }}>
            {lead && (
              <img
                src={lead.url}
                alt={lead.altText ?? headline}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        </div>
        <div className="md:col-span-5 flex items-center px-6 md:px-14 py-14 md:py-0">
          <div className="max-w-md">
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.45em] text-bronze-deep mb-6">
              {eyebrow}
            </p>
            <h2 className="font-serif font-light text-[8vw] md:text-[3vw] leading-[1.05] tracking-[-0.01em] text-balance mb-6 text-ink">
              {headline}
            </h2>
            <p className="text-sm md:text-base leading-[1.75] font-light text-bronze-deep mb-8">
              {body}
            </p>
            <Link
              to={ctaTo}
              className="inline-flex items-center gap-3 pb-2 text-[11px] uppercase tracking-[0.32em] border-b border-bronze text-ink hover:gap-5 transition-all duration-500"
            >
              {ctaLabel}
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function EditorialTile({ handle, title }: { handle: string; title: string }) {
  const { data, isLoading } = useQuery(collectionRailQueryOptions(handle, 4));
  const lead = data?.[0]?.node.images?.edges?.[0]?.node;

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <Link
      to="/collections/$handle"
      params={{ handle }}
      className="group relative block bg-canvas-raised overflow-hidden"
    >
      <div className="relative w-full" style={{ aspectRatio: "3 / 4" }}>
        {lead && (
          <img
            src={lead.url}
            alt={lead.altText ?? title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%)" }}
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 px-6 py-7">
          <h3 className="text-[11px] md:text-[12px] uppercase tracking-[0.32em] text-white">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
}

function WomenswearBlock() {
  const { data, isLoading } = useQuery(collectionRailQueryOptions("womens-dresses", 8));
  const lead = data?.[0]?.node.images?.edges?.[0]?.node;

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="relative w-full bg-canvas-raised overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: "16 / 9", minHeight: "60vh" }}>
        {lead && (
          <img
            src={lead.url}
            alt={lead.altText ?? "Womenswear — silk prints and sea light"}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 100%)" }}
          aria-hidden="true"
        />
        <div className="absolute inset-y-0 left-0 flex items-center px-6 md:px-14">
          <div className="max-w-md text-white">
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.45em] text-white/75 mb-6">
              Womenswear
            </p>
            <h2 className="font-serif font-light text-[10vw] md:text-[4vw] leading-[1.0] tracking-[-0.01em] text-balance mb-8">
              Silk prints and sea light.
            </h2>
            <Link
              to="/women"
              className="inline-flex items-center gap-3 px-7 py-3 border border-white text-white text-[11px] uppercase tracking-[0.32em] hover:bg-white hover:text-ink transition-colors"
            >
              Shop Womenswear
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
