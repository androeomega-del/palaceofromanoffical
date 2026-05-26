import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { CampaignVideo } from "@/components/campaign-video";
import { EditorialHotspots, type Hotspot } from "@/components/editorial-hotspots";
import { routeHead } from "@/lib/seo";
import mensHero from "@/assets/mens-swim-hero.jpg";
import mensDetail1 from "@/assets/mens-swim-detail-1.jpg";
import mensDetail2 from "@/assets/mens-swim-detail-2.jpg";
import mensPortrait from "@/assets/mens-swim-portrait.jpg";
import mensSwimVideo from "@/assets/mens-swim-campaign.mp4.asset.json";

export const Route = createFileRoute("/campaign/mens-swim")({
  head: () => {
    const title = "Men's Swim — Resort 2026 Campaign | Palace of Roman";
    const desc =
      "A curated edit of men's luxury swimwear for Resort 2026 — tailored swim shorts, linen cabana shirts, leather slides and Mediterranean essentials from the maisons we carry. 100% authentic, sourced from authorised distributors.";
    const rh = routeHead({
      path: "/campaign/mens-swim",
      title,
      description: desc,
    });
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: `https://palaceofromanofficial.com${mensHero}` },
        { name: "twitter:image", content: `https://palaceofromanofficial.com${mensHero}` },
        ...rh.meta,
      ],
      links: rh.links,
    };
  },
  component: MensSwimCampaign,
});

/* ---------- helpers ---------- */

function categoryFor(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("swim short") || t.includes("board short") || t.includes("trunk")) return "Swim Shorts";
  if (t.includes("swim brief") || t.includes("brief")) return "Swim Brief";
  if (t.includes("cabana") || (t.includes("shirt") && t.includes("linen"))) return "Cabana Shirt";
  if (t.includes("shirt")) return "Shirt";
  if (t.includes("slide") || t.includes("sandal") || t.includes("espadrille")) return "Footwear";
  if (t.includes("sunglass") || t.includes("eyewear")) return "Eyewear";
  if (t.includes("hat") || t.includes("cap")) return "Hat";
  if (t.includes("bag") || t.includes("tote")) return "Beach Bag";
  if (t.includes("bracelet") || t.includes("necklace") || t.includes("chain") || t.includes("ring")) return "Jewellery";
  if (t.includes("towel") || t.includes("robe")) return "Beachwear";
  return "The Piece";
}

function buildHotspots(
  products: ShopifyProduct[],
  spots: Array<{ x: number; y: number; match: RegExp; label?: string }>,
): Hotspot[] {
  // STRICT: only tag a hotspot when a catalog product actually matches.
  // Never fall back to a random product — a wrong tag is worse than no tag,
  // because it sends the customer to a piece that isn't in the photo.
  const used = new Set<string>();
  const out: Hotspot[] = [];
  for (const s of spots) {
    const pick = products.find(
      (p) => !used.has(p.node.handle) && s.match.test(p.node.title),
    );
    if (!pick) continue; // no match in catalog → skip the hotspot entirely
    used.add(pick.node.handle);
    out.push({
      x: s.x,
      y: s.y,
      handle: pick.node.handle,
      label: s.label ?? categoryFor(pick.node.title),
      sublabel: pick.node.vendor,
    });
  }
  return out;
}


/* ---------- page ---------- */

function MensSwimCampaign() {
  // Core swim edit — men's swimwear across all maisons we carry
  const productsQ = useQuery({
    queryKey: ["campaign", "mens-swim"],
    queryFn: () =>
      fetchProducts({
        first: 24,
        query:
          "(tag:Mens OR tag:Men OR title:men) AND (tag:Swimwear OR tag:Swim OR tag:Beachwear OR title:swim OR title:trunk OR title:board)",
      }),
  });

  // Accessories edit — for the deck flatlay (slides, shirts, sunglasses)
  const accessoriesQ = useQuery({
    queryKey: ["campaign", "mens-swim-accessories"],
    queryFn: () =>
      fetchProducts({
        first: 12,
        query:
          "(tag:Mens OR tag:Men OR title:men) AND (title:shirt OR title:slide OR title:sandal OR title:espadrille OR title:sunglass OR title:hat OR title:tote)",
      }),
  });

  const products = productsQ.data ?? [];
  const accessories = accessoriesQ.data ?? [];

  /* ---- hotspot maps per editorial image ---- */
  // Hard-pin the swim short hotspot to the exact Bottega Veneta feather-print
  // boxer the model is wearing in the editorial. Other hotspots fall back to
  // strict regex matching against the catalog.
  const FEATHER_BOXER_HANDLE = "white-polyamide-swim-shorts";
  const portraitSpots = useMemo<Hotspot[]>(() => {
    const spots: Hotspot[] = [];
    const featherBoxer = products.find((p) => p.node.handle === FEATHER_BOXER_HANDLE);
    const used = new Set<string>();

    const chain = products.find((p) => /chain|necklace/i.test(p.node.title));
    if (chain) {
      used.add(chain.node.handle);
      spots.push({
        x: 50,
        y: 36,
        handle: chain.node.handle,
        label: categoryFor(chain.node.title),
        sublabel: chain.node.vendor,
      });
    }

    if (featherBoxer) {
      used.add(featherBoxer.node.handle);
      spots.push({
        x: 50,
        y: 70,
        handle: featherBoxer.node.handle,
        label: "Feather-Print Swim Boxer",
        sublabel: featherBoxer.node.vendor,
      });
    }

    const wrist = products.find(
      (p) => !used.has(p.node.handle) && /bracelet|cuff|signet/i.test(p.node.title),
    );
    if (wrist) {
      spots.push({
        x: 30,
        y: 50,
        handle: wrist.node.handle,
        label: categoryFor(wrist.node.title),
        sublabel: wrist.node.vendor,
      });
    }

    return spots;
  }, [products]);

  // Hard-pin the detail-1 hotspot to the Bottega Veneta Blue Polyamide Swim
  // Shorts — the exact azure boxer with gold-tipped drawcords in the photo.
  const BLUE_BOXER_HANDLE = "blue-polyamide-swim-shorts";
  const detail1Spots = useMemo<Hotspot[]>(() => {
    const pick = products.find((p) => p.node.handle === BLUE_BOXER_HANDLE);
    if (!pick) return [];
    return [
      {
        x: 48,
        y: 55,
        handle: pick.node.handle,
        label: "Azure Swim Boxer",
        sublabel: pick.node.vendor,
      },
    ];
  }, [products]);

  // Hard-pin the deck flatlay to the three actual catalog pieces in the photo.
  // Givenchy black swim shorts (upper-left), Brunello Cucinelli blue cotton
  // shirt (upper-right), Bottega Veneta green cassette-print swim shorts
  // (lower-center). The magazine is a styling prop and is not tagged.
  const DECK_PIECES: Array<{ x: number; y: number; handle: string; label: string }> = [
    { x: 28, y: 22, handle: "black-polyamide-swim-shorts", label: "Black Swim Shorts" },
    { x: 72, y: 22, handle: "blue-cotton-shirt", label: "Blue Cotton Shirt" },
    { x: 45, y: 46, handle: "gold-metal-sunglasses-9", label: "Wraparound Sunglasses" },
    { x: 22, y: 70, handle: "green-polyamide-swim-shorts", label: "Cassette-Print Swim Shorts" },
    { x: 68, y: 62, handle: "brown-calf-leather-bos-taurus-flat-sandals", label: "FF Monogram Slides" },
  ];
  const detail2Spots = useMemo<Hotspot[]>(() => {
    const pool = [...products, ...accessories];
    const out: Hotspot[] = [];
    for (const s of DECK_PIECES) {
      const pick = pool.find((p) => p.node.handle === s.handle);
      if (!pick) continue;
      out.push({
        x: s.x,
        y: s.y,
        handle: pick.node.handle,
        label: s.label,
        sublabel: pick.node.vendor,
      });
    }
    return out;
  }, [products, accessories]);

  return (
    <div className="bg-canvas">
      {/* ============ HERO ============ */}
      <section className="relative h-[92vh] min-h-[640px] overflow-hidden bg-ink">
        <CampaignVideo
          src={mensSwimVideo.url}
          poster={mensHero}
          className="absolute inset-0 w-full h-full object-cover opacity-95"
          label="Play the Men's Swim Resort 2026 film"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-ink/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-transparent to-transparent pointer-events-none" />

        <div className="relative h-full flex flex-col">
          <nav className="px-6 md:px-10 pt-8 text-[10px] uppercase tracking-[0.3em] text-canvas/80">
            <Link to="/swim" className="hover:text-canvas">Swim</Link>
            <span className="mx-2">/</span>
            <span className="text-canvas">Men's Swim — Resort 2026</span>
          </nav>

          <div className="flex-1 flex items-end">
            <div className="max-w-screen-2xl mx-auto px-6 md:px-10 pb-16 md:pb-24 w-full">
              <span className="block text-[10px] md:text-xs uppercase tracking-[0.5em] text-[var(--sea)] mb-5">
                The Campaign — Resort 2026
              </span>
              <h1 className="font-serif text-canvas text-5xl md:text-7xl lg:text-[8rem] leading-[0.92] max-w-5xl text-balance">
                Men's Swim
                <span className="block italic font-light mt-2">a season at sea level.</span>
              </h1>
              <p className="mt-7 max-w-xl text-canvas/85 text-sm md:text-base leading-relaxed">
                Tailored swim shorts, linen cabana shirts and leather slides — a curated
                men's edit for Resort 2026, photographed on the cliffs of the Tyrrhenian
                coast. 100% authentic, sourced from authorised distributors and ready to
                ship.
              </p>
              <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-canvas/60">
                Tap the white markers on every image to shop the piece.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 md:gap-4">
                <a
                  href="#shop"
                  className="px-9 py-4 bg-canvas text-ink text-[10px] uppercase tracking-[0.35em] font-medium hover:bg-[var(--sea)] hover:text-canvas transition-colors"
                >
                  Shop the Edit
                </a>
                <Link
                  to="/swim/size-guide"
                  className="px-9 py-4 border border-canvas/60 text-canvas text-[10px] uppercase tracking-[0.35em] font-medium hover:bg-canvas hover:text-ink transition-colors"
                >
                  Swim Size Guide
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
            "A man's summer wardrobe, cut down to its essentials — one short,
            one shirt, one pair of slides, and the sea."
          </p>
          <p className="text-sm md:text-base text-muted-foreground italic">
            From the Palace of Roman edit, Resort 2026.
          </p>
        </div>
      </section>

      {/* ============ EDITORIAL — DIPTYCH (shoppable) ============ */}
      <section className="px-6 md:px-10 pb-20 md:pb-28 bg-canvas">
        <div className="max-w-screen-2xl mx-auto grid md:grid-cols-12 gap-6 md:gap-8">
          {/* Frame 1 — portrait, shoppable */}
          <div className="md:col-span-7 relative">
            <EditorialHotspots
              src={mensPortrait}
              alt="Male model in Bottega Veneta red and light blue feather-print swim boxer standing in turquoise Mediterranean water with a gold chain"
              hotspots={portraitSpots}
              aspect="4/5"
            />
            <figcaption className="mt-3 flex items-baseline justify-between gap-4">
              <span className="font-serif italic text-lg md:text-xl text-ink">The salt hour.</span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {portraitSpots.length} pieces tagged
              </span>
            </figcaption>
          </div>

          <div className="md:col-span-5 flex flex-col gap-6 md:gap-8">
            {/* Frame 2 — close-up, shoppable */}
            <div className="relative">
              <EditorialHotspots
                src={mensDetail1}
                alt="Close-up of the Bottega Veneta azure blue polyamide swim boxer with gold drawcord tips, drying on limestone"
                hotspots={detail1Spots}
                aspect="4/5"
              />
              <figcaption className="mt-3 flex items-baseline justify-between gap-4">
                <span className="font-serif italic text-base md:text-lg text-ink">Navy &amp; brass.</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  {detail1Spots.length} pieces tagged
                </span>
              </figcaption>
            </div>

            <div className="bg-canvas-raised/60 p-8 md:p-10">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--sea)] mb-4 block">
                The Short
              </span>
              <h2 className="font-serif text-2xl md:text-3xl mb-4 leading-[1.15]">
                The 5-inch tailored short, re-cut for the water.
              </h2>
              <p className="text-sm leading-relaxed text-ink/80">
                A shorter rise, a cleaner leg line and a quick-dry technical weave that
                holds its shape from the deckchair to the dinner table. Finished with
                gold-tipped drawcords and an interior mesh lining — the only short you
                pack.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CHAPTER — THE KIT (shoppable) ============ */}
      <section className="px-6 md:px-10 py-20 md:py-28 bg-canvas-raised/40 border-y border-ink/5">
        <div className="max-w-screen-2xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4 block">
              Chapter II — The Kit
            </span>
            <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] mb-6">
              One short. One shirt. The rest is sun.
            </h2>
            <p className="text-sm md:text-base text-ink/80 leading-relaxed mb-6">
              The capsule extends past the water — linen cabana shirts, leather slides,
              tortoiseshell aviators and a single gold signet ring. The complete men's
              kit for a Mediterranean week, edited down to what matters.
            </p>
            <p className="text-sm text-ink/70 leading-relaxed mb-8">
              Each piece arrives with the maison's tags intact and an authenticity card —
              100% authentic, sourced from authorised distributors and shipped worldwide.
            </p>
            <Link
              to="/shop"
              search={{
                q: "(tag:Mens OR tag:Men) AND (title:shirt OR title:slide OR title:sunglass OR title:hat)",
                title: "Men's Resort Kit",
              }}
              className="inline-block text-[11px] uppercase tracking-[0.3em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
            >
              Shop the Kit →
            </Link>
          </div>
          <div className="relative">
            <EditorialHotspots
              src={mensDetail2}
              alt="Men's Resort 2026 flatlay on warm teak deck: Givenchy black swim shorts, Brunello Cucinelli blue cotton shirt, Bottega Veneta green Cassette-print swim shorts"
              hotspots={detail2Spots}
              aspect="4/5"
            />
            <figcaption className="mt-3 flex items-baseline justify-between gap-4">
              <span className="font-serif italic text-base md:text-lg text-ink">The Tyrrhenian kit.</span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {detail2Spots.length} pieces tagged
              </span>
            </figcaption>
          </div>
        </div>
      </section>

      {/* ============ SHOP THE EDIT ============ */}
      <section id="shop" className="px-6 md:px-10 py-20 md:py-28 scroll-mt-20">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--sea)] mb-3 block">
                Shop the Edit
              </span>
              <h2 className="font-serif text-3xl md:text-5xl leading-[1.05]">
                Men's Swim — Resort 2026
              </h2>
            </div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {productsQ.isLoading
                ? "Loading the edit…"
                : `${products.length} Pieces in the Edit`}
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
                The edit is currently being restocked from our authorised distributors.
              </p>
              <Link
                to="/swim"
                className="text-[11px] uppercase tracking-[0.3em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
              >
                Browse all Swim →
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
