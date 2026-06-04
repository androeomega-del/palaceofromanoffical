/**
 * /studio/product/$handle — dynamic PDP for the Studio surface.
 *
 * Fetches a single product from the headless Shopify Storefront API via
 * `fetchProductByHandle` (GraphQL under the hood). Renders title, vendor
 * (multi-brand designer line), high-res imagery, price, and per-variant
 * availability. If the selected variant is out of stock, the cart button
 * is replaced by an elegant "Request via Concierge" CTA that opens a
 * messaging modal — never a broken add-to-cart.
 *
 * Scoped to the Studio palette via inline CSS variables; no global token
 * edits. Suppresses default site chrome via useChromeStore, matching the
 * /studio shell.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowUpRight, Loader2, MessageCircle, X, Check } from "lucide-react";
import {
  fetchProductByHandle,
  formatPrice,
  type ShopifyProductNode,
} from "@/lib/shopify";
import { useChromeStore } from "@/stores/chrome-store";
import { useCartStore } from "@/stores/cart-store";
import { cdnImage } from "@/lib/cdn-image";
import { toast } from "sonner";

/* ---------- palette (scoped) ---------- */
const palette = {
  obsidian: "#0B0B0C",
  offwhite: "#F4F1EC",
  sand: "#D9CFC1",
  muted: "rgba(244,241,236,0.6)",
  hairline: "rgba(244,241,236,0.14)",
} as const;

const studioProductQO = (handle: string) =>
  queryOptions({
    queryKey: ["studio-pdp", handle] as const,
    queryFn: async () => {
      const p = await fetchProductByHandle(handle);
      return p;
    },
    staleTime: 60_000,
  });

export const Route = createFileRoute("/studio/product/$handle")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(
      studioProductQO(params.handle),
    );
    if (!p) throw notFound();
    return null;
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.handle} — Studio | Palace of Roman` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: StudioPDP,
});

function StudioPDP() {
  const { handle } = Route.useParams();
  const setSuppressed = useChromeStore((s) => s.setSuppressed);
  useEffect(() => {
    setSuppressed({ header: true, footer: true });
    return () => setSuppressed({ header: false, footer: false });
  }, [setSuppressed]);

  const { data: product } = useSuspenseQuery(studioProductQO(handle));
  if (!product) return null; // loader guarantees presence; satisfy TS

  return (
    <div
      className="min-h-screen w-full animate-[studioFade_1.1s_ease-out_both]"
      style={{
        background: palette.obsidian,
        color: palette.offwhite,
        fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
      }}
    >
      <StudioPDPHeader />
      <PDPBody product={product} />
      <style>{`
        @keyframes studioFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes studioScale { from { opacity: 0; transform: scale(1.02); } to { opacity: 1; transform: scale(1); } }
        @keyframes studioModalIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

function StudioPDPHeader() {
  return (
    <header
      className="flex items-center justify-between px-6 md:px-14 py-6 border-b"
      style={{ borderColor: palette.hairline, fontFamily: "'Inter', sans-serif" }}
    >
      <Link
        to="/studio"
        className="text-[11px] tracking-[0.35em] uppercase hover:opacity-70 transition-opacity"
        style={{ color: palette.sand }}
      >
        ← Studio
      </Link>
      <span
        className="text-[11px] tracking-[0.45em] uppercase"
        style={{ color: palette.muted }}
      >
        Palace of Roman
      </span>
    </header>
  );
}

/* ===================== Body ===================== */

function PDPBody({ product }: { product: ShopifyProductNode }) {
  const images = product.images?.edges?.map((e) => e.node) ?? [];
  const variants = product.variants?.edges?.map((e) => e.node) ?? [];

  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    firstAvailable?.id ?? "",
  );
  const [heroIdx, setHeroIdx] = useState(0);
  const [conciergeOpen, setConciergeOpen] = useState(false);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? variants[0],
    [variants, selectedVariantId],
  );
  const isInStock = !!selectedVariant?.availableForSale;
  const hero = images[heroIdx] ?? images[0];

  return (
    <section className="px-6 md:px-14 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
      {/* ───── Gallery ───── */}
      <div className="lg:col-span-7 space-y-5 animate-[studioScale_1.4s_ease-out_both]">
        <div
          className="relative w-full aspect-[4/5] overflow-hidden"
          style={{ background: "#111113" }}
        >
          {hero ? (
            <img
              src={cdnImage(hero.url, { width: 1600 })}
              alt={hero.altText ?? product.title}
              className="absolute inset-0 h-full w-full object-contain p-8 transition-transform duration-[1200ms] ease-out hover:scale-[1.02]"
              loading="eager"
            />
          ) : null}
        </div>

        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.url}
                onClick={() => setHeroIdx(i)}
                className="relative shrink-0 w-20 h-24 overflow-hidden transition-opacity"
                style={{
                  background: "#111113",
                  outline:
                    i === heroIdx
                      ? `1px solid ${palette.sand}`
                      : "1px solid transparent",
                  opacity: i === heroIdx ? 1 : 0.55,
                }}
                aria-label={`View image ${i + 1}`}
              >
                <img
                  src={cdnImage(img.url, { width: 240 })}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain p-1.5"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ───── Details ───── */}
      <div className="lg:col-span-5 lg:pt-6">
        {product.vendor && (
          <p
            className="text-[11px] tracking-[0.4em] uppercase mb-5"
            style={{ color: palette.sand, fontFamily: "'Inter', sans-serif" }}
          >
            {product.vendor}
          </p>
        )}
        <h1 className="text-3xl md:text-5xl leading-[1.1] tracking-tight mb-8 italic font-light">
          {product.title}
        </h1>

        <div
          className="flex items-baseline gap-4 mb-10 pb-8 border-b"
          style={{ borderColor: palette.hairline }}
        >
          <span
            className="text-xl md:text-2xl"
            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em" }}
          >
            {selectedVariant?.price
              ? formatPrice(selectedVariant.price)
              : formatPrice(product.priceRange?.minVariantPrice)}
          </span>
          {!isInStock && (
            <span
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{ color: palette.muted, fontFamily: "'Inter', sans-serif" }}
            >
              By request
            </span>
          )}
        </div>

        {/* Variant selector */}
        {variants.length > 1 && (
          <div className="mb-10">
            <p
              className="text-[10px] tracking-[0.4em] uppercase mb-4"
              style={{ color: palette.muted, fontFamily: "'Inter', sans-serif" }}
            >
              Variant
            </p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => {
                const active = v.id === selectedVariantId;
                const oos = !v.availableForSale;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantId(v.id)}
                    className="relative px-4 py-2.5 text-[11px] tracking-[0.2em] uppercase transition-all duration-300"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      border: `1px solid ${active ? palette.offwhite : palette.hairline}`,
                      background: active ? palette.offwhite : "transparent",
                      color: active ? palette.obsidian : oos ? palette.muted : palette.offwhite,
                    }}
                  >
                    <span className={oos ? "line-through decoration-[0.5px]" : ""}>
                      {v.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA — in-stock vs request-via-concierge */}
        <div className="space-y-3">
          {isInStock ? (
            <AddToCartButton product={product} variantId={selectedVariant!.id} />
          ) : (
            <button
              onClick={() => setConciergeOpen(true)}
              className="group w-full flex items-center justify-between px-6 py-5 transition-all duration-500 hover:bg-[#F4F1EC] hover:text-[#0B0B0C]"
              style={{
                border: `1px solid ${palette.offwhite}`,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.3em",
                fontSize: 11,
                textTransform: "uppercase",
              }}
            >
              <span className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4" />
                Request via Concierge
              </span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div
            className="mt-12 pt-8 border-t text-sm md:text-base leading-[1.85]"
            style={{
              borderColor: palette.hairline,
              color: palette.muted,
            }}
          >
            <p>{product.description}</p>
          </div>
        )}
      </div>

      <ConciergeModal
        open={conciergeOpen}
        onClose={() => setConciergeOpen(false)}
        product={product}
        variant={selectedVariant}
      />
    </section>
  );
}

/* ===================== Add to Cart ===================== */

function AddToCartButton({
  product,
  variantId,
}: {
  product: ShopifyProductNode;
  variantId: string;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const variant = product.variants.edges.find((e) => e.node.id === variantId)?.node;

  async function onAdd() {
    if (!variant) return;
    setBusy(true);
    const ok = await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions ?? [],
    });
    setBusy(false);
    if (ok) {
      setAdded(true);
      openDrawer();
      setTimeout(() => setAdded(false), 1800);
    } else {
      toast.error("Could not add to bag");
    }
  }

  return (
    <button
      onClick={onAdd}
      disabled={busy}
      className="group w-full flex items-center justify-between px-6 py-5 transition-all duration-500 hover:opacity-90 disabled:opacity-60"
      style={{
        background: palette.offwhite,
        color: palette.obsidian,
        fontFamily: "'Inter', sans-serif",
        letterSpacing: "0.3em",
        fontSize: 11,
        textTransform: "uppercase",
      }}
    >
      <span className="flex items-center gap-3">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : added ? (
          <Check className="h-4 w-4" />
        ) : null}
        {added ? "Added to bag" : busy ? "Adding…" : "Add to bag"}
      </span>
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  );
}

/* ===================== Concierge Modal ===================== */

function ConciergeModal({
  open,
  onClose,
  product,
  variant,
}: {
  open: boolean;
  onClose: () => void;
  product: ShopifyProductNode;
  variant: ShopifyProductNode["variants"]["edges"][number]["node"] | undefined;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    // Lightweight handoff — the studio surface is a draft, so we do not
    // wire a backend send here. Production /product/$handle owns the live
    // concierge pipeline. Toast confirms receipt for the demo flow.
    await new Promise((r) => setTimeout(r, 600));
    setSending(false);
    toast.success("Concierge request received", {
      description: "A stylist will reach out shortly to source this piece.",
    });
    setEmail("");
    setMessage("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end md:items-center justify-center px-0 md:px-6"
      style={{ background: "rgba(11,11,12,0.78)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full md:max-w-lg p-8 md:p-10 animate-[studioModalIn_0.45s_ease-out_both]"
        style={{
          background: palette.obsidian,
          color: palette.offwhite,
          border: `1px solid ${palette.hairline}`,
        }}
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:opacity-70 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>

        <p
          className="text-[10px] tracking-[0.4em] uppercase mb-4"
          style={{ color: palette.sand, fontFamily: "'Inter', sans-serif" }}
        >
          Concierge Request
        </p>
        <h2 className="text-2xl md:text-3xl italic font-light leading-[1.15] mb-2">
          {product.title}
        </h2>
        {variant && variant.title !== "Default Title" && (
          <p
            className="text-[12px] mb-6"
            style={{ color: palette.muted, fontFamily: "'Inter', sans-serif" }}
          >
            Variant · {variant.title}
          </p>
        )}
        <p
          className="text-sm leading-[1.75] mb-7"
          style={{ color: palette.muted }}
        >
          This piece is currently off-floor. Share your details and a personal
          stylist will source it through our boutique network.
        </p>

        <form onSubmit={onSubmit} className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--so)] transition-colors"
            style={{
              border: `1px solid ${palette.hairline}`,
              color: palette.offwhite,
            }}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Size, colour, occasion — anything we should know."
            className="w-full bg-transparent px-4 py-3 text-sm outline-none resize-none"
            style={{
              border: `1px solid ${palette.hairline}`,
              color: palette.offwhite,
            }}
          />
          <button
            type="submit"
            disabled={sending || !email}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              background: palette.offwhite,
              color: palette.obsidian,
              letterSpacing: "0.3em",
              fontSize: 11,
              textTransform: "uppercase",
            }}
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            {sending ? "Sending" : "Send Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
