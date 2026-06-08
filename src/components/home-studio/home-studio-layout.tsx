/**
 * HomeStudioLayout — the obsidian/sand editorial homepage layer.
 *
 * Two variants:
 *  - `embedded` (default, used by `/`): renders inside the real SiteHeader/
 *    SiteFooter chrome. Does NOT suppress global chrome — cart, search,
 *    account, and nav remain functional.
 *  - `standalone` (used by `/studio`): suppresses SiteHeader/SiteFooter
 *    via useChromeStore and renders its own StudioHeader + draft footer.
 *
 * Data: `products` come from the live `newThisWeekQueryOptions` rail
 * (verified Shopify handles only — no fabrication).
 * Concierge drawer is wired to the existing `fetchConciergePicks` serverFn.
 */
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useChromeStore } from "@/stores/chrome-store";
import { newThisWeekQueryOptions } from "@/lib/rails/queries";
import { ConciergeDrawer } from "./concierge-drawer";
import { AsymmetricGrid } from "./asymmetric-grid";
import { PalaceHeader } from "./palace-header";
import { StudioVerificationBanner } from "./studio-verification-banner";
import { palette, fontSans, fontSerif } from "./palette";
import heroImage from "@/assets/home-hero.jpg";
import heroVideoAsset from "@/assets/hero-cinematic.mp4.asset.json";

interface HomeStudioLayoutProps {
  variant?: "embedded" | "standalone";
}

export function HomeStudioLayout({ variant = "embedded" }: HomeStudioLayoutProps) {
  const setSuppressed = useChromeStore((s) => s.setSuppressed);
  const isStandalone = variant === "standalone";

  // Only the standalone (/studio) variant suppresses real site chrome.
  useEffect(() => {
    if (!isStandalone) return;
    setSuppressed({ header: true, footer: true });
    return () => setSuppressed({ header: false, footer: false });
  }, [isStandalone, setSuppressed]);

  const [conciergeOpen, setConciergeOpen] = useState(false);

  const { data: menRail } = useSuspenseQuery(newThisWeekQueryOptions("Men"));
  const { data: womenRail } = useSuspenseQuery(newThisWeekQueryOptions("Women"));
  const menProducts = (menRail ?? []).slice(0, 6);
  const womenProducts = (womenRail ?? []).slice(0, 6);

  return (
    <div
      className="w-full font-serif"
      style={{
        background: palette.obsidian,
        color: palette.offwhite,
        fontFamily: fontSerif,
      }}
    >
      {isStandalone && <PalaceHeader onOpenConcierge={() => setConciergeOpen(true)} />}

      {/* ───── Hero (asymmetric split — text left, cinematic loop right) ───── */}
      <section className="relative px-6 md:px-14 pt-16 md:pt-28 pb-24 md:pb-40 animate-[studioFade_1.2s_ease-out_both]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-center">
          {/* Left column — text block (unchanged copy) */}
          <div className="md:col-span-7">
            <p
              className="text-[10px] md:text-[11px] tracking-[0.45em] uppercase mb-10"
              style={{ color: palette.sand, fontFamily: fontSans }}
            >
              Palace of Roman — {isStandalone ? "Studio" : "The Edit"}
            </p>
            <h1
              className="text-[15vw] md:text-[8.5vw] leading-[0.92] font-light tracking-[-0.02em] text-balance"
              style={{ fontWeight: 300 }}
            >
              Palace of Roman
              <br />
              The quiet <em className="italic" style={{ color: palette.sand }}>art</em> of
              <br />
              luxury fashion.
            </h1>
            <div className="mt-14 md:mt-20 max-w-md">
              <p
                className="text-base md:text-lg leading-relaxed"
                style={{ color: palette.muted, fontFamily: fontSans, fontWeight: 300 }}
              >
                A curated multi-brand luxury fashion boutique sourcing
                current-season pieces directly from a global network of
                authorised European maisons and independent distributors.
                Every item is authenticated, chosen one at a time, and
                delivered duties-cleared to your door.
              </p>
              <button
                onClick={() => setConciergeOpen(true)}
                aria-label="Open personal concierge styling service"
                className="group inline-flex items-center gap-3 mt-10 pb-2 text-[11px] uppercase tracking-[0.32em] border-b transition-all duration-500 hover:gap-5"
                style={{
                  color: palette.offwhite,
                  borderColor: palette.sand,
                  fontFamily: fontSans,
                }}
              >
                Begin with the concierge
                <ArrowUpRight
                  className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  strokeWidth={1.25}
                />
              </button>
            </div>
          </div>

          {/* Right column — vertical cinematic loop. Aspect ratio + contain:layout
              reserve the box at SSR so CLS stays 0. Poster falls back to the
              existing home-hero asset until the .mp4 is uploaded. */}
          <div className="md:col-span-5">
            <div
              className="relative w-full overflow-hidden bg-black/40"
              style={{ aspectRatio: "3 / 4", contain: "layout" }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster={heroImage}
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={heroVideoAsset.url} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Editorial asymmetric grid ───── */}
      <section className="px-6 md:px-14 pb-24 md:pb-40">
        <div className="flex items-end justify-between mb-12 md:mb-20">
          <h2
            className="text-3xl md:text-5xl font-light tracking-[-0.01em]"
            style={{ fontWeight: 300 }}
          >
            New this week
          </h2>
          <Link
            to="/collections/$handle"
            params={{ handle: "new-arrivals" }}
            className="hidden md:inline text-[10px] uppercase tracking-[0.32em] pb-1 border-b transition-colors"
            style={{
              color: palette.sand,
              borderColor: "rgba(217,207,193,0.4)",
              fontFamily: fontSans,
            }}
          >
            View all
          </Link>
        </div>

        <AsymmetricGrid menProducts={menProducts} womenProducts={womenProducts} />
      </section>

      {/* ───── Standalone-only draft footer (real SiteFooter handles `/`) ───── */}
      {isStandalone && (
        <footer
          className="px-6 md:px-14 py-10 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          style={{
            borderColor: "rgba(244,241,236,0.08)",
            fontFamily: fontSans,
          }}
        >
          <span className="text-[10px] uppercase tracking-[0.32em]" style={{ color: palette.muted }}>
            Palace of Roman — Studio draft
          </span>
          <Link
            to="/"
            className="text-[10px] uppercase tracking-[0.32em] transition-colors hover:opacity-100"
            style={{ color: palette.sand, opacity: 0.85 }}
          >
            ← Return to the live boutique
          </Link>
        </footer>
      )}

      <ConciergeDrawer open={conciergeOpen} onClose={() => setConciergeOpen(false)} />

      <style>{`
        @keyframes studioFade {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes studioScale {
          from { opacity: 0; transform: scale(0.985); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes studioDrawerIn {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes conciergeDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40%           { transform: translateY(-3px); opacity: 1; }
        }
        .studio-tile { animation: studioScale 1.4s cubic-bezier(.2,.7,.2,1) both; }
        .studio-tile img { transition: transform 1.6s cubic-bezier(.2,.7,.2,1), opacity .8s ease; will-change: transform; }
        .studio-tile:hover img { transform: scale(1.06); }
      `}</style>
    </div>
  );
}
