import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/lib/newsletter.functions";

/**
 * Exclusive Access — premium-styled newsletter signup with double opt-in.
 * Inserts the email as `pending` and sends a confirmation email; the
 * subscriber is only added to the active list once they click the link.
 */
export function NewsletterForm() {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

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
          source:
            typeof window !== "undefined"
              ? `exclusive-access:${window.location.pathname}`
              : "exclusive-access",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          marketingConsent: true,
        },
      });
      if (!result.ok) {
        setStatus("error");
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
    } catch (err) {
      console.debug("[newsletter] subscribe failed.", err);
      setStatus("error");
      setError("Something went wrong. Please try again.");
      return;
    }

    setStatus("ok");
    setEmail("");
  };

  if (status === "ok") {
    return (
      <div className="border border-bronze/40 bg-bronze/5 p-5" role="status" aria-live="polite">
        <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-2 inline-flex items-center gap-2">
          <Sparkles className="w-3 h-3" /> Check your inbox
        </p>
        <p className="text-sm text-ink leading-relaxed">
          We've sent a confirmation email. Please click the link inside to
          activate your subscription — exclusive promotions and member-only
          offers will follow once your email is verified.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-3 inline-flex items-center gap-2">
        <Sparkles className="w-3 h-3" /> Exclusive Access
      </p>
      <p className="text-sm text-ink/80 leading-relaxed mb-5 max-w-sm">
        Join for early access to seasonal promotions, private discounts and member-only offers
        before they reach the boutique.
      </p>
      <form className="relative" onSubmit={onSubmit} noValidate>
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          disabled={status === "sending"}
          className="bg-transparent border-b border-ink/30 py-3 pr-28 w-full text-sm focus:outline-none focus:border-bronze transition-colors disabled:opacity-50 placeholder:text-ink/40"
          aria-invalid={status === "error"}
          aria-describedby={error ? "newsletter-error" : undefined}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.28em] bg-ink text-canvas px-4 py-2.5 hover:bg-bronze transition-colors disabled:opacity-50"
        >
          {status === "sending" ? "Subscribing…" : "Subscribe"}
        </button>
        {error && (
          <p
            id="newsletter-error"
            role="alert"
            className="mt-2 text-[10px] uppercase tracking-widest text-destructive"
          >
            {error}
          </p>
        )}
        <p className="mt-4 text-[10px] text-ink/50 leading-relaxed">
          By subscribing, you consent to receiving marketing communications, including promotions and
          discount alerts. We'll send a one-time confirmation email to verify your address.{" "}
          <a href="/privacy" className="underline decoration-bronze/40 hover:text-bronze transition-colors">
            Privacy Notice
          </a>.
        </p>
      </form>
    </div>
  );
}
