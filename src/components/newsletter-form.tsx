import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Footer newsletter signup. Stores the email in the Lovable Cloud
 * `newsletter_subscribers` table; duplicates are silently treated as success.
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
        source: typeof window !== "undefined" ? window.location.pathname : null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        marketing_consent: true,
      } as any);

    // Postgres unique-violation = already subscribed; treat as success for UX.
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
      <p className="text-sm text-ink leading-relaxed" role="status" aria-live="polite">
        Thank you — you are on the list. Look out for our first dispatch.
      </p>
    );
  }

  return (
    <form className="relative" onSubmit={onSubmit} noValidate>
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
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
        className="bg-transparent border-b border-ink/20 py-2 pr-14 w-full text-sm focus:outline-none focus:border-ink transition-colors disabled:opacity-50"
        aria-invalid={status === "error"}
        aria-describedby={error ? "newsletter-error" : undefined}
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest hover:text-bronze transition-colors disabled:opacity-50"
      >
        {status === "sending" ? "…" : "Join"}
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
      <p className="mt-3 text-[10px] text-ink/50 leading-relaxed">
        By joining, you consent to receiving marketing emails — including cart recovery reminders.{" "}
        <a href="/privacy" className="underline decoration-bronze/40 hover:text-bronze transition-colors">
          Privacy Notice
        </a>.
      </p>
    </form>
  );
}
