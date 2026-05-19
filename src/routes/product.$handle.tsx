import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  fetchProductByHandle,
  fetchProducts,
  formatPrice,
  type ShopifyVariant,
  type Money,
} from "@/lib/shopify";
import { useCartStore } from "@/stores/cart-store";
import { Loader2, Minus, Plus, ShieldCheck, Truck, RotateCcw, Lock } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/product-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/product/$handle")({
  head: ({ params }) => ({
    meta: [
      { title: `${humanize(params.handle)} — Palace of Roman` },
      { property: "og:title", content: `${humanize(params.handle)} — Palace of Roman` },
    ],
  }),
  component: ProductPage,
});

function humanize(h: string) {
  return h.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProductPage() {
  const { handle } = Route.useParams();

  const productQ = useQuery({
    queryKey: ["product", handle],
    queryFn: () => fetchProductByHandle(handle),
  });

  if (productQ.isLoading) return <ProductSkeleton />;
  if (!productQ.data) throw notFound();

  return <ProductView product={productQ.data} />;
}

function discountPct(price: Money, compareAt?: Money) {
  if (!compareAt) return 0;
  const p = parseFloat(price.amount);
  const c = parseFloat(compareAt.amount);
  if (!isFinite(p) || !isFinite(c) || c <= p) return 0;
  return Math.round(((c - p) / c) * 100);
}

const COLOR_SWATCH: Record<string, string> = {
  black: "#0a0a0a", white: "#fafafa", ivory: "#f5f0e6", cream: "#efe7d6",
  beige: "#d9c7a5", tan: "#c2a378", camel: "#b48a5a", brown: "#6b432a",
  chocolate: "#3d2418", grey: "#9aa0a6", gray: "#9aa0a6", silver: "#c8c8c8",
  red: "#b8231e", burgundy: "#5b1722", pink: "#e8b6c2", rose: "#d99a9a",
  orange: "#d96a2e", yellow: "#d9b13c", gold: "#bf9b48",
  green: "#3a6b3a", olive: "#5d5a2a", sage: "#9aae8a", teal: "#1f6d6e",
  blue: "#2456a8", navy: "#1b2742", denim: "#3c5f88",
  purple: "#5b2a72", violet: "#7b4ea3",
  multicolor: "linear-gradient(135deg,#ec4899 0%,#f59e0b 35%,#22d3ee 70%,#a78bfa 100%)",
};

function swatchFor(label: string): string {
  const k = label.trim().toLowerCase();
  if (COLOR_SWATCH[k]) return COLOR_SWATCH[k];
  const first = k.split(/\s|\//)[0];
  return COLOR_SWATCH[first] ?? "#e5e7eb";
}

function ProductView({
  product,
}: {
  product: NonNullable<Awaited<ReturnType<typeof fetchProductByHandle>>>;
}) {
  const images = product.images.edges.map((e) => e.node);
  const variants = product.variants.edges.map((e) => e.node);
  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(firstAvailable?.id);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? firstAvailable,
    [variants, selectedVariantId, firstAvailable],
  );

  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);

  const compareAt = product.compareAtPriceRange?.minVariantPrice;
  const currentPrice = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const off = discountPct(currentPrice, compareAt);

  const handleAdd = async () => {
    if (!selectedVariant) return;
    if (!selectedVariant.availableForSale) {
      toast.error("This variant is currently unavailable.");
      return;
    }
    for (let i = 0; i < quantity; i++) {
      await addItem({
        product: { node: product },
        variantId: selectedVariant.id,
        variantTitle: selectedVariant.title,
        price: selectedVariant.price,
        quantity: 1,
        selectedOptions: selectedVariant.selectedOptions ?? [],
      });
    }
    toast.success(quantity === 1 ? "Added to bag" : `${quantity} added to bag`);
  };

  const relatedQ = useQuery({
    queryKey: ["related", product.vendor, product.handle],
    queryFn: () => fetchProducts({ first: 8, query: `vendor:${product.vendor}` }),
  });
  const related = (relatedQ.data ?? [])
    .filter((e) => e.node.handle !== product.handle)
    .slice(0, 4);

  const vendorHandle = product.vendor.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return (
    <div>
      {/* Breadcrumb */}
      <div className="px-6 pt-8">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <Link to="/" className="hover:text-ink">Boutique</Link>
          <span className="opacity-40">/</span>
          <Link
            to="/collections/$handle"
            params={{ handle: vendorHandle }}
            className="hover:text-ink"
          >
            {product.vendor}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-ink/70 truncate max-w-[40ch]">{product.title}</span>
        </div>
      </div>

      <div className="px-6 pt-8 pb-16">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-10 lg:gap-16">
          {/* ===== Gallery ===== */}
          <div>
            {/* Mobile: snap carousel */}
            <div className="lg:hidden -mx-6">
              <div
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                onScroll={(e) => {
                  const w = (e.target as HTMLDivElement).clientWidth;
                  setActiveImg(Math.round((e.target as HTMLDivElement).scrollLeft / w));
                }}
              >
                {(images.length ? images : [{ url: "", altText: product.title }]).map((img, i) => (
                  <div key={i} className="min-w-full snap-center aspect-[4/5] bg-muted overflow-hidden">
                    {img.url && (
                      <img
                        src={img.url}
                        alt={img.altText ?? product.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
              {images.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 transition-all ${
                        i === activeImg ? "w-8 bg-ink" : "w-4 bg-ink/20"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: editorial grid */}
            <div className="hidden lg:grid grid-cols-2 gap-3">
              {images.length === 0 ? (
                <div className="col-span-2 w-full aspect-[4/5] bg-muted" />
              ) : (
                images.map((img, i) => {
                  const fullBleed = i === 0 || (i % 5 === 0 && i > 0);
                  return (
                    <div
                      key={img.url}
                      className={`bg-muted overflow-hidden ${
                        fullBleed ? "col-span-2 aspect-[4/5]" : "aspect-[3/4]"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.altText ?? product.title}
                        className="w-full h-full object-cover transition-transform duration-[1200ms] hover:scale-[1.02]"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ===== Info column ===== */}
          <div className="lg:sticky lg:top-28 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2 lg:-mr-2">
            <Link
              to="/collections/$handle"
              params={{ handle: vendorHandle }}
              className="inline-block text-[10px] uppercase tracking-[0.3em] text-bronze hover:text-ink mb-4"
            >
              {product.vendor}
            </Link>
            <h1 className="text-3xl md:text-4xl font-serif leading-[1.05] mb-6 text-balance">
              {product.title}
            </h1>

            {/* Price row */}
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-2xl md:text-[1.7rem] font-serif">{formatPrice(currentPrice)}</span>
              {off > 0 && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(compareAt!)}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 bg-bronze/10 text-bronze">
                    {off}% Off
                  </span>
                </>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-8">
              Import duties included · Worldwide delivery
            </p>

            {/* Variant selectors */}
            {product.options
              .filter((o) => o.values.length > 1 || o.name.toLowerCase() !== "title")
              .map((option) => (
                <VariantOption
                  key={option.name}
                  option={option}
                  variants={variants}
                  selected={selectedVariant}
                  onSelect={(v) => setSelectedVariantId(v.id)}
                />
              ))}

            {/* Quantity + CTA */}
            <div className="flex gap-3 mt-6">
              <div className="flex items-center border border-ink/15">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 h-14 hover:bg-ink/5"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="px-3 h-14 hover:bg-ink/5"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                onClick={handleAdd}
                disabled={isLoading || !selectedVariant?.availableForSale}
                className="flex-1 h-14 bg-ink text-canvas hover:bg-bronze transition-colors text-[11px] uppercase tracking-[0.3em] font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : !selectedVariant?.availableForSale ? (
                  "Sold Out"
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    Add to Bag — {formatPrice({
                      amount: (parseFloat(currentPrice.amount) * quantity).toString(),
                      currencyCode: currentPrice.currencyCode,
                    })}
                  </>
                )}
              </button>
            </div>

            {/* Trust strip */}
            <ul className="mt-8 grid grid-cols-3 gap-2 border-y border-ink/10 py-5">
              <TrustItem icon={ShieldCheck} title="100% Authentic" sub="BrandsGateway sourced" />
              <TrustItem icon={Truck} title="Free Shipping" sub="On orders over $1,200" />
              <TrustItem icon={RotateCcw} title="90-Day Returns" sub="Independent authenticator" />
            </ul>

            {/* Accordions */}
            <Accordion type="multiple" defaultValue={["details"]} className="mt-8">
              {product.description && (
                <AccordionItem value="details" className="border-ink/10">
                  <AccordionTrigger className="text-[10px] uppercase tracking-[0.25em] hover:no-underline py-5">
                    Description
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {product.description}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}
              <AccordionItem value="sizing" className="border-ink/10">
                <AccordionTrigger className="text-[10px] uppercase tracking-[0.25em] hover:no-underline py-5">
                  Sizing & Fit
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Pieces are sized to the maison's standard. If you sit between two sizes, we
                    recommend sizing up for relaxed silhouettes and down for tailored cuts. Reach
                    out via{" "}
                    <Link to="/contact" className="underline underline-offset-4 hover:text-ink">
                      concierge
                    </Link>{" "}
                    for a personal fit check before ordering.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping" className="border-ink/10">
                <AccordionTrigger className="text-[10px] uppercase tracking-[0.25em] hover:no-underline py-5">
                  Shipping & Delivery
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Dispatched sealed from a brand-authorised European warehouse within 1–3
                    business days. Express courier with full tracking; import duties and taxes
                    handled on your behalf. Full details on the{" "}
                    <Link
                      to="/shipping-returns"
                      className="underline underline-offset-4 hover:text-ink"
                    >
                      Shipping & Returns
                    </Link>{" "}
                    page.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="auth" className="border-ink/10 border-b">
                <AccordionTrigger className="text-[10px] uppercase tracking-[0.25em] hover:no-underline py-5">
                  Authenticity & Returns
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Every piece is 100% authentic, sourced from the brands or their authorised
                    distributors as an official BrandsGateway partner. If any independent
                    authenticator finds otherwise within 90 days, Palace of Roman issues a full
                    refund — no questions. See{" "}
                    <Link
                      to="/authentication"
                      className="underline underline-offset-4 hover:text-ink"
                    >
                      our authenticity guarantee
                    </Link>
                    .
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* ===== More from vendor ===== */}
        {related.length > 0 && (
          <section className="max-w-screen-2xl mx-auto mt-28 pt-16 border-t border-ink/10">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-2">
                  The Edit
                </p>
                <h2 className="text-2xl md:text-3xl font-serif">More from {product.vendor}</h2>
              </div>
              <Link
                to="/collections/$handle"
                params={{ handle: vendorHandle }}
                className="hidden md:inline-block text-[10px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
              >
                View all {product.vendor}
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {related.map((e) => (
                <ProductCard key={e.node.id} product={e} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof ShieldCheck;
  title: string;
  sub: string;
}) {
  return (
    <li className="flex flex-col items-center text-center gap-1.5">
      <Icon className="h-4 w-4 text-bronze" strokeWidth={1.5} />
      <span className="text-[10px] uppercase tracking-[0.2em] leading-tight">{title}</span>
      <span className="text-[9px] text-muted-foreground leading-tight">{sub}</span>
    </li>
  );
}

function VariantOption({
  option,
  variants,
  selected,
  onSelect,
}: {
  option: { name: string; values: string[] };
  variants: ShopifyVariant[];
  selected?: ShopifyVariant;
  onSelect: (v: ShopifyVariant) => void;
}) {
  const selectedValue = selected?.selectedOptions.find((o) => o.name === option.name)?.value;
  const isColor = /colou?r/i.test(option.name);
  const isSize = /size/i.test(option.name);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-3">
        <p className="text-[10px] uppercase tracking-[0.25em] font-medium">
          {option.name}
          {selectedValue && (
            <span className="ml-2 text-muted-foreground font-normal normal-case tracking-normal">
              · {selectedValue}
            </span>
          )}
        </p>
        {isSize && (
          <button
            type="button"
            onClick={() => toast("Sizing guide coming soon — message concierge for a fit check.")}
            className="text-[10px] uppercase tracking-[0.2em] text-bronze hover:text-ink underline-offset-4 hover:underline"
          >
            Size Guide
          </button>
        )}
      </div>
      <div className={`flex flex-wrap gap-2 ${isColor ? "items-center" : ""}`}>
        {option.values.map((value) => {
          const candidate =
            variants.find((v) => {
              if (!selected) return v.selectedOptions.some((o) => o.name === option.name && o.value === value);
              return v.selectedOptions.every((o) =>
                o.name === option.name
                  ? o.value === value
                  : selected.selectedOptions.find((so) => so.name === o.name)?.value === o.value,
              );
            }) ??
            variants.find((v) => v.selectedOptions.some((o) => o.name === option.name && o.value === value));
          const active = selectedValue === value;
          const unavailable = candidate && !candidate.availableForSale;

          if (isColor) {
            return (
              <button
                key={value}
                onClick={() => candidate && onSelect(candidate)}
                disabled={!candidate}
                title={value + (unavailable ? " — sold out" : "")}
                className={`relative h-9 w-9 rounded-full border transition-all ${
                  active
                    ? "border-ink ring-2 ring-offset-2 ring-ink/30"
                    : "border-ink/20 hover:border-ink/60"
                } ${unavailable ? "opacity-40" : ""}`}
                style={{ background: swatchFor(value) }}
              >
                <span className="sr-only">{value}</span>
                {unavailable && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px]">
                    ✕
                  </span>
                )}
              </button>
            );
          }
          return (
            <button
              key={value}
              onClick={() => candidate && onSelect(candidate)}
              disabled={!candidate}
              className={`min-w-[3rem] h-11 px-4 text-xs uppercase tracking-widest border transition-colors ${
                active ? "border-ink bg-ink text-canvas" : "border-ink/15 hover:border-ink"
              } ${unavailable ? "line-through opacity-50" : ""}`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="px-6 py-12 max-w-screen-2xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-12 lg:gap-16">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 aspect-[4/5] bg-muted animate-pulse" />
          <div className="aspect-[3/4] bg-muted animate-pulse" />
          <div className="aspect-[3/4] bg-muted animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-3 w-24 bg-muted animate-pulse" />
          <div className="h-10 w-3/4 bg-muted animate-pulse" />
          <div className="h-6 w-32 bg-muted animate-pulse" />
          <div className="h-14 w-full bg-muted animate-pulse mt-8" />
        </div>
      </div>
    </div>
  );
}
