import { useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * VIP Drop Registry — premium-styled newsletter signup.
 * Stores the email in the Lovable Cloud `newsletter_subscribers` table;
 * duplicates are silently treated as success.
 */
export function NewsletterForm() {
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

    const { error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({
        email: value,
        source: typeof window !== "undefined" ? `vip-drop-registry:${window.location.pathname}` : "vip-drop-registry",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        marketing_consent: true,
      });

    if (insertError && insertError.code !== "23505") {
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
          <Sparkles className="w-3 h-3" /> You're on the registry
        </p>
        <p className="text-sm text-ink leading-relaxed">
          Welcome. The next limited-edition drop arrives in your inbox first.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.32em] text-bronze mb-3 inline-flex items-center gap-2">
        <Sparkles className="w-3 h-3" /> VIP Drop Registry
      </p>
      <p className="text-sm text-ink/80 leading-relaxed mb-5 max-w-sm">
        Join the inner circle for first access to weekly limited-edition drops, private sales,
        and pieces released to registry members before they reach the boutique.
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
          {status === "sending" ? "Joining…" : "Request Access"}
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
          By joining, you consent to receiving marketing communications, including drop alerts and
          recovery reminders.{" "}
          <a href="/privacy" className="underline decoration-bronze/40 hover:text-bronze transition-colors">
            Privacy Notice
          </a>.
        </p>
      </form>
    </div>
  );
}
