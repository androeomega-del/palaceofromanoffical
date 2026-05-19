import { createFileRoute, Link, notFound, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useMemo } from "react";

import {
  fetchProductByHandle,
  fetchProducts,
  formatPrice,
  type ShopifyVariant,
  type Money,
} from "@/lib/shopify";
import { pageTitle, metaDescription, absoluteUrl, SITE_URL } from "@/lib/seo";
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
  loader: async ({ params }) => {
    const p = await fetchProductByHandle(params.handle);
    return { product: p };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.product;
    const path = `/product/${params.handle}`;
    const url = absoluteUrl(path);

    if (!p) {
      return {
        meta: [{ title: pageTitle(humanize(params.handle)) }],
        links: [{ rel: "canonical", href: url }],
      };
    }

    const titleMain = p.vendor ? `${p.title} | ${p.vendor}` : p.title;
    const desc =
      metaDescription(p.description) ||
      `Shop ${p.title} by ${p.vendor} at Palace of Roman. 100% authentic, worldwide shipping.`;
    const img = p.images?.edges?.[0]?.node?.url;
    const price = p.priceRange?.minVariantPrice;
    const vendorSlug = (p.vendor || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const anyAvailable = p.variants.edges.some((v) => v.node.availableForSale);

    const meta = [
      { title: pageTitle(titleMain) },
      { name: "description", content: desc },
      { property: "og:title", content: pageTitle(titleMain) },
      { property: "og:description", content: desc },
      { property: "og:url", content: url },
      { property: "og:type", content: "product" },
    ];
    if (img) {
      meta.push({ property: "og:image", content: img });
      meta.push({ name: "twitter:image", content: img });
    }
    if (price) {
      meta.push({ property: "product:price:amount", content: price.amount });
      meta.push({ property: "product:price:currency", content: price.currencyCode });
    }

    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.title,
            description: metaDescription(p.description, 5000),
            sku: p.variants.edges[0]?.node?.id,
            image: p.images.edges.map((e) => e.node.url),
            brand: p.vendor ? { "@type": "Brand", name: p.vendor } : undefined,
            category: p.productType || undefined,
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: price?.currencyCode ?? "USD",
              price: price?.amount ?? "0",
              availability: anyAvailable
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
              seller: { "@type": "Organization", name: "Palace of Roman" },
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
              { "@type": "ListItem", position: 2, name: "Shop", item: SITE_URL + "/shop" },
              ...(p.vendor && vendorSlug
                ? [{
                    "@type": "ListItem",
                    position: 3,
                    name: p.vendor,
                    item: `${SITE_URL}/collections/${vendorSlug}`,
                  }]
                : []),
              {
                "@type": "ListItem",
                position: p.vendor && vendorSlug ? 4 : 3,
                name: p.title,
                item: url,
              },
            ],
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

function humanize(h: string) {
  return h.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ProductPage() {
  const { handle } = Route.useParams();
  const { product: initialProduct } = Route.useLoaderData();

  const productQ = useQuery({
    queryKey: ["product", handle],
    queryFn: () => fetchProductByHandle(handle),
    initialData: initialProduct,
  });

  if (productQ.isLoading && !initialProduct) return <ProductSkeleton />;
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
  const altBase = product.vendor ? `${product.title} — ${product.vendor}` : product.title;
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
  const openDrawer = useCartStore((s) => s.openDrawer);
  const isLoading = useCartStore((s) => s.isLoading);


  const compareAt = product.compareAtPriceRange?.minVariantPrice;
  const currentPrice = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const off = discountPct(currentPrice, compareAt);

  // Buy-Now hand-off from product cards: scroll to the selector + flash it.
  const buyRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [flashBuy, setFlashBuy] = useState(false);
  useEffect(() => {
    if (location.hash !== "buy" && location.hash !== "#buy") return;
    const el = buyRef.current;
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashBuy(true);
      window.setTimeout(() => setFlashBuy(false), 1600);
    }, 120);
    return () => window.clearTimeout(t);
  }, [location.hash]);


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
    openDrawer();
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
    <div className="studio">
      {/* Breadcrumb */}
      <div className="px-6 pt-10">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[var(--studio-muted)]">
          <Link to="/" className="hover:text-[var(--studio-ink)] transition-colors">Boutique</Link>
          <span className="opacity-40">/</span>
          <Link
            to="/collections/$handle"
            params={{ handle: vendorHandle }}
            className="hover:text-[var(--studio-ink)] transition-colors"
          >
            {product.vendor}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-[var(--studio-ink)] truncate max-w-[40ch]">{product.title}</span>
        </div>
      </div>

      <div className="px-6 md:px-12 pt-12 pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          {/* ===== Gallery — stacked editorial ===== */}
          <div className="lg:col-span-7">
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
                  <div key={i} className="min-w-full snap-center aspect-[3/4] bg-white overflow-hidden">
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
                        i === activeImg
                          ? "w-8 bg-[var(--studio-ink)]"
                          : "w-4 bg-[var(--studio-ink)]/20"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: stacked tall frames */}
            <div className="hidden lg:flex flex-col gap-8">
              {(images.length ? images : [{ url: "", altText: product.title }]).map((img, i) => (
                <div
                  key={img.url || i}
                  className="bg-white aspect-[3/4] overflow-hidden shadow-[0_1px_2px_rgba(26,26,26,0.04),0_24px_48px_-24px_rgba(26,26,26,0.08)]"
                >
                  {img.url && (
                    <img
                      src={img.url}
                      alt={img.altText ?? product.title}
                      className="w-full h-full object-cover transition-transform duration-[1400ms] hover:scale-[1.02]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ===== Info column ===== */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start space-y-12">
            <header className="space-y-5">
              <Link
                to="/collections/$handle"
                params={{ handle: vendorHandle }}
                className="inline-block text-[10px] uppercase tracking-[0.3em] font-semibold text-[var(--studio-bronze)] hover:text-[var(--studio-ink)] transition-colors"
              >
                Palace of Roman — {product.vendor}
              </Link>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.4rem] leading-[1.05] tracking-tight text-balance">
                {product.title}
              </h1>
              <div className="flex items-baseline gap-4 pt-1">
                <span className="font-serif text-3xl font-light">{formatPrice(currentPrice)}</span>
                {off > 0 && (
                  <>
                    <span className="text-sm italic text-[var(--studio-bronze)] line-through decoration-[var(--studio-bronze)]/30">
                      {formatPrice(compareAt!)}
                    </span>
                    <span className="text-[10px] tracking-[0.2em] uppercase border border-[var(--studio-bronze)]/30 px-2 py-1 text-[var(--studio-bronze)]">
                      {off}% Off
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--studio-muted)] font-medium">
                Import duties included · Express global delivery
              </p>
            </header>

            {/* Variant selectors + CTA */}
            <div
              id="buy"
              ref={buyRef}
              className={`space-y-10 scroll-mt-28 rounded-md transition-shadow duration-700 ${
                flashBuy
                  ? "ring-2 ring-[var(--studio-bronze)] ring-offset-8 ring-offset-[var(--studio-bg)] shadow-[0_0_0_8px_color-mix(in_oklab,var(--studio-bronze)_15%,transparent)]"
                  : "ring-0"
              }`}
            >

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

              <div className="flex gap-4">
                <div className="flex items-center border border-[var(--studio-rule)] bg-white h-16 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-12 h-full flex items-center justify-center hover:bg-[var(--studio-ink)]/5 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm tabular-nums font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="w-12 h-full flex items-center justify-center hover:bg-[var(--studio-ink)]/5 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  disabled={isLoading || !selectedVariant?.availableForSale}
                  className="flex-1 h-16 bg-[var(--studio-ink)] text-[var(--studio-bg)] hover:bg-[var(--studio-bronze)] transition-colors duration-700 text-[11px] uppercase tracking-[0.3em] font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-lg"
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
            </div>

            {/* Trust strip — diamonds */}
            <ul className="grid grid-cols-3 gap-8 py-10 border-y border-[var(--studio-rule)]">
              <TrustItem title="Curated" sub="Authentic Only" />
              <TrustItem title="Express" sub="3–5 Day Global" />
              <TrustItem title="90 Day" sub="Free Returns" />
            </ul>

            {/* Accordions */}
            <Accordion
              type="multiple"
              defaultValue={["details"]}
              className="divide-y divide-[var(--studio-rule)] border-b border-[var(--studio-rule)] -mt-2"
            >
              {product.description && (
                <AccordionItem value="details" className="border-0">
                  <AccordionTrigger className="text-[11px] uppercase tracking-[0.25em] font-bold hover:no-underline py-6 [&>svg]:text-[var(--studio-bronze)]">
                    The Narrative
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-[1.85] text-[var(--studio-muted)] whitespace-pre-line italic font-serif">
                      {product.description}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}
              <AccordionItem value="sizing" className="border-0">
                <AccordionTrigger className="text-[11px] uppercase tracking-[0.25em] font-bold hover:no-underline py-6 [&>svg]:text-[var(--studio-bronze)]">
                  Sizing & Fit
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-[1.85] text-[var(--studio-muted)]">
                    Pieces are sized to the maison's standard. If you sit between two sizes, we
                    recommend sizing up for relaxed silhouettes and down for tailored cuts. Reach
                    out via{" "}
                    <Link
                      to="/contact"
                      className="underline underline-offset-4 hover:text-[var(--studio-ink)]"
                    >
                      concierge
                    </Link>{" "}
                    for a personal fit check before ordering.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping" className="border-0">
                <AccordionTrigger className="text-[11px] uppercase tracking-[0.25em] font-bold hover:no-underline py-6 [&>svg]:text-[var(--studio-bronze)]">
                  Shipping & Delivery
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-[1.85] text-[var(--studio-muted)]">
                    Dispatched sealed from a brand-authorised European warehouse within 1–3
                    business days. Express courier with full tracking; import duties and taxes
                    handled on your behalf. Full details on the{" "}
                    <Link
                      to="/shipping-returns"
                      className="underline underline-offset-4 hover:text-[var(--studio-ink)]"
                    >
                      Shipping & Returns
                    </Link>{" "}
                    page.
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="auth" className="border-0">
                <AccordionTrigger className="text-[11px] uppercase tracking-[0.25em] font-bold hover:no-underline py-6 [&>svg]:text-[var(--studio-bronze)]">
                  Authenticity & Returns
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-[1.85] text-[var(--studio-muted)]">
                    Every piece is 100% authentic, sourced from the brands or their authorised
                    distributors as an official BrandsGateway partner. If any independent
                    authenticator finds otherwise within 90 days, Palace of Roman issues a full
                    refund — no questions. See{" "}
                    <Link
                      to="/authentication"
                      className="underline underline-offset-4 hover:text-[var(--studio-ink)]"
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
          <section className="max-w-7xl mx-auto mt-32 pt-20 border-t border-[var(--studio-rule)]">
            <div className="flex items-end justify-between mb-12">
              <div className="space-y-3">
                <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--studio-bronze)] font-semibold">
                  The Edit
                </p>
                <h2 className="font-serif text-3xl md:text-4xl">More from {product.vendor}</h2>
              </div>
              <Link
                to="/collections/$handle"
                params={{ handle: vendorHandle }}
                className="hidden md:inline-block text-[10px] uppercase tracking-[0.25em] border-b border-[var(--studio-ink)] pb-1 hover:text-[var(--studio-bronze)] hover:border-[var(--studio-bronze)] transition-colors"
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

function TrustItem({ title, sub }: { title: string; sub: string }) {
  return (
    <li className="flex flex-col items-center text-center gap-3">
      <span
        className="block h-2.5 w-2.5 border border-[var(--studio-bronze)] rotate-45"
        aria-hidden
      />
      <span className="text-[10px] uppercase tracking-[0.25em] font-bold leading-none">
        {title}
      </span>
      <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--studio-muted)] leading-none">
        {sub}
      </span>
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
    <div>
      <div className="flex justify-between items-end mb-5 pb-2 border-b border-[var(--studio-rule)]">
        <p className="text-[11px] uppercase tracking-[0.25em] font-semibold">
          {option.name}
          {selectedValue && (
            <span className="ml-2 text-[var(--studio-muted)] font-normal normal-case tracking-normal">
              — {selectedValue}
            </span>
          )}
        </p>
        {isSize && (
          <button
            type="button"
            onClick={() => toast("Sizing guide coming soon — message concierge for a fit check.")}
            className="text-[10px] uppercase tracking-[0.25em] text-[var(--studio-bronze)] hover:text-[var(--studio-ink)] transition-colors"
          >
            Size Chart
          </button>
        )}
      </div>
      <div className={`flex flex-wrap gap-3 ${isColor ? "items-center" : ""}`}>

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
                className={`relative h-10 w-10 rounded-full border transition-all ${
                  active
                    ? "border-[var(--studio-ink)] ring-2 ring-offset-2 ring-[var(--studio-ink)]/20 ring-offset-[var(--studio-bg)]"
                    : "border-[var(--studio-ink)]/20 hover:border-[var(--studio-ink)]/60"
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
              className={`min-w-16 h-14 px-4 text-[11px] uppercase tracking-widest border transition-all duration-300 ${
                active
                  ? "border-[var(--studio-ink)] bg-[var(--studio-ink)] text-[var(--studio-bg)]"
                  : "border-[var(--studio-ink)]/10 bg-white hover:border-[var(--studio-ink)]"
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
