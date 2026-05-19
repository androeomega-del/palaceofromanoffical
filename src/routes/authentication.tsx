import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialPageShell, ProseColumn, SectionTitle } from "@/components/editorial-page-shell";
import { ShieldCheck, FileBadge, Microscope, Repeat } from "lucide-react";
import { img } from "@/lib/editorial-library";

export const Route = createFileRoute("/authentication")({
  head: () => ({
    meta: [
      { title: "Authentication — Palace of Roman" },
      { name: "description", content: "Every piece is authenticated in-house and accompanied by a certificate. Our authentication standard, explained." },
      { property: "og:title", content: "Authentication — Palace of Roman" },
    ],
  }),
  component: AuthenticationPage,
});

const STEPS = [
  {
    n: "01",
    title: "Provenance",
    body: "Each piece is sourced directly from the maison, a verified distributor, or a private wardrobe with traceable history. We do not buy from unverified marketplaces.",
  },
  {
    n: "02",
    title: "Materials",
    body: "Hides, hardware, threads and stitching are inspected against the maison's reference for season, line and country of manufacture. Subtle deviations are recorded and challenged.",
  },
  {
    n: "03",
    title: "Construction",
    body: "Stitch count, edge paint, lining seams and the placement of every emblem are compared against our in-house archive of authenticated examples.",
  },
  {
    n: "04",
    title: "Identity",
    body: "Date codes, heat stamps, micro-engraving, RFID tags and serial numbers are verified through both physical inspection and, where the maison offers it, digital confirmation.",
  },
  {
    n: "05",
    title: "Certificate",
    body: "Once cleared the piece is photographed, recorded under a unique reference and accompanied to you with a signed certificate of authenticity.",
  },
];

function AuthenticationPage() {
  return (
    <EditorialPageShell
      eyebrow="The House Standard"
      title="Every piece, authenticated."
      intro="A four-stage process performed by our in-house authentication team on every single item before it leaves the atelier."
      heroImage={img(38)}
      heroAlt="The atelier at work"
    >
      <div className="not-prose grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
        {[
          { Icon: ShieldCheck, title: "In-house team", body: "No outsourced authentication. Six specialists, twenty years average tenure." },
          { Icon: Microscope, title: "Archival reference", body: "An internal library of thousands of authenticated examples across every house we stock." },
          { Icon: FileBadge, title: "Certificate", body: "Each order ships with a signed, numbered certificate matched to your piece." },
          { Icon: Repeat, title: "Lifetime re-check", body: "Should you ever wish, we re-authenticate any piece purchased from us at no cost." },
        ].map(({ Icon, title, body }) => (
          <div key={title} className="border-l border-ink/15 pl-5">
            <Icon className="h-5 w-5 text-bronze mb-4" strokeWidth={1.25} />
            <h3 className="font-serif text-lg mb-2">{title}</h3>
            <p className="text-sm text-ink/70 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <ProseColumn>
        <SectionTitle kicker="The process">Five stages, every piece.</SectionTitle>
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
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">If something is ever wrong</p>
          <h3 className="font-serif text-2xl mb-4">Our guarantee is unconditional.</h3>
          <p className="text-sm text-ink/80 leading-relaxed mb-6">
            If a third-party authenticator ever finds reason to challenge a piece purchased from us, return it within
            ninety days for a full refund and a public-record correction to our archive. We have no interest in being
            anything other than right.
          </p>
          <Link
            to="/contact"
            className="inline-block text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
          >
            Speak to the concierge →
          </Link>
        </div>
      </ProseColumn>
    </EditorialPageShell>
  );
}
