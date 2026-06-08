import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialPageShell } from "@/components/editorial-page-shell";
import { img } from "@/lib/editorial-library";
import { routeHead, breadcrumbJsonLd } from "@/lib/seo";

const PATH = "/sourcing-architecture";
const TITLE = "The Architecture of Modern Luxury — Palace of Roman";
const DESC =
  "A direct, digitally-synchronised window into Europe's authorised luxury distribution networks. Current-season pieces sourced through the same channels as the continent's heritage boutiques.";

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
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Sourcing Architecture", path: PATH },
            ]),
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
      title="The Architecture of Modern Luxury."
      intro="The model behind every Palace of Roman order — a digitally-synchronised window into Europe's authorised luxury distribution networks, with the overhead of legacy retail removed and the savings returned, in full, to the client."
      heroImage={img(11)}
      heroAlt="A piece from the current edit, photographed in studio"
    >
      {/* ─── Three-paragraph narrative ─── */}
      <section className="max-w-3xl mx-auto py-16 md:py-24">
        <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">The Digital Shift</p>
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6 text-balance">
          A direct window into Europe's luxury vaults.
        </h2>
        <p className="text-[15px] leading-[1.85] text-ink/80 mb-12">
          Our platform operates on a singular premise: the traditional barriers between the world's finest
          fashion houses and the global collector are entirely obsolete. By replacing physical retail
          footprints and legacy media overhead with a seamless digital architecture, we connect your wardrobe
          directly to the primary source. We interface in real time with Europe's most prestigious authorised
          distributors and brand licensees. This structural integration grants our clients an uncompromised,
          direct window into the continent's premier luxury vaults.
        </p>

        <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">Current-Season Availability</p>
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6 text-balance">
          Runway-to-doorstep, in season.
        </h2>
        <p className="text-[15px] leading-[1.85] text-ink/80 mb-12">
          We do not wait for the season to fade. Our digital logistics ecosystem operates in synchronisation
          with official runway releases, securing brand-new, current-season ready-to-wear and accessories
          simultaneously with traditional heritage boutiques. By eliminating the multi-layered middlemen that
          historically inflated high-fashion pricing, we capture current-season inventory the moment it
          becomes available. This ensures our clients never have to choose between immediate seasonal
          relevance and logistical intelligence.
        </p>

        <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">Structural Efficiency</p>
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6 text-balance">
          Overhead removed. Savings returned.
        </h2>
        <p className="text-[15px] leading-[1.85] text-ink/80">
          The absence of traditional brick-and-mortar storefronts, costly editorial campaign buy-ins, and
          celebrity marketing is our deliberate operational strategy. We allocate those substantial capital
          reserves directly into what matters most to the collector: flawless global transit, rigorous
          verification protocols, and an optimised pricing structure. By streamlining the supply chain from
          the European hub directly to your doorstep, we remove unnecessary systemic costs, delivering
          pristine, newly released luxury items with absolute operational efficiency.
        </p>
      </section>

      {/* ─── 3-Pillar Operational Row ─── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-neutral-200 mb-24">
        <Pillar
          eyebrow="01 — Provenance"
          title="Direct European Integration"
          body="Tracking real-time luxury allocations straight from authorised European distribution points and brand licensees operating under EU commercial law."
        />
        <Pillar
          eyebrow="02 — Cadence"
          title="Runway-to-Doorstep Cadence"
          body="Instant synchronisation with new-season European collections as they drop — the same release window as the boutiques of Milan, Paris, Florence, and London."
        />
        <Pillar
          eyebrow="03 — Transit"
          title="Sovereign Authentication"
          body="Verified transit protocols — insured express from European hubs via DHL, FedEx, UPS — maintaining uncompromised luxury standards from warehouse to wardrobe."
        />
      </section>

      {/* ─── Authenticity anchor ─── */}
      <section id="authenticity" className="max-w-3xl mx-auto mb-24 scroll-mt-32">
        <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">Authenticity Guarantee</p>
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6 text-balance">
          An unconditional standard.
        </h2>
        <p className="text-[15px] leading-[1.85] text-ink/80 mb-6">
          Every acquisition is backed by a strict alliance with tier-one European distribution networks
          operating under European Union commercial law. We maintain zero tolerance for secondary-market
          variance: every piece arrives in original presentation, with house-issued factory tags, regional
          retail barcodes, original care booklets, dust bags, and serial-numbered authenticity cards where
          issued by the maison.
        </p>
        <div className="border-l-2 border-black pl-4 my-4 italic font-medium text-neutral-900">
          We provide an absolute, unconditional financial guarantee of authenticity. If any item fails to meet
          these rigorous standards, a full, immediate financial reversal is issued — no preconditions, no delay.
        </div>
      </section>

      {/* ─── Logistics anchor ─── */}
      <section id="logistics" className="max-w-3xl mx-auto mb-24 scroll-mt-32">
        <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">European Logistics &amp; Tracking</p>
        <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6 text-balance">
          Insured continental express, worldwide.
        </h2>
        <p className="text-[15px] leading-[1.85] text-ink/80 mb-6">
          Dispatched from European hubs within 24–48 hours of order via DHL Express, FedEx, or UPS premium
          air service — fully tracked in real time, fully insured end-to-end, released only against adult
          signature on delivery. Typical transit is 3–7 business days.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs tracking-wider opacity-60 text-neutral-500 uppercase mt-4">
          <span>DHL Express</span>
          <span className="opacity-50">·</span>
          <span>FedEx</span>
          <span className="opacity-50">·</span>
          <span>UPS</span>
        </div>
      </section>

      {/* ─── CTA cluster ─── */}
      <section className="text-center max-w-2xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/collections/$handle"
            params={{ handle: "new-arrivals" }}
            className="px-8 py-4 bg-black text-white text-[11px] uppercase tracking-[0.28em] hover:bg-ink/85 transition-colors"
          >
            Discover New Arrivals
          </Link>
          <Link
            to="/collections/$handle"
            params={{ handle: "accessories" }}
            className="group inline-flex items-center gap-2 px-2 py-4 text-[11px] uppercase tracking-[0.28em] text-ink hover:text-bronze transition-colors"
          >
            View Current Season Accessories
            <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">→</span>
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
