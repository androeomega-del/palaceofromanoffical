import { useEffect, useRef } from "react";
import { enqueueInteractionEvent } from "@/lib/interaction-flush";
import type { ShopifyProduct } from "@/lib/shopify";

/**
 * Rail-level impression tracker.
 *
 * Fires a single `rail_impression` event when the rail container becomes
 * ≥50% visible for 600ms. The event is keyed on the first product handle in
 * the rail (the table requires a non-null `handle`) and carries the
 * `surface` (e.g. `rail:best-sellers`) so analytics can answer "how often
 * did this rail get seen at all" independent of per-card impressions.
 *
 * Returns a ref to attach to the rail's outer element.
 */
export function useRailImpression(
  surface: string | undefined,
  products: ShopifyProduct[] | undefined,
) {
  const ref = useRef<HTMLElement | null>(null);
  const firedRef = useRef(false);
  const firstHandle = products?.[0]?.node.handle;

  useEffect(() => {
    if (!surface || !firstHandle) return;
    if (typeof IntersectionObserver === "undefined") return;
    const el = ref.current;
    if (!el) return;
    if (firedRef.current) return;

    let dwellTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (firedRef.current || dwellTimer) continue;
            dwellTimer = setTimeout(() => {
              if (firedRef.current) return;
              firedRef.current = true;
              enqueueInteractionEvent({
                handle: firstHandle,
                event_type: "rail_impression",
                surface,
              });
              observer.disconnect();
            }, 600);
          } else if (dwellTimer) {
            clearTimeout(dwellTimer);
            dwellTimer = null;
          }
        }
      },
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(el);
    return () => {
      if (dwellTimer) clearTimeout(dwellTimer);
      observer.disconnect();
    };
  }, [surface, firstHandle]);

  return ref;
}
