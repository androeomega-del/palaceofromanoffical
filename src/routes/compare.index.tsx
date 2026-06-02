import { createFileRoute, Link } from "@tanstack/react-router";
import { COMPARISONS } from "@/lib/comparisons";
import { routeHead, pageTitle } from "@/lib/seo";

const ITEMS = Object.values(COMPARISONS);

export const Route = createFileRoute("/compare/")({
  head: () => {
    const title = pageTitle("Compare Palace of Roman — Honest Comparisons");
    const description =
      "Palace of Roman compared, honestly, to Farfetch, Mytheresa, SSENSE and Net-a-Porter. Where each one wins, and where we do.";
    const base = routeHead({ path: "/compare", title, description });
    return {
      meta: [
        { title },
        { name: "description", content: description },
        ...base.meta,
      ],
      links: base.links,
    };
  },
  component: CompareHub,
});

function CompareHub() {
  return (
    <div className="bg-canvas">
      <header className="px-6 pt-16 pb-12 max-w-screen-xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-6">Compare</p>
        <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight mb-6 max-w-[20ch]">
          How we stack up — honestly.
        </h1>
        <p className="text-lg text-muted-foreground max-w-[60ch] leading-relaxed">
          We're not the only place to buy Italian luxury online. Here's how we compare to the four
          retailers shoppers most often weigh us against — written plainly, with the trade-offs in both directions.
        </p>
      </header>

      <section className="px-6 pb-32 max-w-screen-xl mx-auto">
        <div className="grid md:grid-cols-2 gap-px bg-ink/10 border border-ink/10">
          {ITEMS.map((c) => (
            <Link
              key={c.slug}
              to="/compare/$slug"
              params={{ slug: c.slug }}
              className="group block bg-canvas p-10 md:p-12 hover:bg-ink/[0.025] transition-colors"
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">
                Palace of Roman vs
              </p>
              <h2 className="font-serif text-3xl md:text-4xl mb-4 group-hover:text-bronze transition-colors">
                {c.competitor}
              </h2>
              <p className="text-[15px] leading-relaxed text-ink/75 mb-6 max-w-[50ch]">
                {c.subhead}
              </p>
              <span className="text-[11px] uppercase tracking-[0.25em] text-ink group-hover:text-bronze">
                Read the comparison →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
