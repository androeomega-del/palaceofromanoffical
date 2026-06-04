/**
 * /studio — standalone design exploration.
 *
 * A minimal, luxurious homepage shell built outside the live `/` route so the
 * production EditionLayout stays untouched while this direction is refined.
 *
 * - Stark palette (obsidian / off-white / sand) scoped to this page only via
 *   inline CSS variables; no edits to global tokens.
 * - Suppresses the default <SiteHeader/> + <SiteFooter/> via useChromeStore
 *   so the page presents its own chrome.
 * - Hidden left drawer hosts the AI styling concierge, wired to the existing
 *   `fetchConciergePicks` serverFn — no new backend.
 * - Editorial asymmetric grid fed by the live "New In" rail (verified
 *   Shopify handles via newThisWeekQueryOptions).
 * - Noindex: this is a draft surface, not a public page.
 */
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Menu, X, ArrowUpRight, Loader2, Sparkles } from "lucide-react";
import { useChromeStore } from "@/stores/chrome-store";
import { newThisWeekQueryOptions } from "@/lib/rails/queries";
import { fetchConciergePicks, type ConciergeResult } from "@/lib/ai-concierge.functions";
import { formatPrice } from "@/lib/shopify";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Studio — Palace of Roman" },
      { name: "description", content: "A minimal design exploration for Palace of Roman." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(newThisWeekQueryOptions("Women"));
    return null;
  },
  component: StudioPage,
});

/* ---------- palette (scoped, not global) ---------- */
const palette = {
  obsidian: "#0B0B0C",
  offwhite: "#F4F1EC",
  sand: "#D9CFC1",
  sandSoft: "#E8E0D2",
  muted: "rgba(244,241,236,0.55)",
} as const;

function StudioPage() {
  const setSuppressed = useChromeStore((s) => s.setSuppressed);
  useEffect(() => {
    setSuppressed({ header: true, footer: true });
    return () => setSuppressed({ header: false, footer: false });
  }, [setSuppressed]);

  const [conciergeOpen, setConciergeOpen] = useState(false);

  const { data: rail } = useSuspenseQuery(newThisWeekQueryOptions("Women"));
  const products = rail?.products?.edges?.slice(0, 6) ?? [];

  return (
    <div
      className="min-h-screen w-full font-serif"
      style={{
        background: palette.obsidian,
        color: palette.offwhite,
        fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
      }}
    >
      <StudioHeader onOpenConcierge={() => setConciergeOpen(true)} />

      {/* ───── Hero ───── */}
      <section className="relative px-6 md:px-14 pt-20 md:pt-32 pb-24 md:pb-40 animate-[studioFade_1.2s_ease-out_both]">
        <p
          className="text-[10px] md:text-[11px] tracking-[0.45em] uppercase mb-10"
          style={{ color: palette.sand, fontFamily: "'Inter', sans-serif" }}
        >
          Palace of Roman — Studio
        </p>
        <h1
          className="text-[15vw] md:text-[10vw] leading-[0.92] font-light tracking-[-0.02em] text-balance"
          style={{ fontWeight: 300 }}
        >
          The quiet
          <br />
          <em className="italic" style={{ color: palette.sand }}>art</em> of
          <br />
          dressing.
        </h1>
        <div className="mt-14 md:mt-20 max-w-md">
          <p
            className="text-base md:text-lg leading-relaxed"
            style={{ color: palette.muted, fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
          >
            A curated season of pieces from a global network of authorised
            boutiques — chosen one at a time, delivered with duties cleared.
          </p>
          <button
            onClick={() => setConciergeOpen(true)}
            className="group inline-flex items-center gap-3 mt-10 pb-2 text-[11px] uppercase tracking-[0.32em] border-b transition-all duration-500 hover:gap-5"
            style={{
              color: palette.offwhite,
              borderColor: palette.sand,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Begin with the concierge
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.25} />
          </button>
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
              fontFamily: "'Inter', sans-serif",
            }}
          >
            View all
          </Link>
        </div>

        <AsymmetricGrid products={products} />
      </section>

      {/* ───── Footer ───── */}
      <footer
        className="px-6 md:px-14 py-10 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{
          borderColor: "rgba(244,241,236,0.08)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.32em]"
          style={{ color: palette.muted }}
        >
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
        .studio-tile { animation: studioScale 1.4s cubic-bezier(.2,.7,.2,1) both; }
        .studio-tile img { transition: transform 1.6s cubic-bezier(.2,.7,.2,1), opacity .8s ease; }
        .studio-tile:hover img { transform: scale(1.04); }
      `}</style>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function StudioHeader({ onOpenConcierge }: { onOpenConcierge: () => void }) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-14 h-20 backdrop-blur-md"
      style={{
        background: "rgba(11,11,12,0.7)",
        borderBottom: "1px solid rgba(244,241,236,0.06)",
      }}
    >
      <button
        onClick={onOpenConcierge}
        aria-label="Open styling concierge"
        className="inline-flex items-center gap-3 group"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <Menu className="w-5 h-5 transition-transform duration-500 group-hover:rotate-90" strokeWidth={1.25} />
        <span className="hidden md:inline text-[10px] uppercase tracking-[0.32em]" style={{ color: palette.sand }}>
          Concierge
        </span>
      </button>

      <Link
        to="/studio"
        className="text-sm md:text-base uppercase tracking-[0.38em]"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
      >
        Palace of Roman
      </Link>

      <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.32em]" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Link to="/shop" search={{} as never} className="hidden md:inline hover:opacity-70 transition-opacity">
          Boutique
        </Link>
        <Sparkles className="w-4 h-4" strokeWidth={1.25} style={{ color: palette.sand }} />
      </div>
    </header>
  );
}

/* ───── Asymmetric grid: 6 tiles in a 12-col rhythm ─────
 *  row 1: tall (cols 1-5) | spacer | wide-short (cols 7-12)
 *  row 2: wide-short (cols 1-7) | tall (cols 9-12)
 *  row 3: square (cols 2-6) | square (cols 8-11, offset down)
 */
function AsymmetricGrid({
  products,
}: {
  products: Array<{ node: any }>;
}) {
  if (products.length === 0) {
    return (
      <p className="text-sm" style={{ color: palette.muted, fontFamily: "'Inter', sans-serif" }}>
        The next edit is being curated.
      </p>
    );
  }

  // Tile layout: [colStart, colSpan, aspectClass, mtClass]
  const layout: Array<{ col: string; aspect: string; mt?: string }> = [
    { col: "md:col-start-1 md:col-span-5", aspect: "aspect-[3/4]" },
    { col: "md:col-start-7 md:col-span-6", aspect: "aspect-[16/10]", mt: "md:mt-24" },
    { col: "md:col-start-1 md:col-span-7", aspect: "aspect-[16/9]", mt: "md:mt-12" },
    { col: "md:col-start-9 md:col-span-4", aspect: "aspect-[3/4]", mt: "md:-mt-32" },
    { col: "md:col-start-2 md:col-span-5", aspect: "aspect-square", mt: "md:mt-16" },
    { col: "md:col-start-8 md:col-span-4", aspect: "aspect-[4/5]", mt: "md:mt-32" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-y-10 md:gap-y-0 md:gap-x-8">
      {products.map((p, idx) => {
        const slot = layout[idx % layout.length];
        const img = p.node.images?.edges?.[0]?.node;
        const price = p.node.priceRange?.minVariantPrice;
        return (
          <Link
            key={p.node.id}
            to="/product/$handle"
            params={{ handle: p.node.handle }}
            className={`studio-tile group block ${slot.col} ${slot.mt ?? ""}`}
            style={{ animationDelay: `${idx * 120}ms` }}
          >
            <div
              className={`relative overflow-hidden ${slot.aspect}`}
              style={{ background: palette.sandSoft }}
            >
              {img && (
                <img
                  src={img.url}
                  alt={img.altText ?? p.node.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={idx < 2 ? "eager" : "lazy"}
                />
              )}
            </div>
            <div
              className="mt-5 flex items-baseline justify-between gap-4"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <div className="min-w-0">
                <p
                  className="text-[10px] uppercase tracking-[0.3em] mb-1.5"
                  style={{ color: palette.sand }}
                >
                  {p.node.vendor}
                </p>
                <p
                  className="text-sm md:text-base font-light truncate group-hover:opacity-70 transition-opacity"
                  style={{ color: palette.offwhite }}
                >
                  {p.node.title}
                </p>
              </div>
              {price && (
                <span className="text-[11px] tracking-[0.15em]" style={{ color: palette.muted }}>
                  {formatPrice(price)}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ───── Concierge drawer (left-hand) ───── */
function ConciergeDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery<ConciergeResult>({
    queryKey: ["studio-concierge"],
    enabled: open,
    staleTime: 60_000,
    queryFn: () =>
      fetchConciergePicks({
        data: {
          pageType: "home",
          wishlistHandles: [],
          recentHandles: [],
          interactionHandles: [],
          shopperLocalTime: new Date().toISOString(),
        },
      }),
  });

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-label="Personal styling concierge">
      <div
        className="absolute inset-0 animate-[studioFade_.4s_ease-out_both]"
        style={{ background: "rgba(11,11,12,0.65)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="absolute left-0 top-0 bottom-0 w-full sm:w-[460px] flex flex-col"
        style={{
          background: palette.offwhite,
          color: palette.obsidian,
          animation: "studioDrawerIn .55s cubic-bezier(.2,.7,.2,1) both",
        }}
      >
        <header
          className="flex items-center justify-between px-7 py-6 border-b"
          style={{ borderColor: "rgba(11,11,12,0.08)" }}
        >
          <div style={{ fontFamily: "'Inter', sans-serif" }}>
            <p className="text-[9px] uppercase tracking-[0.4em]" style={{ color: "rgba(11,11,12,0.55)" }}>
              Personal
            </p>
            <h2
              className="text-2xl mt-1"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
            >
              Styling concierge
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close concierge"
            className="p-1 hover:opacity-60 transition-opacity"
          >
            <X className="w-5 h-5" strokeWidth={1.25} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-7">
          {isLoading ? (
            <div
              className="flex items-center gap-3 text-sm"
              style={{ color: "rgba(11,11,12,0.6)", fontFamily: "'Inter', sans-serif" }}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading the room…
            </div>
          ) : isError || !data || !data.ok ? (
            <p
              className="text-sm"
              style={{ color: "rgba(11,11,12,0.65)", fontFamily: "'Inter', sans-serif" }}
            >
              The concierge is briefly unavailable. Try again in a moment.
            </p>
          ) : (
            <>
              <p
                className="italic text-xl leading-snug mb-8"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                "{data.greeting}"
              </p>
              {data.products.length === 0 ? (
                <p className="text-sm" style={{ color: "rgba(11,11,12,0.65)", fontFamily: "'Inter', sans-serif" }}>
                  Browse a few pieces and the concierge will refine its picks.
                </p>
              ) : (
                <ul className="space-y-6">
                  {data.products.map((p, idx) => {
                    const img = p.node.images.edges[0]?.node;
                    const reason = data.picks[idx]?.reason;
                    return (
                      <li key={p.node.id}>
                        <Link
                          to="/product/$handle"
                          params={{ handle: p.node.handle }}
                          onClick={onClose}
                          className="group grid grid-cols-[88px_1fr] gap-4"
                        >
                          <div className="aspect-[4/5] overflow-hidden" style={{ background: palette.sandSoft }}>
                            {img && (
                              <img
                                src={img.url}
                                alt={img.altText ?? p.node.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                              />
                            )}
                          </div>
                          <div style={{ fontFamily: "'Inter', sans-serif" }}>
                            <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: "rgba(11,11,12,0.55)" }}>
                              {p.node.vendor}
                            </p>
                            <p
                              className="text-sm leading-snug mt-1.5 line-clamp-2 transition-opacity group-hover:opacity-70"
                              style={{ fontWeight: 300 }}
                            >
                              {p.node.title}
                            </p>
                            <p className="text-[11px] mt-1.5" style={{ color: "rgba(11,11,12,0.6)" }}>
                              {formatPrice(p.node.priceRange.minVariantPrice)}
                            </p>
                            {reason && (
                              <p
                                className="mt-2 text-[10px] uppercase tracking-[0.2em] italic"
                                style={{ color: "#7a5a2a" }}
                              >
                                {reason}
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>

        <footer
          className="px-7 py-5 border-t text-[10px] uppercase tracking-[0.3em]"
          style={{
            borderColor: "rgba(11,11,12,0.08)",
            color: "rgba(11,11,12,0.55)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Curated live · Palace of Roman
        </footer>
      </aside>
    </div>
  );
}
