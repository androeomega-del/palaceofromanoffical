import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProducts } from "@/lib/shopify";
import { ProductCard } from "@/components/product-card";
import { EditorialHotspots, type Hotspot } from "@/components/editorial-hotspots";
import { img } from "@/lib/editorial-library";
import type { ReactNode } from "react";

export type ThemedChapterSpot = {
  /** X position in % (0–100) over the chapter image. */
  x: number;
  /** Y position in % (0–100) over the chapter image. */
  y: number;
  /** Short eyebrow label, e.g. "The Shirt". */
  label?: string;
  /** Regex matched against product title (case-insensitive) to pick the piece. */
  match?: RegExp;
};

export type ThemedChapter = {
  /** Editorial library image number (1–99). Used when `src` is not provided. */
  n: number;
  /** Optional explicit image URL — overrides `n`. */
  src?: string;
  /** Chapter eyebrow, e.g. "Chapter I". */
  eyebrow: string;
  /** Chapter headline (serif). */
  title: string;
  /** Body paragraph — restrained, themed prose. */
  body: string;
  /** Image alt copy. */
  alt: string;
  /** Flip the row so image is on the right. */
  flip?: boolean;
  /** Optional shoppable hotspots, resolved against the edit's product pool. */
  spots?: ThemedChapterSpot[];
};

export type ThemedEditProps = {
  /** Eyebrow above the hero title. */
  issueLabel: string;
  /** Big serif title. */
  title: string;
  /** One-line subtitle, all caps. */
  subtitle: string;
  /** Intro paragraph (italic). */
  intro: string;
  /** Hero editorial image number (used when heroSrc is not provided). */
  heroN: number;
  /** Optional explicit hero image URL — overrides heroN. */
  heroSrc?: string;
  /** CSS object-position for the hero image (default "center"). */
  heroPosition?: string;
  heroAlt: string;
  /** A pull-quote / manifesto line. */
  manifesto: string;
  /** Themed chapters — usually 3. */
  chapters: ThemedChapter[];
  /** Storefront search query for the Shop-the-Edit grid. */
  productQuery: string;
  /** Title of the product grid. */
  shopTitle: string;
  shopEyebrow: string;
  /** Outro collection CTAs. */
  outroCtas: Array<{ label: string; handle: string }>;
  /** Optional extra section below the grid (e.g. "Shop All Versace" button). */
  extra?: ReactNode;
};

export function ThemedEdit({
  issueLabel,
  title,
  subtitle,
  intro,
  heroN,
  heroSrc,
  heroPosition = "center",
  heroAlt,
  manifesto,
  chapters,
  productQuery,
  shopTitle,
  shopEyebrow,
  outroCtas,
  extra,
}: ThemedEditProps) {
  const productsQ = useQuery({
    queryKey: ["themed-edit", productQuery],
    queryFn: () => fetchProducts({ first: 24, query: productQuery }),
  });
  const products = productsQ.data ?? [];

  // Resolve per-chapter hotspots against the fetched product pool.
  // Each spot picks the best-matching unused product (by regex on title),
  // falling back to any unused product so chapters always get tagged.
  const chapterHotspots = useMemo<Array<Hotspot[]>>(() => {
    const pool = products.map((p) => p.node);
    const used = new Set<string>();
    return chapters.map((c) => {
      if (!c.spots?.length) return [];
      const out: Hotspot[] = [];
      for (const s of c.spots) {
        const pick = s.match
          ? pool.find((p) => !used.has(p.handle) && s.match!.test(p.title))
          : pool.find((p) => !used.has(p.handle));
        // Strict: never tag a hotspot with an unrelated product. If no
        // catalog product matches the spot's regex, skip the spot entirely.
        if (!pick) continue;
        used.add(pick.handle);
        out.push({
          x: s.x,
          y: s.y,
          handle: pick.handle,
          label: s.label,
          sublabel: pick.vendor,
        });
      }
      return out;
    });
  }, [chapters, products]);

  return (
    <main className="bg-canvas text-ink">
      {/* HERO */}
      <section className="relative h-[88vh] min-h-[600px] overflow-hidden bg-ink">
        <img
          src={heroSrc ?? img(heroN)}
          alt={heroAlt}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          style={{ objectPosition: heroPosition }}
          className="absolute inset-0 w-full h-full object-cover opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-ink/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-transparent to-transparent pointer-events-none" />
        <div className="relative h-full flex items-end">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-10 pb-16 md:pb-24 w-full">
            <span className="block text-[10px] md:text-xs uppercase tracking-[0.5em] text-bronze mb-5">
              {issueLabel}
            </span>
            <h1 className="font-serif text-canvas text-5xl md:text-7xl lg:text-[8rem] leading-[0.92] max-w-5xl text-balance">
              {title}
            </h1>
            <p className="mt-6 text-[10px] md:text-xs uppercase tracking-[0.4em] text-canvas/80">
              {subtitle}
            </p>
            <p className="mt-7 max-w-xl text-canvas/85 text-sm md:text-base leading-relaxed italic">
              {intro}
            </p>
            <div className="mt-8">
              <a
                href="#shop"
                className="px-9 py-4 bg-canvas text-ink text-[10px] uppercase tracking-[0.35em] font-medium hover:bg-bronze hover:text-canvas transition-colors"
              >
                Shop the Edit
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="px-6 md:px-10 py-24 md:py-32 bg-canvas">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-6 block">
            The Manifesto
          </span>
          <p className="font-serif text-2xl md:text-4xl leading-[1.25] text-ink mb-8 text-balance">
            “{manifesto}”
          </p>
          <p className="text-sm md:text-base text-muted-foreground italic">
            From the Palace of Roman edit.
          </p>
        </div>
      </section>

      {/* CHAPTERS */}
      <div className="space-y-20 md:space-y-32 pb-20 md:pb-28">
        {chapters.map((c, i) => {
          const spots = chapterHotspots[i] ?? [];
          const chapterSrc = c.src ?? img(c.n);
          return (
            <section
              key={`${c.n}-${i}`}
              className="px-6 md:px-10 bg-canvas"
            >
              <div className="max-w-screen-2xl mx-auto grid md:grid-cols-2 gap-10 md:gap-20 items-center">
                <div className={`relative ${c.flip ? "md:order-2" : ""}`}>
                  {spots.length > 0 ? (
                    <EditorialHotspots
                      src={chapterSrc}
                      alt={c.alt}
                      aspect="4/5"
                      hotspots={spots}
                    />
                  ) : (
                    <div className="aspect-[4/5] overflow-hidden bg-canvas-raised">
                      <img
                        src={chapterSrc}
                        alt={c.alt}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className={c.flip ? "md:order-1" : ""}>
                  <span className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4 block">
                    {c.eyebrow}
                  </span>
                  <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] mb-6 text-balance">
                    {c.title}
                  </h2>
                  <p className="text-sm md:text-base text-ink/80 leading-relaxed">
                    {c.body}
                  </p>
                  {spots.length > 0 && (
                    <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-bronze">
                      Tap the marks to shop the look
                    </p>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>


      {/* SHOP THE EDIT */}
      <section
        id="shop"
        className="px-6 md:px-10 py-20 md:py-28 scroll-mt-20 bg-canvas-raised/40 border-y border-ink/5"
      >
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3 block">
                {shopEyebrow}
              </span>
              <h2 className="font-serif text-3xl md:text-5xl leading-[1.05]">
                {shopTitle}
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
                  <div className="h-3 bg-muted w-2/3 mb-2" />
                  <div className="h-3 bg-muted w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12">
              No pieces currently in stock for this edit.
            </p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14">
              {products.map((p) => (
                <ProductCard key={p.node.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {extra}

      {/* OUTRO */}
      <section className="border-t border-ink/10 py-20 md:py-28 text-center px-6 bg-canvas">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">
          End of edit
        </p>
        <h2 className="font-serif text-3xl md:text-5xl mb-8">Continue exploring</h2>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {outroCtas.map((c) => (
            <Link
              key={c.handle}
              to="/collections/$handle"
              params={{ handle: c.handle }}
              className="px-6 py-3 border border-ink hover:bg-ink hover:text-canvas transition-colors text-[11px] uppercase tracking-[0.25em]"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
