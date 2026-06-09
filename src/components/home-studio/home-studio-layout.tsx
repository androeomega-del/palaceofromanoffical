/**
 * HomeStudioLayout — noir editorial homepage.
 *
 * Repositioned for luxury resort fashion told after dark. Dark grounds
 * throughout (ink + canvas-raised), bronze accents, oversized imagery,
 * minimal retail furniture. All copy is verbatim from spec.
 *
 * Concierge invocation is centralised through useConciergeStore so the
 * header link, hero CTA, and Section 8 band all open the same global
 * <ConciergeWidget/> mounted at the app root.
 */
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";

import { useChromeStore } from "@/stores/chrome-store";
import { useConciergeStore } from "@/stores/concierge-store";
import { PalaceHeader } from "./palace-header";
import { ProductRail } from "@/components/sections/product-rail";
import { collectionRailQueryOptions } from "@/lib/rails/queries";
import { collectionHeroImageQueryOptions } from "@/lib/collection-hero-image";
import { Skeleton } from "@/components/ui/skeleton";
import { vendorSlug } from "@/lib/nav-config";
import heroPoster from "@/assets/home-hero.jpg";
import heroVideo from "@/assets/hero-cinematic.mp4.asset.json";

interface HomeStudioLayoutProps {
  variant?: "embedded" | "standalone";
}

const BRANDS = [
  "Dolce & Gabbana",
  "Saint Laurent",
  "Versace",
  "Tom Ford",
  "Gucci",
  "Prada",
  "Balenciaga",
  "Balmain",
] as const;

const TILES = [
  { handle: "new-arrivals", title: "New In" },
  { handle: "suits", title: "Tailoring for After Dark" },
  { handle: "mens-shirts", title: "Silk & Evening Shirts" },
] as const;

export function HomeStudioLayout({ variant = "embedded" }: HomeStudioLayoutProps) {
  const setSuppressed = useChromeStore((s) => s.setSuppressed);
  const isStandalone = variant === "standalone";
  const openConcierge = () => useConciergeStore.getState().setOpen(true);

  useEffect(() => {
    if (!isStandalone) return;
    setSuppressed({ header: true, footer: true });
    return () => setSuppressed({ header: false, footer: false });
  }, [isStandalone, setSuppressed]);

  return (
    <div className="w-full bg-ink text-canvas">
      {isStandalone && <PalaceHeader onOpenConcierge={openConcierge} />}

      {/* ───────────── Section 1 — Hero (video) ───────────── */}
      <section className="relative w-full overflow-hidden bg-ink" style={{ contain: "layout" }}>
        <div className="relative w-full" style={{ aspectRatio: "16 / 9", minHeight: "78vh" }}>
          <video
            src={heroVideo.url}
            poster={heroPoster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
          {/* Noir overlay: deepest at the text edge (bottom-left). */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.05) 100%)",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0) 100%)",
            }}
            aria-hidden="true"
          />

          <div className="absolute inset-x-0 bottom-0 px-6 md:px-14 pb-12 md:pb-24">
            <div className="max-w-screen-2xl mx-auto">
              <div className="max-w-3xl text-canvas">
                <h1 className="font-serif font-light tracking-[-0.015em] text-balance text-[12vw] md:text-[5.5vw] leading-[0.95]">
                  Dress for <em className="italic">after</em> dark.
                </h1>
                <p className="mt-6 md:mt-8 max-w-xl text-base md:text-lg leading-relaxed font-light text-canvas/85">
                  Silk that catches candlelight, linen undone by evening —
                  Dolce &amp; Gabbana, Saint Laurent, Versace, and the maisons
                  that understand desire. New, current-season, shipped
                  worldwide from Europe.
                </p>
                <div className="mt-8 md:mt-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <Link
                    to="/men"
                    className="inline-flex items-center justify-center gap-3 px-7 py-3 bg-canvas text-ink text-[11px] uppercase tracking-[0.32em] transition-opacity hover:opacity-90"
                  >
                    Shop Menswear
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
                  </Link>
                  <Link
                    to="/women"
                    className="inline-flex items-center justify-center gap-3 px-7 py-3 border border-canvas/70 text-canvas text-[11px] uppercase tracking-[0.32em] transition-colors hover:bg-canvas hover:text-ink"
                  >
                    Shop Womenswear
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
                  </Link>
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={openConcierge}
                    className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-canvas/80 hover:text-canvas transition-colors"
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
      <section className="border-y border-canvas/10 bg-ink">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-14 py-7 md:py-8">
          <div className="flex md:justify-center gap-x-8 md:gap-x-12 overflow-x-auto md:overflow-visible whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {BRANDS.map((b, i) => (
              <Link
                key={b}
                to="/brand/$vendor"
                params={{ vendor: vendorSlug(b) }}
                className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-bronze hover:text-canvas transition-colors shrink-0"
              >
                {b}
                {i < BRANDS.length - 1 && (
                  <span aria-hidden="true" className="ml-8 md:ml-12 text-canvas/25">·</span>
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
        headline="Linen for harbors. Silk for whatever comes after."
        body="A cross-category edit of Mediterranean evenings — drawstring linen, silk polos, and the long dinners that outlast the candle."
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
        tone="dark"
      />

      {/* ───────────── Section 4 — Coastal Essentials ───────────── */}
      <ProductRail
        surface="rail:home-coastal"
        queryOptions={collectionRailQueryOptions("coastal-essentials", 8)}
        eyebrow="Coastal Essentials"
        title="For pools at night and beaches at dawn."
        ctaTo="/collections/coastal-essentials"
        ctaLabel="Shop Coastal Essentials"
        tone="dark"
      />

      {/* ───────────── Section 5 — Sourcing ───────────── */}
      <section className="bg-canvas-raised text-ink">
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
      <section className="bg-ink">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-canvas/10">
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
        tone="dark"
      />

      {/* ───────────── Section 8 — Concierge band ───────────── */}
      <section className="bg-black border-y border-canvas/10">
        <div className="max-w-3xl mx-auto px-6 md:px-14 py-section-sm md:py-32 text-center">
          <h2 className="font-serif font-light text-[8vw] md:text-[3vw] leading-[1.1] tracking-[-0.01em] text-balance mb-7 text-canvas">
            The Concierge never sleeps.
          </h2>
          <p className="text-sm md:text-base leading-[1.75] font-light text-canvas/75 mb-10 mx-auto max-w-xl">
            Our concierge is AI — advanced, discreet, and fluent in every
            piece in the house. Tell it what you're dressing for — a late
            dinner in Taormina, a night you've been planning, someone worth
            the effort — and receive a considered edit in moments, at any
            hour.
          </p>
          <button
            type="button"
            onClick={openConcierge}
            className="inline-flex items-center gap-3 pb-2 text-[11px] uppercase tracking-[0.32em] border-b border-bronze text-canvas hover:gap-5 hover:text-bronze transition-all duration-500"
          >
            Begin with the Concierge
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.25} />
          </button>
        </div>
      </section>

      {/* ───────────── Section 9 — Trust strip ───────────── */}
      <section className="bg-ink border-t border-canvas/10">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-14 py-8 md:py-10">
          <ul className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 md:gap-12 text-center">
            {[
              "Express worldwide shipping from Europe",
              "New & current-season, original packaging",
              "Secure checkout",
            ].map((item) => (
              <li
                key={item}
                className="text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-bronze"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {isStandalone && (
        <footer className="px-6 md:px-14 py-10 border-t border-canvas/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-ink">
          <span className="text-[10px] uppercase tracking-[0.32em] text-bronze">
            Palace of Roman — Studio draft
          </span>
          <Link to="/" className="text-[10px] uppercase tracking-[0.32em] text-bronze hover:text-canvas transition-colors">
            ← Return to the live boutique
          </Link>
        </footer>
      )}
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
  const { data } = useQuery(collectionRailQueryOptions(handle, 8));
  const lead = data?.[0]?.node.images?.edges?.[0]?.node;


  return (
    <section className="bg-ink">
      <div className="grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-7 relative bg-black">
          <div className="relative w-full" style={{ aspectRatio: "4 / 5" }}>
            {lead && (
              <img
                src={lead.url}
                alt={lead.altText ?? headline}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "brightness(0.78) contrast(1.05) saturate(0.95)" }}
                loading="lazy"
                decoding="async"
              />
            )}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 60%)",
              }}
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="md:col-span-5 flex items-center px-6 md:px-14 py-14 md:py-0 bg-ink">
          <div className="max-w-md">
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.45em] text-bronze mb-6">
              {eyebrow}
            </p>
            <h2 className="font-serif font-light text-[8vw] md:text-[3vw] leading-[1.05] tracking-[-0.01em] text-balance mb-6 text-canvas">
              {headline}
            </h2>
            <p className="text-sm md:text-base leading-[1.75] font-light text-canvas/75 mb-8">
              {body}
            </p>
            <Link
              to={ctaTo}
              className="inline-flex items-center gap-3 pb-2 text-[11px] uppercase tracking-[0.32em] border-b border-bronze text-canvas hover:gap-5 hover:text-bronze transition-all duration-500"
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
  const { data: hero } = useQuery(collectionHeroImageQueryOptions(handle));

  return (
    <Link
      to="/collections/$handle"
      params={{ handle }}
      className="group relative block bg-ink overflow-hidden"
      aria-label={title}
    >
      <div className="relative w-full bg-black" style={{ aspectRatio: "3 / 4" }}>
        {hero?.url ? (
          <img
            src={hero.url}
            alt={hero.altText ?? title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.04]"
            style={{ filter: "brightness(0.72) contrast(1.05) saturate(0.95)" }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Skeleton className="absolute inset-0 w-full h-full !rounded-none bg-canvas/5" />
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
            {title}
          </h3>
          <ArrowUpRight className="w-4 h-4 text-canvas/80 group-hover:text-bronze transition-colors" strokeWidth={1.25} />
        </div>
      </div>
    </Link>
  );
}

function WomenswearBlock() {
  const { data } = useQuery(collectionRailQueryOptions("womens-dresses", 8));
  const lead = data?.[0]?.node.images?.edges?.[0]?.node;



  return (
    <section className="relative w-full bg-black overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: "16 / 9", minHeight: "62vh" }}>
        {lead && (
          <img
            src={lead.url}
            alt={lead.altText ?? "Womenswear — silk and evening light"}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.72) contrast(1.05) saturate(0.95)" }}
            loading="lazy"
            decoding="async"
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0) 100%)",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-y-0 left-0 flex items-center px-6 md:px-14">
          <div className="max-w-md text-canvas">
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.45em] text-bronze mb-6">
              Womenswear
            </p>
            <h2 className="font-serif font-light text-[10vw] md:text-[4vw] leading-[1.0] tracking-[-0.01em] text-balance mb-8">
              Dresses that end evenings.
            </h2>
            <Link
              to="/women"
              className="inline-flex items-center gap-3 px-7 py-3 border border-canvas/70 text-canvas text-[11px] uppercase tracking-[0.32em] hover:bg-canvas hover:text-ink transition-colors"
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
