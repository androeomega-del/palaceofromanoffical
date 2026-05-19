import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchCollection, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Palace of Roman — Curated Luxury Fashion" },
      { name: "description", content: "A curated destination for luxury fashion. Gucci, Prada, Alexander McQueen, Armani and more." },
    ],
  }),
  component: HomePage,
});

const FEATURED_BRANDS = [
  "GUCCI",
  "PRADA",
  "ALEXANDER McQUEEN",
  "ARMANI",
  "SAINT LAURENT",
  "CALVIN KLEIN",
];

function HomePage() {
  // Hero split: pull a featured product image from women's accessories and men's clothing.
  const womenQ = useQuery({
    queryKey: ["home", "women-hero"],
    queryFn: () =>
      fetchCollection("womens-accessories", 1).then((c) =>
        c?.products?.edges?.[0] ?? null
      ),
  });
  const menQ = useQuery({
    queryKey: ["home", "men-hero"],
    queryFn: () =>
      fetchCollection("mens-luxury-clothing", 1).then((c) =>
        c?.products?.edges?.[0] ?? null
      ),
  });

  const shoesQ = useQuery({
    queryKey: ["home", "shoes"],
    queryFn: () =>
      fetchCollection("mens-designer-shoes", 8).then((c) => c?.products?.edges ?? [])
        .then((edges) => edges.length ? edges : fetchProducts({ first: 8, query: "product_type:Shoes" })),
  });

  const bestSellersQ = useQuery({
    queryKey: ["home", "best-sellers"],
    queryFn: () => fetchProducts({ first: 8, sortKey: "BEST_SELLING" }),
  });

  return (
    <>
      {/* Editorial Hero Split */}
      <section className="px-6 py-12">
        <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row gap-6">
          <HeroPanel
            edge={womenQ.data ?? undefined}
            label="Women's Accessories"
            heading="The Architectural Archive"
            ctaLabel="Discover the collection"
            ctaTo="/collections/$handle"
            ctaParams={{ handle: "womens-accessories" }}
          />
          <div className="lg:w-1/2 lg:mt-24">
            <HeroPanel
              edge={menQ.data ?? undefined}
              label="Men's Luxury Clothing"
              heading="Refined Proportion"
              ctaLabel="Shop Men's Wear"
              ctaTo="/collections/$handle"
              ctaParams={{ handle: "mens-luxury-clothing" }}
              hideOuterWidth
            />
          </div>
        </div>
      </section>

      {/* Logo Wall */}
      <section className="py-24 border-y border-ink/5">
        <div className="max-w-screen-xl mx-auto px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 items-center">
          {FEATURED_BRANDS.map((b) => (
            <Link
              key={b}
              to="/brand/$vendor"
              params={{ vendor: b.toLowerCase().replace(/\s+/g, "-") }}
              className="text-center text-xs md:text-sm tracking-[0.3em] font-medium opacity-60 hover:opacity-100 hover:text-bronze transition-all"
            >
              {b}
            </Link>
          ))}
        </div>
      </section>

      {/* Designer Shoes Feature */}
      <section className="py-32">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <div className="max-w-[48ch]">
              <span className="text-xs uppercase tracking-[0.2em] text-bronze mb-4 block">Selected Footwear</span>
              <h2 className="text-4xl md:text-5xl font-serif leading-none text-balance">Foundations of Form</h2>
            </div>
            <Link
              to="/collections/$handle"
              params={{ handle: "mens-designer-shoes" }}
              className="text-xs uppercase tracking-widest border-b border-ink/20 pb-1 hover:border-ink hidden md:block"
            >
              View all shoes
            </Link>
          </div>

          <ProductGrid edges={shoesQ.data ?? []} loading={shoesQ.isLoading} columns={4} />
        </div>
      </section>

      {/* Final Cuts (Sale) */}
      <section className="py-32 bg-ink text-canvas">
        <div className="max-w-screen-xl mx-auto px-6 flex flex-col items-center text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] mb-8 text-bronze">Season Conclusion</span>
          <h2 className="text-5xl md:text-6xl font-serif mb-10 tracking-tight">Final Cuts</h2>
          <p className="max-w-[48ch] text-sm leading-relaxed text-canvas/60 mb-12 text-pretty">
            A quiet curation of significant pieces from past seasons. Exceptional tailoring and accessories at meaningful reductions.
          </p>
          <Link
            to="/collections/$handle"
            params={{ handle: "high-discounts" }}
            className="px-10 py-4 ring-1 ring-canvas text-xs uppercase tracking-[0.2em] hover:bg-canvas hover:text-ink transition-colors"
          >
            Enter the Sale Archive
          </Link>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-32">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex flex-col items-center mb-16 text-center">
            <span className="text-xs uppercase tracking-[0.2em] text-bronze mb-4">Most Coveted</span>
            <h2 className="text-4xl md:text-5xl font-serif">Currently Best-Selling</h2>
          </div>
          <ProductGrid edges={bestSellersQ.data ?? []} loading={bestSellersQ.isLoading} columns={4} />
        </div>
      </section>
    </>
  );
}

function HeroPanel({
  edge,
  label,
  heading,
  ctaLabel,
  ctaTo,
  ctaParams,
  hideOuterWidth,
}: {
  edge?: ShopifyProduct | null;
  label: string;
  heading: string;
  ctaLabel: string;
  ctaTo: string;
  ctaParams: Record<string, string>;
  hideOuterWidth?: boolean;
}) {
  const img = edge?.node?.images?.edges?.[0]?.node;
  return (
    <div className={hideOuterWidth ? "" : "lg:w-1/2"}>
      <Link to={ctaTo as any} params={ctaParams as any} className="relative group block">
        <div className="w-full aspect-[3/4] bg-muted overflow-hidden">
          {img ? (
            <img
              src={img.url}
              alt={img.altText ?? label}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full grid place-items-center">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
            </div>
          )}
        </div>
      </Link>
      <div className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.25em] text-bronze mb-3">{label}</p>
        <h2 className="text-2xl md:text-3xl font-serif leading-tight text-balance mb-4">{heading}</h2>
        <Link
          to={ctaTo as any}
          params={ctaParams as any}
          className="text-xs uppercase tracking-[0.2em] border-b border-ink/20 pb-1 hover:border-ink transition-colors"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}

function ProductGrid({ edges, loading, columns = 4 }: { edges: ShopifyProduct[]; loading?: boolean; columns?: 3 | 4 }) {
  const gridCls = columns === 3 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-4";

  if (loading && edges.length === 0) {
    return (
      <div className={`grid gap-x-6 gap-y-12 ${gridCls}`}>
        {Array.from({ length: columns }).map((_, i) => (
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
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-muted-foreground">No products found.</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-x-6 gap-y-12 ${gridCls}`}>
      {edges.map((edge) => (
        <ProductCard key={edge.node.id} product={edge} />
      ))}
    </div>
  );
}
