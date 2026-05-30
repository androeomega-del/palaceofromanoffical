/**
 * Trending Now — 4-tile horizontal strip.
 *
 * Farfetch reference: men's homepage "Trending now" row of four bold text
 * links pointing at themed edits and brand spotlights. Our version keeps the
 * editorial restraint (serif label over a muted editorial image) and routes
 * to live trend pages + collections.
 */
import { Link } from "@tanstack/react-router";
import { imgForKey } from "@/lib/editorial-library";

export type TrendingTile = {
  label: string;
  to: string;
  imageKey: string;
};

export function TrendingNowStrip({
  eyebrow = "Trending Now",
  tiles,
}: {
  eyebrow?: string;
  tiles: TrendingTile[];
}) {
  return (
    <section className="py-10 md:py-16 bg-canvas">
      <div className="max-w-screen-2xl mx-auto px-5 md:px-10">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-serif text-2xl md:text-3xl tracking-[0.04em] text-ink">
            {eyebrow}
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          {tiles.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group relative block aspect-[3/4] overflow-hidden bg-ink/5"
            >
              <img
                src={imgForKey(t.imageKey)}
                alt={t.label}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-serif text-canvas text-lg md:text-xl tracking-[0.04em] leading-tight">
                  {t.label}
                </p>
                <span className="mt-2 inline-block text-[10px] uppercase tracking-[0.3em] text-canvas/80 border-b border-bronze pb-0.5">
                  Explore
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
