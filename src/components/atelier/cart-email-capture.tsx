import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Mail, Check } from "lucide-react";
import {
  rememberCustomerEmail,
  rememberMarketingOptIn,
  scheduleAbandonedCartSync,
  getCustomerEmail,
  getMarketingOptIn,
} from "@/lib/abandoned-cart-capture";

export type CartEmailCaptureHandle = {
  /** Returns true if a valid email is already saved. Otherwise focuses + pulses the input. */
  promptIfMissing: () => boolean;
};

/**
 * Email capture rendered inside the cart drawer footer above the checkout button.
 *
 * Email is REQUIRED before checkout — it saves the visitor's selections beyond
 * the session and lets us start curating taste-based recommendations. A separate
 * optional checkbox lets them opt in to additional emails about exclusives.
 *
 * This component does NOT touch the cart store, cart mutations, or the checkout
 * URL. It only writes the visitor's email + opt-in preference to localStorage
 * so `scheduleAbandonedCartSync` can attach it to the abandoned-cart row.
 */
export const CartEmailCapture = forwardRef<CartEmailCaptureHandle>((_, ref) => {
  const existing = typeof window !== "undefined" ? getCustomerEmail() : null;
  const existingOptIn = typeof window !== "undefined" ? getMarketingOptIn() : false;
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(existingOptIn);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">(
    existing ? "ok" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    promptIfMissing: () => {
      if (status === "ok") return true;
      requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: false });
        inputRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
      setPulse(true);
      setError("A valid email is required to save your selections and continue.");
      setStatus("error");
      window.setTimeout(() => setPulse(false), 1600);
      return false;
    },
  }), [status]);

  if (status === "ok") {
    return (
      <div className="border border-bronze/30 bg-bronze/[0.04] px-3 py-2 flex items-center gap-2">
        <Check className="w-3.5 h-3.5 text-bronze shrink-0" strokeWidth={1.5} />
        <p className="text-[10px] text-ink/75 leading-snug">
          Your selections are saved — we'll begin curating to your taste. Proceed to secure checkout below.
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
      rememberMarketingOptIn(optIn);
      scheduleAbandonedCartSync();
      setStatus("ok");
      setEmail("");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`border px-3 py-2.5 transition-all duration-300 ${
        pulse
          ? "border-bronze bg-bronze/[0.08] ring-2 ring-bronze/40 animate-pulse"
          : "border-ink/10 bg-ink/[0.02]"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.25em] text-ink/70 mb-1 inline-flex items-center gap-1.5">
        <Mail className="w-3 h-3" strokeWidth={1.5} /> Email Required To Continue
      </p>
      <p className="text-[10px] text-ink/55 leading-relaxed mb-2">
        We use your email to save your selections and start learning your taste, so we can curate, customize, and recommend pieces you'll actually love.
      </p>
      <form className="relative" onSubmit={onSubmit} noValidate>
        <label htmlFor="cart-email-capture" className="sr-only">
          Email address
        </label>
        <input
          id="cart-email-capture"
          ref={inputRef}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") {
              setStatus("idle");
              setError(null);
            }
          }}
          disabled={status === "saving"}
          className="bg-transparent border-b border-ink/25 py-1.5 pr-20 w-full text-xs focus:outline-none focus:border-bronze transition-colors disabled:opacity-50 placeholder:text-ink/40"
          aria-invalid={status === "error"}
          aria-required="true"
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-[0.22em] bg-ink text-canvas px-2.5 py-1.5 hover:bg-bronze transition-colors disabled:opacity-50"
        >
          {status === "saving" ? "…" : "Save"}
        </button>
        {error && (
          <p role="alert" className="mt-1 text-[9px] uppercase tracking-widest text-destructive">
            {error}
          </p>
        )}
        <label className="mt-2.5 flex items-start gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            className="mt-0.5 w-3 h-3 accent-bronze cursor-pointer shrink-0"
          />
          <span className="text-[10px] text-ink/65 leading-relaxed group-hover:text-ink/85 transition-colors">
            Opt in to additional emails about exclusive drops, private sales, and boutique-only releases. (Optional — uncheck if you prefer only updates about your saved selections.)
          </span>
        </label>
      </form>
    </div>
  );
});

CartEmailCapture.displayName = "CartEmailCapture";
