import { createFileRoute, Link } from "@tanstack/react-router";
import { routeHead } from "@/lib/seo";

// Import all 30 webp files eagerly so Vite emits hashed asset URLs.
const imageModules = import.meta.glob("@/assets/editorial/may-2026/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function img(n: number): string {
  const entry = Object.entries(imageModules).find(([k]) => k.endsWith(`/${n}.webp`));
  return entry?.[1] ?? "";
}

type ShopTarget =
  | { kind: "collection"; handle: string; label: string }
  | { kind: "shop"; label: string };

type Slide = {
  n: number;
  caption: string;
  shop: ShopTarget;
};

// Editorial sequencing — captions are abstract/poetic, shop targets route
// to the most relevant existing collection. Adjust freely; this is data.
const SLIDES: Slide[] = [
  { n: 1, caption: "Quiet authority.", shop: { kind: "collection", handle: "womens-clothing", label: "Shop Women's" } },
  { n: 2, caption: "Soft architecture.", shop: { kind: "collection", handle: "womens-shoes", label: "Shop Women's Shoes" } },
  { n: 3, caption: "Considered ease.", shop: { kind: "collection", handle: "mens-clothing", label: "Shop Men's" } },
  { n: 4, caption: "Tonal study.", shop: { kind: "collection", handle: "womens-clothing", label: "Shop Women's" } },
  { n: 5, caption: "House code.", shop: { kind: "collection", handle: "mens-shoes", label: "Shop Men's Shoes" } },
  { n: 6, caption: "The everyday object.", shop: { kind: "shop", label: "Shop the Edit" } },
  { n: 7, caption: "Cut, refined.", shop: { kind: "collection", handle: "womens-clothing", label: "Shop Women's" } },
  { n: 8, caption: "Hand and heel.", shop: { kind: "collection", handle: "womens-shoes", label: "Shop Heels" } },
  { n: 9, caption: "Pressed light.", shop: { kind: "collection", handle: "mens-clothing", label: "Shop Men's" } },
  { n: 10, caption: "Discreet luxury.", shop: { kind: "collection", handle: "high-discounts", label: "Shop the Sale" } },
  { n: 11, caption: "Material weight.", shop: { kind: "collection", handle: "mens-shoes", label: "Shop Men's Shoes" } },
  { n: 12, caption: "Slow proportion.", shop: { kind: "collection", handle: "womens-clothing", label: "Shop Women's" } },
  { n: 13, caption: "Studio still.", shop: { kind: "shop", label: "Shop the Edit" } },
  { n: 14, caption: "Soft tailoring.", shop: { kind: "collection", handle: "mens-clothing", label: "Shop Men's" } },
  { n: 15, caption: "Surface and shadow.", shop: { kind: "collection", handle: "womens-shoes", label: "Shop Women's Shoes" } },
  { n: 16, caption: "Patient craft.", shop: { kind: "collection", handle: "womens-clothing", label: "Shop Women's" } },
  { n: 17, caption: "Modern restraint.", shop: { kind: "collection", handle: "mens-shoes", label: "Shop Men's Shoes" } },
  { n: 18, caption: "Quiet palette.", shop: { kind: "shop", label: "Shop the Edit" } },
  { n: 19, caption: "Edited motion.", shop: { kind: "collection", handle: "womens-clothing", label: "Shop Women's" } },
  { n: 20, caption: "Form, distilled.", shop: { kind: "collection", handle: "mens-clothing", label: "Shop Men's" } },
  { n: 21, caption: "Worn lightly.", shop: { kind: "collection", handle: "womens-shoes", label: "Shop Women's Shoes" } },
  { n: 22, caption: "Inherited line.", shop: { kind: "collection", handle: "mens-clothing", label: "Shop Men's" } },
  { n: 23, caption: "Slow color.", shop: { kind: "collection", handle: "womens-clothing", label: "Shop Women's" } },
  { n: 24, caption: "Held shape.", shop: { kind: "collection", handle: "mens-shoes", label: "Shop Men's Shoes" } },
  { n: 25, caption: "Off-duty grammar.", shop: { kind: "shop", label: "Shop the Edit" } },
  { n: 26, caption: "Atelier light.", shop: { kind: "collection", handle: "womens-clothing", label: "Shop Women's" } },
  { n: 27, caption: "Considered finish.", shop: { kind: "collection", handle: "womens-shoes", label: "Shop Women's Shoes" } },
  { n: 28, caption: "Codes, rewritten.", shop: { kind: "collection", handle: "mens-clothing", label: "Shop Men's" } },
  { n: 29, caption: "Final cut.", shop: { kind: "collection", handle: "high-discounts", label: "Shop the Sale" } },
  { n: 30, caption: "End of frame.", shop: { kind: "shop", label: "Shop the Edit" } },
];

export const Route = createFileRoute("/editorial/may-2026")({
  head: () => {
    const title = "May 2026 Editorial — Palace of Roman";
    const desc = "A quiet study of the May 2026 edit — tailoring, footwear and house codes, photographed in studio light. Shop the look.";
    const rh = routeHead({ path: "/editorial/may-2026", title, description: desc, image: img(1), type: "article" });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
    };
  },
  component: EditorialMay2026,
});

function ShopLink({ shop }: { shop: ShopTarget }) {
  const cls =
    "inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-bronze hover:text-ink transition-colors border-b border-bronze/40 hover:border-ink pb-1";
  if (shop.kind === "collection") {
    return (
      <Link to="/collections/$handle" params={{ handle: shop.handle }} className={cls}>
        {shop.label} →
      </Link>
    );
  }
  return (
    <Link to="/shop" className={cls}>
      {shop.label} →
    </Link>
  );
}

function Frame({
  slide,
  priority,
  aspect = "aspect-[4/5]",
}: {
  slide: Slide;
  priority?: boolean;
  aspect?: string;
}) {
  return (
    <figure className="group relative">
      <div className={`overflow-hidden bg-canvas-raised ${aspect}`}>
        <img
          src={img(slide.n)}
          alt={slide.caption}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.02]"
        />
      </div>
      <figcaption className="mt-4 flex items-baseline justify-between gap-6">
        <span className="font-serif italic text-base md:text-lg text-ink">
          {slide.caption}
        </span>
        <ShopLink shop={slide.shop} />
      </figcaption>
    </figure>
  );
}

function EditorialMay2026() {
  // Layout pattern: full-bleed hero, then alternating
  // (single | split-pair | triptych) chapters across all 30 slides.
  const hero = SLIDES[0];
  const rest = SLIDES.slice(1);

  // Build chapters of [single, pair(2), triptych(3)] = 6 per chapter → ~5 chapters for 29 frames.
  const chapters: Slide[][] = [];
  let cursor = 0;
  const pattern = [1, 2, 3];
  let pi = 0;
  while (cursor < rest.length) {
    const size = pattern[pi % pattern.length];
    chapters.push(rest.slice(cursor, cursor + size));
    cursor += size;
    pi++;
  }

  return (
    <main className="bg-canvas text-ink">
      {/* Title plate */}
      <section className="max-w-screen-2xl mx-auto px-6 pt-16 md:pt-24 pb-10 md:pb-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">
              Editorial — Issue No. 05
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
              May 2026
            </h1>
          </div>
          <p className="max-w-md font-serif italic text-base md:text-lg text-ink/70">
            A quiet study of the season — tailoring, footwear and house codes,
            photographed in studio light. Shop the look throughout.
          </p>
        </div>
      </section>

      {/* Full-bleed hero */}
      <section className="px-0 md:px-6">
        <div className="relative w-full overflow-hidden aspect-[16/10] md:aspect-[21/9] bg-canvas-raised">
          <img
            src={img(hero.n)}
            alt={hero.caption}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 flex items-end justify-between gap-6 bg-gradient-to-t from-ink/40 to-transparent">
            <span className="font-serif italic text-white text-xl md:text-3xl">
              {hero.caption}
            </span>
            <Link
              to="/collections/$handle"
              params={{ handle: hero.shop.kind === "collection" ? hero.shop.handle : "womens-clothing" }}
              className="text-[10px] uppercase tracking-[0.3em] text-white border-b border-white/60 hover:border-white pb-1"
            >
              {hero.shop.label} →
            </Link>
          </div>
        </div>
      </section>

      {/* Chapters */}
      <div className="max-w-screen-2xl mx-auto px-6 py-16 md:py-24 space-y-20 md:space-y-32">
        {chapters.map((chapter, ci) => {
          if (chapter.length === 1) {
            return (
              <section key={ci} className="grid grid-cols-12 gap-6 md:gap-10">
                <div className="col-span-12 md:col-span-8 md:col-start-3">
                  <Frame slide={chapter[0]} aspect="aspect-[3/4]" />
                </div>
              </section>
            );
          }
          if (chapter.length === 2) {
            // Asymmetric split
            const flip = ci % 2 === 0;
            return (
              <section key={ci} className="grid grid-cols-12 gap-6 md:gap-10 items-end">
                <div className={`col-span-12 md:col-span-7 ${flip ? "" : "md:order-2"}`}>
                  <Frame slide={chapter[0]} aspect="aspect-[4/5]" />
                </div>
                <div className={`col-span-12 md:col-span-4 ${flip ? "md:col-start-9" : "md:col-start-2 md:order-1"}`}>
                  <Frame slide={chapter[1]} aspect="aspect-[3/4]" />
                </div>
              </section>
            );
          }
          // triptych
          return (
            <section key={ci} className="grid grid-cols-12 gap-6 md:gap-8">
              {chapter.map((s, i) => (
                <div
                  key={s.n}
                  className={`col-span-12 sm:col-span-6 md:col-span-4 ${
                    i === 1 ? "md:translate-y-12" : ""
                  }`}
                >
                  <Frame slide={s} aspect="aspect-[3/4]" />
                </div>
              ))}
            </section>
          );
        })}
      </div>

      {/* Outro */}
      <section className="border-t border-ink/10 py-20 md:py-28 text-center px-6">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">End of issue</p>
        <h2 className="font-serif text-3xl md:text-5xl mb-8">Shop the season</h2>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          <Link to="/collections/$handle" params={{ handle: "womens-clothing" }} className="px-6 py-3 border border-ink hover:bg-ink hover:text-canvas transition-colors text-[11px] uppercase tracking-[0.25em]">
            Women's Clothing
          </Link>
          <Link to="/collections/$handle" params={{ handle: "womens-shoes" }} className="px-6 py-3 border border-ink hover:bg-ink hover:text-canvas transition-colors text-[11px] uppercase tracking-[0.25em]">
            Women's Shoes
          </Link>
          <Link to="/collections/$handle" params={{ handle: "mens-clothing" }} className="px-6 py-3 border border-ink hover:bg-ink hover:text-canvas transition-colors text-[11px] uppercase tracking-[0.25em]">
            Men's Clothing
          </Link>
          <Link to="/collections/$handle" params={{ handle: "mens-shoes" }} className="px-6 py-3 border border-ink hover:bg-ink hover:text-canvas transition-colors text-[11px] uppercase tracking-[0.25em]">
            Men's Shoes
          </Link>
        </div>
      </section>
    </main>
  );
}
