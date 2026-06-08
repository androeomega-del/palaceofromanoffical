/**
 * /vault — interactive demo of the Vault Locker funnel.
 *
 * Features a single mock high-ticket piece ("The Cucinelli Edit —
 * Investment Slide", $1,050) so the funnel can be experienced end-to-end
 * without touching the live catalog. Clicking "Secure Allocation"
 * triggers the global VaultLockerOverlay via ensureVaultUnlocked().
 *
 * No cart-store, no checkout URL, no real Shopify writes.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ArrowUpRight } from "lucide-react";
import { ensureVaultUnlocked } from "@/lib/vault-gate";
import { getCustomerEmail } from "@/lib/abandoned-cart-capture";

export const Route = createFileRoute("/vault")({
  component: VaultDemoPage,
  head: () => ({
    meta: [
      { title: "The Vault — Palace of Roman" },
      {
        name: "description",
        content:
          "Private client locker for investment-grade designer edits. Enter to secure your allocation.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

const PALETTE = {
  onyx: "#0a0a0a",
  panel: "#0f0f0f",
  alabaster: "#f4f1ec",
  stone: "#8a8580",
  hairline: "rgba(244,241,236,0.12)",
};

function VaultDemoPage() {
  const [phase, setPhase] = useState<"idle" | "reserved">("idle");
  const [reservedEmail, setReservedEmail] = useState<string | null>(null);

  const onSecure = async () => {
    const ok = await ensureVaultUnlocked("The Cucinelli Edit — Investment Slide");
    if (!ok) return;
    setReservedEmail(getCustomerEmail());
    setPhase("reserved");
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: PALETTE.onyx,
        color: PALETTE.alabaster,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* Editorial header strip */}
      <header
        className="flex items-center justify-between px-6 md:px-14 py-6 border-b"
        style={{ borderColor: PALETTE.hairline }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.4em]"
          style={{ color: PALETTE.stone }}
        >
          Palace of Roman — Private Vault
        </span>
        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em]" style={{ color: PALETTE.stone }}>
          <Lock className="w-3 h-3" strokeWidth={1.5} />
          Members Only
        </span>
      </header>

      {/* Hero / product card */}
      <section className="px-6 md:px-14 pt-16 md:pt-24 pb-24 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-start">
        {/* Image panel — monochrome placeholder; no marketing badges */}
        <div className="md:col-span-7">
          <div
            className="relative w-full overflow-hidden border"
            style={{
              aspectRatio: "4 / 5",
              background:
                "radial-gradient(ellipse at 50% 30%, #1a1a1a 0%, #0a0a0a 70%)",
              borderColor: PALETTE.hairline,
            }}
          >
            <div
              className="absolute inset-0 flex items-end p-6"
              style={{
                background:
                  "linear-gradient(to top, rgba(10,10,10,0.85), transparent 40%)",
              }}
            >
              <span
                className="text-[10px] uppercase tracking-[0.4em]"
                style={{ color: PALETTE.stone }}
              >
                Lot 014 — Investment Slide
              </span>
            </div>
          </div>
        </div>

        {/* Product detail */}
        <div className="md:col-span-5 md:pt-6">
          <p
            className="text-[10px] uppercase tracking-[0.4em] mb-6"
            style={{ color: PALETTE.stone }}
          >
            The Cucinelli Edit
          </p>
          <h1
            className="text-[44px] md:text-[56px] leading-[0.96] font-light tracking-[-0.015em]"
            style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
          >
            Investment
            <br />
            Slide.
          </h1>

          <p
            className="mt-8 text-[13.5px] leading-relaxed max-w-md"
            style={{ color: "rgba(244,241,236,0.72)" }}
          >
            A discreet, hand-finished leather slide rendered in undyed Italian
            calfskin. Cut from a single hide, lined in goat suede, finished
            with a hand-stitched vamp. Reserved through our network of
            authorised boutiques and distributors; allocations are limited per
            season.
          </p>

          {/* Specs — restrained, no badges */}
          <dl
            className="mt-10 grid grid-cols-2 gap-y-3 gap-x-6 text-[11px] uppercase tracking-[0.28em]"
            style={{ color: PALETTE.stone }}
          >
            <dt>Provenance</dt>
            <dd style={{ color: PALETTE.alabaster }}>Solomeo, Italy</dd>
            <dt>Material</dt>
            <dd style={{ color: PALETTE.alabaster }}>Undyed Calfskin</dd>
            <dt>Edition</dt>
            <dd style={{ color: PALETTE.alabaster }}>Restricted Allocation</dd>
            <dt>Authentication</dt>
            <dd style={{ color: PALETTE.alabaster }}>Boutique-Verified</dd>
          </dl>

          {/* Price */}
          <div
            className="mt-10 pt-6 border-t flex items-baseline justify-between"
            style={{ borderColor: PALETTE.hairline }}
          >
            <span
              className="text-[10px] uppercase tracking-[0.4em]"
              style={{ color: PALETTE.stone }}
            >
              Allocation Value
            </span>
            <span
              className="text-[26px] font-light tracking-[-0.01em]"
              style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
            >
              $1,050
            </span>
          </div>

          {/* Primary action — opens the global Vault overlay */}
          {phase === "idle" ? (
            <button
              type="button"
              onClick={onSecure}
              className="mt-8 w-full inline-flex items-center justify-center gap-3 py-4 text-[11px] uppercase tracking-[0.36em] transition-all hover:gap-4"
              style={{
                background: PALETTE.alabaster,
                color: PALETTE.onyx,
              }}
            >
              <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
              Secure Allocation
            </button>
          ) : (
            <div
              className="mt-8 border px-5 py-5"
              style={{
                borderColor: PALETTE.hairline,
                background: "rgba(244,241,236,0.04)",
                animation: "vaultDemoIn 360ms ease-out both",
              }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.36em]"
                style={{ color: PALETTE.alabaster }}
              >
                Vault Secured
              </p>
              <p
                className="mt-2 text-[12px] leading-relaxed"
                style={{ color: "rgba(244,241,236,0.7)" }}
              >
                This allocation has been reserved to your private client
                locker{reservedEmail ? ` under ${reservedEmail}` : ""}. A
                concierge will follow up shortly with checkout instructions.
              </p>
              <button
                type="button"
                onClick={() => setPhase("idle")}
                className="mt-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] pb-1 border-b transition-all hover:gap-3"
                style={{
                  color: PALETTE.stone,
                  borderColor: "rgba(138,133,128,0.4)",
                }}
              >
                Reserve another piece
                <ArrowUpRight className="w-3 h-3" strokeWidth={1.25} />
              </button>
            </div>
          )}

          <p
            className="mt-6 text-[10px] uppercase tracking-[0.28em] leading-relaxed"
            style={{ color: "rgba(244,241,236,0.45)" }}
          >
            Allocations are non-binding until checkout is completed. Held with
            absolute discretion.
          </p>
        </div>
      </section>

      <style>{`
        @keyframes vaultDemoIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
