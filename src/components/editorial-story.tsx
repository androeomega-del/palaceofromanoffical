import { Link } from "@tanstack/react-router";
import { img } from "@/lib/editorial-library";

export type StorySlide = {
  n: number;
  /** Optional explicit image src; overrides the editorial-library lookup by `n`. */
  src?: string;
  /** Optional alt text override; falls back to caption. */
  alt?: string;
  caption: string;
  /** Collection handle for `/collections/$handle`. Used when no productHandle is set. */
  shopHandle?: string;
  shopLabel?: string;
  /** Product handle for `/product/$handle`. Takes precedence over `shopHandle`. */
  productHandle?: string;
};

export type EditorialStoryProps = {
  issueNumber: string;
  title: string;
  subtitle: string;
  intro: string;
  slides: StorySlide[];
  // Default outro CTAs use these collection handles
  outroCtas?: Array<{ label: string; handle: string }>;
};

export function EditorialStory({
  issueNumber,
  title,
  subtitle,
  intro,
  slides,
  outroCtas = [
    { label: "Women's Clothing", handle: "womens-clothing" },
    { label: "Women's Shoes", handle: "womens-shoes" },
    { label: "Men's Clothing", handle: "mens-clothing" },
    { label: "Men's Shoes", handle: "mens-shoes" },
  ],
}: EditorialStoryProps) {
  const hero = slides[0];
  const rest = slides.slice(1);

  // Alternating chapter pattern: single / pair / triptych
  const chapters: StorySlide[][] = [];
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
              Editorial — {issueNumber}
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight text-balance">
              {title}
            </h1>
            <p className="mt-6 text-sm uppercase tracking-[0.3em] text-ink/60">{subtitle}</p>
          </div>
          <p className="max-w-md font-serif italic text-base md:text-lg text-ink/70 text-pretty">
            {intro}
          </p>
        </div>
      </section>

      {/* Full-bleed hero */}
      <section className="px-0 md:px-6">
        <div className="relative w-full overflow-hidden aspect-[16/10] md:aspect-[21/9] bg-canvas-raised">
          <img
            src={hero.src ?? img(hero.n)}
            alt={hero.alt ?? hero.caption}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 flex items-end justify-between gap-6 bg-gradient-to-t from-ink/40 to-transparent">
            <span className="font-serif italic text-white text-xl md:text-3xl">
              {hero.caption}
            </span>
            {hero.productHandle ? (
              <Link
                to="/product/$handle"
                params={{ handle: hero.productHandle }}
                className="text-[10px] uppercase tracking-[0.3em] text-white border-b border-white/60 hover:border-white pb-1"
              >
                {hero.shopLabel ?? "Shop the piece"} →
              </Link>
            ) : hero.shopHandle ? (
              <Link
                to="/collections/$handle"
                params={{ handle: hero.shopHandle }}
                className="text-[10px] uppercase tracking-[0.3em] text-white border-b border-white/60 hover:border-white pb-1"
              >
                {hero.shopLabel ?? "Shop"} →
              </Link>
            ) : null}
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
          return (
            <section key={ci} className="grid grid-cols-12 gap-6 md:gap-8">
              {chapter.map((s, i) => (
                <div
                  key={`${ci}-${s.n}`}
                  className={`col-span-12 sm:col-span-6 md:col-span-4 ${i === 1 ? "md:translate-y-12" : ""}`}
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
        <h2 className="font-serif text-3xl md:text-5xl mb-8">Shop the edit</h2>
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
        <div className="mt-12">
          <Link
            to="/journal"
            className="text-[10px] uppercase tracking-[0.3em] border-b border-ink/30 pb-1 hover:border-ink"
          >
            Return to the Journal →
          </Link>
        </div>
      </section>
    </main>
  );
}

function Frame({ slide, aspect = "aspect-[4/5]" }: { slide: StorySlide; aspect?: string }) {
  return (
    <figure className="group relative">
      <div className={`overflow-hidden bg-canvas-raised ${aspect}`}>
        <img
          src={slide.src ?? img(slide.n)}
          alt={slide.alt ?? slide.caption}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.02]"
        />
      </div>
      <figcaption className="mt-4 flex items-baseline justify-between gap-6">
        <span className="font-serif italic text-base md:text-lg text-ink">{slide.caption}</span>
        {slide.productHandle ? (
          <Link
            to="/product/$handle"
            params={{ handle: slide.productHandle }}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-bronze hover:text-ink transition-colors border-b border-bronze/40 hover:border-ink pb-1"
          >
            {slide.shopLabel ?? "Shop the piece"} →
          </Link>
        ) : slide.shopHandle ? (
          <Link
            to="/collections/$handle"
            params={{ handle: slide.shopHandle }}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-bronze hover:text-ink transition-colors border-b border-bronze/40 hover:border-ink pb-1"
          >
            {slide.shopLabel ?? "Shop"} →
          </Link>
        ) : null}
      </figcaption>
    </figure>
  );
}
