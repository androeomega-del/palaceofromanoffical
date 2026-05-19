import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialPageShell, ProseColumn, SectionTitle } from "@/components/editorial-page-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { img } from "@/lib/editorial-library";

export const Route = createFileRoute("/shipping-returns")({
  head: () => ({
    meta: [
      { title: "Shipping & Returns — Palace of Roman" },
      { name: "description", content: "Delivery zones, lead times, returns, exchanges and customs information for Palace of Roman orders." },
      { property: "og:title", content: "Shipping & Returns — Palace of Roman" },
    ],
  }),
  component: ShippingReturnsPage,
});

const ZONES = [
  { region: "United States", standard: "2–4 business days", express: "Next business day", complimentary: "Orders over $1,200" },
  { region: "Canada", standard: "3–5 business days", express: "2 business days", complimentary: "Orders over $1,500" },
  { region: "United Kingdom & EU", standard: "3–5 business days", express: "2 business days", complimentary: "Orders over $1,500" },
  { region: "Middle East & GCC", standard: "3–5 business days", express: "2 business days", complimentary: "Orders over $2,000" },
  { region: "Asia-Pacific", standard: "4–6 business days", express: "3 business days", complimentary: "Orders over $2,000" },
  { region: "Rest of world", standard: "5–8 business days", express: "3–4 business days", complimentary: "On request" },
];

function ShippingReturnsPage() {
  return (
    <EditorialPageShell
      eyebrow="Client Care"
      title="Shipping & Returns"
      intro="Every order is dispatched from our New York atelier under signature, fully insured, in our signature linen-lined boxes."
      heroImage={img(72)}
      heroAlt="Considered packaging"
    >
      <ProseColumn>
        <section>
          <SectionTitle kicker="Delivery">Shipping zones and timing</SectionTitle>
          <div className="not-prose mt-4 overflow-x-auto -mx-2">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  <th className="text-left font-medium py-3 pr-4 border-b border-ink/10">Region</th>
                  <th className="text-left font-medium py-3 pr-4 border-b border-ink/10">Standard</th>
                  <th className="text-left font-medium py-3 pr-4 border-b border-ink/10">Express</th>
                  <th className="text-left font-medium py-3 pr-4 border-b border-ink/10">Complimentary above</th>
                </tr>
              </thead>
              <tbody>
                {ZONES.map((z) => (
                  <tr key={z.region} className="border-b border-ink/5">
                    <td className="py-4 pr-4 font-serif">{z.region}</td>
                    <td className="py-4 pr-4 text-ink/80">{z.standard}</td>
                    <td className="py-4 pr-4 text-ink/80">{z.express}</td>
                    <td className="py-4 pr-4 text-bronze">{z.complimentary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Orders placed before 12 PM Eastern on a business day are processed the same afternoon. Orders placed after
            that, or on weekends and public holidays, are processed the next business day.
          </p>
        </section>
      </ProseColumn>

      <div className="max-w-[68ch] mx-auto mt-20">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="returns">
            <AccordionTrigger className="text-base font-serif">Returns — within 14 days</AccordionTrigger>
            <AccordionContent className="text-[15px] leading-[1.75] text-ink/85 space-y-3">
              <p>
                Pieces may be returned within fourteen days of delivery for a full refund to your original payment method,
                provided they are unworn, with all tags attached and in their original packaging. Initiate a return from
                the order tracking link in your dispatch email or by writing to{" "}
                <Link to="/contact" className="underline decoration-bronze/60 underline-offset-4">our concierge</Link>.
              </p>
              <p className="text-sm text-muted-foreground">
                Final-sale pieces, swimwear, fine jewellery sized to order, and bespoke alterations are not returnable.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="exchanges">
            <AccordionTrigger className="text-base font-serif">Exchanges — sized differently</AccordionTrigger>
            <AccordionContent className="text-[15px] leading-[1.75] text-ink/85">
              We exchange within the same style for size or colour at no charge. If the replacement piece is no longer in
              stock we will refund and prepare a personal shortlist of alternatives.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="customs">
            <AccordionTrigger className="text-base font-serif">Duties, taxes and customs</AccordionTrigger>
            <AccordionContent className="text-[15px] leading-[1.75] text-ink/85">
              Orders to the United States, Canada, United Kingdom, EU and GCC are delivered duties and taxes paid (DDP) —
              the price you see is the price you pay. Other destinations may attract import duties on arrival; these are
              the responsibility of the recipient and follow your local customs schedule.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="packaging">
            <AccordionTrigger className="text-base font-serif">Packaging</AccordionTrigger>
            <AccordionContent className="text-[15px] leading-[1.75] text-ink/85">
              Each order ships in our signature linen-lined box with the certificate of authenticity, a handwritten card
              and tissue, ready to be presented. Gift wrapping and personalised dedications are complimentary at
              checkout.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tracking">
            <AccordionTrigger className="text-base font-serif">Tracking your order</AccordionTrigger>
            <AccordionContent className="text-[15px] leading-[1.75] text-ink/85">
              You will receive a dispatch email with a tracking link the moment your order leaves the atelier. For any
              query please write to <Link to="/contact" className="underline decoration-bronze/60 underline-offset-4">our concierge</Link> —
              we reply the same business day.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </EditorialPageShell>
  );
}
