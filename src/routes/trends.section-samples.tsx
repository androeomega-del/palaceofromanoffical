/**
 * Section samples (preview, unlinked).
 *
 * Per staged-launches: assembles the four Farfetch-style sections we're
 * piloting for the Women/Men dept landing pages so the founder can review
 * the patterns in isolation before any go live in nav. Not linked from
 * anywhere — reach via direct URL only.
 */
import { createFileRoute } from "@tanstack/react-router";
import { TrendingNowStrip } from "@/components/sections/trending-now-strip";
import { NewThisWeekRail } from "@/components/sections/new-this-week-rail";
import { OnSaleRail } from "@/components/sections/on-sale-rail";
import { BrandsOfTheMoment } from "@/components/sections/brands-of-the-moment";

export const Route = createFileRoute("/trends/section-samples")({
  head: () => ({
    meta: [
      { title: "Section Samples — Internal Preview | Palace of Roman" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SectionSamplesPage,
});

function SectionSamplesPage() {
  return (
    <main className="bg-canvas">
      <header className="border-b border-ink/10 py-10 px-5 md:px-10">
        <p className="text-[11px] uppercase tracking-[0.32em] text-bronze">
          Internal Preview · Unlinked
        </p>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl tracking-[0.04em] text-ink">
          Department-page section samples
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-ink/70 leading-relaxed">
          Four Farfetch-style modules drafted for the Women & Men landing
          pages. Each renders against live Shopify data so empty states behave
          honestly. Approve individually before any of these go live in nav.
        </p>
      </header>

      <SampleLabel n={1} name="Trending Now — 4-tile strip" />
      <TrendingNowStrip
        tiles={[
          {
            label: "Dolce & Gabbana Icons",
            to: "/trends/dolce-gabbana-icons",
            imageKey: "trending-dg",
          },
          {
            label: "Tom Ford Essentials",
            to: "/trends/tom-ford-essentials",
            imageKey: "trending-tf",
          },
          {
            label: "Vacation, Decoded",
            to: "/vacation-stylist",
            imageKey: "trending-vacation",
          },
          {
            label: "The Style Quiz",
            to: "/style-quiz",
            imageKey: "trending-quiz",
          },
        ]}
      />

      <SampleLabel n={2} name="New This Week — 4-product rail (Women)" />
      <NewThisWeekRail dept="Women" />

      <SampleLabel n={3} name="On Sale — strikethrough rail (Women)" />
      <OnSaleRail dept="Women" />

      <SampleLabel n={4} name="Brands of the Moment — trio" />
      <BrandsOfTheMoment
        brands={[
          { vendor: "Versace", note: "Maximalist baroque" },
          { vendor: "Tom Ford", note: "Studied sensuality" },
          { vendor: "Roberto Cavalli", note: "Italian wild glamour" },
        ]}
      />
    </main>
  );
}

function SampleLabel({ n, name }: { n: number; name: string }) {
  return (
    <div className="border-t border-ink/10 bg-ink text-canvas px-5 md:px-10 py-3 flex items-center gap-4">
      <span className="font-serif text-bronze text-sm">Sample {n}</span>
      <span className="text-[11px] uppercase tracking-[0.3em]">{name}</span>
    </div>
  );
}
