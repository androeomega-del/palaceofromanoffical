/**
 * EditionHero — full-bleed cover for the active Edition.
 * Gucci-scale roman numeral over a Burberry-calm image. Slow Ken-Burns
 * parallax on scroll; single thin-stroke CTA bottom-left.
 */
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import type { Edition } from "@/lib/editions";

export function EditionHero({ edition }: { edition: Edition }) {
  const imgRef = useRef<HTMLImageElement>(null);

  // Cheap parallax — translateY 0 → -8% over the hero's viewport range.
  // requestAnimationFrame + transform only; no layout thrash.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = imgRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - vh / 2) / vh));
        el.style.transform = `translate3d(0, ${(-progress * 4).toFixed(2)}%, 0) scale(1.06)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [edition.cover.url]);

  return (
    <motion.section
      key={edition.handle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-[88vh] min-h-[640px] overflow-hidden bg-[var(--edition-bg)] text-[var(--edition-fg)]"
      aria-label={`Edition ${edition.number} — ${edition.title}`}
    >
      <img
        ref={imgRef}
        src={edition.cover.url}
        alt={edition.cover.alt}
        // The hero image IS the LCP. eager + high priority.
        loading="eager"
        // @ts-expect-error -- fetchpriority is valid HTML, not yet typed in React
        fetchpriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        style={{ transform: "translate3d(0,0,0) scale(1.06)" }}
      />

      {/* Soft vignette so the typography reads on any cover */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/55 pointer-events-none" />

      {/* Oversized roman numeral — Gucci scale */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-0 top-[18%] flex justify-center pointer-events-none"
      >
        <span
          className="font-serif italic text-white/95 leading-none select-none"
          style={{
            fontSize: "clamp(8rem, 22vw, 22rem)",
            letterSpacing: "-0.04em",
            textShadow: "0 2px 40px rgba(0,0,0,0.25)",
          }}
        >
          {edition.number}
        </span>
      </motion.div>

      {/* Caption block bottom-left — Burberry calm */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-10 md:bottom-16 left-6 md:left-12 right-6 md:right-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6 text-white"
      >
        <div className="max-w-xl">
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-white/70 mb-3">
            Edition {edition.number} · Now
          </p>
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-balance">
            {edition.title}
          </h1>
          {edition.description && (
            <p className="mt-4 text-sm md:text-base text-white/85 leading-relaxed max-w-md text-pretty">
              {edition.description}
            </p>
          )}
        </div>
        <Link
          to="/collections/$handle"
          params={{ handle: edition.handle }}
          className="self-start md:self-auto inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-white border-b border-white/70 hover:border-white pb-1 transition-colors whitespace-nowrap"
        >
          Discover the edition
          <span aria-hidden>→</span>
        </Link>
      </motion.div>
    </motion.section>
  );
}
