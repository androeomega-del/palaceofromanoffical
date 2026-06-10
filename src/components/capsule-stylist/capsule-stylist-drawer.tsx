/**
 * Capsule Stylist — drawer (Step B of the noir refit).
 *
 * Marquee feature. Three steps, slide-from-right, glass-noir treatment,
 * pulls complementary products from the LIVE Storefront API around the
 * seed product the PDP passed in, and adds the user's selection to the
 * REAL Shopify cart via the existing cart store.
 *
 * Hard rules followed (see project memory):
 *   - No mock/hardcoded products — all candidates come from fetchProducts().
 *   - No localStorage; no VIP gating; no credential wall.
 *   - Optional newsletter tail wires to subscribeNewsletter with
 *     source: 'capsule_stylist'. Always skippable, never a gate.
 *   - Cart additions use useCartStore.addItem — no checkout / cart-store
 *     internals touched.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { useCapsuleStylistStore } from "@/stores/capsule-stylist-store";
import { useCartStore } from "@/stores/cart-store";
import {
  fetchProducts,
  formatPrice,
  type ShopifyProduct,
  type ShopifyProductNode,
} from "@/lib/shopify";
import { subscribeNewsletter } from "@/lib/newsletter.functions";
import { toast } from "sonner";

type Destination =
  | "resort"
  | "city-evening"
  | "travel-day"
  | "black-tie";

type Aesthetic = "minimal" | "sculpted" | "easy" | "bold";

const DESTINATIONS: Array<{ id: Destination; label: string; sub: string }> = [
  { id: "resort", label: "Resort & Beach", sub: "Sun-soaked days, easy evenings" },
  { id: "city-evening", label: "City Evening", sub: "Reservations, openings, late hours" },
  { id: "travel-day", label: "Travel Day", sub: "Considered for transit, ready on arrival" },
  { id: "black-tie", label: "Black Tie", sub: "Formality with a point of view" },
];

const AESTHETICS: Array<{ id: Aesthetic; label: string; sub: string }> = [
  { id: "minimal", label: "Minimal", sub: "Restrained lines, quiet palette" },
  { id: "sculpted", label: "Sculpted", sub: "Architectural cut, presence" },
  { id: "easy", label: "Easy", sub: "Soft drape, unstudied" },
  { id: "bold", label: "Bold", sub: "Print, hardware, statement" },
];

/** Keywords used to surface complementary catalog candidates per destination. */
const DESTINATION_QUERIES: Record<Destination, string> = {
  resort: "sandal OR sunglasses OR kaftan OR linen",
  "city-evening": "heel OR clutch OR jacket OR silk",
  "travel-day": "loafer OR tote OR knit OR trouser",
  "black-tie": "evening OR clutch OR heel OR silk",
};

function pickFirstAvailableVariant(node: ShopifyProductNode) {
  const v = node.variants?.edges?.find((e) => e.node?.availableForSale)?.node
    ?? node.variants?.edges?.[0]?.node;
  if (!v) return null;
  return v;
}

function ProductRow({
  node,
  checked,
  onToggle,
  isSeed,
}: {
  node: ShopifyProductNode;
  checked: boolean;
  onToggle: () => void;
  isSeed?: boolean;
}) {
  const img = node.images?.edges?.[0]?.node;
  const variant = pickFirstAvailableVariant(node);
  const price = variant?.price ?? node.priceRange?.minVariantPrice;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group w-full flex items-stretch gap-4 p-3 border border-luxury-border bg-luxury-zinc text-left transition-colors hover:border-luxury-gold/60"
      aria-pressed={checked}
    >
      <div className="relative w-20 h-24 shrink-0 overflow-hidden bg-luxury-dark">
        {img ? (
          <img
            src={img.url}
            alt={img.altText ?? node.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          {isSeed ? (
            <div className="text-[9px] uppercase tracking-[0.32em] text-luxury-amber mb-1">
              The Piece
            </div>
          ) : (
            <div className="text-[9px] uppercase tracking-[0.32em] text-luxury-text-muted mb-1">
              {node.vendor}
            </div>
          )}
          <div className="font-serif text-[15px] leading-snug text-white truncate">
            {node.title}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-[11px] tracking-[0.18em] text-white">
            {price ? formatPrice(price) : ""}
          </div>
          <div
            className={`w-4 h-4 border ${checked ? "bg-luxury-gold border-luxury-gold" : "border-luxury-text-muted"}`}
            aria-hidden
          />
        </div>
      </div>
    </button>
  );
}

export default function CapsuleStylistDrawer() {
  const { isOpen, seed, close } = useCapsuleStylistStore();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openDrawer);
  const subscribe = useServerFn(subscribeNewsletter);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [aesthetic, setAesthetic] = useState<Aesthetic | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);

  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailMsg, setEmailMsg] = useState("");

  // Reset internal state when drawer closes.
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setDestination(null);
      setAesthetic(null);
      setChecked({});
      setEmail("");
      setEmailState("idle");
      setEmailMsg("");
    }
  }, [isOpen]);

  // Keyboard: ESC closes.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Live complementary candidates — only fetched once we have destination.
  const seedHandle = seed?.product.handle;
  const candidatesQ = useQuery({
    enabled: step === 3 && !!destination && !!seedHandle,
    queryKey: ["capsule-stylist", destination, aesthetic, seedHandle],
    queryFn: () =>
      fetchProducts({
        first: 24,
        sortKey: "BEST_SELLING",
        query: destination ? DESTINATION_QUERIES[destination] : undefined,
      }),
  });

  const complementary: ShopifyProduct[] = useMemo(() => {
    const list = candidatesQ.data ?? [];
    return list
      .filter((e) => e.node.handle !== seedHandle)
      .filter((e) => !!pickFirstAvailableVariant(e.node))
      .slice(0, 3);
  }, [candidatesQ.data, seedHandle]);

  // Default-check seed + all complementary when they land.
  useEffect(() => {
    if (step !== 3 || !seed) return;
    setChecked((prev) => {
      const next = { ...prev };
      if (next[seed.product.handle] === undefined) next[seed.product.handle] = true;
      for (const e of complementary) {
        if (next[e.node.handle] === undefined) next[e.node.handle] = true;
      }
      return next;
    });
  }, [step, seed, complementary]);

  if (!isOpen || !seed) return null;

  const selectedCount = Object.values(checked).filter(Boolean).length;

  async function handleAddCapsule() {
    if (!seed) return;
    setAdding(true);
    try {
      let added = 0;
      // Seed product (use the variant the PDP passed in).
      if (checked[seed.product.handle]) {
        const ok = await addItem({
          product: { node: seed.product },
          variantId: seed.variantId,
          variantTitle: seed.variantTitle,
          price: seed.price,
          quantity: 1,
          selectedOptions: seed.selectedOptions,
        });
        if (ok) added++;
      }
      // Complementary — first available variant of each.
      for (const e of complementary) {
        if (!checked[e.node.handle]) continue;
        const v = pickFirstAvailableVariant(e.node);
        if (!v) continue;
        const ok = await addItem({
          product: e,
          variantId: v.id,
          variantTitle: v.title,
          price: v.price,
          quantity: 1,
          selectedOptions: v.selectedOptions ?? [],
        });
        if (ok) added++;
      }
      if (added === 0) {
        toast.error("Could not add the capsule to bag.");
        return;
      }
      toast.success(`${added} piece${added === 1 ? "" : "s"} added to bag.`);
      // Leave drawer open so the optional newsletter tail is still reachable.
      // Cart drawer slides in over it.
      openCart();
    } finally {
      setAdding(false);
    }
  }

  async function handleSubscribe() {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailState("error");
      setEmailMsg("Please enter a valid email.");
      return;
    }
    setEmailState("sending");
    setEmailMsg("");
    try {
      const res = (await subscribe({
        data: {
          email: trimmed,
          source: "capsule_stylist",
          marketingConsent: true,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        },
      })) as { ok: boolean; pending?: boolean; already?: boolean };
      if (res?.ok) {
        setEmailState("sent");
        setEmailMsg(
          res.already
            ? "You're already on the list."
            : "Check your inbox to confirm.",
        );
      } else {
        setEmailState("error");
        setEmailMsg("Something went wrong. Please try again.");
      }
    } catch {
      setEmailState("error");
      setEmailMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <div
      className="luxury fixed inset-0 z-[80]"
      role="dialog"
      aria-modal="true"
      aria-label="Capsule Stylist"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close Capsule Stylist"
        onClick={close}
        className="absolute inset-0 bg-black/70 luxury-blur-overlay animate-luxury-fade-in"
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-luxury-dark border-l border-luxury-border text-white flex flex-col animate-luxury-slide-left shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-luxury-border">
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-luxury-amber">
              Capsule Stylist
            </div>
            <div className="font-serif text-2xl mt-1">Complete the look</div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="w-9 h-9 inline-flex items-center justify-center border border-luxury-border hover:border-luxury-gold transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.25} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 border-b border-luxury-border flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-px flex-1 transition-colors ${n <= step ? "bg-luxury-gold" : "bg-luxury-border"}`}
              aria-hidden
            />
          ))}
          <span className="text-[10px] uppercase tracking-[0.32em] text-luxury-text-muted ml-2">
            {step} / 3
          </span>
        </div>

        {/* Body */}
        <div
          className="flex-1 overflow-y-auto px-6 py-6"
          aria-live="polite"
        >
          {step === 1 ? (
            <div className="animate-luxury-fade-in">
              <div className="text-[10px] uppercase tracking-[0.32em] text-luxury-text-muted mb-2">
                Step One
              </div>
              <h2 className="font-serif text-xl mb-6">Where are you wearing it?</h2>
              <div className="grid grid-cols-1 gap-3">
                {DESTINATIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setDestination(d.id);
                      setStep(2);
                    }}
                    className={`text-left p-4 border transition-colors ${
                      destination === d.id
                        ? "border-luxury-gold bg-luxury-zinc"
                        : "border-luxury-border hover:border-luxury-gold/60"
                    }`}
                  >
                    <div className="font-serif text-lg">{d.label}</div>
                    <div className="text-[11px] text-luxury-text-muted mt-1">{d.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="animate-luxury-fade-in">
              <div className="text-[10px] uppercase tracking-[0.32em] text-luxury-text-muted mb-2">
                Step Two
              </div>
              <h2 className="font-serif text-xl mb-6">What's the silhouette?</h2>
              <div className="grid grid-cols-2 gap-3">
                {AESTHETICS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setAesthetic(a.id);
                      setStep(3);
                    }}
                    className={`text-left p-4 border transition-colors ${
                      aesthetic === a.id
                        ? "border-luxury-gold bg-luxury-zinc"
                        : "border-luxury-border hover:border-luxury-gold/60"
                    }`}
                  >
                    <div className="font-serif text-base">{a.label}</div>
                    <div className="text-[10.5px] text-luxury-text-muted mt-1">{a.sub}</div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-6 text-[10px] uppercase tracking-[0.32em] text-luxury-text-muted hover:text-luxury-gold transition-colors"
              >
                ← Back
              </button>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="animate-luxury-fade-in">
              <div className="text-[10px] uppercase tracking-[0.32em] text-luxury-text-muted mb-2">
                Your Capsule
              </div>
              <h2 className="font-serif text-xl mb-1">
                {DESTINATIONS.find((d) => d.id === destination)?.label}
                {aesthetic ? ` · ${AESTHETICS.find((a) => a.id === aesthetic)?.label}` : ""}
              </h2>
              <p className="text-[12px] text-luxury-text-muted mb-6">
                Built around the piece you're viewing. Untick anything you'd rather leave behind.
              </p>

              <div className="space-y-3">
                {/* Seed */}
                <ProductRow
                  node={seed.product}
                  isSeed
                  checked={!!checked[seed.product.handle]}
                  onToggle={() =>
                    setChecked((p) => ({
                      ...p,
                      [seed.product.handle]: !p[seed.product.handle],
                    }))
                  }
                />

                {/* Complementary */}
                {candidatesQ.isLoading ? (
                  <div className="text-[11px] uppercase tracking-[0.32em] text-luxury-text-muted py-6 text-center animate-luxury-pulse-slow">
                    Curating the capsule…
                  </div>
                ) : complementary.length === 0 ? (
                  <div className="text-[12px] text-luxury-text-muted py-4">
                    The boutique is refreshing — try another destination or close and reopen.
                  </div>
                ) : (
                  complementary.map((e) => (
                    <ProductRow
                      key={e.node.handle}
                      node={e.node}
                      checked={!!checked[e.node.handle]}
                      onToggle={() =>
                        setChecked((p) => ({
                          ...p,
                          [e.node.handle]: !p[e.node.handle],
                        }))
                      }
                    />
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-6 text-[10px] uppercase tracking-[0.32em] text-luxury-text-muted hover:text-luxury-gold transition-colors"
              >
                ← Refine silhouette
              </button>

              {/* Optional newsletter tail — never a gate. */}
              <div className="mt-8 pt-6 border-t border-luxury-border">
                <div className="text-[10px] uppercase tracking-[0.32em] text-luxury-amber mb-2">
                  Save this edit
                </div>
                <p className="text-[12px] text-luxury-text-muted mb-3">
                  Early access to new arrivals and the occasional considered edit. Optional.
                </p>
                {emailState === "sent" ? (
                  <p className="text-[12px] text-luxury-gold">{emailMsg}</p>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSubscribe();
                    }}
                    className="flex items-stretch gap-2"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      aria-label="Email address"
                      className="flex-1 bg-transparent border border-luxury-border px-3 py-2 text-[13px] text-white placeholder:text-luxury-text-muted focus:border-luxury-gold focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={emailState === "sending"}
                      className="px-4 text-[10px] uppercase tracking-[0.32em] border border-luxury-border hover:border-luxury-gold transition-colors disabled:opacity-50"
                    >
                      {emailState === "sending" ? "…" : "Save"}
                    </button>
                  </form>
                )}
                {emailState === "error" ? (
                  <p className="text-[11px] text-luxury-amber mt-2">{emailMsg}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer — primary CTA only visible on step 3 */}
        {step === 3 ? (
          <div className="px-6 py-5 border-t border-luxury-border bg-luxury-dark">
            <button
              type="button"
              onClick={() => void handleAddCapsule()}
              disabled={adding || selectedCount === 0}
              className="w-full h-12 bg-white text-luxury-dark text-[11px] uppercase tracking-[0.32em] hover:bg-luxury-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding
                ? "Adding…"
                : selectedCount === 0
                  ? "Select at least one piece"
                  : `Add capsule to bag (${selectedCount})`}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
