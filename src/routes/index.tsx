import { createFileRoute, ClientOnly, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchProducts, fetchCollection, fetchSearchFiltered, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { EditorialHotspots } from "@/components/editorial-hotspots";
import { CampaignVideo } from "@/components/campaign-video";

import heroImage from "@/assets/home-hero.jpg";
import summerHero from "@/assets/summer-bento-hero.jpg";
import editorialHero from "@/assets/editorial/may-2026/1.webp";
import marketingWomen from "@/assets/marketing-women-summer.jpg";
import marketingMen from "@/assets/marketing-men-summer.jpg";
import marketingAccessories from "@/assets/marketing-accessories-summer.jpg";
import marketingJewelry from "@/assets/marketing-jewelry-summer.jpg";
import marketingSwim from "@/assets/marketing-swim-summer.jpg";

import swimCampaignVideo from "@/assets/swim-campaign.mp4.asset.json";
import { img } from "@/lib/editorial-library";

// Stable, module-level props for SummerBento. Hoisted out of the component
// so the same object identity, same URLs, and same alt text are passed on
// every render (server and client) — eliminates any risk of input drift
// between the SSR pass and hydration.
const SUMMER_BENTO_PROPS = {
  womenImage: { url: marketingWomen, altText: "Women's Resort 2026 — Mediterranean Edit" },
  menImage: { url: marketingMen, altText: "Men's Resort 2026 — Amalfi Coast" },
  accessoriesImage: { url: marketingAccessories, altText: "Summer Accessories — Designer Edit" },
  jewelryImage: { url: marketingJewelry, altText: "The Jewelry Edit — Fine Gold & Diamonds" },
  swimImage: { url: marketingSwim, altText: "Designer Swimwear — Riviera Edit" },
} as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Palace of Roman — Curated Luxury Fashion" },
      { name: "description", content: "Shop curated luxury fashion from Gucci, Prada, Saint Laurent, Dolce & Gabbana and 500+ designer houses. 100% authentic. Worldwide shipping." },
      { property: "og:title", content: "Palace of Roman — Curated Luxury Fashion" },
      { property: "og:description", content: "Shop curated luxury fashion from 500+ designer houses. 100% authentic. Worldwide shipping." },
      { property: "og:url", content: "https://palaceofromanofficial.com/" },
      { property: "og:image", content: `https://palaceofromanofficial.com${heroImage}` },
      { name: "twitter:image", content: `https://palaceofromanofficial.com${heroImage}` },
    ],
    links: [{ rel: "canonical", href: "https://palaceofromanofficial.com/" }],
  }),
  component: HomePage,
  errorComponent: HomeErrorComponent,
});

function HomeErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("[home] runtime error:", error);
  const router = useRouter();
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-canvas px-4">
      <div className="max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-6">
          Something interrupted the boutique
        </p>
        <h1 className="text-4xl font-serif mb-6">We couldn't load the homepage</h1>
        <p className="text-sm text-muted-foreground mb-10">
          A passing glitch — please try again, or browse the boutique while we tidy up.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors"
          >
            Try Again
          </button>
          <Link
            to="/shop"
            className="text-[11px] uppercase tracking-[0.25em] border-b border-ink/20 pb-1 hover:text-ink transition-colors"
          >
            Browse the Boutique
          </Link>
        </div>
      </div>
    </div>
  );
}

// Virtual category sources: each tile pulls its first image from a real
// Shopify source (collection or product search) so nothing is invented.
type TileSource =
  | { kind: "collection"; handle: string }
  | { kind: "search"; query: string; title: string };

type CategoryTileDef = {
  key: string;
  label: string;
  caption: string;
  source: TileSource;
  linkTo: "collection" | "shop";
};

export const WOMENS_CLOTHING_HANDLE = "womens-clothing";
export const WOMENS_SHOES_HANDLE = "womens-shoes";
export const MENS_CLOTHING_HANDLE = "mens-clothing";
export const MENS_SHOES_HANDLE = "mens-shoes";

const CATEGORY_TILES: CategoryTileDef[] = [
  {
    key: WOMENS_CLOTHING_HANDLE,
    label: "Women's Clothing",
    caption: "Dresses, tailoring & ready-to-wear",
    source: { kind: "collection", handle: WOMENS_CLOTHING_HANDLE },
    linkTo: "collection",
  },
  {
    key: WOMENS_SHOES_HANDLE,
    label: "Women's Shoes",
    caption: "Heels, boots & sandals",
    source: { kind: "collection", handle: WOMENS_SHOES_HANDLE },
    linkTo: "collection",
  },
  {
    key: MENS_CLOTHING_HANDLE,
    label: "Men's Clothing",
    caption: "Tailoring & considered staples",
    source: { kind: "collection", handle: MENS_CLOTHING_HANDLE },
    linkTo: "collection",
  },
  {
    key: MENS_SHOES_HANDLE,
    label: "Men's Shoes",
    caption: "Designer footwear",
    source: { kind: "collection", handle: MENS_SHOES_HANDLE },
    linkTo: "collection",
  },
  {
    key: "womens-accessories",
    label: "Women's Accessories",
    caption: "Bags, belts, scarves & jewellery",
    source: { kind: "search", query: "tag:Accessories AND tag:Women", title: "Women's Accessories" },
    linkTo: "shop",
  },
  {
    key: "mens-accessories",
    label: "Men's Accessories",
    caption: "Belts, ties, wallets & eyewear",
    source: { kind: "search", query: "tag:Accessories AND tag:Men", title: "Men's Accessories" },
    linkTo: "shop",
  },
];

function HomePage() {
  const newArrivalsQ = useQuery({
    queryKey: ["home", "new-arrivals"],
    queryFn: () => fetchProducts({ first: 12, sortKey: "CREATED_AT", reverse: true }),
  });
  const bestSellersQ = useQuery({
    queryKey: ["home", "best-sellers"],
    queryFn: async () => {
      // Primary: virtual /collections/best-sellers (Storefront search, BEST_SELLING)
      const primary = await fetchSearchFiltered({
        first: 8,
        sortKey: "BEST_SELLING",
        reverse: false,
      }).then((r) => r.edges);
      if (primary.length > 0) return primary;
      // Fallback: global products endpoint sorted BEST_SELLING — guarantees
      // the showcase is never empty even if the search index is cold.
      return fetchProducts({ first: 8, sortKey: "BEST_SELLING" });
    },
  });
  const swimwearQ = useQuery({
    queryKey: ["home", "swimwear"],
    queryFn: () => fetchCollection("swimwear", 12).then((c) => c?.products?.edges ?? []),
  });

  // Editorial split sources — one image per panel, pulled from real data.
  const womenEditorialQ = useQuery({
    queryKey: ["home", "women-editorial"],
    queryFn: () => fetchCollection(WOMENS_CLOTHING_HANDLE, 1).then((c) => c?.products?.edges ?? []),
  });
  const menEditorialQ = useQuery({
    queryKey: ["home", "men-editorial"],
    queryFn: () => fetchCollection(MENS_CLOTHING_HANDLE, 1).then((c) => c?.products?.edges ?? []),
  });

  // Wardrobe Essentials triptych — Polos, Long Sleeve Tees, Hoodies.
  // Each pulls its first product image from the matching collection.
  const polosQ = useQuery({
    queryKey: ["home", "polos-editorial"],
    queryFn: () => fetchCollection("polo-shirts", 1).then((c) => c?.products?.edges ?? []),
  });
  const longSleeveQ = useQuery({
    queryKey: ["home", "long-sleeve-tees-editorial"],
    queryFn: () => fetchCollection("long-sleeve-tees", 1).then((c) => c?.products?.edges ?? []),
  });
  const hoodiesQ = useQuery({
    queryKey: ["home", "hoodies-editorial"],
    queryFn: () => fetchCollection("hoodies", 1).then((c) => c?.products?.edges ?? []),
  });

  // Featured brands: only vendors with in-stock products in BOTH a women's
  // category and a men's category.
  const womenBrandsClothingQ = useQuery({
    queryKey: ["home", "brands-women-clothing"],
    queryFn: () => fetchCollection(WOMENS_CLOTHING_HANDLE, 60).then((c) => c?.products?.edges ?? []),
  });
  const womenBrandsShoesQ = useQuery({
    queryKey: ["home", "brands-women-shoes"],
    queryFn: () => fetchCollection(WOMENS_SHOES_HANDLE, 60).then((c) => c?.products?.edges ?? []),
  });
  const menBrandsClothingQ = useQuery({
    queryKey: ["home", "brands-men-clothing"],
    queryFn: () => fetchCollection(MENS_CLOTHING_HANDLE, 60).then((c) => c?.products?.edges ?? []),
  });
  const menBrandsShoesQ = useQuery({
    queryKey: ["home", "brands-men-shoes"],
    queryFn: () => fetchCollection(MENS_SHOES_HANDLE, 60).then((c) => c?.products?.edges ?? []),
  });

  const featuredBrands = useMemo(() => {
    const inStock = (edges: ShopifyProduct[] | undefined) =>
      (edges ?? []).filter((e) =>
        e.node.variants.edges.some((v) => v.node.availableForSale),
      );
    const vendors = (edges: ShopifyProduct[]) =>
      new Set(edges.map((e) => e.node.vendor).filter(Boolean));
    const womenEdges = [...inStock(womenBrandsClothingQ.data), ...inStock(womenBrandsShoesQ.data)];
    const womenVendors = vendors(womenEdges);
    const menEdges = [...inStock(menBrandsClothingQ.data), ...inStock(menBrandsShoesQ.data)];
    const menVendors = vendors(menEdges);
    const both = [...womenVendors].filter((v) => menVendors.has(v));
    return both.slice(0, 8).map((name) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    }));
  }, [womenBrandsClothingQ.data, womenBrandsShoesQ.data, menBrandsClothingQ.data, menBrandsShoesQ.data]);

  return (
    <>
      {/* 1. SUMMER BENTO STOREFRONT — Architectural Resort.
          Rendered client-only to avoid SSR/CSR hydration mismatches while
          the bento markup is iterated on. */}
      <ClientOnly fallback={<SummerBentoSkeleton />}>
        <SummerBento {...SUMMER_BENTO_PROPS} />
      </ClientOnly>


      {/* 1b. SWIMWEAR RAIL — Bikinis, Beachwear, Resort */}
      <section className="py-20 md:py-24 bg-canvas-raised">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-end mb-10 md:mb-12 px-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--sea)] mb-3 block">
                Sun, Sand &amp; Salt
              </span>
              <h2 className="text-3xl md:text-4xl font-serif">Swim &amp; Beachwear</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-3 max-w-md">
                Designer bikinis, swimsuits and resort pieces — built for the season.
              </p>
            </div>
            <Link
              to="/swim"
              className="text-[11px] uppercase tracking-[0.25em] border-b border-ink/20 pb-1 hover:border-ink hidden md:inline-block"
            >
              Shop all swimwear
            </Link>
          </div>
          <HorizontalRail edges={swimwearQ.data ?? []} loading={swimwearQ.isLoading} />
        </div>
      </section>

      {/* 2. SWIM CAMPAIGN — Dolce & Gabbana cinematic */}
      <section className="relative h-[80vh] min-h-[600px] overflow-hidden bg-ink">
        <CampaignVideo
          src={swimCampaignVideo.url}
          poster={marketingSwim}
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />

        <div className="relative h-full flex items-center">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-12 w-full">
            <div className="max-w-xl text-canvas">
              <span className="block text-[10px] md:text-xs uppercase tracking-[0.5em] text-[var(--sea)] mb-5">
                The Campaign — Resort 2026
              </span>
              <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-6 text-balance">
                Dolce &amp; Gabbana
                <span className="block italic font-light mt-2">at the water's edge.</span>
              </h2>
              <p className="text-sm md:text-base text-canvas/85 leading-relaxed mb-9 max-w-md">
                A capsule of bikinis, swimsuits and beachwear — corals, seashells,
                Mediterranean stripes. 100% authentic, in stock for immediate dispatch.
              </p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                <Link
                  to="/swim"
                  className="px-8 md:px-10 py-3.5 md:py-4 bg-canvas text-ink text-[10px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--sea)] hover:text-canvas transition-colors"
                >
                  Shop the Look
                </Link>
                <Link
                  to="/brand/$vendor"
                  params={{ vendor: "dolce-gabbana" }}
                  className="px-8 md:px-10 py-3.5 md:py-4 border border-canvas/60 text-canvas text-[10px] uppercase tracking-[0.3em] font-medium hover:bg-canvas hover:text-ink transition-colors"
                >
                  Enter the Maison
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 text-canvas/70 text-[9px] uppercase tracking-[0.4em]">
          Riviera — Golden Hour
        </div>
      </section>





      {/* 3. NEW ARRIVALS — horizontal scroll rail */}
      <section className="py-24 bg-canvas-raised">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex justify-between items-end mb-12 px-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3 block">Just Landed</span>
              <h2 className="text-3xl md:text-4xl font-serif">New Arrivals</h2>
            </div>
            <Link
              to="/shop"
              className="text-[11px] uppercase tracking-[0.25em] border-b border-ink/20 pb-1 hover:border-ink hidden md:inline-block"
            >
              View all
            </Link>
          </div>
          <HorizontalRail edges={newArrivalsQ.data ?? []} loading={newArrivalsQ.isLoading} />
        </div>
      </section>

      {/* 4. FEATURED BRANDS — brands stocked in BOTH women's and men's */}
      <section className="py-28 border-y border-ink/5">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4 block">Maisons</span>
            <h2 className="text-3xl md:text-4xl font-serif">Featured Brands</h2>
            <p className="text-xs text-muted-foreground mt-3 max-w-md mx-auto">
              Houses currently stocked across both our women's and men's edits.
            </p>
          </div>
          {featuredBrands.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {womenBrandsClothingQ.isLoading || menBrandsClothingQ.isLoading ? "Loading designers…" : "No shared brands in stock at the moment."}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10">
              {featuredBrands.map((b) => (
                <Link
                  key={b.slug}
                  to="/brand/$vendor"
                  params={{ vendor: b.slug }}
                  className="text-center text-xs md:text-sm tracking-[0.25em] font-medium uppercase opacity-70 hover:opacity-100 hover:text-bronze transition-all py-4"
                >
                  {b.name}
                </Link>
              ))}
            </div>
          )}
          <div className="text-center mt-12">
            <Link
              to="/brands"
              className="text-[11px] uppercase tracking-[0.25em] border-b border-ink/20 pb-1 hover:border-ink"
            >
              View all designers
            </Link>
          </div>
        </div>
      </section>

      {/* 5. EDITORIAL TEASER — May 2026 */}
      <section className="py-28">
        <div className="max-w-screen-2xl mx-auto px-6 grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="order-2 md:order-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4 block">The Edit</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif leading-tight mb-6 text-balance">
              May 2026 — A study in quiet authority.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-10 max-w-md text-pretty">
              Tailoring, footwear and house codes photographed in studio light. Shop the look throughout the season's most significant edit.
            </p>
            <Link
              to="/editorial/may-2026"
              className="text-[11px] uppercase tracking-[0.25em] border-b border-ink/20 pb-1 hover:border-ink transition-colors"
            >
              Shop the Look →
            </Link>
          </div>
          <div className="order-1 md:order-2">
            <EditorialHotspots
              src={editorialHero}
              alt="May 2026 Editorial — Quiet authority"
              hotspots={[
                { x: 80, y: 11, label: "Eyewear", sublabel: "Alexander McQueen Acetate Sunglasses", handle: "alexander-mcqueen-black-acetate-sunglasses" },
                { x: 47, y: 56, label: "Handbag", sublabel: "Alexander McQueen Bos Taurus Shoulder Bag", handle: "alexander-mcqueen-black-calf-leather-bos-taurus-shoulder-bag" },
                { x: 22, y: 88, label: "Footwear", sublabel: "Alexander McQueen Chunky Sneakers", handle: "alexander-mcqueen-beige-calf-leather-bos-taurus-chunky-sneakers" },
              ]}
            />
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-3">
              Tap the markers to shop the look
            </p>
          </div>
        </div>
      </section>

      {/* 6. EDITORIAL SPLIT — two panels, sub-CTAs for clothing + shoes */}
      <section className="py-28 border-t border-ink/5">
        <div className="max-w-screen-2xl mx-auto px-6 grid md:grid-cols-2 gap-6 lg:gap-10">
          <EditorialPanel
            image={womenEditorialQ.data?.[0]?.node?.images?.edges?.[0]?.node}
            eyebrow="The Women's Edit"
            heading="Quiet luxury, deliberately curated."
            ctas={[
              { label: "Clothing", to: "/collections/$handle", params: { handle: WOMENS_CLOTHING_HANDLE } },
              { label: "Shoes", to: "/collections/$handle", params: { handle: WOMENS_SHOES_HANDLE } },
            ]}
          />
          <EditorialPanel
            image={menEditorialQ.data?.[0]?.node?.images?.edges?.[0]?.node}
            eyebrow="The Men's Edit"
            heading="Refined tailoring and considered staples."
            ctas={[
              { label: "Clothing", to: "/collections/$handle", params: { handle: MENS_CLOTHING_HANDLE } },
              { label: "Shoes", to: "/collections/$handle", params: { handle: MENS_SHOES_HANDLE } },
            ]}
          />
        </div>
      </section>

      {/* 6b. WARDROBE ESSENTIALS — Polos, Long Sleeve Tees, Hoodies */}
      <section className="py-28 border-t border-ink/5 bg-canvas-raised">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="text-center mb-16 max-w-xl mx-auto">
            <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4 block">
              Wardrobe Essentials
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif leading-tight mb-5 text-balance">
              The everyday, properly considered.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
              Three foundations of the modern wardrobe — cut and finished by houses that take
              the ordinary seriously. Pieces to be worn often, and worn well.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
            <EssentialTile
              image={polosQ.data?.[0]?.node?.images?.edges?.[0]?.node}
              eyebrow="Polo Shirts"
              heading="A quieter form of tailoring."
              copy="Piqué cotton, considered collars and weights that hold their line — polos chosen for the way they sit under a jacket and on their own."
              handle="polo-shirts"
            />
            <EssentialTile
              image={longSleeveQ.data?.[0]?.node?.images?.edges?.[0]?.node}
              eyebrow="Long Sleeve Tees"
              heading="The off-duty foundation."
              copy="Fine cotton and merino long sleeves — the layer worn on its own at the weekend and under everything else for the rest of the week."
              handle="long-sleeve-tees"
            />
            <EssentialTile
              image={hoodiesQ.data?.[0]?.node?.images?.edges?.[0]?.node}
              eyebrow="Hoodies"
              heading="Soft architecture."
              copy="Heavyweight loopback, brushed fleece and houses that finish a hood as carefully as a lapel — the piece worn most, dressed quietly."
              handle="hoodies"
            />
          </div>
        </div>
      </section>


      {/* 6. BEST SELLERS */}
      <section className="py-28">
        <div className="max-w-screen-2xl mx-auto px-6">
          {(() => {
            const bestEdges = bestSellersQ.data ?? [];
            const showEmpty = !bestSellersQ.isLoading && bestEdges.length === 0;
            const fallbackEdges = (newArrivalsQ.data ?? []).slice(0, 8);
            if (showEmpty) {
              return (
                <>
                  <div className="text-center mb-12 max-w-xl mx-auto">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4 block">Most Coveted</span>
                    <h2 className="text-3xl md:text-4xl font-serif mb-6">A best-seller list is taking shape.</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The boutique is brand new, so no piece has had time to rise above the rest just yet.
                      In the meantime, see what has only just landed — these new arrivals will be tomorrow's most-coveted.
                    </p>
                  </div>
                  <ProductCarousel edges={fallbackEdges} loading={newArrivalsQ.isLoading} />
                  <div className="mt-14 flex justify-center">
                    <Link
                      to="/collections/$handle"
                      params={{ handle: "new-arrivals" }}
                      className="group inline-flex items-center gap-3 bg-ink text-canvas px-10 py-5 text-[11px] uppercase tracking-[0.3em] hover:bg-bronze transition-colors"
                    >
                      Shop New Arrivals
                      <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                  </div>
                </>
              );
            }
            return (
              <>
                <div className="text-center mb-16">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4 block">Most Coveted</span>
                  <h2 className="text-3xl md:text-4xl font-serif">Best Sellers</h2>
                </div>
                <ProductCarousel edges={bestEdges} loading={bestSellersQ.isLoading} />
                <div className="mt-14 flex justify-center">
                  <Link
                    to="/collections/$handle"
                    params={{ handle: "best-sellers" }}
                    search={{ sort: "BEST_SELLING-false" }}
                    className="group inline-flex items-center gap-3 bg-ink text-canvas px-10 py-5 text-[11px] uppercase tracking-[0.3em] hover:bg-bronze transition-colors"
                  >
                    Shop Best Sellers
                    <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* 7. TRUST / WHY SHOP WITH US */}
      <section className="py-24 border-t border-ink/5 bg-canvas-raised">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4 block">The House</span>
            <h2 className="text-3xl md:text-4xl font-serif">Why shop with Palace of Roman</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
            {[
              { title: "100% Authentic", body: "Official BrandsGateway partner — every piece authorised and sourced from the brands or their authorised distributors." },
              { title: "Tracked Worldwide", body: "Complimentary DHL or FedEx tracked shipping on orders above $1,200." },
              { title: "Considered Returns", body: "14-day returns on full-priced merchandise from the day your parcel is delivered." },
              { title: "Email Concierge", body: "A single line for sourcing requests, sizing and styling — same-day reply by email." },
            ].map((b) => (
              <div key={b.title} className="text-center md:text-left">
                <h3 className="font-serif text-lg md:text-xl mb-3">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-8 md:gap-10 mt-14 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Link to="/authentication" className="hover:text-ink transition-colors">Authentication →</Link>
            <Link to="/shipping-returns" className="hover:text-ink transition-colors">Shipping &amp; Returns →</Link>
            <Link to="/contact" className="hover:text-ink transition-colors">Contact Concierge →</Link>
          </div>
        </div>
      </section>

      {/* 8. NEWSLETTER */}
      <NewsletterStrip />
    </>
  );
}


function CategoryTile({ tile }: { tile: CategoryTileDef }) {
  const { data } = useQuery({
    queryKey: ["home", "category-tile", tile.key],
    queryFn: async () => {
      if (tile.source.kind === "collection") {
        const c = await fetchCollection(tile.source.handle, 1);
        return c?.products?.edges?.[0]?.node?.images?.edges?.[0]?.node ?? null;
      }
      const edges = await fetchProducts({ first: 1, query: tile.source.query });
      return edges?.[0]?.node?.images?.edges?.[0]?.node ?? null;
    },
  });

  const linkProps =
    tile.linkTo === "collection" && tile.source.kind === "collection"
      ? { to: "/collections/$handle" as const, params: { handle: tile.source.handle } }
      : tile.source.kind === "search"
        ? { to: "/shop" as const, search: { q: tile.source.query, title: tile.source.title } }
        : { to: "/shop" as const };

  return (
    <Link {...(linkProps as any)} className="group block">
      <div className="w-full aspect-[3/4] bg-muted overflow-hidden mb-5 relative">
        {data ? (
          <img
            src={data.url}
            alt={data.altText ?? tile.label}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{tile.label}</span>
          </div>
        )}
      </div>
      <h3 className="text-base md:text-lg font-serif mb-1">{tile.label}</h3>
      <p className="text-xs text-muted-foreground">{tile.caption}</p>
    </Link>
  );
}

function EssentialTile({
  image,
  eyebrow,
  heading,
  copy,
  handle,
}: {
  image?: { url: string; altText: string | null };
  eyebrow: string;
  heading: string;
  copy: string;
  handle: string;
}) {
  return (
    <Link
      to="/collections/$handle"
      params={{ handle }}
      className="group block"
    >
      <div className="w-full aspect-[4/5] bg-muted overflow-hidden mb-6 relative">
        {image ? (
          <img
            src={image.url}
            alt={image.altText ?? eyebrow}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {eyebrow}
            </span>
          </div>
        )}
      </div>
      <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3 block">
        {eyebrow}
      </span>
      <h3 className="text-2xl md:text-[1.65rem] font-serif leading-tight mb-4 text-balance">
        {heading}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6 text-pretty">
        {copy}
      </p>
      <span className="text-[11px] uppercase tracking-[0.25em] border-b border-ink/20 pb-1 group-hover:border-ink transition-colors">
        Shop the edit →
      </span>
    </Link>
  );
}

type EditorialCta = {
  label: string;
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
};

function EditorialPanel({
  image,
  eyebrow,
  heading,
  ctas,
}: {
  image?: { url: string; altText: string | null };
  eyebrow: string;
  heading: string;
  ctas: EditorialCta[];
}) {
  return (
    <div className="block">
      <div className="w-full aspect-[4/5] bg-muted overflow-hidden mb-6">
        {image && (
          <img
            src={image.url}
            alt={image.altText ?? eyebrow}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-1000 hover:scale-[1.02]"
          />
        )}
      </div>
      <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3 block">{eyebrow}</span>
      <h3 className="text-2xl md:text-3xl font-serif leading-tight mb-5 text-balance">{heading}</h3>
      <div className="flex gap-6">
        {ctas.map((cta) => (
          <Link
            key={cta.label}
            to={cta.to as any}
            params={cta.params as any}
            search={cta.search as any}
            className="text-[11px] uppercase tracking-[0.25em] border-b border-ink/20 pb-1 hover:border-ink transition-colors"
          >
            {cta.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function HorizontalRail({ edges, loading }: { edges: ShopifyProduct[]; loading?: boolean }) {
  if (loading && edges.length === 0) {
    return (
      <div className="flex gap-6 overflow-x-auto px-6 pb-4 scrollbar-hide">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-none w-[260px] md:w-[300px] animate-pulse">
            <div className="w-full aspect-[4/5] bg-muted mb-4" />
            <div className="h-2 w-16 bg-muted mb-2" />
            <div className="h-3 w-3/4 bg-muted" />
          </div>
        ))}
      </div>
    );
  }
  if (edges.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-16 px-6">No new arrivals yet.</p>;
  }
  return (
    <div className="flex gap-6 overflow-x-auto px-6 pb-4 snap-x snap-mandatory scrollbar-hide">
      {edges.map((edge) => (
        <div key={edge.node.id} className="flex-none w-[260px] md:w-[300px] snap-start">
          <ProductCard product={edge} />
        </div>
      ))}
    </div>
  );
}

function ProductGrid({ edges, loading }: { edges: ShopifyProduct[]; loading?: boolean }) {
  if (loading && edges.length === 0) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="w-full aspect-[4/5] bg-muted mb-5" />
            <div className="h-2 w-16 bg-muted mb-2" />
            <div className="h-3 w-3/4 bg-muted" />
          </div>
        ))}
      </div>
    );
  }
  if (edges.length === 0) {
    return <p className="py-24 text-center text-sm text-muted-foreground">No products found.</p>;
  }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
      {edges.map((edge) => (
        <ProductCard key={edge.node.id} product={edge} />
      ))}
    </div>
  );
}

function ProductCarousel({ edges, loading }: { edges: ShopifyProduct[]; loading?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

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
  }, [edges.length]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // Scroll roughly one card's width at a time (track item width + gap).
    const first = el.querySelector<HTMLElement>("[data-carousel-item]");
    const step = first ? first.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (loading && edges.length === 0) {
    return (
      <div className="flex gap-6 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse flex-none w-[70%] sm:w-[45%] lg:w-[24%]">
            <div className="w-full aspect-[4/5] bg-muted mb-5" />
            <div className="h-2 w-16 bg-muted mb-2" />
            <div className="h-3 w-3/4 bg-muted" />
          </div>
        ))}
      </div>
    );
  }
  if (edges.length === 0) {
    return <p className="py-24 text-center text-sm text-muted-foreground">No products found.</p>;
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label="Best sellers carousel"
      >
        {edges.map((edge) => (
          <div
            key={edge.node.id}
            data-carousel-item
            className="flex-none snap-start w-[70%] sm:w-[45%] lg:w-[24%]"
          >
            <ProductCard product={edge} />
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Previous products"
        onClick={() => scrollByPage(-1)}
        disabled={!canPrev}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-canvas border border-ink/15 shadow-md text-ink hover:bg-ink hover:text-canvas hover:border-ink transition-colors disabled:opacity-0 disabled:pointer-events-none"
      >
        <span aria-hidden>←</span>
      </button>
      <button
        type="button"
        aria-label="Next products"
        onClick={() => scrollByPage(1)}
        disabled={!canNext}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 h-12 w-12 items-center justify-center rounded-full bg-canvas border border-ink/15 shadow-md text-ink hover:bg-ink hover:text-canvas hover:border-ink transition-colors disabled:opacity-0 disabled:pointer-events-none"
      >
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}

function NewsletterStrip() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <section className="py-28 bg-ink text-canvas">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <span className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-6 block">The Dispatch</span>
        <h2 className="text-3xl md:text-4xl font-serif mb-5">Receive our quarterly edit.</h2>
        <p className="text-sm text-canvas/60 mb-10 leading-relaxed">
          Editorial, new arrivals, and private previews — sent four times a year.
        </p>
        {submitted ? (
          <p className="text-sm text-canvas/80">Thank you. You are subscribed.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.includes("@")) setSubmitted(true);
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 bg-transparent border-b border-canvas/30 focus:border-canvas px-1 py-3 text-sm placeholder:text-canvas/40 focus:outline-none"
            />
            <button
              type="submit"
              className="px-8 py-3 ring-1 ring-canvas text-[11px] uppercase tracking-[0.25em] hover:bg-canvas hover:text-ink transition-colors"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ------------------------------ SummerBento ------------------------------ */

type ShopifyImg = { url: string; altText: string | null };

function SummerBento({
  womenImage,
  menImage,
  accessoriesImage,
  jewelryImage,
  swimImage,
  spotlightImage,
  spotlightVendor,
  spotlightSlug,
}: {
  womenImage?: ShopifyImg;
  menImage?: ShopifyImg;
  accessoriesImage?: ShopifyImg;
  jewelryImage?: ShopifyImg;
  swimImage?: ShopifyImg;
  spotlightImage?: ShopifyImg;
  spotlightVendor?: string;
  spotlightSlug?: string;
}) {
  // Hydration-safe guard: render the matching skeleton (same grid, same
  // tile spans) on the first paint so the layout slot is reserved exactly
  // and there's no CLS when the real bento mounts.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return <SummerBentoSkeleton />;
  }
  return (
    <section className="px-4 md:px-8 lg:px-12 pt-6 md:pt-10 pb-12 md:pb-16">
      <div className="max-w-[1600px] mx-auto grid grid-cols-12 auto-rows-[180px] md:auto-rows-[200px] gap-4">


        {/* Main Hero: The Shoreline Perspective */}
        <div className="col-span-12 lg:col-span-8 row-span-3 lg:row-span-4 relative group overflow-hidden bg-canvas-raised">
          <img
            src={summerHero}
            alt="Resort 2026 — The Shoreline Perspective"
            width={1600}
            height={1280}
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
          <div className="absolute bottom-8 md:bottom-14 lg:bottom-16 left-6 md:left-12 lg:left-16 right-6 max-w-xl">
            <span className="block text-[10px] md:text-xs uppercase tracking-[0.4em] mb-3 md:mb-5 text-canvas/90">
              Resort 2026 Collection
            </span>
            <h1 className="font-serif text-canvas text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[0.95] mb-6 md:mb-8 text-balance">
              The Shoreline
              <span className="block italic font-light md:ml-10 lg:ml-12">Perspective</span>
            </h1>
            <div className="flex flex-wrap gap-3 md:gap-4">
              <Link
                to="/collections/$handle"
                params={{ handle: WOMENS_CLOTHING_HANDLE }}
                className="px-7 md:px-10 py-3 md:py-4 bg-canvas text-ink text-[10px] uppercase tracking-[0.25em] font-medium hover:bg-[var(--sea)] hover:text-canvas transition-all"
              >
                Shop the Edit
              </Link>
              <Link
                to="/editorial/resort-2026"
                className="px-7 md:px-10 py-3 md:py-4 border border-canvas text-canvas text-[10px] uppercase tracking-[0.25em] font-medium hover:bg-canvas hover:text-ink transition-all"
              >
                View Lookbook
              </Link>
            </div>
          </div>
        </div>

        {/* Swimwear Promo Tile (honey) */}
        <Link
          to="/swim"
          className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2 bg-bronze relative overflow-hidden flex flex-col justify-center items-center text-center group"
        >
          {swimImage && (
            <img
              src={swimImage.url}
              alt={swimImage.altText ?? "Designer swimwear"}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/20 to-transparent" />
          <div className="relative z-10 p-8 md:p-10">
            <span className="text-[10px] uppercase tracking-[0.3em] text-canvas/90 mb-3 block">
              The Beach Edit
            </span>
            <h3 className="font-serif text-3xl md:text-4xl text-canvas mb-3 leading-tight">
              Bikinis &amp;
              <span className="block italic">Swimwear</span>
            </h3>
            <p className="text-[11px] tracking-[0.25em] text-canvas/85 uppercase">
              Dolce &amp; Gabbana — In Stock
            </p>
          </div>
        </Link>


        {/* Women Category Tile */}
        <Link
          to="/collections/$handle"
          params={{ handle: WOMENS_CLOTHING_HANDLE }}
          className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2 relative group overflow-hidden bg-canvas-raised"
        >
          {womenImage && (
            <img
              src={womenImage.url}
              alt={womenImage.altText ?? "Women's Edit"}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h3 className="font-serif italic text-4xl md:text-5xl text-canvas">Women</h3>
              <span className="mt-4 inline-block text-[10px] uppercase tracking-[0.3em] text-canvas border-b border-canvas/40 pb-1 group-hover:border-canvas">
                Shop the Edit
              </span>
            </div>
          </div>
        </Link>

        {spotlightSlug && (
          <>
            {/* Brand Spotlight */}
            <Link
              to="/brand/$vendor"
              params={{ vendor: spotlightSlug }}
              className="col-span-12 md:col-span-4 lg:col-span-3 row-span-2 bg-ink flex flex-col justify-between group overflow-hidden relative"
            >
              {spotlightImage && (
                <img
                  src={spotlightImage.url}
                  alt={spotlightImage.altText ?? `${spotlightVendor ?? "Maison"} — In Stock`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-[1400ms] ease-out group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/20" />
              <div className="relative z-10 p-6 md:p-8">
                <span className="text-[9px] uppercase tracking-[0.4em] text-[var(--sea)] mb-3 block">
                  Brand Spotlight
                </span>
                <h4 className="font-serif text-2xl md:text-3xl text-canvas leading-tight">
                  {spotlightVendor ?? "The Maisons"}
                  <span className="block italic font-light mt-1">In Stock Now</span>
                </h4>
              </div>
              <span className="relative z-10 m-6 md:m-8 text-[10px] uppercase tracking-[0.25em] text-canvas border-b border-canvas/40 pb-1 w-fit group-hover:border-canvas">
                Shop the Edit
              </span>
            </Link>
          </>
        )}

        {/* Men Category Tile */}
        <Link
          to="/collections/$handle"
          params={{ handle: MENS_CLOTHING_HANDLE }}
          className="col-span-12 md:col-span-8 lg:col-span-4 row-span-2 relative group overflow-hidden bg-canvas-raised"
        >
          {menImage && (
            <img
              src={menImage.url}
              alt={menImage.altText ?? "The Men's Edit"}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
          <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6">
            <h3 className="font-serif text-3xl md:text-4xl text-canvas">The Men's Edit</h3>
            <p className="text-[10px] uppercase tracking-[0.3em] text-canvas/80 mt-2">
              Effortless Sophistication
            </p>
            <span className="mt-4 inline-block text-[10px] uppercase tracking-[0.3em] text-canvas border-b border-canvas/40 pb-1 group-hover:border-canvas">
              Shop the Look
            </span>
          </div>
        </Link>

        {/* Accessories Tile — full-bleed */}
        <Link
          to="/shop"
          search={{ q: "tag:Accessories", title: "Accessories" }}
          className="col-span-6 md:col-span-4 lg:col-span-2 row-span-2 relative group overflow-hidden bg-canvas-raised"
        >
          {accessoriesImage && (
            <img
              src={accessoriesImage.url}
              alt={accessoriesImage.altText ?? "Accessories"}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-end p-5 md:p-6 text-center items-center">
            <span className="text-[9px] uppercase tracking-[0.3em] text-canvas/85 mb-1">
              Shop
            </span>
            <h4 className="text-base md:text-lg text-canvas uppercase tracking-[0.15em] font-medium">
              Accessories
            </h4>
          </div>
        </Link>

        {/* Jewelry Tile — full-bleed, balances Accessories */}
        <Link
          to="/shop"
          search={{ q: "tag:Jewelry", title: "Jewelry" }}
          className="col-span-6 md:col-span-4 lg:col-span-2 row-span-2 relative group overflow-hidden bg-canvas-raised"
        >
          {jewelryImage && (
            <img
              src={jewelryImage.url}
              alt={jewelryImage.altText ?? "Jewelry"}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-end p-5 md:p-6 text-center items-center">
            <span className="text-[9px] uppercase tracking-[0.3em] text-canvas/85 mb-1">
              Shop
            </span>
            <h4 className="text-base md:text-lg text-canvas uppercase tracking-[0.15em] font-medium">
              Jewelry
            </h4>
          </div>
        </Link>

      </div>
    </section>
  );
}

/* -------------------------- SummerBentoSkeleton -------------------------- */
/**
 * Pixel-matching skeleton for SummerBento. Mirrors the exact grid container
 * and every tile's `col-span` / `row-span` so the layout slot is identical
 * before and after the real bento mounts — eliminating layout shift (CLS).
 */
function SummerBentoSkeleton() {
  return (
    <section
      aria-hidden
      className="px-4 md:px-8 lg:px-12 pt-6 md:pt-10 pb-12 md:pb-16"
    >
      <div className="max-w-[1600px] mx-auto grid grid-cols-12 auto-rows-[180px] md:auto-rows-[200px] gap-4">
        {/* Main Hero */}
        <div className="col-span-12 lg:col-span-8 row-span-3 lg:row-span-4 bg-canvas-raised animate-pulse" />
        {/* Swim Promo */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2 bg-bronze/40 animate-pulse" />
        {/* Women Tile */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 row-span-2 bg-canvas-raised animate-pulse" />
        {/* Men Tile */}
        <div className="col-span-12 md:col-span-8 lg:col-span-4 row-span-2 bg-canvas-raised animate-pulse" />
        {/* Accessories Tile */}
        <div className="col-span-6 md:col-span-4 lg:col-span-2 row-span-2 bg-canvas-raised animate-pulse" />
        {/* Jewelry Tile */}
        <div className="col-span-6 md:col-span-4 lg:col-span-2 row-span-2 bg-canvas-raised animate-pulse" />
      </div>
    </section>
  );
}
