import { createFileRoute, Link, useNavigate, redirect, stripSearchParams } from "@tanstack/react-router";
import { canonicalCollectionHandle } from "@/lib/collection-canonical";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";

import { fetchCollectionFiltered, fetchCollection, fetchProductsPage, type StorefrontFilterValue } from "@/lib/shopify";
import { fetchCollectionTotal } from "@/lib/collection-count.functions";
import { fetchCollectionCategoryCounts } from "@/lib/collection-category-counts.functions";
import { bucketsForHandle, bucketProduct } from "@/lib/category-buckets";
import { ProductCard } from "@/components/product-card";
import {
  EditorialLinksRail,
  editorialLinksForCollection,
} from "@/components/editorial-links-rail";
import { readMetaAbBucket } from "@/lib/meta-ab.functions";
import { pickCollectionMeta, seoMetaForBucket, type MetaBucket } from "@/lib/meta-ab";
import { useMetaAb } from "@/hooks/use-meta-ab";
import { absoluteUrl, SITE_URL } from "@/lib/seo";
import { collectionSeo } from "@/lib/collection-seo";
import {
  CatalogFilters,
  CatalogSort,
  ActiveFilterPills,
  SORT_OPTIONS,
  type Selection,
  type SortValue,
} from "@/components/catalog-filters";

// Curated handles that receive the Farfetch-style editorial hero +
// featured-three row + roomier grid. Adding a handle here is the only
// change needed to opt another collection in.
//
// PHASE 2 — Expanded the map so every major PLP carries an editorial
// lead-in (Farfetch ships one on every collection page). Voice is
// curatorial, restrained, never urgent.
const EDITORIAL_HERO_COPY: Record<string, { eyebrow: string; tagline: string }> = {
  "best-sellers": {
    eyebrow: "Most-Loved at Palace of Roman",
    tagline:
      "The pieces our clients return for — runway-grade silhouettes from Gucci, Prada, Saint Laurent and the houses defining this season. Sourced through our authorised distributor network, shipped worldwide.",
  },
  "new-arrivals": {
    eyebrow: "Just In",
    tagline:
      "Handpicked daily from the maisons defining the season. New silhouettes, fresh proportions, the pieces worth a long look — added as our buyers see them.",
  },
  "womens-clothing": {
    eyebrow: "Womenswear — The Edit",
    tagline:
      "Tailoring, ready-to-wear, evening pieces and the houses that anchor a wardrobe — curated from Versace, Dolce & Gabbana, Brunello Cucinelli and the maisons defining contemporary luxury.",
  },
  "mens-clothing": {
    eyebrow: "Menswear — The Edit",
    tagline:
      "Considered tailoring, soft knits, weekend essentials and resort staples — drawn from the houses that have spent decades getting the proportions right.",
  },
  "womens-shoes": {
    eyebrow: "The Footwear Edit",
    tagline:
      "Heels with architecture, sandals with restraint, boots with intent. The pieces that finish the outfit — sourced from the houses that have always understood the role of the shoe.",
  },
  "mens-shoes": {
    eyebrow: "The Footwear Edit",
    tagline:
      "Italian leather loafers, hand-finished sneakers, considered boots. The pieces that quietly hold a wardrobe together — from the houses that have spent generations perfecting the craft.",
  },
  "italian-leather-handbags": {
    eyebrow: "The Italian Leather Atelier",
    tagline:
      "Hand-finished leathers, considered hardware, and the houses that built their reputations on a single perfect bag. Curated from the Italian maisons defining the category.",
  },
  "italian-leather-loafers": {
    eyebrow: "The Italian Leather Atelier",
    tagline:
      "Pebble grain, polished calf, and the unhurried construction that separates a loafer from a slipper. The pieces a wardrobe leans on for years.",
  },
  "italian-leather-wallets": {
    eyebrow: "The Italian Leather Atelier",
    tagline:
      "Bifolds, cardholders, zip-arounds — small leather goods finished by the same workshops that supply the major houses. Quiet pieces that carry a wardrobe's signature.",
  },
  "designer-sunglasses": {
    eyebrow: "The Eyewear Edit",
    tagline:
      "Acetate, metal, oversized, restrained. The frames that define a face — drawn from Versace, Dolce & Gabbana, Tom Ford and the houses that treat eyewear as architecture.",
  },
  "designer-belts": {
    eyebrow: "The Finishing Touch",
    tagline:
      "Hardware, leather, proportion — the belt that completes the silhouette. Curated from the houses that built their codes on the buckle.",
  },
  "designer-crossbody-bags": {
    eyebrow: "The Crossbody Edit",
    tagline:
      "Hands-free architecture — the bags that move with the day. Considered straps, soft leathers, and the proportions that work from morning to dinner.",
  },
  "designer-mens-shirts": {
    eyebrow: "The Shirt Edit",
    tagline:
      "Poplin, linen, silk-blends — the shirts that anchor everything else. Cut by the houses that understand the difference between a shirt and a piece of clothing.",
  },
  "luxury-sneakers": {
    eyebrow: "The Sneaker Edit",
    tagline:
      "Italian construction, considered branding, and the silhouettes that have crossed from streetwear into the wardrobe proper. From the houses defining the category.",
  },
  "cashmere-sweaters": {
    eyebrow: "Soft Architecture",
    tagline:
      "Hand-loomed cashmere, considered gauges, and the colours that hold up to daylight. The pieces a wardrobe gets quieter and better with.",
  },
  "silk-scarves": {
    eyebrow: "The Silk Edit",
    tagline:
      "Hand-rolled hems, archive prints, and the squares that finish a coat, a handbag, a head. The accessory that has never gone out of fashion.",
  },
  "polo-shirts": {
    eyebrow: "The Polo, Properly Considered",
    tagline:
      "Piqué cottons, fine knits, and the houses that have spent decades perfecting the collar that bridges sportswear and tailoring.",
  },
  "long-sleeve-tees": {
    eyebrow: "The Shoulder-Season Essential",
    tagline:
      "Heavy jerseys, fine cottons, and the long-sleeve cuts that work alone or layered beneath everything else.",
  },
  "hoodies": {
    eyebrow: "Soft Architecture",
    tagline:
      "Brushed cottons, heavyweight loopbacks, and the kind of hoods that hold their shape — off-duty luxury from the houses that taught the category how to behave.",
  },
};

const SORT_VALUES = SORT_OPTIONS.map((o) => o.value);

// Map collections-index sort keys → per-collection sort values
const INDEX_SORT_ALIASES: Record<string, SortValue> = {
  popular: "BEST_SELLING-false",
  newest: "CREATED-true",
  alpha: "TITLE-false",
};

export const Route = createFileRoute("/collections/$handle")({
  beforeLoad: ({ params, search }) => {
    const canonical = canonicalCollectionHandle(params.handle);
    if (canonical !== params.handle.toLowerCase()) {
      throw redirect({
        to: "/collections/$handle",
        params: { handle: canonical },
        search,
        replace: true,
      });
    }
  },
  validateSearch: (search: Record<string, unknown>): { sort: SortValue } => {
    const raw = typeof search.sort === "string" ? search.sort : "";
    let sort: SortValue;
    if (SORT_VALUES.includes(raw as SortValue)) sort = raw as SortValue;
    else if (raw in INDEX_SORT_ALIASES) sort = INDEX_SORT_ALIASES[raw];
    else sort = "BEST_SELLING-false";
    return { sort };
  },
  // SEO: keep bare /collections/<handle> canonical — don't 307 to ?sort=…default.
  search: { middlewares: [stripSearchParams({ sort: "BEST_SELLING-false" as SortValue })] },
  loader: async ({ params }) => {
    const [collectionRes, abRes] = await Promise.all([
      fetchCollection(params.handle, 1).catch(() => null),
      readMetaAbBucket().catch(() => ({ bucket: 0 as MetaBucket })),
    ]);
    return {
      title: collectionRes?.title ?? titleizeHandle(params.handle),
      description: collectionRes?.description ?? "",
      image: collectionRes?.image?.url ?? null,
      abBucket: abRes.bucket,
    };
  },
  head: ({ params, loaderData }) => {
    const title = loaderData?.title ?? titleizeHandle(params.handle);
    const seo = collectionSeo({
      handle: params.handle,
      title,
      description: loaderData?.description ?? null,
    });
    const path = `/collections/${params.handle}`;
    const url = absoluteUrl(path);
    // Meta A/B: pick the variant for this handle based on the SSR-resolved
    // bucket. Canonical URL is identical across variants so the test does
    // not produce duplicate-content signals.
    const bucket = (loaderData?.abBucket ?? 0) as MetaBucket;
    const ab = pickCollectionMeta(params.handle, bucket, {
      title: seo.title,
      description: seo.description,
    });
    const { canonical, robots } = seoMetaForBucket(bucket, url);
    const meta: Array<Record<string, string>> = [
      { title: ab.title },
      { name: "description", content: ab.description },
      { property: "og:title", content: ab.title },
      { property: "og:description", content: ab.description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
    ];
    if (robots) meta.push({ name: "robots", content: robots });
    if (loaderData?.image) {
      meta.push({ property: "og:image", content: loaderData.image });
      meta.push({ name: "twitter:image", content: loaderData.image });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
              { "@type": "ListItem", position: 2, name: "Collections", item: SITE_URL + "/collections" },
              { "@type": "ListItem", position: 3, name: title, item: url },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description: seo.description,
            url,
            isPartOf: { "@type": "WebSite", name: "Palace of Roman", url: SITE_URL },
          }),
        },
      ],
    };
  },
  component: CollectionPage,
});

function titleizeHandle(handle: string) {
  return handle
    .replace(/-/g, " ")
    .replace(/\bs\b/g, "'s")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function CollectionPage() {
  const { handle } = Route.useParams();
  const { sort } = Route.useSearch();
  const { abBucket, title: rawTitle, description: rawDesc } = Route.useLoaderData();
  const navigate = useNavigate({ from: "/collections/$handle" });

  // Meta A/B exposure + client-side variant patch. The base SEO copy is
  // the SSR title/description for this collection — same input the head()
  // uses — so client and server pick the same variant text.
  const baseSeo = collectionSeo({ handle, title: rawTitle ?? handle, description: rawDesc ?? null });
  useMetaAb(`collection:${handle}`, abBucket as MetaBucket, {
    a: pickCollectionMeta(handle, 0, { title: baseSeo.title, description: baseSeo.description }),
    b: pickCollectionMeta(handle, 1, { title: baseSeo.title, description: baseSeo.description }),
  });
  // Surfaces whose own theme makes a card-level badge redundant. Sale-themed
  // pages: every card is on sale, so "House Markdown / Final Reductions"
  // labels would visually clutter the grid without adding information.
  const suppressedBadges = /^(sale|final-reductions|markdown|clearance|last-call)$/i.test(handle)
    ? (["markdown"] as const)
    : ([] as const);
  const setSort = (v: SortValue) =>
    navigate({ search: (prev: { sort: SortValue }) => ({ ...prev, sort: v }), replace: true });

  const [selections, setSelections] = useState<Selection[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Active category chip (single-select, mutually exclusive).
  // For most collections, this is one of CATEGORY_BUCKETS labels (driven
  // by Admin-API aggregation across the entire collection). For the
  // virtual "layering-edit" handle, we keep a bespoke title-regex chip
  // set that better describes the layering taxonomy.
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // The layering-edit handle uses a bespoke local pattern set; every
  // other handle uses the curated 10-bucket whitelist via the server-
  // side aggregation. `isLayering` is the branch switch.
  const isLayering = handle === "layering-edit";

  const LAYERING_PATTERNS: { label: string; test: RegExp }[] = [
    { label: "Polos",        test: /\bpolo\b/i },
    { label: "Long Sleeves", test: /\b(long[\s-]?sleeve|longsleeve|l\/s)\b/i },
    { label: "Turtlenecks",  test: /\b(turtleneck|roll[\s-]?neck|mock[\s-]?neck)\b/i },
    { label: "Cardigans",    test: /\bcardigan\b/i },
    { label: "Hoodies",      test: /\b(hoodie|hooded)\b/i },
    { label: "Sweatshirts",  test: /\b(sweatshirt|crewneck|crew[\s-]?neck)\b/i },
  ];

  function inferLayeringType(title: string): string | null {
    for (const p of LAYERING_PATTERNS) if (p.test.test(title)) return p.label;
    return null;
  }

  // Build Shopify filters arg from selections + price
  const filterInputs = useMemo(() => {
    const arr: object[] = selections.map((s) => JSON.parse(s.input));
    if (priceRange) arr.push({ price: { min: priceRange.min, max: priceRange.max } });
    return arr;
  }, [selections, priceRange]);

  const effectiveSort = handle === "new-arrivals" && sort === "BEST_SELLING-false" ? "CREATED-true" : sort;
  const [sortKey, reverseStr] = effectiveSort.split("-");
  const reverse = reverseStr === "true";

  const q = useInfiniteQuery({
    queryKey: ["collection-filtered", handle, filterInputs, sortKey, reverse],
    queryFn: async ({ pageParam }) => {
      if (handle === "new-arrivals") {
        const page = await fetchProductsPage({
          first: 48,
          after: pageParam as string | null,
          sortKey: sortKey === "CREATED" ? "CREATED_AT" : sortKey,
          reverse,
        });
        return {
          collection: {
            id: "virtual-new-arrivals",
            title: "New Arrivals",
            handle: "new-arrivals",
            description: "",
            image: page.edges[0]?.node.images?.edges?.[0]?.node ?? null,
            updatedAt: new Date(0).toISOString(),
          },
          filters: [],
          edges: page.edges,
          pageInfo: page.pageInfo,
        };
      }
      return fetchCollectionFiltered({
        handle,
        first: 48,
        after: pageParam as string | null,
        filters: filterInputs,
        sortKey,
        reverse,
      });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) =>
      last?.pageInfo?.hasNextPage ? last.pageInfo.endCursor : undefined,
  });

  // True total from Shopify Admin API — used for "Showing X of N" and to
  // know whether infinite scroll has surfaced every active listing.
  const fetchTotal = useServerFn(fetchCollectionTotal);
  const totalQ = useQuery({
    queryKey: ["collection-total", handle],
    queryFn: () => fetchTotal({ data: { handle } }),
    staleTime: 5 * 60_000,
  });
  const total = handle === "new-arrivals" ? null : totalQ.data?.total ?? null;

  // True per-bucket counts via Admin-API walk of the entire collection.
  // Disabled for the bespoke layering-edit chip set (no aggregation
  // needed — that branch uses the loaded-batch counts).
  const fetchCatCounts = useServerFn(fetchCollectionCategoryCounts);
  const categoryCountsQ = useQuery({
    queryKey: ["collection-category-counts", handle],
    queryFn: () => fetchCatCounts({ data: { handle } }),
    staleTime: 10 * 60_000,
    enabled: !isLayering,
  });
  const categoryCounts = categoryCountsQ.data?.counts ?? null;

  // IntersectionObserver sentinel — fetches the next cursor page as soon as
  // the user scrolls within ~800px of the bottom. Continues until
  // hasNextPage === false (Rule 3: zero artificial limits).
  //
  // Implementation note: we use a *callback ref* (not useRef + useEffect) so
  // the observer is attached the moment the sentinel DOM node mounts, and
  // reads the latest query state via `qRef` to avoid stale-closure churn
  // (the `q` object identity changes on every render, which previously made
  // the effect tear down/rebuild the observer constantly — occasionally
  // missing the intersection callback and capping the grid at the first 48).
  const qRef = useRef(q);
  qRef.current = q;
  const ioRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    if (ioRef.current) {
      ioRef.current.disconnect();
      ioRef.current = null;
    }
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const cur = qRef.current;
        if (cur.hasNextPage && !cur.isFetchingNextPage) {
          cur.fetchNextPage();
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    ioRef.current = io;
  }, []);
  useEffect(() => () => ioRef.current?.disconnect(), []);

  // When a category chip is active, auto-exhaust the cursor so client-
  // side bucketing surfaces every matching product across the entire
  // collection — not just whatever was lazy-loaded by scroll. This is
  // what makes "Dresses 47" actually render 47 items, not just the
  // dresses present in the first batch.
  useEffect(() => {
    if (!typeFilter) return;
    if (q.hasNextPage && !q.isFetchingNextPage) {
      q.fetchNextPage();
    }
  }, [typeFilter, q.hasNextPage, q.isFetchingNextPage, q.fetchNextPage, q.data?.pages.length]);

  const pages = q.data?.pages ?? [];
  const data = pages[0] ?? null;
  const filters = data?.filters ?? [];
  const rawEdges = useMemo(() => pages.flatMap((p) => p?.edges ?? []), [pages]);
  const discountEdges = rawEdges;

  // Match a loaded product to the active chip. For layering-edit we use
  // title-regex; for everything else we use the shared bucketProduct
  // helper scoped to the gender-specific bucket set for this handle.
  const activeBuckets = useMemo(() => bucketsForHandle(handle), [handle]);
  function matchesActiveType(
    node: { title?: string | null; tags?: string[] | null },
    label: string,
  ): boolean {
    if (isLayering) return inferLayeringType(node.title ?? "") === label;
    return (
      bucketProduct(
        {
          title: node.title ?? "",
          tags: Array.isArray(node.tags) ? node.tags : [],
        },
        activeBuckets,
      ) === label
    );
  }

  // Chip definitions for the current collection.
  type Chip = { label: string; count: number };
  const chips: Chip[] = useMemo(() => {
    if (isLayering) {
      // Local count from loaded batch — layering catalog is small.
      const c: Record<string, number> = {};
      for (const e of discountEdges) {
        const t = inferLayeringType(e.node.title ?? "");
        if (t) c[t] = (c[t] ?? 0) + 1;
      }
      return LAYERING_PATTERNS.map((p) => ({ label: p.label, count: c[p.label] ?? 0 })).filter(
        (chip) => chip.count > 0,
      );
    }
    if (!categoryCounts) return [];
    return activeBuckets.map((b) => ({
      label: b.label,
      count: categoryCounts[b.label] ?? 0,
    })).filter((chip) => chip.count > 0);
  }, [isLayering, discountEdges, categoryCounts, activeBuckets]);

  const edges = useMemo(() => {
    if (!typeFilter) return discountEdges;
    return discountEdges.filter((e) => matchesActiveType(e.node as { title?: string | null; tags?: string[] | null }, typeFilter));
  }, [discountEdges, typeFilter, isLayering]);


  const title = data?.collection?.title ?? titleizeHandle(handle);
  const description = data?.collection?.description;

  // Header count — reflects the active filter/sort state, not the raw
  // collection size. When a category chip is active and we have the
  // Admin-aggregated count for that bucket, that count is the true
  // master total. Otherwise we fall back to the loaded-count + "+"
  // pattern while the cursor is still draining, and to the absolute
  // Admin productsCount when no filter is active.
  const loadedCount = edges.length;
  const filtersActive =
    Boolean(typeFilter) || selections.length > 0 || Boolean(priceRange);
  const noun = (n: number) => (n === 1 ? "Piece" : "Pieces");
  const activeBucketTrueCount: number | null =
    typeFilter && !isLayering && categoryCounts
      ? categoryCounts[typeFilter] ?? null
      : null;
  let countLabel: string;
  if (q.isLoading) {
    countLabel = "Loading…";
  } else if (typeFilter && activeBucketTrueCount != null && selections.length === 0 && !priceRange) {
    // Pure category-chip filter: show the true Admin-aggregated total
    // for that bucket immediately (e.g. "47 Pieces"), regardless of how
    // many have surfaced via the cursor so far.
    countLabel = `${activeBucketTrueCount} ${noun(activeBucketTrueCount)}`;
  } else if (filtersActive) {
    countLabel = q.hasNextPage
      ? `Showing ${loadedCount}+ ${noun(loadedCount)}`
      : `${loadedCount} ${noun(loadedCount)}`;
  } else if (total != null) {
    countLabel =
      loadedCount < total
        ? `Showing ${loadedCount} of ${total} ${noun(total)}`
        : `${total} ${noun(total)}`;
  } else {
    countLabel = `${loadedCount} ${noun(loadedCount)}`;
  }



  const selectedInputs = useMemo(() => new Set(selections.map((s) => s.input)), [selections]);

  const toggle = (filterId: string, v: StorefrontFilterValue) => {
    setSelections((curr) => {
      if (curr.some((s) => s.input === v.input)) {
        return curr.filter((s) => s.input !== v.input);
      }
      return [...curr, { id: v.id, label: v.label, input: v.input, filterId }];
    });
  };

  const removeOne = (input: string) =>
    setSelections((c) => c.filter((s) => s.input !== input));

  const clearAll = () => {
    setSelections([]);
    setPriceRange(null);
  };

  const sidebar = (
    <CatalogFilters
      filters={filters}
      selectedInputs={selectedInputs}
      priceRange={priceRange}
      onToggle={toggle}
      onPriceChange={setPriceRange}
    />
  );

  const heroImage = data?.collection?.image ?? null;
  const heroSrc = heroImage?.url ?? "";
  const heroAlt = heroImage?.altText ?? `${title} collection at Palace of Roman`;
  const heroFocal = "50% 50%";

  const parsedFocal = (() => {
    const m = heroFocal.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : { x: 50, y: 40 };
  })();
  const renderedFocal = parsedFocal;

  const editorialCopy = EDITORIAL_HERO_COPY[handle];
  const isEditorial = Boolean(editorialCopy);

  // Curated "Featured" trio for editorial handles — top three best-sellers
  // from the same collection, independent of the user's current sort.
  const featuredQ = useQuery({
    queryKey: ["collection-featured", handle],
    queryFn: () =>
      fetchCollectionFiltered({
        handle,
        first: 3,
        filters: [],
        sortKey: "BEST_SELLING",
        reverse: false,
      }).then((r) => r?.edges ?? []),
    enabled: isEditorial,
  });
  const featuredIds = useMemo(
    () => new Set((featuredQ.data ?? []).map((e) => e.node.id)),
    [featuredQ.data],
  );
  const gridEdges = isEditorial
    ? edges.filter((e) => !featuredIds.has(e.node.id))
    : edges;
  const gridGap = isEditorial ? "gap-x-10 gap-y-20" : "gap-x-6 gap-y-16";

  return (
    <div>
      {isEditorial ? (
        <section
          className="relative h-[58vh] min-h-[420px] max-h-[680px] w-full overflow-hidden bg-ink"
          data-testid="collection-hero"
          data-handle={handle.toLowerCase()}
        >
          {heroSrc && (
            <img
              src={heroSrc}
              alt={heroAlt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-90"
              style={{ objectPosition: `${renderedFocal.x}% ${renderedFocal.y}%` }}
              data-testid="collection-hero-img"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/20 to-ink/70" />
          <div className="relative h-full flex items-end">
            <div className="max-w-screen-2xl mx-auto w-full px-6 pb-14 md:pb-20">
              <Link
                to="/"
                className="text-[10px] uppercase tracking-[0.3em] text-canvas/70 hover:text-canvas inline-block mb-8"
              >
                ← Boutique
              </Link>
              <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-bronze mb-5">
                {editorialCopy!.eyebrow}
              </span>
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-canvas text-balance max-w-4xl">
                {title}
              </h1>
              <p className="mt-7 max-w-xl text-sm md:text-base text-canvas/80 leading-relaxed text-pretty">
                {editorialCopy!.tagline}
              </p>
              <p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-canvas/60">
                {countLabel}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section
            className="relative h-[42vh] min-h-[280px] max-h-[520px] w-full overflow-hidden bg-ink/5"
            data-testid="collection-hero"
            data-handle={handle.toLowerCase()}
          >
            {heroSrc && (
              <img
                src={heroSrc}
                alt={heroAlt}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: `${renderedFocal.x}% ${renderedFocal.y}%` }}
                data-testid="collection-hero-img"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
          </section>

          <section className="px-4 md:px-6 pt-8 md:pt-12 pb-6 md:pb-8">
            <div className="max-w-screen-2xl mx-auto">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                <Link to="/" className="hover:text-ink transition-colors">Home</Link>
                <span className="opacity-40">/</span>
                <Link to="/collections" className="hover:text-ink transition-colors">Collections</Link>
                <span className="opacity-40">/</span>
                <span className="text-ink">{title}</span>
              </nav>
              <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <h1 className="text-4xl md:text-6xl font-serif text-balance">{title}</h1>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {countLabel}
                </p>
              </div>
              {description && (
                <p className="mt-6 max-w-[64ch] text-sm text-muted-foreground leading-relaxed">{description}</p>
              )}
            </div>
          </section>
        </>
      )}

      {isEditorial && (featuredQ.data?.length ?? 0) > 0 && (
        <section className="px-4 md:px-6 pt-10 md:pt-16 pb-4">
          <div className="max-w-screen-2xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3 block">
                  The Edit
                </span>
                <h2 className="font-serif text-2xl md:text-3xl">Featured this season</h2>
              </div>
              <p className="hidden md:block text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                A curated three
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12">
              {featuredQ.data!.map((e) => (
                <ProductCard key={e.node.id} product={e} suppressBadges={[...suppressedBadges]} />

              ))}
            </div>
            
          </div>
        </section>
      )}


      <section className="px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-screen-2xl mx-auto flex gap-10">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">{sidebar}</div>

          {/* Main column */}
          <div className="flex-1 min-w-0">
            {/* Sort dropdown — same menu on every catalog surface */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden text-[11px] uppercase tracking-[0.25em] border-b border-ink/30 pb-1 hover:text-bronze hover:border-bronze transition-colors"
              >
                Filter
              </button>
              <CatalogSort value={sort} onChange={setSort} />
            </div>

            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filter products">
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="absolute inset-0 bg-ink/40"
                />
                <div className="absolute inset-y-0 left-0 w-[88%] max-w-sm bg-canvas px-6 py-6 overflow-y-auto shadow-2xl">
                  <div className="mb-6 flex items-center justify-between border-b border-ink/10 pb-4">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-ink">Filter</p>
                    <button
                      type="button"
                      onClick={() => setMobileFiltersOpen(false)}
                      className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink"
                    >
                      Close
                    </button>
                  </div>
                  {sidebar}
                </div>
              </div>
            )}



            {/* Category chips — Admin-API aggregated counts across the
                entire collection (curated 10-bucket whitelist).
                Single-select; "All" clears. Hidden if only one chip
                would render (nothing to choose between). */}
            {chips.length > 1 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mr-2">
                  Category
                </span>
                <button
                  onClick={() => setTypeFilter(null)}
                  className={`text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border rounded-full transition-colors ${
                    typeFilter === null
                      ? "bg-ink text-canvas border-ink"
                      : "border-ink/15 text-muted-foreground hover:border-ink hover:text-ink"
                  }`}
                >
                  All
                </button>
                {chips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => setTypeFilter(typeFilter === chip.label ? null : chip.label)}
                    className={`text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border rounded-full transition-colors ${
                      typeFilter === chip.label
                        ? "bg-ink text-canvas border-ink"
                        : "border-ink/15 text-muted-foreground hover:border-ink hover:text-ink"
                    }`}
                  >
                    {chip.label}
                    <span className="ml-2 opacity-60">{chip.count}</span>
                  </button>
                ))}
              </div>
            )}




            <ActiveFilterPills
              selections={selections}
              priceRange={priceRange}
              onRemove={removeOne}
              onClearPrice={() => setPriceRange(null)}
              onClearAll={clearAll}
            />

            {q.isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-5 md:gap-x-6 gap-y-12">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i}>
                    <div className="w-full aspect-[4/5] por-shimmer mb-5" />
                    <div className="h-2 w-16 por-shimmer mb-2" />
                    <div className="h-3 w-3/4 por-shimmer" />
                  </div>
                ))}
              </div>
            ) : edges.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-sm text-muted-foreground mb-6">
                  No pieces match the current filters.
                </p>
                {(selections.length > 0 || priceRange) && (
                  <button
                    onClick={clearAll}
                    className="text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className={`grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 ${gridGap}`}>
                  {gridEdges.map((e) => (
                    <ProductCard key={e.node.id} product={e} suppressBadges={[...suppressedBadges]} />
                  ))}
                </div>
                {/* IntersectionObserver sentinel — drives infinite scroll.
                    Real height + min-h ensures the node is always layout-
                    measurable so IO reliably reports intersection. */}
                <div ref={sentinelRef} aria-hidden className="h-10 w-full mt-10" />
                {(q.hasNextPage || q.isFetchingNextPage) && (
                  <div className="mt-6 flex justify-center">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                      Loading more…
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Editorial internal links — strengthens topical relevance and
          shortens crawl path from PLPs into long-form editorial. */}
      <EditorialLinksRail
        links={editorialLinksForCollection(handle)}
        eyebrow="Further reading"
        heading="From the Editorial"
        className="pb-20"
      />

      {/* FAQ deep-links — route shoppers from a PLP into the structured
          answers most relevant to a category purchase decision. */}
      <section aria-labelledby="plp-faq" className="border-t border-ink/10 py-16 px-6 md:px-10 lg:px-14">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">Common questions</p>
          <h2 id="plp-faq" className="font-serif text-2xl md:text-3xl tracking-tight mb-8">
            Before you order.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-6 text-[14px]">
            <Link to="/faq" hash="sourcing-authenticity" className="block group">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Sourcing</p>
              <p className="font-serif text-base group-hover:text-bronze">Where do these pieces come from? →</p>
            </Link>
            <Link to="/faq" hash="shipping" className="block group">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Shipping</p>
              <p className="font-serif text-base group-hover:text-bronze">How long will my order take to arrive? →</p>
            </Link>
            <Link to="/faq" hash="returns-exchanges" className="block group">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Returns</p>
              <p className="font-serif text-base group-hover:text-bronze">What is your return window? →</p>
            </Link>
            <Link to="/faq" hash="sizing-care" className="block group">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Sizing &amp; care</p>
              <p className="font-serif text-base group-hover:text-bronze">Which sizing system do you use? →</p>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.25em]">
            <Link to="/faq" className="border-b border-ink/40 pb-1 hover:text-bronze hover:border-bronze">All FAQs →</Link>
            <Link to="/authentication" className="border-b border-ink/40 pb-1 hover:text-bronze hover:border-bronze">Sourcing &amp; authenticity →</Link>
            <Link to="/shipping-returns" className="border-b border-ink/40 pb-1 hover:text-bronze hover:border-bronze">Shipping &amp; returns →</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
