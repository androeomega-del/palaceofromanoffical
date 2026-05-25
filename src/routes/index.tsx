/**
 * Homepage — Edition-driven immersive lookbook.
 *
 * Spine: Edition Hero (full-bleed, parallax) → Edition Intro → Trending This
 * Week → Lookbook Masonry pt.1 → Style Quiz CTA → Curated For You →
 * Edition Editorial Band → Lookbook Masonry pt.2 → Featured Houses (LUXURY_TIERS).
 *
 * Everything else from the previous home (Bento, swim rails, Versace
 * spotlight, additive EditorsEdition band, Wardrobe Essentials triptych,
 * Best Sellers, Why-Shop pillars) is archived — files preserved, just
 * not rendered. To restore, restore the previous git version of this file.
 */
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, ShieldCheck, Plane, Sparkles } from "lucide-react";

import { EditionProvider, useEdition } from "@/contexts/edition-context";
import { EditionHero } from "@/components/lookbook/edition-hero";
import { EditionSwitcher } from "@/components/lookbook/edition-switcher";
import { EditionIntro } from "@/components/lookbook/edition-intro";
import { EditionEditorialBand } from "@/components/lookbook/edition-editorial-band";
import { LookbookMasonry } from "@/components/lookbook/lookbook-masonry";
import { TrendingNowRail } from "@/components/trending-now";
import { ForYouFeed } from "@/components/for-you-feed";
import { LUXURY_TIERS } from "@/lib/luxury-brands";
import { useEffect, useState } from "react";

import heroImage from "@/assets/home-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Palace of Roman — Curated Luxury Fashion" },
      {
        name: "description",
        content:
          "An immersive seasonal lookbook from Palace of Roman — shop the current Editions across Gucci, Prada, Saint Laurent, Dolce & Gabbana and 500+ designer houses. 100% authentic, worldwide shipping.",
      },
      { property: "og:title", content: "Palace of Roman — Editions" },
      {
        property: "og:description",
        content:
          "An immersive seasonal lookbook — shop the current Editions across 500+ designer houses.",
      },
      { property: "og:url", content: "https://palaceofromanofficial.com/" },
      { property: "og:image", content: `https://palaceofromanofficial.com${heroImage}` },
      { name: "twitter:image", content: `https://palaceofromanofficial.com${heroImage}` },
    ],
    links: [
      { rel: "canonical", href: "https://palaceofromanofficial.com/" },
      // LCP candidate — preloaded as a high-priority image.
      { rel: "preload", as: "image", href: heroImage, fetchpriority: "high" } as never,
    ],
  }),
  component: HomePage,
  errorComponent: HomeErrorComponent,
});

function HomeErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("[home] runtime error:", error);
  const router = useRouter();
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas px-4">
      <div className="max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-6">
          Something interrupted the boutique
        </p>
        <h1 className="text-4xl font-serif mb-6">We couldn't load the homepage</h1>
        <p className="text-sm text-muted-foreground mb-10">
          A passing glitch — please try again, or browse the boutique while we tidy up.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
          >
            Try Again
          </button>
          <Link
            to="/shop"
            className="text-[11px] uppercase tracking-[0.25em] border-b border-ink/20 pb-1 hover:text-ink"
          >
            Browse the Boutique
          </Link>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  // Defer all browser-only edition resolution to post-hydration to avoid SSR
  // text mismatches (Roman numerals, edition title, etc. are async data).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <EditionProvider>
      <TrustStrip />
      {mounted ? <EditionSpine /> : <HeroSkeleton />}
    </EditionProvider>
  );
}

function TrustStrip() {
  return (
    <section aria-label="Why shop Palace of Roman" className="border-b border-ink/10 bg-canvas">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 md:py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-ink/75">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-bronze" strokeWidth={1.5} /> Official BrandsGateway Partner
        </span>
        <span className="hidden md:inline opacity-30">·</span>
        <span>100% Authentic</span>
        <span className="hidden md:inline opacity-30">·</span>
        <span className="inline-flex items-center gap-2">
          <Plane className="w-3.5 h-3.5 text-bronze" strokeWidth={1.5} /> Ships from EU — Tracked Worldwide
        </span>
        <span className="hidden md:inline opacity-30">·</span>
        <Link
          to="/authentication"
          className="border-b border-bronze/40 hover:text-bronze hover:border-bronze transition-colors pb-0.5"
        >
          How we authenticate →
        </Link>
      </div>
    </section>
  );
}

function HeroSkeleton() {
  return (
    <div className="h-[88vh] min-h-[640px] flex items-center justify-center bg-canvas-raised">
      <Loader2 className="w-5 h-5 animate-spin text-ink/30" />
    </div>
  );
}

function EditionSpine() {
  const { active, editions, isLoading } = useEdition();

  if (isLoading || !active) return <HeroSkeleton />;

  return (
    <>
      {/* Floating edition switcher — fixed to top-right of viewport */}
      {editions.length > 1 && (
        <div className="fixed top-20 right-4 md:right-8 z-40">
          <EditionSwitcher />
        </div>
      )}

      {/* The whole spine crossfades on edition change. AnimatePresence keys on
          active.handle so React re-mounts the subtree cleanly. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.handle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <EditionHero edition={active} />
          <EditionIntro edition={active} />

          {/* Trending This Week — kept */}
          <TrendingNowRail />

          {/* Lookbook masonry pt.1 — shoppable hotspots */}
          <LookbookMasonry edition={active} productOffset={0} productLimit={6} />

          {/* Style Quiz CTA — kept, restyled */}
          <StyleQuizCTA />

          {/* Curated For You — kept */}
          <ForYouFeed />

          {/* Edition editorial band */}
          <EditionEditorialBand edition={active} />

          {/* Lookbook masonry pt.2 */}
          <LookbookMasonry edition={active} productOffset={6} productLimit={8} />

          {/* The Houses — kept (tiered designer directory) */}
          <FeaturedHouses />
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function StyleQuizCTA() {
  return (
    <section aria-label="Take the style quiz" className="bg-canvas">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-14 md:py-20">
        <Link
          to="/style-quiz"
          className="group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-10 border border-ink/10 hover:border-bronze/60 transition-colors px-6 md:px-10 py-8 md:py-10 bg-canvas-raised"
        >
          <div className="flex items-start gap-5 md:gap-6">
            <span className="hidden md:inline-flex shrink-0 items-center justify-center w-12 h-12 rounded-full border border-bronze/40 text-bronze">
              <Sparkles className="w-5 h-5" strokeWidth={1.25} />
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-2">In 60 seconds</p>
              <h2 className="font-serif text-2xl md:text-3xl text-ink leading-tight">
                Find your edit — take the Style Quiz
              </h2>
              <p className="mt-2 text-[12px] md:text-[13px] text-muted-foreground max-w-xl">
                Four questions, one curated selection. We'll narrow thousands of pieces down to the ones made for you.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-canvas text-[11px] uppercase tracking-[0.25em] group-hover:bg-bronze transition-colors whitespace-nowrap">
            Start the Quiz →
          </span>
        </Link>
      </div>
    </section>
  );
}

function FeaturedHouses() {
  return (
    <section className="py-24 md:py-28 border-t border-ink/5 bg-canvas">
      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="text-center mb-14 md:mb-16 max-w-2xl mx-auto">
          <span className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-4 block">
            The Houses
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif leading-tight mb-5 text-balance">
            The world's most significant maisons, under one roof.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
            A living index of the houses we represent — from the legacy giants to the modern vanguard. Tap a name to enter the maison.
          </p>
        </div>
        <div className="space-y-12">
          {LUXURY_TIERS.map((tier) => (
            <div key={tier.id} className="grid grid-cols-12 gap-6 border-t border-ink/10 pt-8">
              <div className="col-span-12 md:col-span-3">
                <p className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-2">
                  {tier.id.replace("tier-", "Tier ")}
                </p>
                <p className="font-serif text-xl md:text-2xl leading-tight">{tier.label}</p>
              </div>
              <div className="col-span-12 md:col-span-9 flex flex-wrap gap-x-6 gap-y-3">
                {tier.brands.map((b) => (
                  <Link
                    key={b.slug}
                    to="/brand/$vendor"
                    params={{ vendor: b.slug }}
                    className="text-xs md:text-sm tracking-[0.18em] uppercase opacity-70 hover:opacity-100 hover:text-bronze transition-all"
                  >
                    {b.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-14">
          <Link
            to="/brands"
            className="text-[11px] uppercase tracking-[0.28em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors"
          >
            Browse the full directory →
          </Link>
        </div>
      </div>
    </section>
  );
}
