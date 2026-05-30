import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialPageShell, ProseColumn, SectionTitle } from "@/components/editorial-page-shell";
import { img } from "@/lib/editorial-library";
import { routeHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => {
    const title = "Terms of Sale — Palace of Roman";
    const desc = "The terms governing your purchase and use of the Palace of Roman boutique.";
    const rh = routeHead({ path: "/terms", title, description: desc });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
    };
  },
  component: TermsPage,
});

function TermsPage() {
  return (
    <EditorialPageShell
      eyebrow="House Notes"
      title="Terms of Sale & Use"
      intro="The understandings between Palace of Roman and our clients, set out plainly."
      heroImage={img(63)}
      heroAlt="Document and detail"
    >
      <ProseColumn>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Last revised — May 2026</p>

        <section>
          <SectionTitle kicker="01">Acceptance</SectionTitle>
          <p>
            By placing an order, creating an account, or otherwise using the Palace of Roman boutique you accept these
            terms in full. If you do not, please do not use the service. We may update these terms occasionally; the
            version in force at the time of your order is the one that governs your purchase.
          </p>
        </section>

        <section>
          <SectionTitle kicker="02">Orders and acceptance</SectionTitle>
          <p>
            Each order is an offer to purchase, which we accept by sending a confirmation email. We reserve the right to
            decline any order — for stock, authentication, payment or compliance reasons — in which case any sum paid will
            be refunded in full to your original method of payment.
          </p>
        </section>

        <section>
          <SectionTitle kicker="03">Pricing and availability</SectionTitle>
          <p>
            All prices are shown in U.S. dollars and are inclusive of value added taxes where applicable. Pieces are
            curated in single or limited runs; while we make every effort to keep stock accurate, an item may sell out
            between the moment you view it and the moment your order is processed. Should this occur we will write to you
            within one business day with the next steps.
          </p>
        </section>

        <section>
          <SectionTitle kicker="04">Payment</SectionTitle>
          <p>
            We accept all major credit and debit cards, Apple Pay, Google Pay, Klarna and bank transfer for orders above
            $10,000. Payment is processed at the moment your order is confirmed; we do not store full card numbers on our
            systems.
          </p>
        </section>

        <section>
          <SectionTitle kicker="05">Delivery</SectionTitle>
          <p>
            Delivery times, customs and risk-of-loss are set out in our{" "}
            <Link to="/shipping-returns" className="underline decoration-bronze/60 underline-offset-4 hover:text-bronze">
              shipping notice
            </Link>
            . Title to your purchase passes on delivery to the address you nominate.
          </p>
        </section>

        <section>
          <SectionTitle kicker="06">Returns</SectionTitle>
          <p>
            Our returns and exchange policy is set out in the{" "}
            <Link to="/shipping-returns" className="underline decoration-bronze/60 underline-offset-4 hover:text-bronze">
              shipping notice
            </Link>
            . Final-sale pieces, swimwear, and bespoke alterations are not returnable.
          </p>
        </section>

        <section>
          <SectionTitle kicker="07">Sourcing &amp; authenticity</SectionTitle>
          <p>
            Palace of Roman partners with a network of authorised boutiques and distributors around the world to
            offer luxury fashion goods from the maisons listed on the site. Every piece is 100% authentic and
            sourced directly from the brands or their authorised distributors, and ships sealed in its original
            packaging. The full chain of custody and our authenticity guarantee are described on the{" "}
            <Link to="/authentication" className="underline decoration-bronze/60 underline-offset-4 hover:text-bronze">
              sourcing &amp; authenticity page
            </Link>
            . If an independent authenticator ever challenges a piece purchased from us, return it within ninety days
            for a full refund.
          </p>
        </section>

        <section>
          <SectionTitle kicker="08">Intellectual property</SectionTitle>
          <p>
            All photography, editorial copy, the Palace of Roman wordmark, and the boutique's overall design are the
            property of Palace of Roman or used under licence. You may not reproduce or republish any part of the
            boutique without our written permission, except for personal, non-commercial use.
          </p>
        </section>

        <section>
          <SectionTitle kicker="09">Limitation of liability</SectionTitle>
          <p>
            To the extent permitted by law, our liability for any single order is limited to the value of that order.
            Nothing in these terms excludes liability for fraud or for any matter that cannot be excluded by law.
          </p>
        </section>

        <section>
          <SectionTitle kicker="10">Governing law</SectionTitle>
          <p>
            These terms are governed by the laws of the State of New York and any dispute is subject to the exclusive
            jurisdiction of the courts of New York County, unless mandatory consumer protection law in your country of
            residence provides otherwise.
          </p>
        </section>
      </ProseColumn>
    </EditorialPageShell>
  );
}
