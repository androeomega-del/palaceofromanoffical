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
import { useRailImpression } from "@/hooks/use-rail-impression";
import { enqueueInteractionEvent } from "@/lib/interaction-flush";

export type TrendingTile = {
  label: string;
  to: string;
  imageKey: string;
};

const SURFACE = "rail:trending-now";

export function TrendingNowStrip({
  eyebrow = "Trending Now",
  tiles,
}: {
  eyebrow?: string;
  tiles: TrendingTile[];
}) {
  const railRef = useRailImpression(SURFACE, tiles?.[0]?.imageKey);
  return (
    <section
      ref={railRef as React.RefObject<HTMLElement>}
      data-rail-surface={SURFACE}
      className="py-section-sm md:py-16 bg-canvas"
    >
      <div className="max-w-screen-2xl mx-auto px-5 md:px-10">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-serif text-subhead-md md:text-subhead-lg tracking-subhead-open text-ink">
            {eyebrow}
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-5 px-5 md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:snap-none md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tiles.map((t, i) => (
            <Link
              key={t.to}
              to={t.to}
              onClick={() =>
                enqueueInteractionEvent({
                  handle: t.imageKey,
                  event_type: "rail_tap",
                  surface: SURFACE,
                  position: i,
                })
              }
              className="group relative block aspect-[3/4] overflow-hidden bg-ink/5 shrink-0 basis-[72%] snap-start md:basis-auto md:shrink"
            >
              <img
                src={imgForKey(t.imageKey)}
                alt={t.label}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-serif text-canvas text-lg md:text-xl tracking-subhead-open leading-tight">
                  {t.label}
                </p>
                {/* text-bronze decorative border, not text — passes on dark */}
                <span className="mt-2 inline-block text-cta-lg uppercase text-canvas/80 border-b border-bronze pb-0.5">
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
