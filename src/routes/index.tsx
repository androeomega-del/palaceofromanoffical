import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchProducts, fetchCollection, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import heroImage from "@/assets/home-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Palace of Roman — Curated Luxury Fashion" },
      { name: "description", content: "Curated luxury fashion for women and men. Gucci, Prada, Dolce & Gabbana, Saint Laurent and more — authenticated and shipped worldwide." },
      { property: "og:title", content: "Palace of Roman — Curated Luxury Fashion" },
      { property: "og:description", content: "A curated destination for luxury fashion." },
      { property: "og:image", content: heroImage },
    ],
  }),
  component: HomePage,
});

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
];

function HomePage() {
  const newArrivalsQ = useQuery({
    queryKey: ["home", "new-arrivals"],
    queryFn: () => fetchProducts({ first: 12, sortKey: "CREATED_AT", reverse: true }),
  });
  const bestSellersQ = useQuery({
    queryKey: ["home", "best-sellers"],
    queryFn: () => fetchProducts({ first: 8, sortKey: "BEST_SELLING" }),
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
    const womenVendors = vendors(inStock(womenBrandsQ.data));
    const menEdges = [...inStock(menBrandsClothingQ.data), ...inStock(menBrandsShoesQ.data)];
    const menVendors = vendors(menEdges);
    const both = [...womenVendors].filter((v) => menVendors.has(v));
    return both.slice(0, 8).map((name) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    }));
  }, [womenBrandsQ.data, menBrandsClothingQ.data, menBrandsShoesQ.data]);

  return (
    <>
      {/* 1. HERO */}
      <section className="relative w-full">
        <div className="relative w-full aspect-[16/10] md:aspect-[16/7] overflow-hidden bg-muted">
          <img
            src={heroImage}
            alt="Palace of Roman — Spring editorial"
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-canvas/80 via-canvas/30 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-screen-2xl mx-auto w-full px-6 md:px-12">
              <div className="max-w-xl">
                <span className="text-[10px] uppercase tracking-[0.35em] text-bronze block mb-6">
                  The Spring Edit
                </span>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif leading-[1.05] tracking-tight text-balance mb-8">
                  A study in considered dressing.
                </h1>
                <p className="text-sm md:text-base text-ink/70 leading-relaxed max-w-md mb-10 text-pretty">
                  A curated edit from the season's most significant houses — quietly assembled, authenticated, and shipped worldwide.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/shop"
                    search={{ q: WOMENS_CLOTHING_QUERY, title: "Women's Clothing" }}
                    className="px-8 py-3.5 bg-ink text-canvas text-[11px] uppercase tracking-[0.25em] hover:bg-ink/85 transition-colors"
                  >
                    Shop Women
                  </Link>
                  <Link
                    to="/collections/$handle"
                    params={{ handle: "mens-luxury-clothing" }}
                    className="px-8 py-3.5 ring-1 ring-ink text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-canvas transition-colors"
                  >
                    Shop Men
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SHOP BY CATEGORY */}
      <section className="py-28">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4 block">The Wardrobe</span>
            <h2 className="text-3xl md:text-4xl font-serif">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {CATEGORY_TILES.map((tile) => (
              <CategoryTile key={tile.key} tile={tile} />
            ))}
          </div>
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
              {womenBrandsQ.isLoading || menBrandsClothingQ.isLoading ? "Loading designers…" : "No shared brands in stock at the moment."}
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

      {/* 5. EDITORIAL SPLIT — two panels, sub-CTAs for clothing + shoes */}
      <section className="py-28">
        <div className="max-w-screen-2xl mx-auto px-6 grid md:grid-cols-2 gap-6 lg:gap-10">
          <EditorialPanel
            image={womenEditorialQ.data?.[0]?.node?.images?.edges?.[0]?.node}
            eyebrow="The Women's Edit"
            heading="Quiet luxury, deliberately curated."
            ctas={[
              { label: "Clothing", to: "/shop", search: { q: WOMENS_CLOTHING_QUERY, title: "Women's Clothing" } },
              { label: "Shoes", to: "/shop", search: { q: WOMENS_SHOES_QUERY, title: "Women's Shoes" } },
            ]}
          />
          <EditorialPanel
            image={menEditorialQ.data?.[0]?.node?.images?.edges?.[0]?.node}
            eyebrow="The Men's Edit"
            heading="Refined tailoring and considered staples."
            ctas={[
              { label: "Clothing", to: "/collections/$handle", params: { handle: "mens-luxury-clothing" } },
              { label: "Shoes", to: "/collections/$handle", params: { handle: "mens-designer-shoes" } },
            ]}
          />
        </div>
      </section>

      {/* 6. BEST SELLERS */}
      <section className="py-28">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4 block">Most Coveted</span>
            <h2 className="text-3xl md:text-4xl font-serif">Best Sellers</h2>
          </div>
          <ProductGrid edges={bestSellersQ.data ?? []} loading={bestSellersQ.isLoading} />
        </div>
      </section>

      {/* 7. NEWSLETTER */}
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
