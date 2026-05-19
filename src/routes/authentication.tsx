import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialPageShell, ProseColumn, SectionTitle } from "@/components/editorial-page-shell";
import { Building2, PackageCheck, FileBadge, ShieldCheck } from "lucide-react";
import { img } from "@/lib/editorial-library";
import { routeHead } from "@/lib/seo";

export const Route = createFileRoute("/authentication")({
  head: () => {
    const title = "Sourcing & Authenticity — Palace of Roman";
    const desc = "How Palace of Roman sources its edit: an authorised European distribution partner, sealed shipments from brand-authorised warehouses, and an unconditional authenticity guarantee.";
    const rh = routeHead({ path: "/authentication", title, description: desc, image: img(38) });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
    };
  },
  component: AuthenticationPage,
});

const STEPS = [
  {
    n: "01",
    title: "Authorised distribution",
    body: "Every piece in the edit is held by an authorised European distribution partner that sources directly from the maisons and their official wholesale channels. We do not buy from unverified marketplaces, resellers, or private sellers.",
  },
  {
    n: "02",
    title: "Brand-authorised warehouses",
    body: "Stock is kept at brand-authorised warehouses across Italy, Spain, Austria, Sweden, Northern Ireland and the United States. Pieces remain in their original packaging from the moment they leave the maison until the moment they reach you.",
  },
  {
    n: "03",
    title: "Sealed shipment",
    body: "When you order, the piece ships directly from the warehouse holding it — sealed, with tags, dust bag and brand packaging intact. Palace of Roman does not open, repackage, or relabel inventory.",
  },
  {
    n: "04",
    title: "Documentation",
    body: "Each order arrives with the original brand documentation supplied by the maison, including any authenticity card, serial or date code, and care booklet provided with that piece.",
  },
  {
    n: "05",
    title: "Unconditional guarantee",
    body: "If an independent authenticator ever finds reason to challenge a piece purchased from us, return it within ninety days for a full refund. We would rather lose the sale than carry a piece we cannot stand behind.",
  },
];

function AuthenticationPage() {
  return (
    <EditorialPageShell
      eyebrow="Sourcing & Authenticity"
      title="Where every piece comes from."
      intro="Palace of Roman is an official BrandsGateway partner, authorised to resell pieces from Gucci, Versace, Balenciaga, Dior, Dolce & Gabbana, Saint Laurent and the wider catalogue. Every piece is 100% authentic, sourced from the brands or their authorised distributors, and ships sealed from a brand-authorised warehouse."
      heroImage={img(38)}
      heroAlt="Original brand packaging on a studio surface"
    >
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
        {[
          { Icon: Building2, title: "Official partner", body: "Certified BrandsGateway partner, authorised to resell from a catalogue of more than ninety luxury houses." },
          { Icon: PackageCheck, title: "Sealed shipment", body: "Direct from the brand-authorised warehouse in original packaging — tags, dust bag and box intact." },
          { Icon: FileBadge, title: "Original documentation", body: "Each order arrives with the documentation the maison originally supplied with the piece." },
          { Icon: ShieldCheck, title: "Authenticity guarantee", body: "Ninety days to return for a full refund if a third-party authenticator ever challenges the piece." },
        ].map(({ Icon, title, body }) => (
          <div key={title} className="border-l border-ink/15 pl-5">
            <Icon className="h-5 w-5 text-bronze mb-4" strokeWidth={1.25} />
            <h2 className="font-serif text-lg mb-2">{title}</h2>
            <p className="text-sm text-ink/70 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <ProseColumn>
        <SectionTitle kicker="The chain of custody">From the maison to your door.</SectionTitle>
        <div className="not-prose space-y-10 mt-6">
          {STEPS.map((s) => (
            <div key={s.n} className="grid grid-cols-[auto_1fr] gap-6 md:gap-10">
              <span className="text-[10px] uppercase tracking-[0.35em] text-bronze mt-1">{s.n}</span>
              <div>
                <h3 className="font-serif text-xl mb-2">{s.title}</h3>
                <p className="text-[15px] leading-[1.75] text-ink/80">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="not-prose mt-16 p-8 md:p-10 bg-canvas-raised border border-ink/5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">Verified partner</p>
          <h3 className="font-serif text-2xl mb-4">Read our reseller certificate.</h3>
          <p className="text-sm text-ink/80 leading-relaxed mb-6">
            Palace of Roman is certified by BrandsGateway (Gateway Holdings OÜ, Estonia) as an official partner,
            authorised to resell luxury fashion goods that are 100% authentic and sourced from the brands or their
            authorised distributors. The signed certificate is available below for your review.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/reseller-certificate.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
            >
              View reseller certificate (PDF) →
            </a>
            <Link
              to="/contact"
              className="inline-block text-[11px] uppercase tracking-[0.25em] border-b border-ink/40 pb-1 hover:text-bronze hover:border-bronze"
            >
              Write to the concierge →
            </Link>
          </div>
        </div>
      </ProseColumn>
    </EditorialPageShell>
  );
}
