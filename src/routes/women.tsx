/**
 * Women's Homepage — /women
 *
 * Editorial Farfetch-narrow 7-section gateway for womenswear, written in
 * Palace of Roman's curatorial voice. Mirrors men.tsx's component system but
 * with a tighter rhythm (one editorial story per beat, no duplicate brand
 * rails). Verified Shopify handles: womens-clothing, womens-shoes,
 * womens-bags, womens-jewelry, women-accessories, women.
 *
 * Staged launch: NOT linked from primary nav or home edition body yet. The
 * four "Curated Edit" tiles point to dedicated themed pages also shipping
 * in this batch (the-cucinelli-edit, the-prada-effect, dolce-romana,
 * the-bag-vault).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Plane, RotateCcw, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Children, type ReactNode, useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

import { fetchCollection, fetchProducts } from "@/lib/shopify";
import { cdnImage } from "@/lib/cdn-image";
import { ProductCard } from "@/components/product-card";

import womenHero from "@/assets/women/women-hero.jpg";
import editCucinelliHero from "@/assets/women/edit-cucinelli-hero.jpg";
import editPradaHero from "@/assets/women/edit-prada-hero.jpg";
import editDgHero from "@/assets/women/edit-dg-hero.jpg";
import editBagsHero from "@/assets/women/edit-bags-hero.jpg";

import brandSaintLaurent from "@/assets/brand-saint-laurent-women.jpg";
import brandPrada from "@/assets/brand-prada-women.jpg";
import brandDolceGabbana from "@/assets/brand-dolce-gabbana-women.jpg";
import brandBottegaVeneta from "@/assets/brand-bottega-veneta-women.jpg";
import brandGucci from "@/assets/brand-gucci-women.jpg";
import brandVersace from "@/assets/brand-versace-women.jpg";

export const Route = createFileRoute("/women")({
  head: () => ({
    meta: [
      { title: "Womenswear — Resort 2026 | Palace of Roman" },
      {
        name: "description",
        content:
          "Womenswear Resort 2026 from Brunello Cucinelli, Prada, Dolce & Gabbana, Ferragamo and the maisons defining the season. Dresses, knitwear, bags, jewellery. Worldwide shipping, 100% authentic.",
      },
      { property: "og:title", content: "Womenswear — Resort 2026 | Palace of Roman" },
      {
        property: "og:description",
        content:
          "Considered cashmere, architectural lines, Sicilian lace and the bags worth holding onto. Curated from the world's leading maisons.",
      },
      { property: "og:url", content: "https://palaceofromanofficial.com/women" },
      {
        property: "og:image",
        content: `https://palaceofromanofficial.com${womenHero}`,
      },
      {
        name: "twitter:image",
        content: `https://palaceofromanofficial.com${womenHero}`,
      },
    ],
    links: [
      { rel: "canonical", href: "https://palaceofromanofficial.com/women" },
      { rel: "preload", as: "image", href: womenHero, fetchPriority: "high" } as any,
    ],
  }),
  component: WomenHomePage,
});

function WomenHomePage() {
  useEffect(() => {
    import("@/stores/dept-store").then((m) => m.useDeptStore.getState().setDept("women"));
  }, []);
  return (
    <>
      <HeroBanner />
      <JustLanded />
      <CuratedEditGrid />
      <WhatsResonating />
      <MaisonsInFocus />
      <BuyersPick />
      <FinishingPieces />
      <TrustStrip />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Shared carousel section (mirror of men.tsx CarouselSection)        */
/* ─────────────────────────────────────────────────────────────────── */

type CarouselSectionProps = {
  ariaLabel: string;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  sectionClassName?: string;
  itemClassName?: string;
};

function CarouselSection({
  ariaLabel,
  eyebrow,
  title,
  description,
  actions,
  children,
  sectionClassName = "bg-canvas pt-16 md:pt-24",
  itemClassName = "basis-[68%] sm:basis-[42%] md:basis-[32%] lg:basis-[24%]",
}: CarouselSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section aria-label={ariaLabel} className={sectionClassName}>
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <div className="flex items-end justify-between mb-8 md:mb-10 gap-6">
          <div>
            {eyebrow ? (
              <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">
                {eyebrow}
              </p>
            ) : null}
            <h2 className="font-serif text-3xl md:text-4xl text-ink mb-3">
              {title}
            </h2>
            {description ? (
              <p className="text-[14px] md:text-[15px] text-muted-foreground max-w-lg leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          <div className="hidden md:flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Previous ${ariaLabel}`}
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canPrev}
                className="w-10 h-10 grid place-items-center border border-ink/15 hover:border-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label={`Next ${ariaLabel}`}
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canNext}
                className="w-10 h-10 grid place-items-center border border-ink/15 hover:border-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            {actions}
          </div>
        </div>
        <div className="overflow-hidden -mx-2" ref={emblaRef}>
          <div className="flex">
            {Children.toArray(children).map((child, index) => (
              <div key={index} className={`px-2 shrink-0 ${itemClassName}`}>
                {child}
              </div>
            ))}
          </div>
        </div>
        {actions ? <div className="md:hidden mt-8 text-center">{actions}</div> : null}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  1. Hero Banner                                                     */
/* ─────────────────────────────────────────────────────────────────── */

function HeroBanner() {
  return (
    <section aria-label="Womenswear Resort 2026 hero" className="bg-canvas">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[80vh] md:min-h-[78vh]">
        <div className="order-2 md:order-1 flex items-center justify-center bg-canvas px-6 md:px-10 py-14 md:py-0">
          <div className="max-w-md text-center">
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-5">
              The Women's Edit — Resort 2026
            </p>
            <h1 className="font-serif text-[34px] md:text-[44px] leading-[1.1] text-ink mb-6 md:mb-8">
              A wardrobe, considered.
            </h1>
            <p className="text-[14px] md:text-[15px] text-ink/80 leading-relaxed mb-8 md:mb-10">
              Cashmere that holds its shape, lines that hold the room,
              jewellery that closes a thought. The maisons defining how
              women dress this season — Brunello Cucinelli, Prada, Dolce
              &amp; Gabbana, Ferragamo.
            </p>
            <Link
              to="/editorial/womens-edit"
              className="inline-flex items-center justify-center px-8 py-3 border border-ink text-[13px] text-ink hover:bg-ink hover:text-canvas transition-colors"
            >
              Shop the Edit
            </Link>
          </div>
        </div>
        <div className="order-1 md:order-2 relative aspect-[4/5] md:aspect-auto bg-muted overflow-hidden">
          <img
            src={womenHero}
            alt="Womenswear Resort 2026 — model in camel cashmere knit and ivory wool trousers in a sunlit Milanese palazzo courtyard"
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  2. Just Landed — C→A→C→S look-building cadence                     */
/* ─────────────────────────────────────────────────────────────────── */

function JustLanded() {
  const { data } = useQuery({
    queryKey: ["women", "just-landed", "v1-look"],
    queryFn: () =>
      fetchProducts({
        first: 60,
        query: 'tag:Women AND tag:"New with tags"',
        sortKey: "CREATED_AT",
        reverse: true,
      }),
    staleTime: 10 * 60 * 1000,
  });

  const products = data ?? [];
  const SHOE = /shoe|sneaker|boot|loafer|pump|heel|sandal|mule|espadrille|flat/i;
  const ACC = /bag|belt|wallet|sunglass|eyewear|hat|scarf|jewel|necklace|earring|bracelet|ring|watch|clutch|pouch/i;
  const shoes: typeof products = [];
  const accs: typeof products = [];
  const clothing: typeof products = [];
  for (const p of products) {
    const t = `${p.node.productType ?? ""} ${p.node.title ?? ""}`;
    if (SHOE.test(t)) shoes.push(p);
    else if (ACC.test(t)) accs.push(p);
    else clothing.push(p);
  }
  const pattern: Array<"C" | "A" | "C" | "S"> = ["C", "A", "C", "S"];
  const ordered: typeof products = [];
  const seen = new Set<string>();
  const take = (bucket: typeof products, fallback: typeof products) => {
    const next =
      bucket.find((p) => !seen.has(p.node.id)) ??
      fallback.find((p) => !seen.has(p.node.id));
    if (next) {
      seen.add(next.node.id);
      ordered.push(next);
    }
  };
  for (let i = 0; ordered.length < 16 && i < 40; i++) {
    const slot = pattern[i % pattern.length];
    if (slot === "A") take(accs, products);
    else if (slot === "S") take(shoes, products);
    else take(clothing, products);
  }
  const display = ordered.length > 0 ? ordered : products.slice(0, 16);

  return (
    <CarouselSection
      ariaLabel="Just landed in womenswear"
      eyebrow="New In This Week"
      title="Just Landed"
      description="The latest arrivals, arranged the way a woman builds a look — a dress, the chain, a knit, the heel."
      actions={
        <Link
          to="/collections/$handle"
          params={{ handle: "womens-clothing" }}
          className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze/50 pb-1 hover:text-bronze hover:border-bronze transition-colors"
        >
          Explore New In →
        </Link>
      }
    >
      {display.length > 0
        ? display.map((p) => <ProductCard key={p.node.id} product={p} />)
        : Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] por-shimmer bg-muted" />
          ))}
    </CarouselSection>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  3. The Curated Edit — 4 themed destinations                         */
/* ─────────────────────────────────────────────────────────────────── */

const CURATED_EDITS: {
  eyebrow: string;
  title: string;
  body: string;
  to: "/edits/the-cucinelli-edit" | "/edits/the-prada-effect" | "/edits/dolce-romana" | "/edits/the-bag-vault";
  image: string;
  alt: string;
}[] = [
  {
    eyebrow: "Edit 01 — Quiet Cashmere",
    title: "The Cucinelli Edit",
    body: "Soft tailoring, monastic neutrals, and the cashmere worn on the long afternoon.",
    to: "/edits/the-cucinelli-edit",
    image: editCucinelliHero,
    alt: "The Cucinelli Edit — model in ivory cashmere turtleneck and wool trousers in an Italian villa",
  },
  {
    eyebrow: "Edit 02 — Architectural Minimalism",
    title: "The Prada Effect",
    body: "Re-Nylon, polished black, and the lines that quietly run the season.",
    to: "/edits/the-prada-effect",
    image: editPradaHero,
    alt: "The Prada Effect — model in a black Prada belted coat against polished concrete",
  },
  {
    eyebrow: "Edit 03 — Sicilian Romance",
    title: "Dolce Romana",
    body: "Lace, embroidery, gold filigree — the holiday wardrobe written in Italian.",
    to: "/edits/dolce-romana",
    image: editDgHero,
    alt: "Dolce Romana — model in a black floral lace dress in a Sicilian baroque courtyard",
  },
  {
    eyebrow: "Edit 04 — The Investment",
    title: "The Bag Vault",
    body: "Calfskin, lambskin, structured top-handle. The bags worth holding onto.",
    to: "/edits/the-bag-vault",
    image: editBagsHero,
    alt: "The Bag Vault — four designer handbags arranged on travertine with leather gloves and gold chain",
  },
];

function CuratedEditGrid() {
  return (
    <CarouselSection
      ariaLabel="The Curated Edit"
      eyebrow="The Curated Edit"
      title="Four ways into the season."
      description="Themed chapters from the buying desk — each opening a dedicated edit of pieces in stock."
      itemClassName="basis-[86%] sm:basis-[64%] md:basis-[46%] lg:basis-[28%]"
    >
      {CURATED_EDITS.map((e) => (
        <Link
          key={e.title}
          to={e.to}
          className="group relative block aspect-[3/4] overflow-hidden bg-muted"
        >
          <img
            src={e.image}
            alt={e.alt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-7 text-canvas">
            <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-3">
              {e.eyebrow}
            </p>
            <h3 className="font-serif text-xl md:text-2xl leading-[1.1] mb-3">
              {e.title}
            </h3>
            <p className="text-[12px] md:text-[13px] text-canvas/85 leading-relaxed mb-4">
              {e.body}
            </p>
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-canvas border-b border-bronze pb-1 group-hover:text-bronze transition-colors">
              Open the Edit →
            </span>
          </div>
        </Link>
      ))}
    </CarouselSection>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  4. What's Resonating — typographic chips                            */
/* ─────────────────────────────────────────────────────────────────── */

const RESONATING: { label: string; handle: string }[] = [
  { label: "Cashmere Knits", handle: "womens-clothing" },
  { label: "Lace Dressing", handle: "womens-clothing" },
  { label: "The Heel", handle: "womens-shoes" },
  { label: "Gold Jewellery", handle: "womens-jewelry" },
];

function WhatsResonating() {
  return (
    <section aria-label="What's resonating" className="bg-canvas pt-16 md:pt-24">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">
          What's Resonating
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-ink mb-10">
          The pieces moving this week.
        </h2>
        <ul className="flex flex-wrap gap-x-10 md:gap-x-14 gap-y-5">
          {RESONATING.map((r) => (
            <li key={r.label}>
              <Link
                to="/collections/$handle"
                params={{ handle: r.handle }}
                className="font-serif text-2xl md:text-4xl text-ink hover:text-bronze transition-colors"
              >
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  5. Maisons in Focus                                                 */
/* ─────────────────────────────────────────────────────────────────── */

const MAISONS: { label: string; vendor: string; handle: string; alt: string; src: string }[] = [
  { label: "Saint Laurent", vendor: "saint-laurent", handle: "brand-saint-laurent", alt: "Saint Laurent womenswear — Le Smoking tuxedo tailoring", src: brandSaintLaurent },
  { label: "Prada", vendor: "prada", handle: "brand-prada", alt: "Prada womenswear — minimalist sheath and triangle-logo top-handle bag", src: brandPrada },
  { label: "Dolce & Gabbana", vendor: "dolce-gabbana", handle: "brand-dolce-gabbana", alt: "Dolce & Gabbana womenswear — Sicilian black lace corseted gown", src: brandDolceGabbana },
  { label: "Bottega Veneta", vendor: "bottega-veneta", handle: "brand-bottega-veneta", alt: "Bottega Veneta womenswear — caramel leather trench and intrecciato shoulder bag", src: brandBottegaVeneta },
  { label: "Gucci", vendor: "gucci", handle: "brand-gucci", alt: "Gucci womenswear — emerald silk pussy-bow blouse with horsebit loafers", src: brandGucci },
  { label: "Versace", vendor: "versace", handle: "brand-versace", alt: "Versace womenswear — draped sapphire silk jersey gown with Medusa hardware", src: brandVersace },
];

function MaisonsInFocus() {
  return (
    <CarouselSection
      ariaLabel="Maisons in focus"
      eyebrow="Maisons in Focus"
      title="Houses in motion."
      description="The maisons our buying desk is watching this season."
      itemClassName="basis-[68%] sm:basis-[44%] md:basis-[30%] lg:basis-[22%]"
    >
      {MAISONS.map((b) => (
        <MaisonTile key={b.vendor} brand={b} />
      ))}
    </CarouselSection>
  );
}

function MaisonTile({
  brand,
}: {
  brand: { label: string; vendor: string; handle: string; alt: string; src: string };
}) {
  return (
    <Link
      to="/brand/$vendor"
      params={{ vendor: brand.vendor }}
      className="group block"
    >
      <div className="relative aspect-[3/4] bg-muted overflow-hidden mb-3">
        <img
          src={brand.src}
          alt={brand.alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
        <p className="absolute inset-x-0 bottom-4 text-center text-[11px] md:text-[12px] uppercase tracking-[0.3em] text-canvas">
          {brand.label}
        </p>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  6. Buyer's Pick                                                     */
/* ─────────────────────────────────────────────────────────────────── */

function BuyersPick() {
  const picks = useQuery({
    queryKey: ["women", "buyers-pick", "v1"],
    queryFn: () => fetchCollection("womens-clothing", 12),
    staleTime: 10 * 60 * 1000,
  });
  const fallback = useQuery({
    queryKey: ["women", "buyers-pick-fallback", "v1"],
    queryFn: () => fetchCollection("womens-shoes", 12),
    enabled: !!picks.data && (picks.data?.products?.edges?.length ?? 0) === 0,
    staleTime: 10 * 60 * 1000,
  });

  const fromPicks = picks.data?.products?.edges ?? [];
  const fromFallback = fallback.data?.products?.edges ?? [];
  const products = fromPicks.length > 0 ? fromPicks : fromFallback;
  const sourceHandle = fromPicks.length > 0 ? "womens-clothing" : "womens-shoes";

  return (
    <CarouselSection
      ariaLabel="The Buyer's Pick"
      eyebrow="The Buyer's Pick"
      title="Chosen with intention."
      description="Eight pieces our buying desk would put on the rail today."
      actions={
        <Link
          to="/collections/$handle"
          params={{ handle: sourceHandle }}
          className="inline-flex shrink-0 items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze/50 pb-1 hover:text-bronze hover:border-bronze transition-colors"
        >
          Explore the Edit →
        </Link>
      }
    >
      {products.length > 0
        ? products.slice(0, 8).map((p) => <ProductCard key={p.node.id} product={p} />)
        : Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] por-shimmer bg-muted" />
          ))}
    </CarouselSection>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  7. Finishing Pieces — bags + jewellery campaign                     */
/* ─────────────────────────────────────────────────────────────────── */

function FinishingPieces() {
  return (
    <CarouselSection
      ariaLabel="Finishing pieces"
      eyebrow="Accessories"
      title="Finishing pieces"
      description="The bag that closes the outfit. The chain that closes the thought."
      itemClassName="basis-[86%] sm:basis-[64%] md:basis-[46%] lg:basis-[42%]"
    >
      <CampaignTile
        eyebrow="The Bag Edit"
        headline="The bag, as the answer."
        body="Top-handle, crossbody, structured tote — pieces worth carrying through the decade."
        cta="Explore Bags →"
        handle="womens-bags"
        image={editBagsHero}
        alt="The Bag Edit — four designer handbags on a travertine surface in warm window light"
      />
      <CampaignTile
        eyebrow="The Jewellery Edit"
        headline="Gold, kept close."
        body="A single chain, a filigree drop, the brass cuff — small pieces that hold the whole look."
        cta="Explore Jewellery →"
        handle="womens-jewelry"
        image={editDgHero}
        alt="The Jewellery Edit — gold drop earrings worn with a black lace dress in Mediterranean light"
      />
    </CarouselSection>
  );
}

function CampaignTile({
  eyebrow,
  headline,
  body,
  cta,
  handle,
  image,
  alt,
}: {
  eyebrow: string;
  headline: string;
  body: string;
  cta: string;
  handle: string;
  image: string;
  alt: string;
}) {
  return (
    <Link
      to="/collections/$handle"
      params={{ handle }}
      className="group flex h-full flex-col border border-ink/10 overflow-hidden bg-canvas"
    >
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={image}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between px-6 md:px-8 py-8 md:py-10 bg-canvas">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">
            {eyebrow}
          </p>
          <h3 className="font-serif text-2xl md:text-3xl leading-[1.1] text-ink mb-4 max-w-[18ch]">
            {headline}
          </h3>
          <p className="text-[14px] md:text-[15px] text-muted-foreground leading-relaxed mb-6">
            {body}
          </p>
        </div>
        <span className="inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink border-b border-bronze/50 pb-1 self-start group-hover:text-bronze group-hover:border-bronze transition-colors">
          {cta}
        </span>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Trust Strip                                                         */
/* ─────────────────────────────────────────────────────────────────── */

function TrustStrip() {
  const items = [
    { Icon: ShieldCheck, label: "100% Authentic" },
    { Icon: Plane, label: "Ships from EU" },
    { Icon: RotateCcw, label: "14-Day Returns" },
    { Icon: MessageCircle, label: "Personal Concierge" },
  ];
  return (
    <CarouselSection
      ariaLabel="Service promise"
      title="The service promise"
      description="Quiet assurances for a considered luxury purchase."
      sectionClassName="bg-canvas pt-16 md:pt-24 pb-10 md:pb-14"
      itemClassName="basis-[58%] sm:basis-[40%] md:basis-[28%] lg:basis-[22%]"
    >
      {items.map(({ Icon, label }) => (
        <div
          key={label}
          className="min-h-36 border border-ink/10 bg-canvas-raised flex flex-col items-center justify-center text-center px-6"
        >
          <Icon className="w-5 h-5 text-bronze mb-3" strokeWidth={1.25} />
          <p className="text-[11px] uppercase tracking-[0.25em] text-ink">{label}</p>
        </div>
      ))}
    </CarouselSection>
  );
}
