/**
 * StudioVerificationBanner — editorial provenance statement
 *
 * Wide-set editorial layout. Right column carries a staggered four-image
 * studio drop pulled from the June bucket; a full-bleed contact-sheet
 * marquee below the body cycles through all 30 frames as a quiet visual
 * proof of the in-studio handling described in the body copy.
 *
 * Images are CDN-hosted (`@/assets/june/*.png.asset.json`) so the heavy
 * PNGs never touch the repo and load lazily.
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

// Four anchor frames for the staggered right-column grid; the marquee
// below replays every frame in the drop.
const featured = [juneUrls[0], juneUrls[1], juneUrls[2], juneUrls[3]].filter(Boolean);
const marqueeFrames = juneUrls.length ? [...juneUrls, ...juneUrls] : []; // duplicate for seamless loop

export function StudioVerificationBanner() {
  return (
    <section
      className="border-y"
      style={{ borderColor: "rgba(244,241,236,0.08)" }}
    >
      <div className="px-6 md:px-14 py-24 md:py-36">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-14 items-start">
          {/* ───── Left column — text block ───── */}
          <div className="md:col-span-5 md:col-start-1">
            <h2
              className="text-[8vw] md:text-[3.2vw] leading-[1.1] font-light tracking-[0.08em] uppercase mb-6"
              style={{ fontWeight: 300, fontFamily: fontSerif, textWrap: "balance" }}
            >
              Verified Physical Provenance
            </h2>

            <p
              className="text-[10px] md:text-[11px] tracking-[0.45em] uppercase mb-10"
              style={{ color: palette.sand, fontFamily: fontSans }}
            >
              Beyond the Digital Architecture
            </p>

            <p
              className="text-sm md:text-base leading-[1.75] mb-10 max-w-lg"
              style={{ color: palette.muted, fontFamily: fontSans, fontWeight: 300 }}
            >
              We do not rely on generic catalog imagery or unverified secondary markets.
              Every current-season allocation displayed on palaceofromanofficial.com
              is documented live under our studio architecture. We handle, inspect,
              and photograph the fine material grains and custom hardware of our
              inventory firsthand, guaranteeing absolute alignment with European
              luxury standards before your selection ever departs our distribution hubs.
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
              Explore Our Sourcing Protocol
              <ArrowUpRight
                className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={1.25}
              />
            </Link>
          </div>

          {/* ───── Right column — staggered studio frames ───── */}
          <div className="md:col-span-6 md:col-start-7">
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {featured.map((url, i) => (
                <div
                  key={url}
                  className={`relative overflow-hidden aspect-[3/4] group ${
                    i % 2 === 1 ? "mt-8 md:mt-16" : ""
                  }`}
                  style={{ background: palette.sandSoft }}
                >
                  <img
                    src={url}
                    alt={`Palace of Roman studio capture — verified inventory frame ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.06]"
                    loading="lazy"
                    decoding="async"
                    width={512}
                    height={683}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none border"
                    style={{ borderColor: "rgba(244,241,236,0.12)" }}
                  />
                </div>
              ))}
            </div>

            <p
              className="mt-6 text-[10px] tracking-[0.32em] uppercase"
              style={{ color: palette.muted, fontFamily: fontSans }}
            >
              Studio captures — current allocation, photographed in-house
            </p>
          </div>
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
