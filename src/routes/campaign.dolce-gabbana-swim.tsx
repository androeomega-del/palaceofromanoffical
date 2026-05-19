import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { CampaignVideo } from "@/components/campaign-video";
import { routeHead } from "@/lib/seo";
import dgHero from "@/assets/dg-campaign-hero.jpg";
import dgDetail1 from "@/assets/dg-campaign-detail-1.jpg";
import dgDetail2 from "@/assets/dg-campaign-detail-2.jpg";
import dgPortrait from "@/assets/dg-campaign-portrait.jpg";
import swimCampaignVideo from "@/assets/swim-campaign.mp4.asset.json";

export const Route = createFileRoute("/campaign/dolce-gabbana-swim")({
  head: () => {
    const title = "Dolce & Gabbana — Resort 2026 Swim Campaign | Palace of Roman";
    const desc =
      "Sicilian majolica, lemon prints and gold seashell detailing — the Dolce & Gabbana Resort 2026 swim capsule, curated by Palace of Roman. 100% authentic, sourced from authorised distributors.";
    const rh = routeHead({
      path: "/campaign/dolce-gabbana-swim",
      title,
      description: desc,
    });
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: `https://palaceofroman.com${dgHero}` },
        { name: "twitter:image", content: `https://palaceofroman.com${dgHero}` },
        ...rh.meta,
      ],
      links: rh.links,
    };
  },
  component: DGSwimCampaign,
});

function DGSwimCampaign() {
  const productsQ = useQuery({
    queryKey: ["campaign", "dg-swim"],
    queryFn: () =>
      fetchProducts({
        first: 12,
        query:
          "vendor:'Dolce & Gabbana' AND (tag:Swimwear OR tag:Beachwear OR title:bikini OR title:swimsuit)",
      }),
  });

  const products = productsQ.data?.edges ?? [];

  return (
    <div className="bg-canvas">
      {/* ============ HERO ============ */}
      <section className="relative h-[92vh] min-h-[640px] overflow-hidden bg-ink">
        <CampaignVideo
          src={swimCampaignVideo.url}
          poster={dgHero}
          className="absolute inset-0 w-full h-full object-cover opacity-95"
          label="Play the Dolce & Gabbana Resort 2026 film"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-ink/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-transparent to-transparent pointer-events-none" />

        <div className="relative h-full flex flex-col">
          <nav className="px-6 md:px-10 pt-8 text-[10px] uppercase tracking-[0.3em] text-canvas/80">
            <Link to="/swim" className="hover:text-canvas">Swim</Link>
            <span className="mx-2">/</span>
            <span className="text-canvas">Dolce &amp; Gabbana — Resort 2026</span>
          </nav>

          <div className="flex-1 flex items-end">
            <div className="max-w-screen-2xl mx-auto px-6 md:px-10 pb-16 md:pb-24 w-full">
              <span className="block text-[10px] md:text-xs uppercase tracking-[0.5em] text-[var(--sea)] mb-5">
                The Campaign — Resort 2026
              </span>
              <h1 className="font-serif text-canvas text-5xl md:text-7xl lg:text-[8rem] leading-[0.92] max-w-5xl text-balance">
                Dolce &amp; Gabbana
                <span className="block italic font-light mt-2">at the water's edge.</span>
              </h1>
              <p className="mt-7 max-w-xl text-canvas/85 text-sm md:text-base leading-relaxed">
                Sicilian majolica, lemon groves and gold seashell detailing — a capsule of
                bikinis, swimsuits and beachwear photographed on the cliffs of Capri.
                100% authentic, sourced from authorised distributors and ready to ship.
              </p>
              <div className="mt-9 flex flex-wrap gap-3 md:gap-4">
                <a
                  href="#shop"
                  className="px-9 py-4 bg-canvas text-ink text-[10px] uppercase tracking-[0.35em] font-medium hover:bg-[var(--sea)] hover:text-canvas transition-colors"
                >
                  Shop the Capsule
                </a>
                <Link
                  to="/brand/$vendor"
                  params={{ vendor: "dolce-gabbana" }}
                  className="px-9 py-4 border border-canvas/60 text-canvas text-[10px] uppercase tracking-[0.35em] font-medium hover:bg-canvas hover:text-ink transition-colors"
                >
                  Enter the Maison
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MANIFESTO ============ */}
      <section className="px-6 md:px-10 py-24 md:py-32 bg-canvas">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-6 block">
            The Manifesto
          </span>
          <p className="font-serif text-2xl md:text-4xl leading-[1.25] text-ink mb-8">
            "A summer cut from majolica and lemon leaves — the language of Sicily,
            re-spoken in silk-finish jersey and gold."
          </p>
          <p className="text-sm md:text-base text-muted-foreground italic">
            From the Palace of Roman edit, Resort 2026.
          </p>
        </div>
      </section>

      {/* ============ EDITORIAL — DIPTYCH ============ */}
      <section className="px-6 md:px-10 pb-20 md:pb-28 bg-canvas">
        <div className="max-w-screen-2xl mx-auto grid md:grid-cols-12 gap-6 md:gap-8">
          <figure className="md:col-span-7 relative overflow-hidden aspect-[4/5] group">
            <img
              src={dgPortrait}
              alt="Model in Sicilian-print swimsuit wading in turquoise Mediterranean water"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1600ms] group-hover:scale-105"
              width={1080}
              height={1350}
            />
            <figcaption className="absolute bottom-6 left-6 right-6 text-canvas font-serif italic text-2xl md:text-3xl">
              Sicilia, in the late hour.
            </figcaption>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent pointer-events-none" />
          </figure>

          <div className="md:col-span-5 flex flex-col gap-6 md:gap-8">
            <figure className="relative overflow-hidden aspect-[4/5] group">
              <img
                src={dgDetail1}
                alt="Close-up of D&G majolica-print swimwear with gold hardware"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1600ms] group-hover:scale-105"
                width={1080}
                height={1350}
              />
              <figcaption className="absolute bottom-5 left-5 text-canvas font-serif italic text-xl md:text-2xl">
                Majolica &amp; gold.
              </figcaption>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/45 to-transparent pointer-events-none" />
            </figure>

            <div className="bg-canvas-raised/60 p-8 md:p-10">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--sea)] mb-4 block">
                The Print
              </span>
              <h2 className="font-serif text-2xl md:text-3xl mb-4 leading-[1.15]">
                The Maiolica codes, re-cut for the water.
              </h2>
              <p className="text-sm leading-relaxed text-ink/80">
                The Maiolica print — born from the tiled floors of Caltagirone — has been a
                Dolce &amp; Gabbana signature since 2016. This resort cut translates it into
                quick-dry silk-finish jersey, finished with the maison's gold-plated rings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CHAPTER — THE ACCESSORIES ============ */}
      <section className="px-6 md:px-10 py-20 md:py-28 bg-canvas-raised/40 border-y border-ink/5">
        <div className="max-w-screen-2xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4 block">
              Chapter II — The Accessories
            </span>
            <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] mb-6">
              Lemon-grove yellow, raffia, and gold seashells.
            </h2>
            <p className="text-sm md:text-base text-ink/80 leading-relaxed mb-6">
              The capsule extends past the water — silk lemon-print pareos, woven raffia
              totes and gold-plated shell drop earrings that finish the look between the
              shore and the trattoria.
            </p>
            <p className="text-sm text-ink/70 leading-relaxed mb-8">
              Each piece arrives with the maison's tags intact and an authenticity card —
              100% authentic, sourced from authorised distributors and shipped worldwide.
            </p>
            <Link
              to="/shop"
              search={{
                q: "vendor:'Dolce & Gabbana' AND (tag:Accessories OR tag:Beachwear)",
                title: "D&G Resort Accessories",
              }}
              className="inline-block text-[11px] uppercase tracking-[0.3em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
            >
              Shop the Accessories →
            </Link>
          </div>
          <figure className="relative overflow-hidden aspect-[4/5]">
            <img
              src={dgDetail2}
              alt="D&G lemon-print pareo, raffia bag, gold seashell earrings, espadrilles"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
              width={1080}
              height={1350}
            />
          </figure>
        </div>
      </section>

      {/* ============ SHOP THE CAPSULE ============ */}
      <section id="shop" className="px-6 md:px-10 py-20 md:py-28 scroll-mt-20">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--sea)] mb-3 block">
                Shop the Capsule
              </span>
              <h2 className="font-serif text-3xl md:text-5xl leading-[1.05]">
                Dolce &amp; Gabbana — Resort 2026
              </h2>
            </div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {productsQ.isLoading
                ? "Loading the edit…"
                : `${products.length} Pieces in the Capsule`}
            </p>
          </div>

          {productsQ.isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full aspect-[4/5] bg-muted mb-5" />
                  <div className="h-2 w-16 bg-muted mb-2" />
                  <div className="h-3 w-3/4 bg-muted" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center border border-ink/10">
              <p className="text-sm text-muted-foreground mb-6">
                The capsule is currently being restocked from the maison's authorised distributor.
              </p>
              <Link
                to="/brand/$vendor"
                params={{ vendor: "dolce-gabbana" }}
                className="text-[11px] uppercase tracking-[0.3em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
              >
                Browse all D&amp;G →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14">
              {products.map((e) => (
                <ProductCard key={e.node.id} product={e} />
              ))}
            </div>
          )}

          <div className="mt-16 flex flex-wrap gap-4 justify-center">
            <Link
              to="/swim"
              className="px-9 py-4 border border-ink text-[10px] uppercase tracking-[0.3em] hover:bg-ink hover:text-canvas transition-colors"
            >
              Back to the Swim Edit
            </Link>
            <Link
              to="/swim/size-guide"
              className="px-9 py-4 bg-ink text-canvas text-[10px] uppercase tracking-[0.3em] hover:bg-[var(--sea)] transition-colors"
            >
              Swim Size Guide
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
