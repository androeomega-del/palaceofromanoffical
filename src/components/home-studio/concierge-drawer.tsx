/**
 * ConciergeDrawer — left-hand off-white drawer wired to the existing
 * `fetchConciergePicks` serverFn. No backend changes; identical behavior to
 * the original /studio prototype, extracted for reuse between `/` and
 * `/studio`.
 */
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { fetchConciergePicks, type ConciergeResult } from "@/lib/ai-concierge.functions";
import { formatPrice } from "@/lib/shopify";
import { palette, fontSans, fontSerif } from "./palette";

interface ConciergeDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ConciergeDrawer({ open, onClose }: ConciergeDrawerProps) {
  const { data, isLoading, isError } = useQuery<ConciergeResult>({
    queryKey: ["home-studio-concierge"],
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
          <div style={{ fontFamily: fontSans }}>
            <p className="text-[9px] uppercase tracking-[0.4em]" style={{ color: "rgba(11,11,12,0.55)" }}>
              Personal
            </p>
            <h2 className="text-2xl mt-1" style={{ fontFamily: fontSerif, fontWeight: 400 }}>
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
              style={{ color: "rgba(11,11,12,0.6)", fontFamily: fontSans }}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading the room…
            </div>
          ) : isError || !data || !data.ok ? (
            <p className="text-sm" style={{ color: "rgba(11,11,12,0.65)", fontFamily: fontSans }}>
              The concierge is briefly unavailable. Try again in a moment.
            </p>
          ) : (
            <>
              <p className="italic text-xl leading-snug mb-8" style={{ fontFamily: fontSerif }}>
                "{data.greeting}"
              </p>
              {data.products.length === 0 ? (
                <p className="text-sm" style={{ color: "rgba(11,11,12,0.65)", fontFamily: fontSans }}>
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
                          <div style={{ fontFamily: fontSans }}>
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
            fontFamily: fontSans,
          }}
        >
          Curated live · Palace of Roman
        </footer>
      </aside>
    </div>
  );
}
