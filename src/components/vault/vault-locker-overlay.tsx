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

// Three-stage status ticker shown while the submit button is in its loading state.
const SECURING_STATUSES = [
  "Verifying limited allocation availability",
  "Securing item to private customer locker",
  "Locking logistics pipeline",
];
const SECURING_STEP_MS = 700;
const SECURING_TOTAL_MS = SECURING_STEP_MS * SECURING_STATUSES.length; // 2100ms

export function VaultLockerOverlay() {
  const open = useVaultGateStore((s) => s.open);
  const label = useVaultGateStore((s) => s.label);
  const lowStock = useVaultGateStore((s) => s.lowStock);
  const confirmUnlock = useVaultGateStore((s) => s.confirmUnlock);
  const cancel = useVaultGateStore((s) => s.cancel);

  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"idle" | "securing" | "secured">("idle");
  const [tickerIdx, setTickerIdx] = useState(0);
  const [securingStep, setSecuringStep] = useState(0);
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);


  // Reset on open / close
  useEffect(() => {
    if (open) {
      setEmail("");
      setPhase("idle");
      setTickerIdx(0);
      setSecuringStep(0);
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

  // Cycle through the three luxury-security status lines while the submit
  // button is in its loading state.
  useEffect(() => {
    if (phase !== "securing") return;
    setSecuringStep(0);
    const id = window.setInterval(() => {
      setSecuringStep((i) =>
        i < SECURING_STATUSES.length - 1 ? i + 1 : i,
      );
    }, SECURING_STEP_MS);
    return () => window.clearInterval(id);
  }, [phase]);


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
    // Play the three-status sequence, then transition to "secured",
    // then resolve the gate promise.
    window.setTimeout(() => setPhase("secured"), SECURING_TOTAL_MS);
    window.setTimeout(() => confirmUnlock(), SECURING_TOTAL_MS + 800);
  };


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-locker-title"
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:px-8 sm:py-8"
      style={{
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "vaultOverlayFade 320ms cubic-bezier(.2,.7,.2,1) both",
      }}
    >
      {/* Dismiss control — top-right on desktop, in-sheet handle area on mobile */}
      <button
        type="button"
        onClick={() => phase !== "secured" && cancel()}
        aria-label="Dismiss secure allocation overlay"
        className="hidden sm:inline-flex absolute top-7 right-7 items-center gap-2 text-[10px] uppercase tracking-[0.32em] transition-opacity hover:opacity-100"
        style={{ color: "rgba(244,241,236,0.55)", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        <X className="w-3 h-3" strokeWidth={1.25} />
        Close
      </button>

      <div
        className="relative w-full max-w-[560px] border flex flex-col sm:block"
        style={{
          background: "#0f0f0f",
          borderColor: "rgba(244,241,236,0.12)",
          maxHeight: "92dvh",
          animation: "vaultSheetIn 420ms cubic-bezier(.2,.7,.2,1) both",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: "#f4f1ec",
        }}
      >
        {/* Mobile drag handle + close */}
        <div className="sm:hidden flex items-center justify-between pt-3 pb-1 px-5">
          <span className="w-10 h-1 rounded-full mx-auto" style={{ background: "rgba(244,241,236,0.2)" }} aria-hidden />
          <button
            type="button"
            onClick={() => phase !== "secured" && cancel()}
            aria-label="Close"
            className="absolute right-3 top-2 inline-flex items-center justify-center"
            style={{ minWidth: 48, minHeight: 48, color: "rgba(244,241,236,0.6)" }}
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable content (sheet body) */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            padding: "20px 22px 16px",
          }}
        >
          <div className="sm:p-[clamp(28px,5vw,56px)] sm:m-0">
        {/* Eyebrow */}
        <div
          className="flex items-center gap-2 mb-5 sm:mb-7"
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
          className="text-[24px] sm:text-[34px] leading-[1.05] tracking-[-0.01em] font-light"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
        >
          Secure your
          <br />
          luxury allocation.
        </h2>

        {/* Subtext */}
        <p
          className="mt-4 sm:mt-5 text-[13px] sm:text-[13.5px] leading-relaxed max-w-[440px]"
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
        <form onSubmit={handleSubmit} className="mt-7 sm:mt-9" noValidate id="vault-locker-form">
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
            autoFocus
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
            className="w-full bg-transparent border-0 border-b text-[16px] tracking-[0.18em] uppercase placeholder:tracking-[0.32em] placeholder:text-[11px] focus:outline-none transition-colors disabled:opacity-60"
            style={{
              minHeight: 52,
              padding: "14px 0",
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
              <span
                className="inline-flex items-center gap-2"
                key={`securing-${securingStep}`}
                style={{ animation: "vaultTickerIn 320ms cubic-bezier(.2,.7,.2,1) both" }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{
                    background: "#8a8580",
                    animation: "vaultPulse 0.9s ease-in-out infinite",
                  }}
                  aria-hidden
                />
                {SECURING_STATUSES[securingStep]}…
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
        </form>

        {/* Footer reassurance — restrained, no marketing */}
        <p
          className="mt-6 sm:mt-7 text-[10px] uppercase tracking-[0.28em] leading-relaxed pb-2"
          style={{ color: "rgba(244,241,236,0.45)" }}
        >
          Held with discretion. No third-party tracking. Used only to safeguard
          your reservation and curate your private locker.
        </p>
          </div>
        </div>

        {/* Sticky thumb-zone CTA — always within reach, above safe area */}
        <div
          className="sticky bottom-0 left-0 right-0 border-t"
          style={{
            background: "#0f0f0f",
            borderColor: "rgba(244,241,236,0.12)",
            padding: "12px 18px calc(12px + env(safe-area-inset-bottom)) 18px",
          }}
        >
          <button
            type="submit"
            form="vault-locker-form"
            disabled={!isValid || phase !== "idle"}
            className="relative w-full inline-flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.32em] transition-all disabled:cursor-not-allowed overflow-hidden"
            style={{
              minHeight: 56,
              background: "#f4f1ec",
              color: "#0a0a0a",
              letterSpacing: "0.32em",
              opacity: phase === "idle" && !isValid ? 0.4 : 1,
            }}
          >
            {/* Idle label — fades out the moment securing begins */}
            <span
              className="inline-flex items-center justify-center gap-3"
              style={{
                opacity: phase === "idle" ? 1 : 0,
                transform: phase === "idle" ? "translateY(0)" : "translateY(-4px)",
                transition: "opacity 240ms ease-out, transform 240ms ease-out",
                pointerEvents: phase === "idle" ? "auto" : "none",
              }}
            >
              <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
              Generate Verification Link
            </span>

            {/* Securing state — horizontal monochrome progress bar */}
            {phase === "securing" && (
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center px-6"
                style={{ animation: "vaultTickerIn 220ms ease-out both" }}
              >
                <span
                  className="relative block w-full overflow-hidden"
                  style={{
                    height: 2,
                    background: "rgba(10,10,10,0.08)",
                  }}
                >
                  <span
                    className="absolute inset-y-0 left-0"
                    style={{
                      width: "40%",
                      background: "linear-gradient(90deg, transparent, #8a8580 50%, transparent)",
                      animation: "vaultProgress 1.1s cubic-bezier(.4,.0,.2,1) infinite",
                    }}
                  />
                </span>
              </span>
            )}

            {/* Success — checkmark draws in and softly settles */}
            {phase === "secured" && (
              <span
                className="absolute inset-0 inline-flex items-center justify-center gap-2"
                style={{ animation: "vaultSuccessIn 360ms cubic-bezier(.2,.7,.2,1) both" }}
              >
                <span
                  className="inline-flex items-center justify-center rounded-full"
                  style={{
                    width: 22,
                    height: 22,
                    border: "1px solid #0a0a0a",
                    animation: "vaultCheckRing 420ms cubic-bezier(.2,.7,.2,1) both",
                  }}
                >
                  <Check
                    className="w-3 h-3"
                    strokeWidth={2.2}
                    style={{ animation: "vaultCheckIn 320ms 120ms cubic-bezier(.2,.7,.2,1) both" }}
                  />
                </span>
                Vault Secured
              </span>
            )}

            {/* Screen-reader live announcement */}
            <span className="sr-only" aria-live="polite">
              {phase === "securing"
                ? SECURING_STATUSES[securingStep]
                : phase === "secured"
                ? "Vault secured"
                : ""}
            </span>
          </button>
        </div>
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
        @keyframes vaultSheetIn {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 640px) {
          @keyframes vaultSheetIn {
            from { opacity: 0; transform: translateY(16px) scale(0.985); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
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
        @keyframes vaultProgress {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes vaultSuccessIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes vaultCheckRing {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes vaultCheckIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
