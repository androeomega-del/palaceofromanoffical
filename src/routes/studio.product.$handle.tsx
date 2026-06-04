/**
 * Studio PDP preview — `/studio/product/$handle`
 *
 * READ-ONLY visual sandbox for the editorial obsidian PDP skin. Uses the
 * real `fetchProductByHandle` loader so the data is identical to the live
 * `/product/$handle` route, but renders an entirely separate component.
 *
 * Purpose: design review before porting any of this back into the real
 * production PDP (`src/routes/product.$handle.tsx`). NO cart mutations,
 * NO checkout calls, NO Zustand writes — Add to Bag is disabled and
 * labelled as a preview surface (per checkout-protocol lockdown).
 */
import { useState } from "react";
import {
  createFileRoute,
  Link,
  notFound,
  useRouter,
} from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { fetchProductByHandle, formatPrice } from "@/lib/shopify";
import { palette, fontSans, fontSerif } from "@/components/home-studio/palette";

const productQueryOptions = (handle: string) =>
  queryOptions({
    queryKey: ["studio-product", handle],
    queryFn: async () => {
      const product = await fetchProductByHandle(handle);
      if (!product) throw notFound();
      return product;
    },
  });

export const Route = createFileRoute("/studio/product/$handle")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(productQueryOptions(params.handle)),
  component: StudioProductPreview,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: palette.obsidian, color: palette.offwhite, fontFamily: fontSans }}
      >
        <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: palette.sand }}>
          Studio
        </p>
        <h1 className="mt-4 text-2xl font-light" style={{ fontFamily: fontSerif }}>
          The archive could not be opened.
        </h1>
        <p className="mt-2 text-sm opacity-70 max-w-md">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-8 px-6 py-3 text-[10px] uppercase tracking-[0.3em] border"
          style={{ borderColor: palette.sand, color: palette.offwhite }}
        >
          Try again
        </button>
      </div>
    );
  },
  notFoundComponent: () => {
    const { handle } = Route.useParams();
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: palette.obsidian, color: palette.offwhite, fontFamily: fontSans }}
      >
        <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: palette.sand }}>
          Studio
        </p>
        <h1 className="mt-4 text-2xl font-light" style={{ fontFamily: fontSerif }}>
          No piece archived under "{handle}".
        </h1>
        <Link
          to="/studio"
          className="mt-8 text-[10px] uppercase tracking-[0.3em] underline underline-offset-4"
          style={{ color: palette.sand }}
        >
          ← Return to the studio
        </Link>
      </div>
    );
  },
});

function StudioProductPreview() {
  const { handle } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQueryOptions(handle));

  const images = (product.images?.edges ?? []).map((e) => e.node);
  const variants = (product.variants?.edges ?? []).map((e) => e.node);
  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    firstAvailable?.id,
  );
  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) ?? firstAvailable;

  // Derive segment label from productType/title (ShopifyProductNode has no `tags`)
  const haystack = `${product.productType ?? ""} ${product.title}`.toLowerCase();
  const isMen = /\b(men|homme|man|mens)\b/.test(haystack);
  const segmentLabel = isMen ? "Homme / Archive" : "Femme / Archive";

  // Detect a single-variant product (Shopify default "Default Title")
  const isSingleVariant =
    variants.length <= 1 ||
    (variants.length === 1 && variants[0].title === "Default Title");

  const priceMoney = selectedVariant?.price ?? product.priceRange.minVariantPrice;

  return (
    <div
      className="min-h-screen"
      style={{
        background: palette.obsidian,
        color: palette.offwhite,
        fontFamily: fontSerif,
      }}
    >
      {/* Studio strip — make it obvious this is the preview, not the live PDP */}
      <div
        className="w-full px-6 md:px-14 py-3 flex items-center justify-between text-[10px] uppercase tracking-[0.32em]"
        style={{
          background: "rgba(217,207,193,0.06)",
          borderBottom: "1px solid rgba(244,241,236,0.06)",
          color: palette.sand,
          fontFamily: fontSans,
        }}
      >
        <span>Studio preview · /studio/product/{handle}</span>
        <Link
          to="/product/$handle"
          params={{ handle }}
          className="opacity-80 hover:opacity-100 transition-opacity underline underline-offset-4"
          style={{ color: palette.offwhite }}
        >
          View live PDP →
        </Link>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 md:px-12 lg:px-24 py-10 md:py-16">
        {/* Breadcrumb */}
        <nav
          className="mb-12 md:mb-16 text-[10px] uppercase tracking-[0.32em]"
          style={{ color: "rgba(244,241,236,0.45)", fontFamily: fontSans }}
          aria-label="Breadcrumb"
        >
          <Link to="/studio" className="hover:opacity-100 opacity-80 transition-opacity">
            Archive
          </Link>
          <span className="mx-3 opacity-30">/</span>
          <span className="opacity-80">{product.vendor || "Palace of Roman"}</span>
          <span className="mx-3 opacity-30">/</span>
          <span style={{ color: palette.sand }}>{product.title}</span>
        </nav>

        {/* 12-col editorial grid */}
        <div className="grid grid-cols-12 gap-y-12 md:gap-x-12 lg:gap-x-20 items-start">
          {/* Left — vertical asymmetric gallery (7/12) */}
          <div className="col-span-12 md:col-span-7 space-y-6 md:space-y-10">
            {images.length === 0 ? (
              <div
                className="aspect-[3/4] w-full"
                style={{ background: "#121212" }}
                aria-label="No imagery available"
              />
            ) : (
              images.map((img, idx) => {
                // Asymmetric rhythm: first image full-bleed 3/4, then alternate
                // square (slightly inset) and 4/5 portrait
                const isFirst = idx === 0;
                const inset = !isFirst && idx % 2 === 1;
                const aspect = isFirst
                  ? "aspect-[3/4]"
                  : idx % 2 === 0
                  ? "aspect-[4/5]"
                  : "aspect-square";
                return (
                  <figure
                    key={img.url + idx}
                    className={`relative w-full overflow-hidden group ${aspect} ${
                      inset ? "md:w-[88%] md:ml-auto" : ""
                    }`}
                    style={{ background: "#121212" }}
                  >
                    <img
                      src={img.url}
                      alt={img.altText || `${product.title} — view ${idx + 1}`}
                      loading={isFirst ? "eager" : "lazy"}
                      className="w-full h-full object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
                    />
                  </figure>
                );
              })
            )}
          </div>

          {/* Right — sticky monolith meta (5/12) */}
          <aside className="col-span-12 md:col-span-5 md:sticky md:top-10 space-y-10 pb-16">
            {/* Identity block */}
            <header
              className="space-y-4 pb-8"
              style={{ borderBottom: "1px solid rgba(244,241,236,0.08)" }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.4em]"
                style={{ color: palette.sand, fontFamily: fontSans }}
              >
                {segmentLabel}
              </p>
              {product.vendor && (
                <p
                  className="text-[11px] uppercase tracking-[0.32em] opacity-80"
                  style={{ fontFamily: fontSans }}
                >
                  {product.vendor}
                </p>
              )}
              <h1
                className="text-3xl md:text-4xl lg:text-[2.6rem] font-light leading-[1.05] tracking-[-0.01em]"
                style={{ fontWeight: 300 }}
              >
                {product.title}
              </h1>
              <p
                className="pt-1 text-sm tracking-[0.18em] uppercase"
                style={{ color: palette.sand, fontFamily: fontSans }}
              >
                {formatPrice(priceMoney)}
              </p>
            </header>

            {/* Size selector — only when there are real variants */}
            {!isSingleVariant && (
              <section className="space-y-4">
                <div
                  className="flex justify-between items-baseline text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: "rgba(244,241,236,0.55)", fontFamily: fontSans }}
                >
                  <span>Select size</span>
                  <span className="underline underline-offset-4 opacity-60 cursor-not-allowed">
                    View measurements
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const isAvailable = variant.availableForSale;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => setSelectedVariantId(variant.id)}
                        className="py-4 text-[11px] tracking-[0.2em] uppercase transition-all duration-300 border focus:outline-none disabled:cursor-not-allowed disabled:line-through"
                        style={{
                          fontFamily: fontSans,
                          borderColor: !isAvailable
                            ? "rgba(244,241,236,0.08)"
                            : isSelected
                            ? palette.sand
                            : "rgba(244,241,236,0.15)",
                          background: isSelected ? "rgba(217,207,193,0.06)" : "transparent",
                          color: !isAvailable
                            ? "rgba(244,241,236,0.25)"
                            : isSelected
                            ? palette.sand
                            : palette.offwhite,
                        }}
                      >
                        {variant.title}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Read-only ATC */}
            <section className="space-y-3 pt-2">
              <button
                type="button"
                disabled
                className="w-full py-4 text-[11px] tracking-[0.28em] uppercase cursor-not-allowed"
                style={{
                  fontFamily: fontSans,
                  background: palette.offwhite,
                  color: palette.obsidian,
                  opacity: 0.55,
                }}
                aria-disabled="true"
              >
                Add to bag · preview
              </button>
              <p
                className="text-[9px] uppercase tracking-[0.3em] text-center"
                style={{ color: "rgba(244,241,236,0.45)", fontFamily: fontSans }}
              >
                Studio surface — orders disabled. Use the live PDP to purchase.
              </p>
            </section>

            {/* Description */}
            {product.description && (
              <section
                className="pt-8 space-y-4 text-sm leading-relaxed"
                style={{
                  borderTop: "1px solid rgba(244,241,236,0.08)",
                  color: "rgba(244,241,236,0.7)",
                  fontFamily: fontSans,
                  fontWeight: 300,
                }}
              >
                <p
                  className="text-[10px] uppercase tracking-[0.32em]"
                  style={{ color: palette.sand }}
                >
                  The piece
                </p>
                <p className="whitespace-pre-line">{product.description}</p>
              </section>
            )}

            {/* Micro details */}
            <ul
              className="space-y-2 text-[10px] uppercase tracking-[0.22em]"
              style={{ color: palette.sand, fontFamily: fontSans }}
            >
              <li>· Sourced from a global network of authorised boutiques</li>
              <li>· Complimentary priority courier · duties cleared</li>
              <li>· 100% authentic — sealed at origin</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
