/**
 * StudioVerificationBanner — editorial provenance statement
 *
 * A minimalist, wide-set editorial container that communicates the brand's
 * physical authentication commitment. Uses the obsidian/sand palette already
 * established in the home-studio system.
 */
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { palette, fontSans, fontSerif } from "./palette";
import macroLeather from "@/assets/macro-leather-detail.jpg";
import macroHardware from "@/assets/macro-hardware-detail.jpg";

export function StudioVerificationBanner() {
  return (
    <section
      className="px-6 md:px-14 py-24 md:py-36 border-y"
      style={{
        borderColor: "rgba(244,241,236,0.08)",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-14 items-start">
        {/* ───── Left column — text block ───── */}
        <div className="md:col-span-5 md:col-start-1">
          {/* ── Header: tracked-out uppercase serif ── */}
          <h2
            className="text-[8vw] md:text-[3.2vw] leading-[1.1] font-light tracking-[0.08em] uppercase mb-6"
            style={{ fontWeight: 300, fontFamily: fontSerif, textWrap: "balance" }}
          >
            Verified Physical Provenance
          </h2>

          {/* ── Subtitle ── */}
          <p
            className="text-[10px] md:text-[11px] tracking-[0.45em] uppercase mb-10"
            style={{ color: palette.sand, fontFamily: fontSans }}
          >
            Beyond the Digital Architecture
          </p>

          {/* ── Body ── */}
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

        {/* ───── Right column — dual macro images ───── */}
        <div className="md:col-span-6 md:col-start-7">
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {/* Primary macro image — leather grain */}
            <div
              className="relative overflow-hidden aspect-[3/4] group"
              style={{ background: palette.sandSoft }}
            >
              <img
                src={macroLeather}
                alt="Macro detail photography of premium Italian calfskin leather grain and patina"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.06]"
                loading="lazy"
                decoding="async"
                width={512}
                height={683}
              />
              {/* Thin border overlay */}
              <div
                className="absolute inset-0 pointer-events-none border"
                style={{ borderColor: "rgba(244,241,236,0.12)" }}
              />
            </div>

            {/* Secondary macro image — hardware detail */}
            <div
              className="relative overflow-hidden aspect-[3/4] mt-8 md:mt-16 group"
              style={{ background: palette.sandSoft }}
            >
              <img
                src={macroHardware}
                alt="Macro detail photography of luxury fashion hardware, zipper teeth and metal clasp"
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
          </div>

          {/* Quiet caption beneath images */}
          <p
            className="mt-6 text-[10px] tracking-[0.32em] uppercase"
            style={{ color: palette.muted, fontFamily: fontSans }}
          >
            Studio macro photography — material grains &amp; custom hardware
          </p>
        </div>
      </div>
    </section>
  );
}
