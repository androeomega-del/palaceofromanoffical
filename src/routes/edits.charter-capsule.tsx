import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchProductsPage, type ShopifyProductNode } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME } from "@/lib/seo";
import {
  ShopTheEditEmpty,
  ShopTheEditError,
  ShopTheEditSkeleton,
} from "@/components/shop-the-edit-state";
import { Loader2, Copy, Check, Share2 } from "lucide-react";

// ─── The Capsule ───────────────────────────────────────────────────────────
// Eight pieces. Seven days on the Med. Each slot picks the best-matching
// live catalog product by regex on title; falls back to skipping silently if
// no match — per the always-tag-real-products rule.

type Piece = {
  no: string;
  label: string;
  title: string;
  body: string;
  /** Editorial library image number used for the piece's vignette. */
  n: number;
  /** Regex applied to product title (case-insensitive). */
  match: RegExp;
};

const PIECES: Piece[] = [
  {
    no: "01",
    label: "The Linen Trouser",
    title: "Chalk linen, wide-cut.",
    body:
      "The pant that survives the gangway, the welcome aperitivo, and the walk home through the village. Wear it five of the seven days.",
    n: 18,
    match: /trouser|pant/i,
  },
  {
    no: "02",
    label: "The Cotton-Silk Shirt",
    title: "Ivory, soft at the collar.",
    body:
      "A short-sleeve cotton-silk that drapes, not stands. Untucked over the linen trouser by day; tucked for the terrace at seven.",
    n: 27,
    match: /(shirt|polo).*(cotton|silk)|(cotton|silk).*(shirt|polo)/i,
  },
  {
    no: "03",
    label: "The Camp-Collar",
    title: "Linen, three buttons open.",
    body:
      "The open-collar linen — white, ecru, or faded indigo — that walks off the tender and into lunch in the port.",
    n: 14,
    match: /(camp.?collar|linen).*shirt|shirt.*(camp.?collar|linen)/i,
  },
  {
    no: "04",
    label: "The Swim",
    title: "Five-inch rise, gold-tipped drawcord.",
    body:
      "Bottega, Canali, Givenchy. A short cut you'd wear off the boat — clean side seam, a colour that reads on every deck.",
    n: 3,
    match: /swim|trunk/i,
  },
  {
    no: "05",
    label: "The Terry Polo",
    title: "Cream, for the late lunch.",
    body:
      "Bridges the sun-deck and the dining banquette. Open the placket. Untucked. The only top you need between hours one and six.",
    n: 9,
    match: /polo/i,
  },
  {
    no: "06",
    label: "The Loafer",
    title: "Unlined suede, broken in.",
    body:
      "Chocolate or stone, worn without socks — a no-show liner saves the leather. The arrival shoe and the dinner shoe, in one.",
    n: 33,
    match: /loafer|driver|moccasin/i,
  },
  {
    no: "07",
    label: "The Slide",
    title: "Woven leather, off the boat.",
    body:
      "Bottega intrecciato, tan calfskin from Brunello. The shoe that ends up in every photograph from the village.",
    n: 36,
    match: /slide|sandal/i,
  },
  {
    no: "08",
    label: "The Frame",
    title: "Tortoiseshell, with weight.",
    body:
      "Deep tortoise acetate — pilot or keyhole. Acetate, not metal: the sea will eat the hinges by day three.",
    n: 24,
    match: /sunglass|eyewear|aviator/i,
  },
];

// One broad query that covers every slot. Each piece then picks its product
// from this single pool, so we make one paginated request — not eight.
const CAPSULE_QUERY =
  'tag:Men AND (' +
  [
    'title:trouser',
    'title:pant',
    'title:shirt',
    'title:polo',
    'title:swim',
    'title:trunk',
    'title:loafer',
    'title:driver',
    'title:moccasin',
    'title:slide',
    'title:sandal',
    'title:sunglass',
    'title:eyewear',
    'tag:"category:swimwear"',
    'tag:"category:shorts"',
    'tag:"category:sandals"',
  ].join(' OR ') +
  ')';

const HERO_N = 28;
const TITLE = "The Charter Capsule — Eight Pieces, Seven Days on the Med | Palace of Roman";
const DESC =
  "Eight pieces for a Mediterranean charter week — linen tailoring, swim, terry polo, loafer, slide, tortoiseshell. The men's resort capsule, curated by Palace of Roman.";
const PATH = "/edits/charter-capsule";

export const Route = createFileRoute("/edits/charter-capsule")({
  head: () => {
    const image = img(HERO_N);
    const rh = routeHead({ path: PATH, title: TITLE, description: DESC, image, type: "article" });
    return {
      meta: [{ title: TITLE }, { name: "description", content: DESC }, ...rh.meta],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: TITLE,
            description: DESC,
            image: absoluteUrl(image),
            url: absoluteUrl(PATH),
            publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
            mainEntityOfPage: absoluteUrl(PATH),
            isPartOf: {
              "@type": "CreativeWorkSeries",
              name: "The Yacht Edit",
              url: absoluteUrl("/edits/yacht-edit"),
            },
          }),
        },
      ],
    };
  },
  component: CharterCapsulePage,
});

function CharterCapsulePage() {
  const PAGE_SIZE = 24;
  const productsQ = useInfiniteQuery({
    queryKey: ["charter-capsule", CAPSULE_QUERY],
    queryFn: ({ pageParam }) =>
      fetchProductsPage({ first: PAGE_SIZE, after: pageParam, query: CAPSULE_QUERY }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.pageInfo.hasNextPage ? last.pageInfo.endCursor : undefined),
  });

  const products = useMemo(
    () => (productsQ.data?.pages ?? []).flatMap((p) => p.edges),
    [productsQ.data],
  );

  // Resolve each capsule slot to a real catalog product. Strict: if no
  // match, the slot is shown as an editorial card without a product CTA
  // — never tagged with an unrelated item.
  const resolved = useMemo<Array<{ piece: Piece; product: ShopifyProductNode | null }>>(() => {
    const pool = products.map((p) => p.node);
    const used = new Set<string>();
    return PIECES.map((piece) => {
      const pick = pool.find((p) => !used.has(p.handle) && piece.match.test(p.title));
      if (pick) used.add(pick.handle);
      return { piece, product: pick ?? null };
    });
  }, [products]);

  const matchedCount = resolved.filter((r) => r.product).length;

  return (
    <main className="bg-canvas text-ink">
      {/* HERO */}
      <section className="relative h-[88vh] min-h-[600px] overflow-hidden bg-ink">
        <img
          src={img(HERO_N)}
          alt="A men's charter capsule wardrobe laid out on a teak deck at golden hour"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-ink/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-transparent to-transparent pointer-events-none" />
        <div className="relative h-full flex items-end">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-10 pb-16 md:pb-24 w-full">
            <span className="block text-[10px] md:text-xs uppercase tracking-[0.5em] text-bronze mb-5">
              The Charter Capsule
            </span>
            <h1 className="font-serif text-canvas text-5xl md:text-7xl lg:text-[8rem] leading-[0.92] max-w-5xl text-balance">
              Eight pieces.
              <br />
              Seven days.
            </h1>
            <p className="mt-6 text-[10px] md:text-xs uppercase tracking-[0.4em] text-canvas/80">
              Men's — A Mediterranean Charter Wardrobe, Reduced to Eight
            </p>
            <p className="mt-7 max-w-xl text-canvas/85 text-sm md:text-base leading-relaxed italic">
              One linen trouser, two shirts, one swim, one polo, one loafer, one slide, one tortoiseshell frame. The charter week, edited.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#capsule"
                className="px-9 py-4 bg-canvas text-ink text-[10px] uppercase tracking-[0.35em] font-medium hover:bg-bronze hover:text-canvas transition-colors"
              >
                See the Eight
              </a>
              <a
                href="#shop"
                className="px-9 py-4 border border-canvas/70 text-canvas text-[10px] uppercase tracking-[0.35em] font-medium hover:bg-canvas hover:text-ink transition-colors"
              >
                Shop the Kit
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="px-6 md:px-10 py-24 md:py-32 bg-canvas">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-6 block">
            The Rule
          </span>
          <p className="font-serif text-2xl md:text-4xl leading-[1.25] text-ink mb-8 text-balance">
            “A man's charter wardrobe is the same eight pieces, worn the right way, in the right order, in the right port.”
          </p>
          <p className="text-sm md:text-base text-muted-foreground italic">
            From the Palace of Roman edit.
          </p>
        </div>
      </section>

      {/* THE EIGHT */}
      <section id="capsule" className="px-6 md:px-10 pb-24 md:pb-32 bg-canvas scroll-mt-20">
        <div className="max-w-screen-2xl mx-auto">
          <div className="mb-14 md:mb-20">
            <span className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3 block">
              The Eight
            </span>
            <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] max-w-2xl">
              Every piece, in the order you'll wear it.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16 md:gap-y-24">
            {resolved.map(({ piece, product }) => (
              <article key={piece.no} className="group">
                <div className="aspect-[4/5] overflow-hidden bg-canvas-raised mb-6 relative">
                  <img
                    src={img(piece.n)}
                    alt={piece.label}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <span className="absolute top-4 left-4 text-[10px] uppercase tracking-[0.4em] text-canvas bg-ink/70 px-3 py-2">
                    No. {piece.no}
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-2 block">
                  {piece.label}
                </span>
                <h3 className="font-serif text-2xl md:text-3xl leading-[1.1] mb-3">
                  {piece.title}
                </h3>
                <p className="text-sm text-ink/75 leading-relaxed max-w-md mb-5">{piece.body}</p>
                {product ? (
                  <Link
                    to="/product/$handle"
                    params={{ handle: product.handle }}
                    className="inline-block text-[10px] uppercase tracking-[0.3em] text-ink border-b border-ink/40 pb-1 hover:text-bronze hover:border-bronze transition-colors"
                  >
                    {product.vendor ? `${product.vendor} — Shop the Piece` : "Shop the Piece"}
                  </Link>
                ) : productsQ.isLoading ? (
                  <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Sourcing
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    Restocking soon
                  </span>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SHOP THE KIT */}
      <section
        id="shop"
        className="px-6 md:px-10 py-20 md:py-28 scroll-mt-20 bg-canvas-raised/40 border-y border-ink/5"
      >
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3 block">
                Shop the Kit
              </span>
              <h2 className="font-serif text-3xl md:text-5xl leading-[1.05]">
                The Eight, in stock.
              </h2>
            </div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {productsQ.isLoading
                ? "Loading the capsule…"
                : productsQ.isError
                  ? "Capsule unavailable"
                  : `${matchedCount} of 8 sourced`}
            </p>
          </div>

          {productsQ.isLoading ? (
            <ShopTheEditSkeleton />
          ) : productsQ.isError ? (
            <ShopTheEditError onRetry={() => productsQ.refetch()} isRetrying={productsQ.isFetching} />
          ) : resolved.filter((r) => r.product).length === 0 ? (
            <ShopTheEditEmpty />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14">
              {resolved
                .filter((r): r is { piece: Piece; product: ShopifyProductNode } => !!r.product)
                .map(({ product }) => {
                  // Find the original edge to pass into ProductCard (it expects ShopifyProduct).
                  const edge = products.find((e) => e.node.handle === product.handle);
                  if (!edge) return null;
                  return <ProductCard key={product.id} product={edge} />;
                })}
            </div>
          )}

          {productsQ.hasNextPage && matchedCount < 8 && (
            <div className="mt-14 flex justify-center">
              <button
                type="button"
                onClick={() => productsQ.fetchNextPage()}
                disabled={productsQ.isFetchingNextPage}
                className="inline-flex items-center gap-2 px-9 py-4 border border-ink text-[10px] uppercase tracking-[0.35em] font-medium hover:bg-ink hover:text-canvas transition-colors disabled:opacity-50"
              >
                {productsQ.isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sourcing more
                  </>
                ) : (
                  "Source the rest"
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* OUTRO */}
      <section className="border-t border-ink/10 py-20 md:py-28 text-center px-6 bg-canvas">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">
          The full edit
        </p>
        <h2 className="font-serif text-3xl md:text-5xl mb-8">Read the chapters</h2>
        <p className="max-w-xl mx-auto text-sm md:text-base text-ink/75 leading-relaxed mb-10">
          How the eight pieces move from the marina to the terrace — across five chapters of the Mediterranean charter week.
        </p>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          <Link
            to="/edits/yacht-edit"
            className="px-6 py-3 border border-ink hover:bg-ink hover:text-canvas transition-colors text-[11px] uppercase tracking-[0.25em]"
          >
            The Yacht Edit
          </Link>
          <Link
            to="/edits/yacht-edit/$chapter"
            params={{ chapter: "boarding-marina" }}
            className="px-6 py-3 border border-ink hover:bg-ink hover:text-canvas transition-colors text-[11px] uppercase tracking-[0.25em]"
          >
            Chapter I — Boarding
          </Link>
          <Link
            to="/edits/yacht-edit/$chapter"
            params={{ chapter: "sunset-dinner" }}
            className="px-6 py-3 border border-ink hover:bg-ink hover:text-canvas transition-colors text-[11px] uppercase tracking-[0.25em]"
          >
            Chapter IV — Sunset Dinner
          </Link>
        </div>
      </section>
    </main>
  );
}
