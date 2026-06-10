/**
 * Home Newsletter Strip — restrained full-width band on the darkest ground.
 * Wires to subscribeNewsletter (double opt-in). Never claims confirmed
 * status — success message instructs the user to check their inbox.
 */
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/lib/newsletter.functions";
import { enqueueInteractionEvent } from "@/lib/interaction-flush";

type State = "idle" | "sending" | "pending" | "already" | "error";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function HomeNewsletterStrip() {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlight.current) return;

    const value = email.trim();
    if (!value || !EMAIL_RE.test(value)) {
      setState("error");
      setError("Please enter a valid email address.");
      return;
    }

    enqueueInteractionEvent({
      handle: "newsletter:submit",
      event_type: "click",
      surface: "home_newsletter",
    });

    inFlight.current = true;
    setState("sending");
    setError(null);

    try {
      const result = await subscribe({
        data: {
          email: value,
          source: "homepage_footer",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          marketingConsent: true,
        },
      });
      if (!result.ok) {
        setState("error");
        setError("Something went wrong — try again.");
        return;
      }
      // Already confirmed → neutral "you're already with us".
      // Otherwise (new or pending re-send) → "check your inbox".
      if (result.already && !result.pending) {
        setState("already");
      } else {
        setState("pending");
        enqueueInteractionEvent({
          handle: "newsletter:success",
          event_type: "click",
          surface: "home_newsletter",
        });
      }
      setEmail("");
    } catch (err) {
      console.debug("[home-newsletter] subscribe failed", err);
      setState("error");
      setError("Something went wrong — try again.");
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <section className="bg-black border-t border-canvas/10">
      <div className="max-w-3xl mx-auto px-6 md:px-14 py-section-sm md:py-28 text-center">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.45em] text-bronze mb-7">
          Newsletter
        </p>
        <h2 className="font-serif font-light text-[8vw] md:text-[3vw] leading-[1.1] tracking-[-0.01em] text-balance mb-5 text-canvas">
          Early access.
        </h2>
        <p className="text-sm md:text-base leading-[1.75] font-light text-canvas/75 mb-10 mx-auto max-w-xl">
          New arrivals and the occasional considered edit. Nothing else.
        </p>

        {state === "pending" || state === "already" ? (
          <p
            role="status"
            aria-live="polite"
            className="text-[11px] uppercase tracking-[0.32em] text-bronze"
          >
            {state === "pending"
              ? "Check your inbox to confirm."
              : "You're already with us."}
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            className="mx-auto max-w-md flex flex-col sm:flex-row sm:items-stretch gap-3 sm:gap-0"
          >
            <label htmlFor="home-newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="home-newsletter-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.currentTarget.value);
                if (state === "error") {
                  setState("idle");
                  setError(null);
                }
              }}
              disabled={state === "sending"}
              className="flex-1 bg-transparent border-b border-canvas/30 sm:border-b sm:border-r-0 py-3 px-1 text-sm text-canvas focus:outline-none focus:border-bronze transition-colors disabled:opacity-50 placeholder:text-canvas/40 text-center sm:text-left"
              aria-invalid={state === "error"}
              aria-describedby={error ? "home-newsletter-error" : undefined}
            />
            <button
              type="submit"
              disabled={state === "sending"}
              className="text-[11px] uppercase tracking-[0.32em] bg-canvas text-ink px-7 py-3 hover:bg-bronze hover:text-canvas transition-colors disabled:opacity-50"
            >
              {state === "sending" ? "Sending…" : "Subscribe"}
            </button>
            <p
              id="home-newsletter-error"
              role="alert"
              aria-live="polite"
              className={`sm:col-span-2 mt-3 text-[10px] uppercase tracking-[0.28em] text-destructive ${
                state === "error" ? "block" : "sr-only"
              }`}
            >
              {error ?? ""}
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
