/**
 * Vault Release Overlay — shown over a product's CTA stack when a piece the
 * visitor has in their (still unverified) cart sells out completely. Replaces
 * the standard Add-to-Bag flow with a high-end "Allocation Expired" panel
 * and a single waitlist email handoff.
 *
 * Presentational only — uses NotifyMeForm under the hood for the actual
 * back-in-stock subscription.
 */
import { useState } from "react";
import { Lock, Check } from "lucide-react";

interface VaultReleaseOverlayProps {
  variantGid: string;
  productHandle: string;
  productTitle: string;
  variantTitle?: string | null;
  imageUrl?: string | null;
  priceUsd?: string | null;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function VaultReleaseOverlay({
  variantGid,
  productHandle,
  productTitle,
  variantTitle,
  imageUrl,
  priceUsd,
}: VaultReleaseOverlayProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
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
          source: "vault_release_waitlist",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("ok");
      setEmail("");
    } catch (err) {
      console.debug("[vault-release] failed:", err);
      setStatus("error");
      setError("Could not join the waitlist. Please try again.");
    }
  };

  const successScreen = (
    <div
      className="text-center py-4"
      style={{ animation: "vaultReleaseIn 600ms cubic-bezier(.2,.7,.2,1) both" }}
    >
      {/* Checkmark ring */}
      <div
        className="inline-flex items-center justify-center"
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "1px solid rgba(244,241,236,0.22)",
          animation: "vaultCheckRing 520ms cubic-bezier(.2,.7,.2,1) both",
        }}
      >
        <Check
          className="w-5 h-5"
          strokeWidth={1.6}
          style={{
            color: "#f4f1ec",
            animation: "vaultCheckIn 400ms 140ms cubic-bezier(.2,.7,.2,1) both",
          }}
        />
      </div>

      {/* Title */}
      <h3
        className="mt-7 text-[13px] uppercase tracking-[0.34em] leading-snug"
        style={{
          color: "#f4f1ec",
          animation: "vaultReleaseIn 500ms 100ms cubic-bezier(.2,.7,.2,1) both",
        }}
      >
        Archival Application Received
      </h3>

      {/* Concierge copy */}
      <p
        className="mt-5 mx-auto max-w-[420px] text-[12.5px] leading-[1.75]"
        style={{
          color: "rgba(244,241,236,0.65)",
          animation: "vaultReleaseIn 500ms 220ms cubic-bezier(.2,.7,.2,1) both",
        }}
      >
        Your priority request has been assigned to our procurement pipeline. Our
        luxury procurement concierge will instantly track global multi-brand
        networks for this specific piece or an authenticated architectural
        equivalent. Should an allocation become available through a cart
        expiration or vault release, you will receive immediate, priority
        notification.
      </p>

      {/* Return CTA */}
      <a
        href="/"
        className="mt-8 inline-flex items-center justify-center w-full text-[11px] uppercase transition-colors"
        style={{
          minHeight: 52,
          background: "#f4f1ec",
          color: "#0a0a0a",
          letterSpacing: "0.32em",
          animation: "vaultReleaseIn 500ms 360ms cubic-bezier(.2,.7,.2,1) both",
        }}
      >
        Return to Digital Couture Selections
      </a>
    </div>
  );

  return (
    <section
      id="substitution"
      aria-label="Vault release waitlist"
      className="relative border p-5 sm:p-7"
      style={{
        background: "#0a0a0a",
        borderColor: "rgba(244,241,236,0.14)",
        color: "#f4f1ec",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        animation: "vaultReleaseIn 420ms cubic-bezier(.2,.7,.2,1) both",
      }}
    >
      {status === "ok" ? (
        successScreen
      ) : (
        <div
          style={{
            opacity: status === "sending" ? 0.55 : 1,
            transition: "opacity 300ms ease",
            pointerEvents: status === "sending" ? "none" : "auto",
          }}
        >
          <div
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.34em]"
            style={{ color: "rgba(244,241,236,0.55)" }}
          >
            <Lock className="w-3 h-3" strokeWidth={1.5} aria-hidden />
            Status: Allocation Expired
          </div>

          <p
            className="mt-4 text-[12.5px] uppercase tracking-[0.22em] leading-relaxed"
            style={{ color: "rgba(244,241,236,0.85)" }}
          >
            Couture reserved by another private client.
          </p>

          <p
            className="mt-2 text-[11.5px] leading-relaxed"
            style={{ color: "rgba(244,241,236,0.55)" }}
          >
            The standard checkout flow has been quietly suspended for this
            piece. Reserve a place on the re-allocation waitlist and we will
            notify you the instant a comparable archival edition is released.
          </p>

          <form onSubmit={onSubmit} className="mt-5" noValidate>
            <label htmlFor="vault-release-email" className="sr-only">
              Private email
            </label>
            <input
              id="vault-release-email"
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="ENTER PRIVATE EMAIL"
              value={email}
              disabled={status === "sending"}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") {
                  setStatus("idle");
                  setError(null);
                }
              }}
              className="w-full bg-transparent border-0 border-b text-[15px] tracking-[0.18em] uppercase placeholder:tracking-[0.32em] placeholder:text-[11px] focus:outline-none transition-colors disabled:opacity-60"
              style={{
                minHeight: 48,
                padding: "12px 0",
                borderColor:
                  status === "error"
                    ? "rgba(244,241,236,0.55)"
                    : "rgba(244,241,236,0.22)",
                color: "#f4f1ec",
                caretColor: "#f4f1ec",
              }}
            />
            <div aria-live="polite" className="mt-2 min-h-[14px]">
              {status === "error" && error && (
                <p
                  className="text-[10px] tracking-[0.14em]"
                  style={{ color: "rgba(244,241,236,0.55)", fontStyle: "italic" }}
                >
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-4 w-full inline-flex items-center justify-center text-[11px] uppercase transition-all disabled:cursor-not-allowed"
              style={{
                minHeight: 52,
                background: "#f4f1ec",
                color: "#0a0a0a",
                letterSpacing: "0.32em",
                opacity: status === "sending" ? 0.6 : 1,
              }}
            >
              {status === "sending" ? "Securing…" : "Join the Re-Allocation Waitlist"}
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes vaultReleaseIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
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
    </section>
  );
}
