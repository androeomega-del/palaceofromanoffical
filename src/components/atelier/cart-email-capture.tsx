import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { rememberCustomerEmail, scheduleAbandonedCartSync, getCustomerEmail } from "@/lib/abandoned-cart-capture";

/**
 * Email capture rendered inside the cart drawer above the checkout button.
 *
 * Critical: this component does NOT touch the cart store, cart mutations,
 * or the checkout URL. It only writes the visitor's email to localStorage
 * (so the existing `scheduleAbandonedCartSync` helper can attach it to the
 * abandoned-cart row) and triggers a sync — unlocking recovery emails for
 * carts that are abandoned before checkout.
 */
export function CartEmailCapture() {
  const existing = typeof window !== "undefined" ? getCustomerEmail() : null;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">(
    existing ? "ok" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  if (status === "ok") {
    return (
      <div className="border border-bronze/30 bg-bronze/[0.04] px-3 py-2.5 flex items-center gap-2">
        <Check className="w-3.5 h-3.5 text-bronze shrink-0" strokeWidth={1.5} />
        <p className="text-[11px] text-ink/70 leading-snug">
          We'll hold your selection — and write if you don't make it to checkout.
        </p>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setStatus("error");
      setError("Please enter a valid email address.");
      return;
    }
    setStatus("saving");
    try {
      rememberCustomerEmail(value);
      scheduleAbandonedCartSync();
      setStatus("ok");
      setEmail("");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="border border-ink/10 bg-ink/[0.02] px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.25em] text-ink/60 mb-2 inline-flex items-center gap-1.5">
        <Mail className="w-3 h-3" strokeWidth={1.5} /> Hold This Selection
      </p>
      <form className="relative" onSubmit={onSubmit} noValidate>
        <label htmlFor="cart-email-capture" className="sr-only">
          Email address
        </label>
        <input
          id="cart-email-capture"
          type="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          disabled={status === "saving"}
          className="bg-transparent border-b border-ink/25 py-2 pr-20 w-full text-xs focus:outline-none focus:border-bronze transition-colors disabled:opacity-50 placeholder:text-ink/40"
          aria-invalid={status === "error"}
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-[0.22em] bg-ink text-canvas px-2.5 py-1.5 hover:bg-bronze transition-colors disabled:opacity-50"
        >
          {status === "saving" ? "…" : "Save"}
        </button>
        {error && (
          <p role="alert" className="mt-1.5 text-[9px] uppercase tracking-widest text-destructive">
            {error}
          </p>
        )}
        <p className="mt-2 text-[9px] text-ink/45 leading-relaxed">
          We'll write a single reminder if you don't finish checkout. Unsubscribe anytime.
        </p>
      </form>
    </div>
  );
}
