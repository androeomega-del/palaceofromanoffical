import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialPageShell, ProseColumn, SectionTitle } from "@/components/editorial-page-shell";
import { img } from "@/lib/editorial-library";
import { routeHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => {
    const title = "Privacy Notice — Palace of Roman";
    const desc = "How Palace of Roman collects, uses and protects your personal information.";
    const rh = routeHead({ path: "/privacy", title, description: desc });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
    };
  },
  component: PrivacyPage,
});

function PrivacyPage() {
  const updated = "Last revised — May 2026";
  return (
    <EditorialPageShell
      eyebrow="House Notes"
      title="Privacy Notice"
      intro="A clear account of the personal information we hold for you, why we hold it, and the rights you may exercise at any time."
      heroImage={img(45)}
      heroAlt="A study in discretion"
    >
      <ProseColumn>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{updated}</p>

        <section>
          <SectionTitle kicker="01">Information we collect</SectionTitle>
          <p>
            When you create an account, place an order, request authentication, or write to our concierge we collect the
            information you provide — your name, billing and shipping address, contact details, payment instruction and
            anything you choose to tell us about your preferences. We also collect technical information automatically
            when you visit, such as device type, IP address, referring page and the items you view.
          </p>
        </section>

        <section>
          <SectionTitle kicker="02">How we use it</SectionTitle>
          <p>
            Your information is used to fulfil your orders, communicate about deliveries and returns, respond to enquiries,
            personalise your suggestions across the boutique, prevent fraud, and — only with your separate consent — to send
            our quarterly Dispatch. We do not sell your data to third parties.
          </p>
        </section>

        <section>
          <SectionTitle kicker="03">Trusted processors</SectionTitle>
          <p>
            We rely on a small number of trusted technology providers to operate the boutique, including our commerce
            platform, payment processors, courier partners and analytics provider. Each is bound by strict contractual
            obligations on how your information may be used, and we share only the minimum required to deliver the service.
          </p>
        </section>

        <section>
          <SectionTitle kicker="04">Cookies</SectionTitle>
          <p>
            We use cookies and similar technologies to keep your cart in place, remember your preferences, measure how the
            boutique is used, and — where you have opted in — to personalise advertising. You may decline non-essential
            cookies at any time through your browser settings; essential cookies cannot be disabled as the boutique would
            not function without them.
          </p>
        </section>

        <section>
          <SectionTitle kicker="05">Your rights</SectionTitle>
          <p>
            You may request a copy of the information we hold for you, correct anything that is inaccurate, ask us to
            delete records that are no longer needed, withdraw consent for marketing, or restrict particular uses. To
            exercise any of these rights please write to{" "}
            <Link to="/contact" className="underline decoration-bronze/60 underline-offset-4 hover:text-bronze">
              the concierge
            </Link>
            . We respond within thirty days.
          </p>
        </section>

        <section>
          <SectionTitle kicker="06">Retention</SectionTitle>
          <p>
            Order and authentication records are retained for ten years to satisfy our legal obligations, after which they
            are anonymised. Marketing preferences are retained until you withdraw consent. Account information is held for
            as long as your account remains open and for a short grace period thereafter.
          </p>
        </section>

        <section>
          <SectionTitle kicker="07">Contact</SectionTitle>
          <p>
            Questions about this notice may be sent to <span className="font-medium">privacy@palaceofromanofficial.com</span> or
            through our{" "}
            <Link to="/contact" className="underline decoration-bronze/60 underline-offset-4 hover:text-bronze">
              concierge form
            </Link>
            .
          </p>
        </section>
      </ProseColumn>
    </EditorialPageShell>
  );
}
