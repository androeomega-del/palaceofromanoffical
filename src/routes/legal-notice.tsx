import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialPageShell, ProseColumn, SectionTitle } from "@/components/editorial-page-shell";
import { img } from "@/lib/editorial-library";
import { routeHead, breadcrumbJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/legal-notice")({
  head: () => {
    const title = "Legal Notice — Palace of Roman";
    const desc = "Operator identification and legal disclosures for Palace of Roman.";
    const rh = routeHead({ path: "/legal-notice", title, description: desc });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "House Notes", path: "/about" },
          { name: "Legal Notice", path: "/legal-notice" },
        ])),
      }],
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
            <strong className="font-medium">Palace of Roman</strong> is an independent luxury boutique, registered and operating in the United States. All business is conducted online; visits, atelier appointments and in-person consultations are not offered at this time.
          </p>
        </section>

        <section>
          <SectionTitle kicker="02">Client Services</SectionTitle>
          <p>
            For all correspondence — orders, sourcing requests, returns and general enquiries — please contact our Client Services team:
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
            Palace of Roman, 8605 Santa Monica Blvd PMB 610211, West Hollywood, California 90069-4109, US
          </p>
        </section>

        <section>
          <SectionTitle kicker="03">Business registration</SectionTitle>
          <p className="text-sm text-ink/70">
            <span className="text-muted-foreground">Business registration:</span> Tax identification details are held on file and disclosed to authorities, payment processors and wholesale partners on request.
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
            Palace of Roman partners with a network of authorised boutiques and distributors around the world to
            offer luxury fashion goods from the maisons listed on the site. Every piece is 100% authentic and
            sourced directly from the brands or their authorised distributors. More detail on our sourcing model
            is on the{" "}
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
            These disclosures and the operation of this boutique are governed by the laws of the State of California, United States.
            Any dispute is subject to the exclusive jurisdiction of the courts of Los Angeles County, California, unless mandatory
            consumer protection law in your country of residence provides otherwise.
          </p>
        </section>
      </ProseColumn>
    </EditorialPageShell>
  );
}
