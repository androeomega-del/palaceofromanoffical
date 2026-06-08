/**
 * Vault Locker Overlay — full-screen pre-cart email gate.
 *
 * Design constraints (per spec):
 *  - Monochromatic: Onyx (#0a0a0a), Alabaster (#f4f1ec), Stone (#8a8580).
 *  - No discount badges, no newsletter copy, no exclamation marks.
 *  - Title: "INITIALIZING SECURE ALLOCATION".
 *  - Header: "SECURE YOUR LUXURY ALLOCATION".
 *  - Live ticker while typing.
 *  - "Vault Secured" confirmation animation before resolving the promise.
 *
 * Compliance:
 *  - Reads & writes ONLY through rememberCustomerEmail() + scheduleAbandonedCartSync().
 *  - Never touches cart-store, formatCheckoutUrl, or checkout URL generation.
 *  - Fixed-position overlay; SSR-safe (renders nothing until store.open is true).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Check, X } from "lucide-react";
import { useVaultGateStore } from "@/stores/vault-gate-store";
import {
  rememberCustomerEmail,
  scheduleAbandonedCartSync,
} from "@/lib/abandoned-cart-capture";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const TICKER_PHRASES = [
  "Allocating vault space",
  "Securing item verification pipeline",
  "Cross-referencing authorised boutique network",
  "Reserving private client locker",
];

export function VaultLockerOverlay() {
  const open = useVaultGateStore((s) => s.open);
  const label = useVaultGateStore((s) => s.label);
  const confirmUnlock = useVaultGateStore((s) => s.confirmUnlock);
  const cancel = useVaultGateStore((s) => s.cancel);

  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"idle" | "securing" | "secured">("idle");
  const [tickerIdx, setTickerIdx] = useState(0);
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);


  // Reset on open / close
  useEffect(() => {
    if (open) {
      setEmail("");
      setPhase("idle");
      setTickerIdx(0);
      setShowError(false);
      // Defer focus until after the entrance animation
      const id = window.setTimeout(() => inputRef.current?.focus(), 280);
      return () => window.clearTimeout(id);
    }
  }, [open]);


  // Rotate ticker copy while the visitor is typing
  useEffect(() => {
    if (!open || phase !== "idle" || email.length === 0) return;
    const id = window.setInterval(() => {
      setTickerIdx((i) => (i + 1) % TICKER_PHRASES.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, [open, phase, email.length]);

  // Lock background scroll while the overlay is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to dismiss
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "secured") cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, phase, cancel]);

  const isValid = useMemo(() => EMAIL_RE.test(email.trim()), [email]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== "idle") return;
    if (!isValid) {
      setShowError(true);
      // Re-trigger the soft charcoal pulse on every failed attempt
      if (inputRef.current) {
        inputRef.current.style.animation = "none";
        // Force reflow so the animation restarts cleanly
        void inputRef.current.offsetWidth;
        inputRef.current.style.animation = "vaultBorderPulse 1.4s ease-in-out 2";
      }
      return;
    }
    setShowError(false);
    const value = email.trim();
    setPhase("securing");
    // Persist via the existing telemetry helpers (no cart-store changes).
    try {
      rememberCustomerEmail(value);
      scheduleAbandonedCartSync();
    } catch {
      // Best-effort — never block checkout
    }
    // Brief secure-sequence animation, then resolve the gate promise
    window.setTimeout(() => setPhase("secured"), 700);
    window.setTimeout(() => confirmUnlock(), 1500);
  };


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-locker-title"
      className="fixed inset-0 z-[120] flex items-center justify-center px-5 py-8 sm:px-8"
      style={{
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "vaultOverlayFade 320ms cubic-bezier(.2,.7,.2,1) both",
      }}
    >
      {/* Dismiss control — top-right, monochrome */}
      <button
        type="button"
        onClick={() => phase !== "secured" && cancel()}
        aria-label="Dismiss secure allocation overlay"
        className="absolute top-5 right-5 sm:top-7 sm:right-7 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] transition-opacity hover:opacity-100"
        style={{ color: "rgba(244,241,236,0.55)", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        <X className="w-3 h-3" strokeWidth={1.25} />
        Close
      </button>

      <div
        className="relative w-full max-w-[560px] border"
        style={{
          background: "#0f0f0f",
          borderColor: "rgba(244,241,236,0.12)",
          padding: "clamp(28px, 5vw, 56px)",
          animation: "vaultPanelIn 480ms cubic-bezier(.2,.7,.2,1) both",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: "#f4f1ec",
        }}
      >
        {/* Eyebrow */}
        <div
          className="flex items-center gap-2 mb-7"
          style={{ color: "#8a8580" }}
        >
          <Lock className="w-3 h-3" strokeWidth={1.5} aria-hidden />
          <span className="text-[10px] uppercase tracking-[0.4em]">
            Initializing Secure Allocation
          </span>
        </div>

        {/* Title */}
        <h2
          id="vault-locker-title"
          className="text-[28px] sm:text-[34px] leading-[1.05] tracking-[-0.01em] font-light"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
        >
          Secure your
          <br />
          luxury allocation.
        </h2>

        {/* Subtext */}
        <p
          className="mt-5 text-[13px] sm:text-[13.5px] leading-relaxed max-w-[440px]"
          style={{ color: "rgba(244,241,236,0.7)" }}
        >
          To protect our verified, investment-grade designer edits and preserve
          your custom curation, an email reservation is required. This secures
          these restricted pieces to your temporary private client locker
          before checkout.
        </p>

        {label && (
          <p
            className="mt-4 text-[10px] uppercase tracking-[0.32em]"
            style={{ color: "#8a8580" }}
          >
            Reserving — {label}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-9" noValidate>
          <label htmlFor="vault-locker-email" className="sr-only">
            Private email
          </label>
          <input
            id="vault-locker-email"
            ref={inputRef}
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="ENTER PRIVATE EMAIL"
            value={email}
            disabled={phase !== "idle"}
            onChange={(e) => {
              setEmail(e.target.value);
              if (showError) setShowError(false);
            }}
            aria-invalid={!isValid && email.length > 0}
            aria-describedby={showError ? "vault-locker-email-error" : undefined}
            className="w-full bg-transparent border-0 border-b py-3 text-[15px] tracking-[0.18em] uppercase placeholder:tracking-[0.32em] placeholder:text-[11px] focus:outline-none transition-colors disabled:opacity-60"
            style={{
              borderColor: showError ? "rgba(244,241,236,0.55)" : "rgba(244,241,236,0.25)",
              color: "#f4f1ec",
              caretColor: "#f4f1ec",
            }}
            onFocus={(e) => {
              if (!showError) e.currentTarget.style.borderColor = "#f4f1ec";
            }}
            onBlur={(e) => {
              if (!showError) e.currentTarget.style.borderColor = "rgba(244,241,236,0.25)";
            }}
          />

          {/* Sophisticated validation message — stone-gray micro-text */}
          <div
            aria-live="polite"
            id="vault-locker-email-error"
            className="mt-2 h-3.5 overflow-hidden"
          >
            {showError && (
              <p
                className="text-[10px] tracking-[0.14em] leading-tight"
                style={{
                  color: "#8a8580",
                  fontStyle: "italic",
                  animation: "vaultErrorIn 360ms cubic-bezier(.2,.7,.2,1) both",
                }}
              >
                Verification error: Please check the formatting of your private email.
              </p>
            )}
          </div>


          {/* Live status ticker (reserved height so layout doesn't jump) */}
          <div
            aria-live="polite"
            className="mt-3 h-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] overflow-hidden"
            style={{ color: "#8a8580" }}
          >
            {email.length > 0 && phase === "idle" && (
              <>
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#f4f1ec",
                    animation: "vaultPulse 1s ease-in-out infinite",
                  }}
                  aria-hidden
                />
                <span
                  key={tickerIdx}
                  style={{ animation: "vaultTickerIn 320ms ease-out both" }}
                >
                  {TICKER_PHRASES[tickerIdx]}…
                </span>
              </>
            )}
            {phase === "securing" && (
              <span style={{ animation: "vaultTickerIn 240ms ease-out both" }}>
                Engaging locker mechanism…
              </span>
            )}
            {phase === "secured" && (
              <span
                className="inline-flex items-center gap-2"
                style={{ color: "#f4f1ec", animation: "vaultTickerIn 240ms ease-out both" }}
              >
                <Check className="w-3 h-3" strokeWidth={2} />
                Vault secured — opening checkout
              </span>
            )}
          </div>

          {/* Primary action */}
          <button
            type="submit"
            disabled={!isValid || phase !== "idle"}
            className="mt-7 w-full inline-flex items-center justify-center gap-3 py-4 text-[11px] uppercase tracking-[0.32em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: phase === "secured" ? "#f4f1ec" : "#f4f1ec",
              color: "#0a0a0a",
              letterSpacing: "0.32em",
            }}
          >
            {phase === "secured" ? (
              <>
                <Check className="w-3.5 h-3.5" strokeWidth={2} />
                Vault Secured
              </>
            ) : phase === "securing" ? (
              <>
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{
                    background: "#0a0a0a",
                    animation: "vaultPulse 0.8s ease-in-out infinite",
                  }}
                  aria-hidden
                />
                Securing
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
                Secure Locker & Access Checkout
              </>
            )}
          </button>
        </form>

        {/* Footer reassurance — restrained, no marketing */}
        <p
          className="mt-7 text-[10px] uppercase tracking-[0.28em] leading-relaxed"
          style={{ color: "rgba(244,241,236,0.45)" }}
        >
          Held with discretion. No third-party tracking. Used only to safeguard
          your reservation and curate your private locker.
        </p>
      </div>

      <style>{`
        @keyframes vaultOverlayFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes vaultPanelIn {
          from { opacity: 0; transform: translateY(16px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes vaultTickerIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vaultErrorIn {
          from { opacity: 0; transform: translateY(-2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vaultBorderPulse {
          0%, 100% { border-bottom-color: rgba(244,241,236,0.25); }
          50%      { border-bottom-color: rgba(138,133,128,0.85); }
        }
        @keyframes vaultPulse {
          0%, 100% { opacity: 0.35; transform: scale(0.9); }

          50%      { opacity: 1;    transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
