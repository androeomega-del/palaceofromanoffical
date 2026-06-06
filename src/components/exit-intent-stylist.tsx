import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AiSearchBar } from "@/components/ai-search-bar";
import { Sparkles, Check } from "lucide-react";
import { subscribeNewsletter } from "@/lib/newsletter.functions";

const SESSION_KEY = "por_exit_intent_shown_v1";
const SUBSCRIBED_KEY = "por_atelier_subscribed_v1";

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
              Before You Go
            </span>
          </div>
          <DialogTitle className="font-serif text-3xl md:text-4xl leading-tight text-ink mb-4 text-balance">
            SUBSCRIBE
          </DialogTitle>
          <DialogDescription className="text-sm text-ink/70 leading-relaxed mb-6">
            Enter your email to receive updates on new arrivals, exclusive collection drops, and boutique releases.
          </DialogDescription>

          <AtelierListInline onSubscribed={() => undefined} />

          <div className="mt-7 pt-6 border-t border-ink/10">
            <p className="text-[10px] uppercase tracking-[0.3em] text-ink/50 mb-3">
              Or talk to the AI stylist
            </p>
            <AiSearchBar onComplete={() => setOpen(false)} />
            <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-ink/40">
              Try: "soft tailoring for a Capri dinner"
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AtelierListInline({ onSubscribed }: { onSubscribed: () => void }) {
  const alreadySubscribed =
    typeof window !== "undefined" && localStorage.getItem(SUBSCRIBED_KEY) === "1";
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">(
    alreadySubscribed ? "ok" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  if (status === "ok") {
    return (
      <div
        className="border border-bronze/40 bg-bronze/5 px-5 py-4 flex items-start gap-3"
        role="status"
        aria-live="polite"
      >
        <Check className="w-4 h-4 text-bronze mt-0.5 shrink-0" strokeWidth={1.5} />
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-1">
            Check your inbox
          </p>
          <p className="text-sm text-ink leading-relaxed">
            We've sent a confirmation link — click it to activate your
            subscription to the Atelier List.
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setStatus("error");
      setError("Please enter a valid email address.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const result = await subscribe({
        data: {
          email: value,
          source: "exit_intent",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          marketingConsent: true,
        },
      });
      if (!result.ok) {
        throw new Error(result.error ?? "subscribe failed");
      }
      try {
        localStorage.setItem(SUBSCRIBED_KEY, "1");
      } catch {
        /* ignore */
      }
      setStatus("ok");
      setEmail("");
      onSubscribed();
    } catch (err) {
      console.debug("[exit-intent] subscribe failed:", err);
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <form className="relative" onSubmit={onSubmit} noValidate>
      <label htmlFor="exit-intent-email" className="sr-only">
        Email address
      </label>
      <input
        id="exit-intent-email"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        disabled={status === "sending"}
        className="bg-transparent border-b border-ink/30 py-3 pr-32 w-full text-sm focus:outline-none focus:border-bronze transition-colors disabled:opacity-50 placeholder:text-ink/40"
        aria-invalid={status === "error"}
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.25em] bg-ink text-canvas px-4 py-2.5 hover:bg-bronze transition-colors disabled:opacity-50"
      >
        {status === "sending" ? "Signing up…" : "Sign Up"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-[10px] uppercase tracking-widest text-destructive">
          {error}
        </p>
      )}
      <p className="mt-3 text-[10px] text-ink/45 leading-relaxed">
        Receive updates on new arrivals, exclusive collection drops, and boutique releases. Unsubscribe anytime.
      </p>
    </form>
  );
}
