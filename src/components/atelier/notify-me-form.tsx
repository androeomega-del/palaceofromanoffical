import { useState } from "react";
import { Bell, Check } from "lucide-react";

interface NotifyMeFormProps {
  variantGid: string;
  productHandle: string;
  productTitle: string;
  variantTitle?: string | null;
  imageUrl?: string | null;
  priceUsd?: string | null;
}

/**
 * Back-in-stock email capture, shown on sold-out variants.
 * Posts to the existing public stock-alerts subscribe endpoint.
 * Inline, on-brand — replaces the dead "Sold Out" state with a recoverable
 * email handoff at the highest-intent moment.
 */
export function NotifyMeForm({
  variantGid,
  productHandle,
  productTitle,
  variantTitle,
  imageUrl,
  priceUsd,
}: NotifyMeFormProps) {
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
      const res = await fetch("/api/public/stock-alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          variantGid,
          productHandle,
          productTitle,
          variantTitle: variantTitle ?? undefined,
          imageUrl: imageUrl ?? undefined,
          priceUsd: priceUsd ?? undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("ok");
      setEmail("");
    } catch (err) {
      console.debug("[notify-me] failed:", err);
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

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
            You're on the list
          </p>
          <p className="text-sm text-ink leading-relaxed">
            We'll write the moment this piece returns to the boutique.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-ink/15 bg-ink/[0.02] px-5 py-5">
      <p className="text-[10px] uppercase tracking-[0.3em] text-ink/60 mb-2 inline-flex items-center gap-2">
        <Bell className="w-3 h-3" strokeWidth={1.5} /> Reserve Notification
      </p>
      <p className="text-sm text-ink/80 leading-relaxed mb-4">
        This piece is currently out of stock. Leave your email and we'll write
        the moment it returns.
      </p>
      <form className="relative" onSubmit={onSubmit} noValidate>
        <label htmlFor={`notify-${variantGid}`} className="sr-only">
          Email address
        </label>
        <input
          id={`notify-${variantGid}`}
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
          className="bg-transparent border-b border-ink/30 py-2.5 pr-32 w-full text-sm focus:outline-none focus:border-bronze transition-colors disabled:opacity-50 placeholder:text-ink/40"
          aria-invalid={status === "error"}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.25em] bg-ink text-canvas px-4 py-2 hover:bg-bronze transition-colors disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Notify Me"}
        </button>
        {error && (
          <p role="alert" className="mt-2 text-[10px] uppercase tracking-widest text-destructive">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
