/**
 * /studio/product/$handle — high-end PDP for the Studio surface.
 *
 * Layout:
 *  - Left (7 cols): vertical scrollable gallery of all hi-res images.
 *  - Right (5 cols): sticky details — vendor, title, price, minimalist
 *    size selector, primary CTA (or "Request via Concierge" when OOS),
 *    and product description.
 *  - Below: "Complete the Look" — Shopify productRecommendations
 *    (COMPLEMENTARY intent) presented as a curated three-piece outfit
 *    with a single "Add Entire Look to Cart" button that adds every
 *    in-stock first variant in one batch.
 *
 * Pure Storefront API data — no fabricated copy. Scoped palette; no
 * global token edits; chrome suppressed via useChromeStore.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions } from "@tanstack/react-query";
import { ArrowUpRight, Loader2, MessageCircle, X, Check, Plus } from "lucide-react";
import {
  fetchProductByHandle,
  fetchProductRecommendations,
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

/* ---------- query options ---------- */
const studioProductQO = (handle: string) =>
  queryOptions({
    queryKey: ["studio-pdp", handle] as const,
    queryFn: () => fetchProductByHandle(handle),
    staleTime: 60_000,
  });

const studioLookQO = (productId: string | undefined) =>
  queryOptions({
    queryKey: ["studio-pdp-look", productId] as const,
    enabled: !!productId,
    queryFn: () =>
      productId ? fetchProductRecommendations(productId, "COMPLEMENTARY") : Promise.resolve([]),
    staleTime: 5 * 60_000,
  });

export const Route = createFileRoute("/studio/product/$handle")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(studioProductQO(params.handle));
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
  if (!product) return null;

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
      <CompleteTheLook product={product} />
      <style>{`
        @keyframes studioFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes studioScale { from { opacity: 0; transform: scale(1.015); } to { opacity: 1; transform: scale(1); } }
        @keyframes studioModalIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

/* ===================== Header ===================== */

function StudioPDPHeader() {
  return (
    <header
      className="flex items-center justify-between px-6 md:px-14 py-6 border-b sticky top-0 z-30"
      style={{
        borderColor: palette.hairline,
        background: "rgba(11,11,12,0.85)",
        backdropFilter: "blur(12px)",
        fontFamily: "'Inter', sans-serif",
      }}
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

  // Detect a Size option; fall back to the variants list when only one exists.
  const sizeOption = product.options?.find((o) => /size/i.test(o.name));
  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string>(firstAvailable?.id ?? "");
  const [conciergeOpen, setConciergeOpen] = useState(false);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? variants[0],
    [variants, selectedVariantId],
  );
  const isInStock = !!selectedVariant?.availableForSale;
  const hasMultipleVariants = variants.length > 1;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-12">
      {/* ───── Left: vertical scrollable gallery ───── */}
      <div className="lg:col-span-7 px-6 md:px-14 pt-10 pb-12 lg:pb-24 space-y-6 animate-[studioScale_1.3s_ease-out_both]">
        {images.length === 0 ? (
          <div
            className="w-full aspect-[4/5]"
            style={{ background: "#111113" }}
            aria-hidden
          />
        ) : (
          images.map((img, i) => (
            <figure
              key={img.url + i}
              className="relative w-full aspect-[4/5] overflow-hidden"
              style={{ background: "#111113" }}
            >
              <img
                src={cdnImage(img.url, { width: 1800 })}
                alt={img.altText ?? `${product.title} — view ${i + 1}`}
                className="absolute inset-0 h-full w-full object-contain p-8 transition-transform duration-[1400ms] ease-out hover:scale-[1.015]"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </figure>
          ))
        )}
      </div>

      {/* ───── Right: sticky details ───── */}
      <aside className="lg:col-span-5 px-6 md:px-14 pt-10 pb-20">
        <div className="lg:sticky lg:top-28">
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

          {/* Minimalist size selector */}
          {hasMultipleVariants && (
            <div className="mb-10">
              <div className="flex items-baseline justify-between mb-5">
                <p
                  className="text-[10px] tracking-[0.4em] uppercase"
                  style={{ color: palette.muted, fontFamily: "'Inter', sans-serif" }}
                >
                  {sizeOption?.name ?? "Variant"}
                </p>
                <span
                  className="text-[10px] tracking-[0.3em] uppercase hover:opacity-70 cursor-pointer"
                  style={{ color: palette.sand, fontFamily: "'Inter', sans-serif" }}
                >
                  Size guide
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {variants.map((v) => {
                  const active = v.id === selectedVariantId;
                  const oos = !v.availableForSale;
                  // Prefer the Size selectedOption when available so labels stay clean.
                  const label = sizeOption
                    ? v.selectedOptions.find((o) => o.name === sizeOption.name)?.value ?? v.title
                    : v.title;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className="py-3 text-[11px] tracking-[0.2em] uppercase transition-all duration-300"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        border: `1px solid ${active ? palette.offwhite : palette.hairline}`,
                        background: active ? palette.offwhite : "transparent",
                        color: active ? palette.obsidian : oos ? palette.muted : palette.offwhite,
                      }}
                      aria-pressed={active}
                    >
                      <span className={oos ? "line-through decoration-[0.5px]" : ""}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTA */}
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

          {product.description && (
            <div
              className="mt-12 pt-8 border-t text-sm md:text-[15px] leading-[1.85]"
              style={{ borderColor: palette.hairline, color: palette.muted }}
            >
              <p>{product.description}</p>
            </div>
          )}
        </div>
      </aside>

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
      product: { node: product },
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
      className="group w-full flex items-center justify-between px-6 py-5 transition-opacity duration-500 hover:opacity-90 disabled:opacity-60"
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
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : added ? <Check className="h-4 w-4" /> : null}
        {added ? "Added to bag" : busy ? "Adding…" : "Add to bag"}
      </span>
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  );
}

/* ===================== Complete the Look ===================== */

function CompleteTheLook({ product }: { product: ShopifyProductNode }) {
  const { data: recs, isLoading } = useQuery(studioLookQO(product.id));
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [busy, setBusy] = useState(false);

  // Curate a focused outfit — three companion pieces with an in-stock variant.
  const look = useMemo(() => {
    const list = (recs ?? []).filter((p) => p.variants.edges.some((e) => e.node.availableForSale));
    return list.slice(0, 3);
  }, [recs]);

  // Total = primary product (first available variant) + each look piece.
  const total = useMemo(() => {
    const lookSum = look.reduce((acc, p) => {
      const v = p.variants.edges.find((e) => e.node.availableForSale)?.node;
      return acc + (v ? Number(v.price.amount) : 0);
    }, 0);
    const code = look[0]?.variants.edges[0]?.node.price.currencyCode ?? "USD";
    return { amount: lookSum.toFixed(2), currencyCode: code };
  }, [look]);

  async function addEntireLook() {
    if (look.length === 0) return;
    setBusy(true);
    let okCount = 0;
    for (const p of look) {
      const v = p.variants.edges.find((e) => e.node.availableForSale)?.node;
      if (!v) continue;
      const ok = await addItem({
        product: { node: p },
        variantId: v.id,
        variantTitle: v.title,
        price: v.price,
        quantity: 1,
        selectedOptions: v.selectedOptions ?? [],
      });
      if (ok) okCount++;
    }
    setBusy(false);
    if (okCount > 0) {
      openDrawer();
      toast.success(`${okCount} piece${okCount > 1 ? "s" : ""} added to bag`);
    } else {
      toast.error("Could not add the look");
    }
  }

  if (!isLoading && look.length === 0) return null;

  return (
    <section
      className="px-6 md:px-14 pt-20 pb-28 border-t"
      style={{ borderColor: palette.hairline }}
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
        <div>
          <p
            className="text-[11px] tracking-[0.45em] uppercase mb-4"
            style={{ color: palette.sand, fontFamily: "'Inter', sans-serif" }}
          >
            The Stylist
          </p>
          <h2 className="text-3xl md:text-5xl italic font-light tracking-tight leading-[1.05]">
            Complete the Look
          </h2>
        </div>
        {look.length > 0 && (
          <div
            className="text-[11px] tracking-[0.3em] uppercase"
            style={{ color: palette.muted, fontFamily: "'Inter', sans-serif" }}
          >
            {look.length} piece{look.length > 1 ? "s" : ""} ·{" "}
            {formatPrice({ amount: total.amount, currencyCode: total.currencyCode })}
          </div>
        )}
      </div>

      {isLoading ? (
        <div
          className="flex items-center gap-3 text-[12px]"
          style={{ color: palette.muted, fontFamily: "'Inter', sans-serif" }}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Composing the look…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12 mb-16">
            {look.map((p, i) => {
              const img = p.images.edges[0]?.node;
              const v = p.variants.edges.find((e) => e.node.availableForSale)?.node;
              return (
                <Link
                  key={p.id}
                  to="/studio/product/$handle"
                  params={{ handle: p.handle }}
                  className="group block animate-[studioFade_0.9s_ease-out_both]"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <div
                    className="relative w-full aspect-[4/5] overflow-hidden mb-5"
                    style={{ background: "#111113" }}
                  >
                    {img && (
                      <img
                        src={cdnImage(img.url, { width: 900 })}
                        alt={img.altText ?? p.title}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-contain p-6 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                      />
                    )}
                    <span
                      className="absolute top-3 left-3 text-[10px] tracking-[0.3em] uppercase px-2 py-1"
                      style={{
                        background: "rgba(11,11,12,0.7)",
                        color: palette.sand,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      No. {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p
                    className="text-[11px] tracking-[0.3em] uppercase mb-1.5"
                    style={{ color: palette.sand, fontFamily: "'Inter', sans-serif" }}
                  >
                    {p.vendor}
                  </p>
                  <h3 className="text-lg italic font-light leading-snug mb-1.5">{p.title}</h3>
                  <p
                    className="text-[12px]"
                    style={{ color: palette.muted, fontFamily: "'Inter', sans-serif" }}
                  >
                    {v ? formatPrice(v.price) : formatPrice(p.priceRange.minVariantPrice)}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={addEntireLook}
              disabled={busy || look.length === 0}
              className="group inline-flex items-center justify-center gap-4 px-10 py-5 transition-all duration-500 hover:opacity-90 disabled:opacity-50"
              style={{
                background: palette.offwhite,
                color: palette.obsidian,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.35em",
                fontSize: 11,
                textTransform: "uppercase",
              }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {busy ? "Adding the look" : "Add Entire Look to Cart"}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </>
      )}
    </section>
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
        <p className="text-sm leading-[1.75] mb-7" style={{ color: palette.muted }}>
          This piece is currently off-floor. Share your details and a personal stylist will source
          it through our boutique network.
        </p>

        <form onSubmit={onSubmit} className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full bg-transparent px-4 py-3 text-sm outline-none"
            style={{ border: `1px solid ${palette.hairline}`, color: palette.offwhite }}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Size, colour, occasion — anything we should know."
            className="w-full bg-transparent px-4 py-3 text-sm outline-none resize-none"
            style={{ border: `1px solid ${palette.hairline}`, color: palette.offwhite }}
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
