/**
 * StudioVerificationBanner — "Sourcing" statement
 *
 * Editorial direct-from-Europe positioning. Replaces the prior
 * "Verified Physical Provenance" block. The full-bleed contact-sheet
 * marquee remains as the supporting visual; it carries no in-house
 * studio claim — purely a visual rhythm of curated pieces.
 */
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { palette, fontSans, fontSerif } from "./palette";

// Eagerly import every June asset pointer at build time; Vite tree-shakes
// the .asset.json modules into a single map of CDN urls.
const juneModules = import.meta.glob("../../assets/june/*.png.asset.json", {
  eager: true,
  import: "default",
}) as Record<string, { url: string }>;

const juneUrls: string[] = Object.entries(juneModules)
  .sort(([a], [b]) => {
    const na = Number(a.match(/\/(\d+)(?:-)?\.png/)?.[1] ?? 0);
    const nb = Number(b.match(/\/(\d+)(?:-)?\.png/)?.[1] ?? 0);
    return na - nb;
  })
  .map(([, mod]) => mod.url);

// The full-bleed contact-sheet marquee replays every frame in the drop.
const marqueeFrames = juneUrls.length ? [...juneUrls, ...juneUrls] : []; // duplicate for seamless loop

export function StudioVerificationBanner() {
  return (
    <section
      className="border-y"
      style={{ borderColor: "rgba(244,241,236,0.08)" }}
    >
      <div className="px-6 md:px-14 py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-[10px] md:text-[11px] tracking-[0.45em] uppercase mb-8"
            style={{ color: palette.sand, fontFamily: fontSans }}
          >
            Sourcing
          </p>

          <h2
            className="text-[8vw] md:text-[3.2vw] leading-[1.1] font-light tracking-[-0.01em] mb-8"
            style={{ fontWeight: 300, fontFamily: fontSerif, textWrap: "balance" }}
          >
            Direct from Europe. Never secondary market.
          </h2>

          <p
            className="text-sm md:text-base leading-[1.75] mb-10 mx-auto max-w-xl"
            style={{ color: palette.muted, fontFamily: fontSans, fontWeight: 300 }}
          >
            Every piece at Palace of Roman is new, unworn, and current or
            recent season — sourced through established European distribution
            partners and shipped to you in original packaging, with tags and
            authenticity cards where the maison provides them. No consignment.
            No pre-owned. No gray-market resale chains. One piece, one owner:
            you.
          </p>

          <Link
            to="/sourcing-architecture"
            className="group inline-flex items-center gap-3 pb-2 text-[11px] uppercase tracking-[0.32em] border-b transition-all duration-500 hover:gap-5"
            style={{
              color: palette.offwhite,
              borderColor: palette.sand,
              fontFamily: fontSans,
            }}
          >
            Read how we source
            <ArrowUpRight
              className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.25}
            />
          </Link>
        </div>
      </div>

      {/* ───── Full-bleed contact-sheet marquee ───── */}
      {marqueeFrames.length > 0 && (
        <div
          className="relative overflow-hidden border-t"
          style={{ borderColor: "rgba(244,241,236,0.08)" }}
          aria-label="Studio contact sheet"
        >
          <div className="flex gap-3 md:gap-4 py-6 md:py-8 studio-marquee-track">
            {marqueeFrames.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="relative shrink-0 w-[42vw] md:w-[18vw] aspect-[3/4] overflow-hidden"
                style={{ background: palette.sandSoft }}
              >
                <img
                  src={url}
                  alt={`Studio contact sheet — frame ${(i % (marqueeFrames.length / 2)) + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width={360}
                  height={480}
                />
                <div
                  className="absolute inset-0 pointer-events-none border"
                  style={{ borderColor: "rgba(244,241,236,0.08)" }}
                />
              </div>
            ))}
          </div>
          <style>{`
            @keyframes studioMarquee {
              from { transform: translate3d(0, 0, 0); }
              to   { transform: translate3d(-50%, 0, 0); }
            }
            .studio-marquee-track {
              width: max-content;
              animation: studioMarquee 90s linear infinite;
              will-change: transform;
            }
            @media (prefers-reduced-motion: reduce) {
              .studio-marquee-track { animation: none; }
            }
          `}</style>
        </div>
      )}
    </section>
  );
}
