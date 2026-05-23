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
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { useInteractionStore } from "@/stores/interaction-store";
import { Loader2, Minus, Plus, ShieldCheck, Truck, RotateCcw, Lock, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { computeScarcitySignal } from "@/lib/scarcity-signal";
import { toast } from "sonner";
import { ProductCard } from "@/components/product-card";
import AIRecommendations from "@/components/ai-recommendations";
import { PdpAuthenticityStrip } from "@/components/pdp-authenticity-strip";
import { PdpShippingSheet } from "@/components/pdp-shipping-sheet";
import { cdnImage } from "@/lib/cdn-image";
import { PdpDeliveryBadge } from "@/components/pdp-delivery-badge";
import { PdpBrandHeritage } from "@/components/pdp-brand-heritage";
import { ProductReviews } from "@/components/product-reviews";
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
              priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
                .toISOString()
                .slice(0, 10),
              availability: anyAvailable
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
              seller: { "@type": "Organization", name: "Palace of Roman" },
              shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingRate: {
                  "@type": "MonetaryAmount",
                  value: Number(price?.amount ?? 0) >= 1200 ? "0" : "45",
                  currency: price?.currencyCode ?? "USD",
                },
                shippingDestination: {
                  "@type": "DefinedRegion",
                  geoTargetName: "Worldwide",
                },
                deliveryTime: {
                  "@type": "ShippingDeliveryTime",
                  handlingTime: {
                    "@type": "QuantitativeValue",
                    minValue: 1,
                    maxValue: 2,
                    unitCode: "DAY",
                  },
                  transitTime: {
                    "@type": "QuantitativeValue",
                    minValue: 3,
                    maxValue: 7,
                    unitCode: "DAY",
                  },
                },
              },
              hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: "US",
                returnPolicyCategory:
                  "https://schema.org/MerchantReturnFiniteReturnWindow",
                merchantReturnDays: 14,
                returnMethod: "https://schema.org/ReturnByMail",
                returnFees: "https://schema.org/FreeReturn",
              },
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

// ===== Layering categories: editorial product treatment =====
type LayeringKey = "polo" | "long-sleeve" | "hoodie" | "cardigan" | "turtleneck" | "sweatshirt";

const LAYERING_COPY: Record<LayeringKey, {
  eyebrow: string;
  tagline: string;
  piece: string;
  craft: string;
  styling: string;
}> = {
  polo: {
    eyebrow: "The Polo",
    tagline: "A collar between sport and tailoring — finished by houses that have spent decades perfecting the form.",
    piece: "The polo lives in the seam between knitwear and shirting. Cut from breathable piqué cottons or fine merino, with a placket short enough to wear open and a collar weighted to hold its line. The proportions are restrained — close through the shoulder, easy through the body, sleeves that sit just above the elbow.",
    craft: "Mills in Italy and Portugal supply the cottons; the embroidered crests and tone-on-tone branding are finished by the maison's own ateliers. Pearlised buttons, side vents, and bar-tacked seams are constants of houses that take this category seriously.",
    styling: "Worn open under a structured blazer, tucked into pleated trousers, or layered over a fine tee with tailored shorts. The polo is the most quietly versatile collar in a considered wardrobe.",
  },
  "long-sleeve": {
    eyebrow: "The Long Sleeve",
    tagline: "The foundation layer — long-staple cottons, considered cuts, the quiet base every wardrobe is built on.",
    piece: "A long sleeve tee is the most honest piece in a wardrobe — nothing to hide behind. The maisons in this edit favour long-staple Egyptian and Pima cottons, garment-dyed for depth, with reinforced shoulder seams and a hem that lies flat under tailoring or knitwear.",
    craft: "Knitted in northern Italy on vintage circular machines that produce a denser, more elastic fabric than modern looms. Branding is restrained — a woven tab at the hem, a tonal logo at the chest, nothing more.",
    styling: "Layered under a cardigan, worn solo under a leather jacket, or tucked into denim with a belt. The cut is built to disappear into a look or carry it alone.",
  },
  hoodie: {
    eyebrow: "The Hoodie",
    tagline: "Heavyweight cottons, double-lined hoods, and the brands that elevated the silhouette into a luxury proposition.",
    piece: "The luxury hoodie has earned its place beside knitwear in a serious wardrobe. Heavyweight brushed-back cottons — 450 to 600 GSM — sit with weight on the shoulder. Hoods are double-lined and faced with grosgrain or self-fabric; cords are tipped in metal or leather.",
    craft: "Cut and sewn in Italy, Portugal, or Japan depending on the house. Ribbed cuffs and hem are knitted separately for elasticity; kangaroo pockets are bar-tacked at the stress points. Branding ranges from a discreet rubberised badge to full-chest embroidery — never printed.",
    styling: "Under a long wool overcoat with tailored trousers, or with washed denim and clean white sneakers. The hoodie has become an off-duty signature for those who understand that luxury is as much about texture as cut.",
  },
  cardigan: {
    eyebrow: "The Cardigan",
    tagline: "The most quietly elegant knit a man can own — Italian wool, mother-of-pearl, and centuries of craft.",
    piece: "The cardigan is the most considered piece of knitwear in a wardrobe — the only one designed to be worn open as readily as closed. Cut from fine merino, cashmere, or wool-silk blends, with mother-of-pearl buttons set on a placket reinforced with grosgrain ribbon.",
    craft: "Knitted on fully-fashioned machines in northern Italy and Scotland — meaning the panels are shaped on the loom rather than cut from a knitted sheet. This preserves the integrity of every stitch and gives the garment its quiet drape.",
    styling: "Over a fine tee with tailored trousers, under a topcoat in deep winter, or as the unstructured third piece in place of a jacket. Few garments do more with less.",
  },
  turtleneck: {
    eyebrow: "The Turtleneck",
    tagline: "Fine-gauge wools and cashmeres — the most architectural neckline in a man's wardrobe.",
    piece: "The turtleneck draws the eye upward and reframes the shoulder. The pieces in this edit are knitted in fine-gauge merino, cashmere, or wool-silk — sized close through the body, with a collar tall enough to fold once at the throat.",
    craft: "Spun from Cariaggi and Loro Piana yarns in Italy, with shoulders that are linked rather than stitched — a finishing technique that flattens the seam to a single thread of yarn. The collar is double-knitted for weight and recovery.",
    styling: "Under a tailored jacket in place of a shirt and tie, or under a leather coat with raw denim. The most chronologically reliable silhouette in modern menswear.",
  },
  sweatshirt: {
    eyebrow: "The Sweatshirt",
    tagline: "Loopback cottons, vintage looms, and the houses that treat jersey with the seriousness of a wool coat.",
    piece: "The sweatshirt has been quietly reclaimed by luxury — the heavyweight loopback cottons, the boxy proportions, the ribbed collar that sits flat against the throat. The pieces here are cut close through the shoulder with an easy body and a hem that breaks at the hip.",
    craft: "Knitted on vintage tubular looms in Italy and Japan, then garment-dyed for an irregular, lived-in depth of colour. Cuffs and waistband are knitted separately and joined by hand to preserve the rib pattern across the seam.",
    styling: "Under tailoring as a softer alternative to knitwear, or with washed denim and minimal sneakers. A reminder that the most versatile pieces in a wardrobe are rarely the loudest.",
  },
};

function layeringKey(product: { title: string; productType?: string }): LayeringKey | null {
  const hay = `${product.title} ${product.productType ?? ""}`.toLowerCase();
  if (/\bpolo\b/.test(hay)) return "polo";
  if (/turtleneck|roll[- ]?neck/.test(hay)) return "turtleneck";
  if (/cardigan/.test(hay)) return "cardigan";
  if (/hoodie|hooded/.test(hay)) return "hoodie";
  if (/sweatshirt/.test(hay)) return "sweatshirt";
  if (/long[- ]?sleeve/.test(hay)) return "long-sleeve";
  return null;
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

  // Track recently-viewed + interaction signal for the personalised feed.
  const pushRecent = useRecentlyViewedStore((s) => s.push);
  const trackInteraction = useInteractionStore((s) => s.track);
  useEffect(() => {
    if (!product?.handle) return;
    pushRecent({
      handle: product.handle,
      vendor: product.vendor || "",
      productType: product.productType || undefined,
    });
    trackInteraction({
      handle: product.handle,
      event: "pdp_view",
      vendor: product.vendor || undefined,
      productType: product.productType || undefined,
    });
    // Track on entry only — don't re-fire on every variant change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.handle]);


  const compareAt = product.compareAtPriceRange?.minVariantPrice;
  const currentPrice = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const off = discountPct(currentPrice, compareAt);

  // Buy-Now hand-off from product cards: scroll to the selector + flash it.
  const buyRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [flashBuy, setFlashBuy] = useState(false);
  const [showStickyBuy, setShowStickyBuy] = useState(false);
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

  // Sticky mobile Add-to-Bag: show once the inline ATC scrolls out of view.
  useEffect(() => {
    const el = buyRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowStickyBuy(!entry.isIntersecting),
      { rootMargin: "0px 0px -40% 0px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);



  const handleAdd = async () => {
    if (!selectedVariant) return;
    if (!selectedVariant.availableForSale) {
      toast.error("This variant is currently unavailable.");
      return;
    }
    const added = await addItem({
      product: { node: product },
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity,
      selectedOptions: selectedVariant.selectedOptions ?? [],
    });
    if (!added) {
      toast.error("Could not add this item to bag.", { description: "Please try another size or refresh the page." });
      return;
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

  // Cross-sell "Style It With" — pieces from other houses to complete the look.
  const styleItWithQ = useQuery({
    queryKey: ["style-it-with", product.handle, product.vendor],
    queryFn: () =>
      fetchProducts({
        first: 16,
        sortKey: "BEST_SELLING",
        query: `-vendor:"${product.vendor}"`,
      }),
  });
  const styleItWith = (styleItWithQ.data ?? [])
    .filter((e) => e.node.handle !== product.handle && e.node.vendor !== product.vendor)
    .slice(0, 8);

  const vendorHandle = product.vendor.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const layering = layeringKey(product);
  const editorial = layering ? LAYERING_COPY[layering] : null;


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
                        src={cdnImage(img.url, { width: 900 })}
                        alt={img.altText ?? product.title}
                        loading={i === 0 ? "eager" : "lazy"}
                        decoding="async"
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
              {(images.length ? images : [{ url: "", altText: product.title }]).map((img, i) => {
                const oversized = editorial && i === 0;
                return (
                  <div
                    key={img.url || i}
                    className={`bg-white overflow-hidden shadow-[0_1px_2px_rgba(26,26,26,0.04),0_24px_48px_-24px_rgba(26,26,26,0.08)] ${
                      oversized ? "aspect-[4/5]" : "aspect-[3/4]"
                    }`}
                  >
                    {img.url && (
                      <img
                        src={cdnImage(img.url, { width: 1400 })}
                        alt={img.altText ?? product.title}
                        loading={i === 0 ? "eager" : "lazy"}
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-[1400ms] hover:scale-[1.02]"
                      />
                    )}
                  </div>
                );
              })}
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
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.2em] text-[var(--studio-bronze)] font-semibold pt-1">
                <span>14-Day Returns</span>
                <span className="opacity-30">·</span>
                <span>Express Worldwide</span>
                <span className="opacity-30">·</span>
                <span>100% Authentic</span>
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

              <ScarcityPanel
                availableCount={variants.filter((v) => v.availableForSale).length}
                totalVariants={variants.length}
                priceUsd={parseFloat(currentPrice.amount)}
                onSale={off > 0}
              />


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

              {/* Trust anchor — interactive, opens shipping/returns sheet. Full-width, flush under CTA row. */}
              <PdpShippingSheet />
            </div>

            {/* Delivery badge — uses zip from location store */}
            <PdpDeliveryBadge vendor={product.vendor} handle={product.handle} variantId={selectedVariant?.id} />


            {/* Authenticity strip — defensible claims only */}
            <PdpAuthenticityStrip />

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
                    Dispatched sealed from a brand-authorised European or US partner warehouse
                    within 24–48 hours. Express courier with full tracking and import duties
                    handled on your behalf. Typical transit: 2–3 business days within the EU,
                    3–5 to the UK, 4–7 to the US & Canada, and 5–10 to the rest of the world.
                    Full details on the{" "}
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
                    distributors as an official BrandsGateway partner. Returns are accepted within
                    14 days of delivery — unworn, with original tags and packaging. See{" "}
                    <Link
                      to="/authentication"
                      className="underline underline-offset-4 hover:text-[var(--studio-ink)]"
                    >
                      our authenticity guarantee
                    </Link>
                    {" "}and{" "}
                    <Link
                      to="/shipping-returns"
                      className="underline underline-offset-4 hover:text-[var(--studio-ink)]"
                    >
                      returns policy
                    </Link>
                    .
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* ===== Editorial notes (layering categories) ===== */}
        {editorial && (
          <section className="max-w-5xl mx-auto mt-32 pt-20 border-t border-[var(--studio-rule)]">
            <div className="text-center max-w-2xl mx-auto space-y-5 mb-20">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--studio-bronze)] font-semibold">
                {editorial.eyebrow}
              </p>
              <h2 className="font-serif text-4xl md:text-5xl leading-[1.1] tracking-tight text-balance">
                {editorial.tagline}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-14">
              {[
                { label: "The Piece", body: editorial.piece },
                { label: "The Craft", body: editorial.craft },
                { label: "How to Wear", body: editorial.styling },
              ].map((block) => (
                <div key={block.label} className="space-y-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--studio-ink)] pb-3 border-b border-[var(--studio-rule)]">
                    {block.label}
                  </p>
                  <p className="text-[15px] leading-[1.85] text-[var(--studio-muted)] font-serif italic">
                    {block.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

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

        {/* ===== Brand heritage — "The {Vendor} Story" ===== */}
        <PdpBrandHeritage vendor={product.vendor} vendorHandle={vendorHandle} />

        {/* ===== Reviews (first-party, admin-moderated) ===== */}
        <ProductReviews handle={product.handle} productTitle={product.title} />

        {/* ===== AI Recommendations (server-assisted) ===== */}
        <AIRecommendations product={product} />

        {/* ===== Style It With — cross-house cross-sell rail ===== */}
        {styleItWith.length > 0 && (
          <section className="max-w-7xl mx-auto mt-32 pt-20 border-t border-[var(--studio-rule)]">
            <StyleItWithRail items={styleItWith} />
          </section>
        )}
      </div>

      {/* Sticky mobile Add-to-Bag — appears once inline ATC is scrolled past */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[var(--studio-rule)] bg-[var(--studio-bg)]/95 backdrop-blur-md shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.18)] transition-transform duration-500 ${
          showStickyBuy ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
        aria-hidden={!showStickyBuy}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {images[0]?.url && (
            <img
              src={cdnImage(images[0].url, { width: 120 })}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-12 h-14 object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--studio-bronze)] font-semibold truncate">
              {product.vendor}
            </p>
            <p className="font-serif text-[15px] leading-tight truncate">
              {formatPrice(currentPrice)}
            </p>
          </div>
          <button
            onClick={handleAdd}
            disabled={isLoading || !selectedVariant?.availableForSale}
            className="h-12 px-5 bg-[var(--studio-ink)] text-[var(--studio-bg)] hover:bg-[var(--studio-bronze)] transition-colors text-[10px] uppercase tracking-[0.25em] font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-md"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : !selectedVariant?.availableForSale ? (
              "Sold Out"
            ) : (
              <>
                <Lock className="w-3 h-3" />
                Add to Bag
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


function StyleItWithRail({ items }: { items: Awaited<ReturnType<typeof fetchProducts>> }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateEdges = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [items.length]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-rail-item]");
    const step = first ? first.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <>
      <div className="flex items-end justify-between mb-10 gap-6">
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.32em] uppercase text-[var(--studio-bronze)] font-semibold">
            Complete the Look
          </p>
          <h2 className="font-serif text-3xl md:text-4xl">Style It With</h2>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canPrev}
            aria-label="Previous pieces"
            className="w-11 h-11 grid place-items-center border border-[var(--studio-rule)] hover:border-[var(--studio-ink)] hover:text-[var(--studio-bronze)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[var(--studio-rule)] disabled:hover:text-current"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canNext}
            aria-label="Next pieces"
            className="w-11 h-11 grid place-items-center border border-[var(--studio-rule)] hover:border-[var(--studio-ink)] hover:text-[var(--studio-bronze)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[var(--studio-rule)] disabled:hover:text-current"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="flex gap-5 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-6 px-6 scroll-pl-6 scroll-pr-6"
        role="region"
        aria-label="Style it with — recommended pieces"
      >
        {items.map((e) => (
          <div
            key={e.node.id}
            data-rail-item
            className="snap-start flex-shrink-0 w-[68%] sm:w-[42%] md:w-[28%] lg:w-[22%]"
          >
            <ProductCard product={e} />
          </div>
        ))}
      </div>
    </>
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

function ScarcityPanel({
  availableCount,
  totalVariants,
  priceUsd,
  onSale,
}: {
  availableCount: number;
  totalVariants: number;
  priceUsd: number;
  onSale: boolean;
}) {
  const signal = computeScarcitySignal({ availableCount, totalVariants, priceUsd, onSale });
  if (signal.tier === "none") return null;

  const isSoldOut = signal.tier === "soldOut";
  const accent = isSoldOut
    ? "border-[var(--studio-ink)]/20 bg-[var(--studio-ink)]/[0.03]"
    : "border-[var(--studio-bronze)]/40 bg-[color-mix(in_oklab,var(--studio-bronze)_6%,transparent)]";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 border-l-2 px-4 py-3 ${accent}`}
    >
      <Sparkles
        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
          isSoldOut ? "text-[var(--studio-muted)]" : "text-[var(--studio-bronze)]"
        }`}
        strokeWidth={1.5}
      />
      <div className="space-y-1">
        <p
          className={`text-[11px] uppercase tracking-[0.25em] font-semibold ${
            isSoldOut ? "text-[var(--studio-ink)]" : "text-[var(--studio-bronze)]"
          }`}
        >
          {signal.headline}
        </p>
        <p className="text-xs leading-relaxed text-[var(--studio-muted)] font-serif italic">
          {signal.rationale}
        </p>
      </div>
    </div>
  );
}

