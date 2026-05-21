import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialPageShell, ProseColumn, SectionTitle } from "@/components/editorial-page-shell";
import { img } from "@/lib/editorial-library";
import { routeHead } from "@/lib/seo";

export const Route = createFileRoute("/legal-notice")({
  head: () => {
    const title = "Legal Notice — Palace of Roman";
    const desc = "Operator identification and legal disclosures for Palace of Roman.";
    const rh = routeHead({ path: "/legal-notice", title, description: desc });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
    };
  },
  component: LegalNoticePage,
});

function LegalNoticePage() {
  return (
    <EditorialPageShell
      eyebrow="House Notes"
      title="Legal Notice"
      intro="The legal and operational identity of Palace of Roman, set out plainly for our clients and visitors."
      heroImage={img(56)}
      heroAlt="Order and structure"
    >
      <ProseColumn>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Last revised — May 2026</p>

        <section>
          <SectionTitle kicker="01">Operator</SectionTitle>
          <p>
            <strong className="font-medium">Palace of Roman</strong> is operated as a sole proprietorship by the founder. The boutique operates exclusively online; there is no physical showroom, atelier or in-person appointment service.
          </p>
          <p className="mt-4 text-sm text-ink/70">
            <span className="text-muted-foreground">Founder / Owner:</span>{" "}
            <em className="text-muted-foreground">[To be completed — please provide your full legal name]</em>
          </p>
        </section>

        <section>
          <SectionTitle kicker="02">Contact</SectionTitle>
          <p>
            For all correspondence — orders, sourcing requests, returns and general enquiries — please write to:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink/80 list-none">
            <li>
              <span className="text-muted-foreground">Email:</span>{" "}
              <a href="mailto:support@palaceofromanofficial.com" className="underline decoration-bronze/60 underline-offset-4 hover:text-bronze">
                support@palaceofromanofficial.com
              </a>
            </li>
            <li>
              <span className="text-muted-foreground">Concierge form:</span>{" "}
              <Link to="/contact" className="underline decoration-bronze/60 underline-offset-4 hover:text-bronze">
                palaceofromanofficial.com/contact
              </Link>
            </li>
          </ul>
          <p className="mt-4 text-sm text-ink/70">
            <span className="text-muted-foreground">Registered business address:</span>{" "}
            Virtual mailbox / PO Box <em className="text-muted-foreground">[address to be added]</em>
          </p>
        </section>

        <section>
          <SectionTitle kicker="03">Business registration</SectionTitle>
          <p className="text-sm text-ink/70">
            <span className="text-muted-foreground">Legal entity type:</span> Sole proprietorship
          </p>
          <p className="mt-2 text-sm text-ink/70">
            <span className="text-muted-foreground">EIN (Employer Identification Number):</span>{" "}
            <em className="text-muted-foreground">[on file — to be displayed]</em>
          </p>
          <p className="mt-2 text-sm text-ink/70">
            <span className="text-muted-foreground">Tax / VAT ID:</span>{" "}
            <em className="text-muted-foreground">[if applicable]</em>
          </p>
        </section>

        <section>
          <SectionTitle kicker="04">Responsible for content</SectionTitle>
          <p>
            The editorial content, photography and copy on this boutique are produced and maintained by Palace of Roman.
            If you have concerns about the accuracy of any material on the site, please write to{" "}
            <a href="mailto:support@palaceofromanofficial.com" className="underline decoration-bronze/60 underline-offset-4 hover:text-bronze">
              support@palaceofromanofficial.com
            </a>.
          </p>
        </section>

        <section>
          <SectionTitle kicker="05">Sourcing &amp; partnership</SectionTitle>
          <p>
            Palace of Roman is an official partner of{" "}
            <a
              href="https://brandsgateway.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-bronze/60 underline-offset-4 hover:text-bronze"
            >
              BrandsGateway
            </a>{" "}
            (Gateway Holdings OÜ, Estonia), authorised to resell luxury fashion goods from the maisons listed on the site.
            Every piece is certified as 100% authentic and sourced directly from the brands or their authorised distributors.
            Our reseller certificate is available on the{" "}
            <Link to="/authentication" className="underline decoration-bronze/60 underline-offset-4 hover:text-bronze">
              authentication page
            </Link>
            .
          </p>
        </section>

        <section>
          <SectionTitle kicker="06">Dispute resolution</SectionTitle>
          <p>
            Palace of Roman is not obliged to participate in dispute resolution proceedings before a consumer arbitration board,
            nor is it currently participating in any such voluntary scheme. In the event of a dispute, please contact us first
            at{" "}
            <a href="mailto:support@palaceofromanofficial.com" className="underline decoration-bronze/60 underline-offset-4 hover:text-bronze">
              support@palaceofromanofficial.com
            </a>{" "}
            and we will make every effort to resolve the matter directly.
          </p>
        </section>

        <section>
          <SectionTitle kicker="07">Governing law</SectionTitle>
          <p>
            These disclosures and the operation of this boutique are governed by the laws of the State of New York.
            Any dispute is subject to the exclusive jurisdiction of the courts of New York County, unless mandatory
            consumer protection law in your country of residence provides otherwise.
          </p>
        </section>
      </ProseColumn>
    </EditorialPageShell>
  );
}
