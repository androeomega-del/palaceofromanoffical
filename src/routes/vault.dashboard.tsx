/**
 * /vault/dashboard — Private Client Vault Dashboard.
 *
 * Destination for the verification link sent to the client's inbox.
 * On mount it plays a brief "decrypting" micro-animation, then reveals
 * the secured allocation manifest (their current cart items) and a
 * single CTA that transitions into a pre-filled one-page checkout view.
 *
 * Reads from cart-store and the persisted customer email — does NOT
 * mutate cart state, does NOT touch the Shopify checkout URL beyond
 * navigation to the existing one.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Lock, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { getCustomerEmail } from "@/lib/abandoned-cart-capture";
import { formatPrice } from "@/lib/shopify";
import { cdnImage } from "@/lib/cdn-image";

export const Route = createFileRoute("/vault/dashboard")({
  component: VaultDashboardPage,
  head: () => ({
    meta: [
      { title: "Private Client Vault — Palace of Roman" },
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

type Phase = "decrypting" | "dashboard" | "dispatch";

function VaultDashboardPage() {
  const [phase, setPhase] = useState<Phase>("decrypting");
  const [decryptLine, setDecryptLine] = useState(
    "DECRYPTING PRIVATE SECURE LINK",
  );

  const items = useCartStore((s) => s.items);
  const checkoutUrl = useCartStore((s) => s.checkoutUrl);
  const email = useMemo(() => getCustomerEmail(), []);

  useEffect(() => {
    const t1 = setTimeout(() => setDecryptLine("ACCESS GRANTED"), 700);
    const t2 = setTimeout(() => setPhase("dashboard"), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "decrypting") {
    return <DecryptingScreen line={decryptLine} />;
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: PALETTE.onyx,
        color: PALETTE.alabaster,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        animation: "vaultFadeIn 500ms ease-out both",
      }}
    >
      {/* Header strip */}
      <header
        className="flex items-center justify-between px-6 md:px-14 py-6 border-b"
        style={{ borderColor: PALETTE.hairline }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.4em]"
          style={{ color: PALETTE.stone }}
        >
          Palace of Roman
        </span>
        <span
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em]"
          style={{ color: PALETTE.stone }}
        >
          <ShieldCheck className="w-3 h-3" strokeWidth={1.5} />
          Verified Session
        </span>
      </header>

      {phase === "dashboard" ? (
        <DashboardView
          email={email}
          items={items}
          onProceed={() => setPhase("dispatch")}
        />
      ) : (
        <DispatchView
          email={email}
          items={items}
          checkoutUrl={checkoutUrl}
          onBack={() => setPhase("dashboard")}
        />
      )}

      <style>{`
        @keyframes vaultFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vaultDecryptPulse {
          0%, 100% { opacity: 0.55; letter-spacing: 0.4em; }
          50%      { opacity: 1;    letter-spacing: 0.5em; }
        }
        @keyframes vaultBar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes vaultSlideIn {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes vaultSlideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(-28px); }
        }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Decryption micro-animation                                              */
/* -------------------------------------------------------------------------- */

function DecryptingScreen({ line }: { line: string }) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{ background: PALETTE.onyx, color: PALETTE.alabaster }}
    >
      <div className="w-full max-w-md text-center">
        <Lock
          className="w-5 h-5 mx-auto mb-8"
          strokeWidth={1.25}
          style={{ color: PALETTE.stone }}
        />
        <p
          className="text-[11px] uppercase font-light"
          style={{
            letterSpacing: "0.4em",
            color: PALETTE.alabaster,
            animation: "vaultDecryptPulse 1s ease-in-out infinite",
          }}
        >
          {line}…
        </p>
        <div
          className="mt-10 h-px w-full origin-left"
          style={{
            background: PALETTE.alabaster,
            animation: "vaultBar 1.1s cubic-bezier(.65,0,.35,1) forwards",
          }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Dashboard view                                                          */
/* -------------------------------------------------------------------------- */

function DashboardView({
  email,
  items,
  onProceed,
}: {
  email: string | null;
  items: ReturnType<typeof useCartStore.getState>["items"];
  onProceed: () => void;
}) {
  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.price.amount) * it.quantity,
    0,
  );
  const currency = items[0]?.price.currencyCode ?? "USD";

  return (
    <section
      className="px-6 md:px-14 pt-16 md:pt-24 pb-24 max-w-5xl mx-auto"
      style={{ animation: "vaultSlideIn 500ms ease-out both" }}
    >
      <p
        className="text-[10px] uppercase tracking-[0.4em] mb-6"
        style={{ color: PALETTE.stone }}
      >
        Private Client Vault // Welcome Back
      </p>
      <h1
        className="text-[40px] md:text-[56px] leading-[0.96] font-light tracking-[-0.015em]"
        style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
      >
        Your allocation
        <br />
        is locked.
      </h1>
      <p
        className="mt-6 text-[13.5px] leading-relaxed max-w-xl"
        style={{ color: "rgba(244,241,236,0.72)" }}
      >
        Your luxury allocation has been successfully verified and locked to
        your profile{email ? ` (${email})` : ""}.
      </p>

      {/* Manifest */}
      <div
        className="mt-14 border-t border-b py-10"
        style={{ borderColor: PALETTE.hairline }}
      >
        <div className="flex items-center justify-between mb-8">
          <span
            className="text-[10px] uppercase tracking-[0.4em]"
            style={{ color: PALETTE.stone }}
          >
            Secured Allocation Manifest
          </span>
          <span
            className="inline-flex items-center gap-2 text-[9.5px] uppercase tracking-[0.32em] px-3 py-1.5 border"
            style={{
              borderColor: PALETTE.hairline,
              color: PALETTE.alabaster,
              background: "rgba(244,241,236,0.04)",
            }}
          >
            <ShieldCheck className="w-3 h-3" strokeWidth={1.5} />
            Status: Allocation Reserved &amp; Secured
          </span>
        </div>

        {items.length === 0 ? (
          <p
            className="text-[12px] italic"
            style={{ color: "rgba(244,241,236,0.5)" }}
          >
            Your locker is currently empty. Reserved pieces appear here the
            moment you secure them.
          </p>
        ) : (
          <ul className="space-y-8">
            {items.map((it) => {
              const img = it.product.node.images?.edges?.[0]?.node;
              return (
                <li
                  key={it.variantId}
                  className="grid grid-cols-[96px_1fr_auto] md:grid-cols-[140px_1fr_auto] gap-6 md:gap-10 items-start"
                >
                  <div
                    className="w-full overflow-hidden border"
                    style={{
                      aspectRatio: "4/5",
                      borderColor: PALETTE.hairline,
                      background: "#1a1a1a",
                    }}
                  >
                    {img && (
                      <img
                        src={cdnImage(img.url, { width: 400 })}
                        alt={img.altText ?? it.product.node.title}
                        className="w-full h-full object-cover"
                        style={{ filter: "saturate(0.95)" }}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[10px] uppercase tracking-[0.32em] mb-2"
                      style={{ color: PALETTE.stone }}
                    >
                      {it.product.node.vendor}
                    </p>
                    <h3
                      className="text-[18px] md:text-[22px] font-light leading-snug"
                      style={{
                        fontFamily:
                          "ui-serif, Georgia, 'Times New Roman', serif",
                      }}
                    >
                      {it.product.node.title}
                    </h3>
                    {it.selectedOptions?.length > 0 && (
                      <p
                        className="mt-3 text-[10.5px] uppercase tracking-[0.28em]"
                        style={{ color: "rgba(244,241,236,0.55)" }}
                      >
                        {it.selectedOptions
                          .map((o) => `${o.name}: ${o.value}`)
                          .join(" · ")}
                        {it.quantity > 1 ? ` · Qty ${it.quantity}` : ""}
                      </p>
                    )}
                  </div>
                  <p
                    className="text-[14px] font-light whitespace-nowrap pt-1"
                    style={{
                      fontFamily:
                        "ui-serif, Georgia, 'Times New Roman', serif",
                    }}
                  >
                    {formatPrice({
                      amount: String(
                        Number(it.price.amount) * it.quantity,
                      ),
                      currencyCode: it.price.currencyCode,
                    })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        <p
          className="mt-10 text-[11px] leading-relaxed italic max-w-2xl"
          style={{ color: "rgba(244,241,236,0.55)" }}
        >
          Out of respect for our limited multi-brand designer pipelines, this
          allocation is held securely under your verified email for a
          restricted window before returning to the global catalog.
        </p>
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div
          className="mt-10 flex items-baseline justify-between pb-10 border-b"
          style={{ borderColor: PALETTE.hairline }}
        >
          <span
            className="text-[10px] uppercase tracking-[0.4em]"
            style={{ color: PALETTE.stone }}
          >
            Allocation Total
          </span>
          <span
            className="text-[26px] font-light tracking-[-0.01em]"
            style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
          >
            {formatPrice({ amount: String(subtotal), currencyCode: currency })}
          </span>
        </div>
      )}

      {/* Spacer so sticky mobile CTA doesn't cover content */}
      <div className="h-28 md:hidden" aria-hidden />

      {/* CTA — sticky thumb-zone on mobile, inline on desktop */}
      <div
        className="fixed md:static bottom-0 left-0 right-0 z-40 md:z-auto md:mt-12 px-5 md:px-0 pt-3 md:pt-0"
        style={{
          background: "linear-gradient(to top, #0a0a0a 78%, rgba(10,10,10,0))",
          paddingBottom: "calc(14px + env(safe-area-inset-bottom))",
        }}
      >
        <button
          type="button"
          onClick={onProceed}
          disabled={items.length === 0}
          className="w-full inline-flex items-center justify-center gap-4 text-[11px] uppercase font-light transition-all md:hover:gap-6 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            minHeight: 56,
            background: PALETTE.alabaster,
            color: PALETTE.onyx,
            letterSpacing: "0.36em",
          }}
        >
          Proceed to White-Glove Dispatch
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>

        <p
          className="mt-3 md:mt-6 text-[9.5px] md:text-[10px] uppercase tracking-[0.28em] text-center"
          style={{ color: "rgba(244,241,236,0.45)" }}
        >
          Held with absolute discretion · Verified concierge channel
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. White-Glove Dispatch view (pre-filled checkout)                         */
/* -------------------------------------------------------------------------- */

function DispatchView({
  email,
  items,
  checkoutUrl,
  onBack,
}: {
  email: string | null;
  items: ReturnType<typeof useCartStore.getState>["items"];
  checkoutUrl: string | null;
  onBack: () => void;
}) {
  const [redirecting, setRedirecting] = useState(false);
  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.price.amount) * it.quantity,
    0,
  );
  const currency = items[0]?.price.currencyCode ?? "USD";

  const confirm = () => {
    if (!checkoutUrl) return;
    setRedirecting(true);
    setTimeout(() => {
      window.location.assign(checkoutUrl);
    }, 600);
  };

  return (
    <section
      className="px-6 md:px-14 pt-16 md:pt-24 pb-24 max-w-3xl mx-auto"
      style={{ animation: "vaultSlideIn 500ms ease-out both" }}
    >
      <button
        type="button"
        onClick={onBack}
        className="text-[10px] uppercase tracking-[0.32em] mb-10 pb-1 border-b"
        style={{
          color: PALETTE.stone,
          borderColor: "rgba(138,133,128,0.4)",
        }}
      >
        ← Return to vault
      </button>

      <p
        className="text-[10px] uppercase tracking-[0.4em] mb-6"
        style={{ color: PALETTE.stone }}
      >
        White-Glove Dispatch // One-Page Confirmation
      </p>
      <h1
        className="text-[36px] md:text-[48px] leading-[1] font-light tracking-[-0.015em]"
        style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
      >
        Confirm dispatch.
      </h1>

      {/* Pre-filled identity */}
      <div
        className="mt-12 border-t border-b py-8 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10"
        style={{ borderColor: PALETTE.hairline }}
      >
        <Field
          label="Verified Recipient"
          value={email ?? "—"}
          lockedNote="Locked to vault session"
        />
        <Field
          label="Channel"
          value="Private Concierge"
          lockedNote="White-glove transit"
        />
      </div>

      {/* Items snapshot */}
      <ul
        className="mt-10 divide-y"
        style={{ borderColor: PALETTE.hairline }}
      >
        {items.map((it) => (
          <li
            key={it.variantId}
            className="flex items-baseline justify-between py-4"
            style={{ borderColor: PALETTE.hairline }}
          >
            <span
              className="text-[12px] uppercase tracking-[0.18em]"
              style={{ color: "rgba(244,241,236,0.85)" }}
            >
              {it.product.node.vendor} · {it.product.node.title}
              {it.quantity > 1 ? ` × ${it.quantity}` : ""}
            </span>
            <span
              className="text-[13px] font-light whitespace-nowrap pl-6"
              style={{
                fontFamily: "ui-serif, Georgia, 'Times New Roman', serif",
              }}
            >
              {formatPrice({
                amount: String(Number(it.price.amount) * it.quantity),
                currencyCode: it.price.currencyCode,
              })}
            </span>
          </li>
        ))}
      </ul>

      <div
        className="mt-6 pt-6 border-t flex items-baseline justify-between"
        style={{ borderColor: PALETTE.hairline }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.4em]"
          style={{ color: PALETTE.stone }}
        >
          Total
        </span>
        <span
          className="text-[24px] font-light tracking-[-0.01em]"
          style={{ fontFamily: "ui-serif, Georgia, 'Times New Roman', serif" }}
        >
          {formatPrice({ amount: String(subtotal), currencyCode: currency })}
        </span>
      </div>

      <button
        type="button"
        onClick={confirm}
        disabled={!checkoutUrl || redirecting}
        className="mt-12 w-full inline-flex items-center justify-center gap-4 py-5 text-[11px] uppercase font-light transition-all hover:gap-6 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: PALETTE.alabaster,
          color: PALETTE.onyx,
          letterSpacing: "0.42em",
        }}
      >
        {redirecting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
            Opening Secure Dispatch
          </>
        ) : (
          <>
            Confirm &amp; Dispatch
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </>
        )}
      </button>

      <p
        className="mt-6 text-[10px] uppercase tracking-[0.28em] text-center"
        style={{ color: "rgba(244,241,236,0.45)" }}
      >
        Payment finalised on the secure dispatch channel
      </p>
    </section>
  );
}

function Field({
  label,
  value,
  lockedNote,
}: {
  label: string;
  value: string;
  lockedNote?: string;
}) {
  return (
    <div>
      <p
        className="text-[10px] uppercase tracking-[0.36em] mb-2"
        style={{ color: PALETTE.stone }}
      >
        {label}
      </p>
      <p
        className="text-[14px] font-light"
        style={{
          fontFamily: "ui-serif, Georgia, 'Times New Roman', serif",
          color: PALETTE.alabaster,
        }}
      >
        {value}
      </p>
      {lockedNote && (
        <p
          className="mt-1 inline-flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.28em]"
          style={{ color: "rgba(244,241,236,0.45)" }}
        >
          <Lock className="w-2.5 h-2.5" strokeWidth={1.5} />
          {lockedNote}
        </p>
      )}
    </div>
  );
}
