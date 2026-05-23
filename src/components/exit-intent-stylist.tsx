import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AiSearchBar } from "@/components/ai-search-bar";
import { Sparkles } from "lucide-react";

const SESSION_KEY = "por_exit_intent_shown_v1";

// Routes where the overlay is allowed to trigger. Collection pages are the
// primary target per the brief; home is included as a soft secondary surface.
function isEligiblePath(pathname: string): boolean {
  return pathname.startsWith("/collections/") || pathname === "/";
}

export function ExitIntentStylist() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isEligiblePath(pathname)) return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;

    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let armed = false;

    // Arm only after the user has been on the page for a moment — avoids
    // firing during the initial scroll-to-top after navigation.
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 4000);

    const trigger = () => {
      if (!armed) return;
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    };

    // Desktop: cursor moves toward the top of the viewport to close the tab.
    const onMouseOut = (e: MouseEvent) => {
      if (isTouch) return;
      // relatedTarget is null when leaving the document; clientY <= 0 means
      // the cursor crossed the top edge.
      if (e.relatedTarget) return;
      if (e.clientY > 0) return;
      trigger();
    };

    // Mobile: rapid upward scroll near the top of the page.
    const onScroll = () => {
      if (!isTouch) return;
      const y = window.scrollY;
      const t = performance.now();
      const dy = y - lastY;
      const dt = Math.max(t - lastT, 1);
      const velocity = dy / dt; // px/ms; negative = scrolling up
      lastY = y;
      lastT = t;
      if (y < 120 && velocity < -1.2) {
        trigger();
      }
    };

    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg bg-canvas border border-ink/10 p-0 overflow-hidden">
        <div className="px-8 pt-10 pb-8">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-bronze" strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.35em] text-bronze">
              The AI Stylist
            </span>
          </div>
          <DialogTitle className="font-serif text-3xl md:text-4xl leading-tight text-ink mb-4 text-balance">
            Can't find the exact vibe you're hunting for?
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/70 leading-relaxed mb-7">
            Describe the mood, the silhouette, the occasion — even a colour
            you saw in a film. The stylist will route you to a private edit
            built around it.
          </DialogDescription>

          <AiSearchBar onComplete={() => setOpen(false)} />

          <p className="mt-5 text-[10px] uppercase tracking-[0.25em] text-ink/40">
            Try: "soft tailoring for a Capri dinner" or "quiet luxury knitwear"
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
