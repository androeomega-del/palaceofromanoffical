import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { useState } from "react";
import { Loader2, MapPin, Calendar, Sparkles } from "lucide-react";
import {
  type VacationDestination,
  type VacationVibe,
} from "@/lib/vacation-destinations";
import { getVacationDestination } from "@/lib/vacation-destinations.functions";
import { buildVacationCapsule, type StylistResult } from "@/lib/vacation-stylist.functions";
import { ProductCard } from "@/components/product-card";
import { routeHead } from "@/lib/seo";
import { fetchProducts, formatPrice, type ShopifyProduct } from "@/lib/shopify";

function buildTagQuery(styleTags: string[]): string {
  const cleaned = styleTags
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
  if (cleaned.length === 0) return "";
  return cleaned.map((t) => `tag:"${t.replace(/"/g, "")}"`).join(" OR ");
}

async function fetchCuratedProducts(styleTags: string[]): Promise<ShopifyProduct[]> {
  const query = buildTagQuery(styleTags);
  try {
    const edges = await fetchProducts({
      first: 8,
      query: query || undefined,
      sortKey: "BEST_SELLING",
    });
    return edges;
  } catch {
    return [];
  }
}

const VIBES: Array<{ id: VacationVibe; label: string; hint: string }> = [
  { id: "beach-club", label: "Beach Club", hint: "Linen, swim, sandal" },
  { id: "yacht-marina", label: "Yacht & Marina", hint: "Navy, polo, loafer" },
  { id: "resort-evening", label: "Resort Evening", hint: "Silk, heel, clutch" },
  { id: "city-escape", label: "City Escape", hint: "Blazer, trouser, tote" },
  { id: "desert-retreat", label: "Desert Retreat", hint: "Kaftan, leather, scarf" },
  { id: "alpine-getaway", label: "Alpine Getaway", hint: "Cashmere, knit, boot" },
];

export const Route = createFileRoute("/vacation-stylist/$destination")({
  loader: async ({ params }) => {
    try {
      const dest = await getVacationDestination({ data: { slug: params.destination } });
      return { destination: dest };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData, params }) => {
    const dest = loaderData?.destination;
    const name = dest?.name ?? params.destination;
    const title = `${name} Luxury Packing List & Capsule Wardrobe | Palace of Roman Official`;
    const description = `Discover an AI-curated luxury wardrobe edit for ${name}. Explore investment-grade designer styles, resort wear trends, and authenticated packing matrices.`;
    const rh = routeHead({
      path: `/vacation-stylist/${params.destination}`,
      title,
      description,
      type: "article",
    });
    return {
      meta: [{ title }, { name: "description", content: description }, ...rh.meta],
      links: rh.links,
    };
  },
  component: DestinationPage,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">{error.message}</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <h1 className="font-serif text-3xl mb-3">Destination not found</h1>
        <p className="text-sm text-muted-foreground">
          We don't yet have a curated edit for this location.
        </p>
      </div>
    </main>
  ),
});

function DestinationPage() {
  const { destination: dest } = Route.useLoaderData();
  return <DestinationStylist dest={dest} />;
}

function DestinationStylist({ dest }: { dest: VacationDestination }) {
  const build = useServerFn(buildVacationCapsule);
  const [destination, setDestination] = useState(dest.name);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vibe, setVibe] = useState<VacationVibe>(dest.defaultVibe);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StylistResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || destination.trim().length < 2) {
      setErr("Please tell us where you're going.");
      return;
    }
    setErr(null);
    setLoading(true);
    setResult(null);
    try {
      const out = await build({
        data: { destination, startDate, endDate, vibe, notes },
      });
      setResult(out);
      if (!out.ok) setErr(out.error);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "The stylist is briefly unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-canvas text-ink">
      {/* Hero — primary H1 carries the long-tail query phrase */}
      <section className="border-b border-ink/10 px-6 md:px-12 py-16 md:py-24 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">
          {dest.region} · Private Capsule
        </p>
        <h1 className="font-serif text-3xl md:text-5xl leading-[1.05] tracking-tight max-w-3xl mx-auto">
          Luxury Vacation Stylist: What to Wear in {dest.name}
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-sm md:text-base text-muted-foreground leading-relaxed">
          {dest.editorialSummary}
        </p>
      </section>

      {/* Semantic editorial — server-rendered context unique to this destination */}
      <section className="border-b border-ink/10 px-6 md:px-12 py-16 md:py-20 max-w-4xl mx-auto">
        <div className="space-y-12">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl tracking-tight mb-4">
              Resort Curation for {dest.name}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              {dest.climate} {dest.seasonalNotes}
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl md:text-3xl tracking-tight mb-4">
              Signature Style Tags
            </h2>
            <ul className="flex flex-wrap gap-2">
              {dest.styleTags.map((tag) => (
                <li
                  key={tag}
                  className="border border-ink/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl md:text-3xl tracking-tight mb-4">
              Curated for {dest.name}, Composed in Seconds
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              The questionnaire below is pre-seeded for {dest.name}. Adjust the dates and
              vibe, then the boutique returns a chapter-by-chapter packing edit drawn from
              the live Palace of Roman collection — every piece authenticated, every
              recommendation tied to in-stock inventory.
            </p>
          </div>
        </div>
      </section>

      {/* Form — pre-seeded; reserved height prevents CLS as the questionnaire hydrates */}
      <section
        className="px-6 md:px-12 py-12 md:py-16 max-w-3xl mx-auto"
        style={{ minHeight: "720px" }}
      >
        <form onSubmit={submit} className="space-y-8">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
              <MapPin className="inline h-3 w-3 mr-1.5 -mt-0.5" />
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full border-b border-ink/30 bg-transparent py-3 text-base focus:outline-none focus:border-ink"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                <Calendar className="inline h-3 w-3 mr-1.5 -mt-0.5" />
                Arrival
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border-b border-ink/30 bg-transparent py-3 text-base focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                <Calendar className="inline h-3 w-3 mr-1.5 -mt-0.5" />
                Departure
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border-b border-ink/30 bg-transparent py-3 text-base focus:outline-none focus:border-ink"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
              The Vibe
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {VIBES.map((v) => {
                const active = vibe === v.id;
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => setVibe(v.id)}
                    aria-pressed={active}
                    className={`text-left border px-4 py-3 transition-colors ${
                      active
                        ? "bg-ink text-canvas border-ink"
                        : "border-ink/20 hover:border-ink"
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-[0.2em]">{v.label}</div>
                    <div
                      className={`mt-1 text-[10px] ${
                        active ? "text-canvas/70" : "text-muted-foreground"
                      }`}
                    >
                      {v.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
              Notes for the Stylist{" "}
              <span className="text-muted-foreground/60 normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full border border-ink/15 bg-transparent p-3 text-sm focus:outline-none focus:border-ink resize-none"
            />
          </div>

          {err && (
            <p className="text-xs text-red-600" role="alert">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-ink text-canvas px-8 py-4 text-[11px] uppercase tracking-[0.25em] hover:bg-bronze transition-colors disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Composing your capsule…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Compose My Capsule
              </>
            )}
          </button>
        </form>
      </section>

      {result?.ok && (
        <section className="border-t border-ink/10 px-6 md:px-12 py-16 md:py-24 max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">
              Your Capsule
            </p>
            <h2 className="font-serif text-3xl md:text-5xl leading-[1.1] tracking-tight max-w-3xl mx-auto">
              {result.headline}
            </h2>
            <p className="mt-5 max-w-xl mx-auto text-sm text-muted-foreground leading-relaxed">
              {result.narrative}
            </p>
          </div>

          <div className="space-y-16">
            {result.chapters.map((ch, idx) => (
              <div key={`${ch.title}-${idx}`}>
                <div className="flex items-baseline gap-4 mb-6 border-b border-ink/10 pb-4">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-bronze tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl tracking-tight">
                    {ch.title}
                  </h3>
                </div>
                {ch.rationale && (
                  <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
                    {ch.rationale}
                  </p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
                  {ch.products.map((p) => (
                    <ProductCard key={p.node.handle} product={p} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

