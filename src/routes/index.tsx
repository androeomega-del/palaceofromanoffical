import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchProducts, fetchCollection, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import heroImage from "@/assets/home-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Palace of Roman — Curated Luxury Fashion" },
      { name: "description", content: "Curated luxury fashion. Gucci, Prada, Dolce & Gabbana, Saint Laurent and more — authenticated and shipped worldwide." },
      { property: "og:title", content: "Palace of Roman — Curated Luxury Fashion" },
      { property: "og:description", content: "A curated destination for luxury fashion." },
      { property: "og:image", content: heroImage },
    ],
  }),
  component: HomePage,
});

const FEATURED_BRANDS = [
  { name: "Dolce & Gabbana", slug: "dolce-&-gabbana" },
  { name: "Calvin Klein", slug: "calvin-klein" },
  { name: "Brunello Cucinelli", slug: "brunello-cucinelli" },
  { name: "Prada", slug: "prada" },
  { name: "Gucci", slug: "gucci" },
  { name: "Saint Laurent", slug: "saint-laurent" },
  { name: "Armani", slug: "armani" },
  { name: "Alexander McQueen", slug: "alexander-mcqueen" },
];

const CATEGORY_TILES = [
  { handle: "cat-womens-wear", label: "Clothing", caption: "Tailoring, knitwear & ready-to-wear" },
  { handle: "cat-womens-bags", label: "Bags", caption: "Heritage leather goods" },
  { handle: "cat-mens-shoes", label: "Shoes", caption: "Footwear for every occasion" },
  { handle: "cat-womens-accessories", label: "Accessories", caption: "Finishing touches" },
];

function HomePage() {
  const newArrivalsQ = useQuery({
    queryKey: ["home", "new-arrivals"],
    queryFn: () => fetchProducts({ first: 12, sortKey: "CREATED_AT", reverse: true }),
  });
  const womenHeroQ = useQuery({
    queryKey: ["home", "women-hero"],
    queryFn: () => fetchCollection("womens-accessories-1", 1).then((c) => c?.products?.edges?.[0] ?? null),
  });
  const menHeroQ = useQuery({
    queryKey: ["home", "men-hero"],
    queryFn: () => fetchCollection("mens-luxury-clothing", 1).then((c) => c?.products?.edges?.[0] ?? null),
  });
  const bestSellersQ = useQuery({
    queryKey: ["home", "best-sellers"],
    queryFn: () => fetchProducts({ first: 8, sortKey: "BEST_SELLING" }),
  });

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
                    to="/collections/$handle"
                    params={{ handle: "womens-accessories-1" }}
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
              <CategoryTile key={tile.handle} {...tile} />
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
              search={{ sort: "newest" } as any}
              className="text-[11px] uppercase tracking-[0.25em] border-b border-ink/20 pb-1 hover:border-ink hidden md:inline-block"
            >
              View all
            </Link>
          </div>
          <HorizontalRail edges={newArrivalsQ.data ?? []} loading={newArrivalsQ.isLoading} />
        </div>
      </section>

      {/* 4. FEATURED BRANDS */}
      <section className="py-28 border-y border-ink/5">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4 block">Maisons</span>
            <h2 className="text-3xl md:text-4xl font-serif">Featured Brands</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10">
            {FEATURED_BRANDS.map((b) => (
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

      {/* 5. EDITORIAL SPLIT — Women + Men */}
      <section className="py-28">
        <div className="max-w-screen-2xl mx-auto px-6 grid md:grid-cols-2 gap-6 lg:gap-10">
          <EditorialPanel
            edge={womenHeroQ.data ?? undefined}
            eyebrow="The Women's Edit"
            heading="Quiet luxury, deliberately curated."
            ctaLabel="Discover Women"
            handle="womens-accessories-1"
          />
          <EditorialPanel
            edge={menHeroQ.data ?? undefined}
            eyebrow="The Men's Edit"
            heading="Refined tailoring and considered staples."
            ctaLabel="Discover Men"
            handle="mens-luxury-clothing"
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

function CategoryTile({ handle, label, caption }: { handle: string; label: string; caption: string }) {
  const { data } = useQuery({
    queryKey: ["home", "category-tile", handle],
    queryFn: () => fetchCollection(handle, 1).then((c) => c?.products?.edges?.[0]?.node?.images?.edges?.[0]?.node ?? null),
  });

  return (
    <Link to="/collections/$handle" params={{ handle }} className="group block">
      <div className="w-full aspect-[3/4] bg-muted overflow-hidden mb-5 relative">
        {data ? (
          <img
            src={data.url}
            alt={data.altText ?? label}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
          </div>
        )}
      </div>
      <h3 className="text-base md:text-lg font-serif mb-1">{label}</h3>
      <p className="text-xs text-muted-foreground">{caption}</p>
    </Link>
  );
}

function EditorialPanel({
  edge,
  eyebrow,
  heading,
  ctaLabel,
  handle,
}: {
  edge?: ShopifyProduct | null;
  eyebrow: string;
  heading: string;
  ctaLabel: string;
  handle: string;
}) {
  const img = edge?.node?.images?.edges?.[0]?.node;
  return (
    <Link to="/collections/$handle" params={{ handle }} className="group block">
      <div className="w-full aspect-[4/5] bg-muted overflow-hidden mb-6">
        {img && (
          <img
            src={img.url}
            alt={img.altText ?? eyebrow}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
          />
        )}
      </div>
      <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3 block">{eyebrow}</span>
      <h3 className="text-2xl md:text-3xl font-serif leading-tight mb-5 text-balance">{heading}</h3>
      <span className="text-[11px] uppercase tracking-[0.25em] border-b border-ink/20 pb-1 group-hover:border-ink transition-colors">
        {ctaLabel}
      </span>
    </Link>
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
