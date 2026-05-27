import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState } from "@tanstack/react-router";
import { rememberCustomerEmail, scheduleAbandonedCartSync } from "@/lib/abandoned-cart-capture";
import { subscribeNewsletter } from "@/lib/newsletter.functions";

/**
 * First-visit welcome capture. Data-driven response to an early 91%+ bounce
 * rate: the vast majority of landed visitors leave without engaging, so we
 * capture them as owned-audience subscribers before they exit.
 *
 * Voice stays editorial-luxury — no discount popup, no urgency theatrics.
 * Offers private access to new arrivals and editorials, in line with the
 * Palace of Roman brand. Appears once per device (localStorage flag), after
 * a short delay so it doesn't interrupt the initial impression.
 */
const STORAGE_KEY = "por_welcome_dispatch_v1";
// Luxury-tier trigger calibration: NAP / MR PORTER / MyTheresa only surface
// newsletter capture after sustained engagement (45s+) or near the page foot.
// Mid-scroll interruptions read as discount-site behaviour. We gate on BOTH
// 45s dwell AND 75% scroll, with the localStorage flag enforcing once-ever
// (so practically also once-per-session).
const MIN_DWELL_MS = 45000;
const MIN_SCROLL_RATIO = 0.75;

export function WelcomeDispatchModal() {
  const subscribe = useServerFn(subscribeNewsletter);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const suppressed =
    pathname === "/login" ||
    pathname.startsWith("/admin") ||
    pathname === "/order-confirmed" ||
    pathname === "/authentication";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (suppressed) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }

    let dwellMet = false;
    let scrollMet = false;
    let dismissed = false;

    const maybeOpen = () => {
      if (dismissed) return;
      if (dwellMet && scrollMet) {
        dismissed = true;
        setOpen(true);
        cleanup();
      }
    };

    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = Math.max(document.documentElement.scrollHeight, 1);
      if (scrolled / total >= MIN_SCROLL_RATIO) {
        scrollMet = true;
        maybeOpen();
      }
    };

    const dwellTimer = window.setTimeout(() => {
      dwellMet = true;
      maybeOpen();
    }, MIN_DWELL_MS);

    window.addEventListener("scroll", onScroll, { passive: true });
    // Re-evaluate in case the page is already past 40% on mount (e.g. anchor link)
    onScroll();

    function cleanup() {
      window.clearTimeout(dwellTimer);
      window.removeEventListener("scroll", onScroll);
    }

    return cleanup;
  }, [suppressed]);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
  };

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
          source: "welcome_modal",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          marketingConsent: true,
        },
      });
      if (!result.ok) {
        setStatus("error");
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
      return;
    }
    rememberCustomerEmail(value);
    scheduleAbandonedCartSync();
    setStatus("ok");
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
  };

  if (!open || suppressed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-dispatch-title"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-300"
      />
      <div className="relative w-full max-w-md bg-canvas border border-ink/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center text-ink/60 hover:text-ink transition-colors text-lg"
        >
          ×
        </button>
        <div className="px-8 py-10 sm:px-10 sm:py-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-5">
            The Palace Dispatch
          </p>
          <h2
            id="welcome-dispatch-title"
            className="font-serif text-3xl sm:text-4xl leading-[1.1] mb-4"
          >
            Step inside the Palace.
          </h2>
          <p className="text-sm text-ink/70 leading-relaxed mb-7 max-w-sm mx-auto">
            Private access to new arrivals, seasonal editorials and quiet
            edits — delivered before they reach the boutique.
          </p>

          {status === "ok" ? (
            <p
              role="status"
              aria-live="polite"
              className="text-sm text-ink leading-relaxed py-4"
            >
              Thank you — you are on the list.
              <br />
              <button
                type="button"
                onClick={dismiss}
                className="mt-6 inline-block text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors"
              >
                Continue browsing
              </button>
            </p>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div className="relative">
                <label htmlFor="welcome-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="welcome-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  disabled={status === "sending"}
                  className="w-full bg-transparent border-b border-ink/20 py-3 text-sm text-center focus:outline-none focus:border-ink transition-colors disabled:opacity-50"
                  aria-invalid={status === "error"}
                  aria-describedby={error ? "welcome-error" : undefined}
                />
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full bg-ink text-canvas py-3 text-[11px] uppercase tracking-[0.3em] hover:bg-bronze transition-colors disabled:opacity-50"
              >
                {status === "sending" ? "Joining…" : "Receive the Dispatch"}
              </button>
              {error && (
                <p
                  id="welcome-error"
                  role="alert"
                  className="text-[10px] uppercase tracking-widest text-destructive"
                >
                  {error}
                </p>
              )}
              <p className="text-[10px] text-ink/50 leading-relaxed pt-2">
                By joining, you consent to receiving marketing emails — including cart recovery reminders if you leave items behind. You may{" "}
                <a href="/privacy" className="underline decoration-bronze/40 hover:text-bronze transition-colors">
                  unsubscribe
                </a>{" "}
                at any time.
              </p>
              <button
                type="button"
                onClick={dismiss}
                className="block mx-auto text-[10px] uppercase tracking-[0.25em] text-ink/50 hover:text-ink transition-colors pt-2"
              >
                No thank you
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
