import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, MapPin, Calendar, Sparkles } from "lucide-react";
import { buildVacationCapsule, type StylistResult } from "@/lib/vacation-stylist.functions";
import { ProductCard } from "@/components/product-card";
import { routeHead } from "@/lib/seo";

export const Route = createFileRoute("/vacation-stylist")({
  head: () => {
    const title = "Vacation Stylist — Palace of Roman";
    const description =
      "Tell us your destination, dates, and vibe. The boutique returns a curated capsule of designer pieces drawn from the live collection.";
    const rh = routeHead({ path: "/vacation-stylist", title, description });
    return {
      meta: [{ title }, { name: "description", content: description }, ...rh.meta],
      links: rh.links,
    };
  },
  component: VacationStylistPage,
});

const VIBES: Array<{ id: string; label: string; hint: string }> = [
  { id: "beach-club", label: "Beach Club", hint: "Linen, swim, sandal" },
  { id: "yacht-marina", label: "Yacht & Marina", hint: "Navy, polo, loafer" },
  { id: "resort-evening", label: "Resort Evening", hint: "Silk, heel, clutch" },
  { id: "city-escape", label: "City Escape", hint: "Blazer, trouser, tote" },
  { id: "desert-retreat", label: "Desert Retreat", hint: "Kaftan, leather, scarf" },
  { id: "alpine-getaway", label: "Alpine Getaway", hint: "Cashmere, knit, boot" },
];

function VacationStylistPage() {
  const build = useServerFn(buildVacationCapsule);
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vibe, setVibe] = useState<string>("beach-club");
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
        data: { destination, startDate, endDate, vibe: vibe as never, notes },
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
      {/* Hero */}
      <section className="border-b border-ink/10 px-6 md:px-12 py-16 md:py-24 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">
          Private Capsule · By Appointment
        </p>
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight">
          The Vacation Stylist
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-sm md:text-base text-muted-foreground leading-relaxed">
          Tell us where you're going, when, and how the days should feel. The boutique
          returns a packing edit — chapter by chapter — drawn from the live collection.
        </p>
      </section>

      {/* Form */}
      <section className="px-6 md:px-12 py-12 md:py-16 max-w-3xl mx-auto">
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
              placeholder="Mykonos · Capri · Saint-Tropez · Aspen…"
              className="w-full border-b border-ink/30 bg-transparent py-3 text-base focus:outline-none focus:border-ink placeholder:text-muted-foreground/60"
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
                    <div className={`mt-1 text-[10px] ${active ? "text-canvas/70" : "text-muted-foreground"}`}>
                      {v.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
              Notes for the Stylist <span className="text-muted-foreground/60 normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="A black-tie dinner on the second night. Prefers neutrals. Travelling carry-on only."
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

      {/* Results */}
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
                  <h3 className="font-serif text-2xl md:text-3xl tracking-tight">{ch.title}</h3>
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
