import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialPageShell } from "@/components/editorial-page-shell";
import { img } from "@/lib/editorial-library";
import { routeHead, breadcrumbJsonLd } from "@/lib/seo";

const PATH = "/sourcing-architecture";
const TITLE = "Sourcing Architecture — How We Operate";
const DESC =
  "A digital-first window into Europe's authorised luxury distribution networks. Current-season pieces, sourced through the same channels as the houses' own boutiques, with no overhead carried into the price.";

export const Route = createFileRoute("/sourcing-architecture")({
  head: () => {
    const rh = routeHead({ path: PATH, title: TITLE, description: DESC, image: img(11) });
    return {
      meta: [{ title: TITLE }, { name: "description", content: DESC }, ...rh.meta],
      links: rh.links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd("https://palaceofromanofficial.com", PATH, "Sourcing Architecture"),
          ),
        },
      ],
    };
  },
  component: SourcingArchitecturePage,
});

function SourcingArchitecturePage() {
  return (
    <EditorialPageShell
      eyebrow="House Notes"
      title="Sourcing Architecture."
      intro="The model behind every Palace of Roman order — explained plainly. A direct, digitally-synchronised window into Europe's authorised luxury distribution networks, with the overhead of legacy retail removed and the savings returned, in full, to the client."
      heroImage={img(11)}
      heroAlt="A piece from the current edit, photographed in studio"
    >
      {/* ─── Three-paragraph narrative ─── */}
      <section className="max-w-3xl mx-auto mb-28">
        <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">The Digital Shift</p>
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6 text-balance">
          A direct window into Europe's luxury vaults.
        </h2>
        <p className="text-[15px] leading-[1.85] text-ink/80 mb-12">
          Palace of Roman is a digital-first maison — a quiet evolution of the traditional luxury model. In place
          of a single flagship and a fixed buying calendar, we operate through a seamless digital architecture
          connected directly to a network of authorised European distributors, brand licensees, and tier-one
          supply partners. The expensive geometry of brick-and-mortar retail — long leases on Madison and Bond,
          regional inventory silos, layers of middlemen — has been replaced with a single, live data channel into
          the same European vaults that supply the continent's most established boutiques. The result is a
          private window onto the catalogue, opened, for the first time, to a global clientele on their own
          terms.
        </p>

        <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">Current-Season Availability</p>
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6 text-balance">
          The same release date as the boutiques on Via Montenapoleone.
        </h2>
        <p className="text-[15px] leading-[1.85] text-ink/80 mb-12">
          Our ecosystem synchronises directly with authorised European distributor networks and the official
          licensees of each maison, securing brand-new, current-season ready-to-wear and accessories at the
          moment of release — simultaneously with the heritage boutiques of Milan, Paris, Florence, and London.
          When a collection lands on the shop floor, it lands with us. There is no waiting list, no intermediary
          mark-up, and no quiet hand-off through the grey market. Every piece is current-season, fully
          authenticated, and offered the instant it becomes available.
        </p>

        <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">Structural Efficiency</p>
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6 text-balance">
          Overhead removed. Savings returned.
        </h2>
        <p className="text-[15px] leading-[1.85] text-ink/80">
          We do not maintain editorial offices, flagship leases, or celebrity campaigns — and we do not ask our
          clients to underwrite them. The cost structure of traditional luxury retail can absorb thirty to
          fifty percent of a piece's retail price before a single garment is sold. By eliminating those layers,
          we are able to redirect the full weight of our resources into the parts of the experience that
          genuinely matter to a serious buyer: flawless global logistics, rigorous authentication, fully insured
          express transit from European hubs, and a private concierge that answers personally. The reduction in
          price you see against traditional retail is not a discount, and it is not a sale. It is the absence
          of overhead — passed, in full, to you.
        </p>
      </section>

      {/* ─── Pillars row ─── */}
      <section className="grid md:grid-cols-3 gap-10 mb-28 border-y border-ink/10 py-16">
        <Pillar
          eyebrow="01 — Provenance"
          title="Authorised European channels only."
          body="Every piece is sourced through the official supply chain — the maison, its appointed distributor, or a brand licensee operating under European Union commercial law."
        />
        <Pillar
          eyebrow="02 — Inventory"
          title="Live-synced to the exact second."
          body="What you see on the page is what is physically held, in your size, at the moment of order. No phantom listings, no oversells, no quiet substitutions."
        />
        <Pillar
          eyebrow="03 — Logistics"
          title="Insured express, worldwide."
          body="Dispatched from European hubs within 24–48 hours via DHL Express, FedEx, or UPS — fully tracked, fully insured, signature on delivery."
        />
      </section>

      {/* ─── CTA ─── */}
      <section className="text-center max-w-2xl mx-auto pb-12">
        <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">Continue</p>
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6 text-balance">
          Read the authenticity protocol.
        </h2>
        <p className="text-[15px] leading-[1.8] text-ink/80 mb-8">
          The full standard every order is held to — original presentation, factory tagging, documentation, and
          the unconditional financial guarantee that backs each acquisition.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/authentication"
            className="px-6 py-3 bg-ink text-canvas text-[11px] uppercase tracking-[0.25em] hover:bg-ink/85 transition-colors"
          >
            Authenticity Guarantee
          </Link>
          <Link
            to="/shipping-returns"
            className="px-6 py-3 ring-1 ring-ink text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-canvas transition-colors"
          >
            European Logistics &amp; Tracking
          </Link>
        </div>
      </section>
    </EditorialPageShell>
  );
}

function Pillar({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">{eyebrow}</p>
      <h3 className="font-serif text-xl md:text-2xl tracking-tight mb-3 text-balance">{title}</h3>
      <p className="text-[13.5px] leading-[1.75] text-ink/75">{body}</p>
    </div>
  );
}
