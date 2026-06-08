/**
 * Vacation Trunk Overlay — slide-out "Digital Packing Trunk" workspace.
 *
 * Editorial-lookbook grid of curated items + email + minimalist Month/Day
 * dropdowns for departure date. On submit runs the same three-stage
 * verification sequence as the Vault Locker, then returns to idle.
 *
 * Presentational only. Does not touch cart-store, checkout URL, or
 * Shopify mutations. Email is persisted via the same telemetry helper
 * used by the Vault Locker.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Luggage, Check, X, Trash2 } from "lucide-react";
import { useVacationTrunkStore } from "@/stores/vacation-trunk-store";
import {
  rememberCustomerEmail,
  scheduleAbandonedCartSync,
} from "@/lib/abandoned-cart-capture";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SECURING_STATUSES = [
  "Verifying itinerary window",
  "Routing to private vacation stylist",
  "Locking white-glove transit timeline",
];
const SECURING_STEP_MS = 700;
const SECURING_TOTAL_MS = SECURING_STEP_MS * SECURING_STATUSES.length;

function daysInMonth(monthIdx: number): number {
  // Non-leap-year safe upper bound; current year for Feb.
  const year = new Date().getFullYear();
  return new Date(year, monthIdx + 1, 0).getDate();
}

/** Resolve the next future date matching month/day. Used for 48h validation. */
function resolveDepartureDate(monthIdx: number, day: number): Date {
  const now = new Date();
  const year = now.getFullYear();
  const candidate = new Date(year, monthIdx, day, 12, 0, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setFullYear(year + 1);
  }
  return candidate;
}

export function VacationTrunkOverlay() {
  const open = useVacationTrunkStore((s) => s.open);
  const items = useVacationTrunkStore((s) => s.items);
  const lowStock = useVacationTrunkStore((s) => s.lowStock);
  const closeTrunk = useVacationTrunkStore((s) => s.closeTrunk);
  const removeItem = useVacationTrunkStore((s) => s.removeItem);

  const [email, setEmail] = useState("");
  const [month, setMonth] = useState<string>("");
  const [day, setDay] = useState<string>("");
  const [phase, setPhase] = useState<"idle" | "securing" | "secured">("idle");
  const [securingStep, setSecuringStep] = useState(0);
  const [emailError, setEmailError] = useState(false);
  const [dateError, setDateError] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setEmail("");
      setMonth("");
      setDay("");
      setPhase("idle");
      setSecuringStep(0);
      setEmailError(false);
      setDateError(false);
      const id = window.setTimeout(() => inputRef.current?.focus(), 320);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  // Lock background scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC dismiss
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "secured") closeTrunk();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, phase, closeTrunk]);

  // Cycle the three-stage securing status
  useEffect(() => {
    if (phase !== "securing") return;
    setSecuringStep(0);
    const id = window.setInterval(() => {
      setSecuringStep((i) => (i < SECURING_STATUSES.length - 1 ? i + 1 : i));
    }, SECURING_STEP_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  const monthIdx = useMemo(() => MONTHS.indexOf(month), [month]);
  const dayNum = useMemo(() => parseInt(day, 10), [day]);
  const dayOptions = useMemo(() => {
    if (monthIdx < 0) return Array.from({ length: 31 }, (_, i) => i + 1);
    return Array.from({ length: daysInMonth(monthIdx) }, (_, i) => i + 1);
  }, [monthIdx]);

  const isEmailValid = EMAIL_RE.test(email.trim());
  const isDateSelected = monthIdx >= 0 && Number.isFinite(dayNum) && dayNum > 0;
  const dateOk = useMemo(() => {
    if (!isDateSelected) return false;
    const target = resolveDepartureDate(monthIdx, dayNum);
    const minMs = Date.now() + 48 * 60 * 60 * 1000;
    return target.getTime() >= minMs;
  }, [isDateSelected, monthIdx, dayNum]);

  const canSubmit = isEmailValid && isDateSelected && dateOk;

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== "idle") return;
    let bad = false;
    if (!isEmailValid) {
      setEmailError(true);
      bad = true;
    }
    if (!isDateSelected || !dateOk) {
      setDateError(true);
      bad = true;
    }
    if (bad) return;
    setEmailError(false);
    setDateError(false);

    try {
      rememberCustomerEmail(email.trim());
      scheduleAbandonedCartSync();
    } catch {
      /* best effort */
    }

    setPhase("securing");
    window.setTimeout(() => setPhase("secured"), SECURING_TOTAL_MS);
    window.setTimeout(() => {
      closeTrunk();
    }, SECURING_TOTAL_MS + 1400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vacation-trunk-title"
      className="fixed inset-0 z-[120] flex items-end sm:items-stretch sm:justify-end"
      style={{
        background: "rgba(10,10,10,0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "trunkOverlayFade 320ms cubic-bezier(.2,.7,.2,1) both",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && phase !== "secured") closeTrunk();
      }}
    >
      <aside
        className="relative w-full sm:w-[560px] sm:max-w-[92vw] flex flex-col"
        style={{
          background: "#f4f1ec",
          color: "#0a0a0a",
          maxHeight: "92dvh",
          height: "100%",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          borderLeft: "1px solid rgba(10,10,10,0.08)",
          animation: "trunkSheetIn 460ms cubic-bezier(.2,.7,.2,1) both",
        }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex items-center justify-center pt-3 pb-1">
          <span className="w-10 h-1 rounded-full" style={{ background: "rgba(10,10,10,0.2)" }} aria-hidden />
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={() => phase !== "secured" && closeTrunk()}
          aria-label="Close Digital Packing Trunk"
          className="absolute top-3 right-3 sm:top-5 sm:right-5 inline-flex items-center justify-center"
          style={{ minWidth: 44, minHeight: 44, color: "rgba(10,10,10,0.5)" }}
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "20px 22px 16px" }}>
          <div className="sm:px-[clamp(20px,3vw,32px)] sm:pt-6">
            {/* Status badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 border"
              style={{
                borderColor: "rgba(10,10,10,0.18)",
                color: "#0a0a0a",
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "#0a0a0a", animation: "trunkPulse 1.6s ease-in-out infinite" }}
                aria-hidden
              />
              <span className="text-[9.5px] uppercase tracking-[0.32em]">
                Packing Trunk Status: In Progress // Secured to Itinerary
              </span>
            </div>

            {/* Eyebrow */}
            <div className="flex items-center gap-2 mt-7" style={{ color: "rgba(10,10,10,0.55)" }}>
              <Luggage className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden />
              <span className="text-[10px] uppercase tracking-[0.4em]">Vacation Stylist</span>
            </div>

            {/* Title */}
            <h2
              id="vacation-trunk-title"
              className="mt-3 text-[24px] sm:text-[32px] leading-[1.05] tracking-[-0.01em] font-light"
              style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
            >
              Create your
              <br />
              digital packing trunk.
            </h2>

            <p
              className="mt-4 text-[13px] leading-relaxed max-w-[440px]"
              style={{ color: "rgba(10,10,10,0.66)" }}
            >
              Enter your email to archive this curated destination edit. Our
              Vacation Stylist will save your selections and seamlessly align
              your wardrobe with your upcoming itinerary.
            </p>

            {/* Editorial lookbook grid */}
            <div className="mt-7">
              <div
                className="flex items-center justify-between mb-3"
                style={{ color: "rgba(10,10,10,0.45)" }}
              >
                <span className="text-[10px] uppercase tracking-[0.32em]">
                  Curated Trunk · {items.length} {items.length === 1 ? "Piece" : "Pieces"}
                </span>
              </div>

              {items.length === 0 ? (
                <div
                  className="border border-dashed py-10 px-4 text-center"
                  style={{
                    borderColor: "rgba(10,10,10,0.18)",
                    color: "rgba(10,10,10,0.5)",
                  }}
                >
                  <p className="text-[10.5px] uppercase tracking-[0.32em]">
                    Your trunk is empty
                  </p>
                  <p className="mt-3 text-[12px] tracking-wide">
                    Add pieces from any product page to begin composing your
                    destination wardrobe.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {items.map((it, idx) => (
                    <div
                      key={it.id}
                      className="relative group"
                      style={{
                        animation: `trunkTileIn 360ms ${idx * 40}ms cubic-bezier(.2,.7,.2,1) both`,
                      }}
                    >
                      <div
                        className="relative overflow-hidden"
                        style={{
                          aspectRatio: "3 / 4",
                          background: "rgba(10,10,10,0.04)",
                        }}
                      >
                        {it.imageUrl ? (
                          <img
                            src={it.imageUrl}
                            alt={it.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            style={{ transition: "transform 700ms cubic-bezier(.2,.7,.2,1)" }}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-[0.3em]"
                            style={{ color: "rgba(10,10,10,0.3)" }}
                          >
                            No image
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          aria-label={`Remove ${it.title} from trunk`}
                          className="absolute top-2 right-2 inline-flex items-center justify-center backdrop-blur-sm"
                          style={{
                            minWidth: 32,
                            minHeight: 32,
                            background: "rgba(244,241,236,0.85)",
                            color: "#0a0a0a",
                            border: "1px solid rgba(10,10,10,0.12)",
                          }}
                        >
                          <Trash2 className="w-3 h-3" strokeWidth={1.4} />
                        </button>
                      </div>
                      <div className="mt-2">
                        {it.vendor && (
                          <p
                            className="text-[9px] uppercase tracking-[0.28em] truncate"
                            style={{ color: "rgba(10,10,10,0.5)" }}
                          >
                            {it.vendor}
                          </p>
                        )}
                        <p
                          className="text-[11.5px] leading-snug truncate"
                          style={{ color: "#0a0a0a" }}
                        >
                          {it.title}
                        </p>
                        {it.priceLabel && (
                          <p
                            className="text-[10.5px] tabular-nums mt-0.5"
                            style={{ color: "rgba(10,10,10,0.6)" }}
                          >
                            {it.priceLabel}
                          </p>
                        )}
                        {it.outOfStock && (
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof window !== "undefined" && it.handle) {
                                window.location.href = `/product/${it.handle}#substitution`;
                              }
                            }}
                            className="mt-2 w-full inline-flex items-center justify-center text-[9.5px] uppercase tracking-[0.28em] border transition-colors"
                            style={{
                              minHeight: 36,
                              borderColor: "rgba(10,10,10,0.4)",
                              color: "#0a0a0a",
                              background: "transparent",
                            }}
                          >
                            Request Archival Piece Substitution
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Competing Allocation banner */}
            {lowStock && (
              <div
                role="status"
                className="mt-7 border px-4 py-3 flex items-start gap-3"
                style={{
                  borderColor: "rgba(10,10,10,0.18)",
                  background: "rgba(10,10,10,0.025)",
                  animation: "trunkTickerIn 360ms cubic-bezier(.2,.7,.2,1) both",
                }}
              >
                <span
                  className="inline-block w-1 h-1 rounded-full mt-2 shrink-0"
                  style={{
                    background: "rgba(10,10,10,0.55)",
                    animation: "trunkPulse 1.6s ease-in-out infinite",
                  }}
                  aria-hidden
                />
                <p
                  className="text-[10.5px] uppercase tracking-[0.22em] leading-relaxed"
                  style={{ color: "rgba(10,10,10,0.6)" }}
                >
                  Notice: Due to restricted designer pipelines, this piece is
                  currently undergoing a live allocation check. Complete your
                  email verification to hold temporary priority access.
                </p>
              </div>
            )}

            {/* Form */}
            <form id="vacation-trunk-form" onSubmit={handleSubmit} className="mt-8" noValidate>
              {/* Email */}
              <label htmlFor="vacation-trunk-email" className="sr-only">
                Private email
              </label>
              <input
                id="vacation-trunk-email"
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
                  if (emailError) setEmailError(false);
                }}
                aria-invalid={!isEmailValid && email.length > 0}
                aria-describedby={emailError ? "vacation-trunk-email-error" : undefined}
                className="w-full bg-transparent border-0 border-b text-[16px] tracking-[0.18em] uppercase placeholder:tracking-[0.32em] placeholder:text-[11px] focus:outline-none transition-colors disabled:opacity-60"
                style={{
                  minHeight: 52,
                  padding: "14px 0",
                  borderColor: emailError ? "rgba(10,10,10,0.55)" : "rgba(10,10,10,0.25)",
                  color: "#0a0a0a",
                  caretColor: "#0a0a0a",
                  animation: emailError ? "trunkBorderPulse 1.6s ease-in-out 2" : undefined,
                }}
              />
              <div
                aria-live="polite"
                id="vacation-trunk-email-error"
                className="mt-2 h-3.5 overflow-hidden"
              >
                {emailError && (
                  <p
                    className="text-[10px] tracking-[0.14em] leading-tight"
                    style={{
                      color: "rgba(10,10,10,0.6)",
                      fontStyle: "italic",
                      animation: "trunkErrorIn 360ms cubic-bezier(.2,.7,.2,1) both",
                    }}
                  >
                    Verification error: Please check the formatting of your private email.
                  </p>
                )}
              </div>

              {/* Departure Date */}
              <div className="mt-6">
                <label
                  className="text-[10px] uppercase tracking-[0.34em] block"
                  style={{ color: "rgba(10,10,10,0.55)" }}
                >
                  Date of Departure
                </label>
                <div className="mt-3 grid grid-cols-[1fr_120px] gap-3">
                  <div className="relative">
                    <select
                      aria-label="Month of departure"
                      value={month}
                      disabled={phase !== "idle"}
                      onChange={(e) => {
                        setMonth(e.target.value);
                        if (dateError) setDateError(false);
                      }}
                      className="w-full appearance-none bg-transparent border-0 border-b text-[14px] tracking-[0.22em] uppercase focus:outline-none disabled:opacity-60"
                      style={{
                        minHeight: 52,
                        padding: "14px 28px 14px 0",
                        borderColor: dateError ? "rgba(10,10,10,0.55)" : "rgba(10,10,10,0.25)",
                        color: month ? "#0a0a0a" : "rgba(10,10,10,0.4)",
                        backgroundImage:
                          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%230a0a0a' stroke-width='1' fill='none'/></svg>\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 4px center",
                        animation: dateError ? "trunkBorderPulse 1.6s ease-in-out 2" : undefined,
                      }}
                    >
                      <option value="">Month</option>
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <select
                      aria-label="Day of departure"
                      value={day}
                      disabled={phase !== "idle"}
                      onChange={(e) => {
                        setDay(e.target.value);
                        if (dateError) setDateError(false);
                      }}
                      className="w-full appearance-none bg-transparent border-0 border-b text-[14px] tracking-[0.22em] uppercase focus:outline-none disabled:opacity-60"
                      style={{
                        minHeight: 52,
                        padding: "14px 28px 14px 0",
                        borderColor: dateError ? "rgba(10,10,10,0.55)" : "rgba(10,10,10,0.25)",
                        color: day ? "#0a0a0a" : "rgba(10,10,10,0.4)",
                        backgroundImage:
                          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%230a0a0a' stroke-width='1' fill='none'/></svg>\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 4px center",
                        animation: dateError ? "trunkBorderPulse 1.6s ease-in-out 2" : undefined,
                      }}
                    >
                      <option value="">Day</option>
                      {dayOptions.map((d) => (
                        <option key={d} value={d}>
                          {d.toString().padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div
                  aria-live="polite"
                  className="mt-2 h-3.5 overflow-hidden"
                >
                  {dateError && (
                    <p
                      className="text-[10px] tracking-[0.14em] leading-tight"
                      style={{
                        color: "rgba(10,10,10,0.6)",
                        fontStyle: "italic",
                        animation: "trunkErrorIn 360ms cubic-bezier(.2,.7,.2,1) both",
                      }}
                    >
                      Logistical restriction: Please provide a departure date that accommodates white-glove transit safety windows.
                    </p>
                  )}
                </div>
              </div>

              {/* Securing ticker */}
              <div
                aria-live="polite"
                className="mt-5 h-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] overflow-hidden"
                style={{ color: "rgba(10,10,10,0.55)" }}
              >
                {phase === "securing" && (
                  <span
                    key={`securing-${securingStep}`}
                    className="inline-flex items-center gap-2"
                    style={{ animation: "trunkTickerIn 320ms cubic-bezier(.2,.7,.2,1) both" }}
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: "#0a0a0a", animation: "trunkPulse 0.9s ease-in-out infinite" }}
                      aria-hidden
                    />
                    {SECURING_STATUSES[securingStep]}…
                  </span>
                )}
                {phase === "secured" && (
                  <span
                    className="inline-flex items-center gap-2"
                    style={{ color: "#0a0a0a", animation: "trunkTickerIn 240ms ease-out both" }}
                  >
                    <Check className="w-3 h-3" strokeWidth={2} />
                    Trunk locked — verification dispatched
                  </span>
                )}
              </div>
            </form>

            {/* Disclaimer */}
            <p
              className="mt-6 text-[10px] uppercase tracking-[0.24em] leading-relaxed pb-2"
              style={{ color: "rgba(10,10,10,0.5)" }}
            >
              We utilize your departure date to calculate transit safety
              windows and guarantee your curated pieces arrive safely before
              your journey begins.
            </p>
          </div>
        </div>

        {/* Sticky CTA */}
        <div
          className="sticky bottom-0 left-0 right-0 border-t"
          style={{
            background: "#f4f1ec",
            borderColor: "rgba(10,10,10,0.1)",
            padding: "12px 18px calc(12px + env(safe-area-inset-bottom)) 18px",
          }}
        >
          <button
            type="submit"
            form="vacation-trunk-form"
            disabled={!canSubmit || phase !== "idle"}
            className="relative w-full inline-flex items-center justify-center gap-3 text-[11px] uppercase transition-all disabled:cursor-not-allowed overflow-hidden"
            style={{
              minHeight: 56,
              background: "#0a0a0a",
              color: "#f4f1ec",
              letterSpacing: "0.32em",
              opacity: phase === "idle" && !canSubmit ? 0.4 : 1,
            }}
          >
            <span
              className="inline-flex items-center justify-center gap-3"
              style={{
                opacity: phase === "idle" ? 1 : 0,
                transform: phase === "idle" ? "translateY(0)" : "translateY(-4px)",
                transition: "opacity 240ms ease-out, transform 240ms ease-out",
                pointerEvents: phase === "idle" ? "auto" : "none",
              }}
            >
              <Luggage className="w-3.5 h-3.5" strokeWidth={1.5} />
              Lock Trunk &amp; Secure Delivery Timeline
            </span>

            {phase === "securing" && (
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center px-6"
                style={{ animation: "trunkTickerIn 220ms ease-out both" }}
              >
                <span
                  className="relative block w-full overflow-hidden"
                  style={{ height: 2, background: "rgba(244,241,236,0.15)" }}
                >
                  <span
                    className="absolute inset-y-0 left-0"
                    style={{
                      width: "40%",
                      background:
                        "linear-gradient(90deg, transparent, rgba(244,241,236,0.85) 50%, transparent)",
                      animation: "trunkProgress 1.1s cubic-bezier(.4,0,.2,1) infinite",
                    }}
                  />
                </span>
              </span>
            )}

            {phase === "secured" && (
              <span
                className="absolute inset-0 inline-flex items-center justify-center gap-2"
                style={{ animation: "trunkSuccessIn 360ms cubic-bezier(.2,.7,.2,1) both" }}
              >
                <span
                  className="inline-flex items-center justify-center rounded-full"
                  style={{
                    width: 22,
                    height: 22,
                    border: "1px solid #f4f1ec",
                    animation: "trunkCheckRing 420ms cubic-bezier(.2,.7,.2,1) both",
                  }}
                >
                  <Check
                    className="w-3 h-3"
                    strokeWidth={2.2}
                    style={{ animation: "trunkCheckIn 320ms 120ms cubic-bezier(.2,.7,.2,1) both" }}
                  />
                </span>
                Verification dispatched
              </span>
            )}
          </button>
        </div>
      </aside>

      <style>{`
        @keyframes trunkOverlayFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes trunkSheetIn {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 640px) {
          @keyframes trunkSheetIn {
            from { opacity: 0; transform: translateX(100%); }
            to   { opacity: 1; transform: translateX(0); }
          }
        }
        @keyframes trunkTileIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes trunkTickerIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes trunkErrorIn {
          from { opacity: 0; transform: translateY(-2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes trunkBorderPulse {
          0%, 100% { border-bottom-color: rgba(10,10,10,0.25); }
          50%      { border-bottom-color: rgba(10,10,10,0.55); }
        }
        @keyframes trunkPulse {
          0%, 100% { opacity: 0.35; transform: scale(0.9); }
          50%      { opacity: 1;    transform: scale(1.1); }
        }
        @keyframes trunkProgress {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes trunkSuccessIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes trunkCheckRing {
          from { transform: scale(0.6); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes trunkCheckIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
