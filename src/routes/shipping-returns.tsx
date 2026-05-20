import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialPageShell, ProseColumn, SectionTitle } from "@/components/editorial-page-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { img } from "@/lib/editorial-library";
import { routeHead } from "@/lib/seo";

export const Route = createFileRoute("/shipping-returns")({
  head: () => {
    const title = "Shipping & Returns — Palace of Roman";
    const desc = "Worldwide shipping from our brand-authorised European and US partner warehouses, with a 14-day return window from the day your parcel is delivered.";
    const rh = routeHead({ path: "/shipping-returns", title, description: desc, image: img(22) });
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
    };
  },
  component: ShippingReturnsPage,
});

const ZONES = [
  { region: "European Union", standard: "2–3 business days", dispatch: "24–48 hours" },
  { region: "United Kingdom & Northern Ireland", standard: "3–5 business days", dispatch: "24–48 hours" },
  { region: "Switzerland & Norway", standard: "3–5 business days", dispatch: "24–48 hours" },
  { region: "United States & Canada", standard: "4–7 business days", dispatch: "24–48 hours" },
  { region: "Rest of world", standard: "5–10 business days", dispatch: "24–48 hours" },
];

function ShippingReturnsPage() {
  return (
    <EditorialPageShell
      eyebrow="Client Care"
      title="Shipping & Returns"
      intro="Each order is dispatched from one of our partner warehouses across Italy, Sweden, Spain, Austria, Northern Ireland and the United States — fully tracked, fully insured."
      heroImage={img(72)}
      heroAlt="Considered packaging"
    >
      {/* At-a-glance callout — the three numbers that matter */}
      <div className="max-w-5xl mx-auto -mt-6 mb-16 grid grid-cols-1 sm:grid-cols-3 gap-px bg-ink/10 border border-ink/10">
        <div className="bg-canvas p-8 text-center">
          <p className="font-serif text-5xl md:text-6xl tracking-tight text-ink leading-none">14</p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-bronze font-semibold">Days to Return</p>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">From the day your parcel is delivered</p>
        </div>
        <div className="bg-canvas p-8 text-center">
          <p className="font-serif text-5xl md:text-6xl tracking-tight text-ink leading-none">3–5</p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-bronze font-semibold">Day Express</p>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">Tracked worldwide delivery</p>
        </div>
        <div className="bg-canvas p-8 text-center">
          <p className="font-serif text-5xl md:text-6xl tracking-tight text-ink leading-none">100%</p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-bronze font-semibold">Authentic</p>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">Sealed from a brand-authorised partner</p>
        </div>
      </div>

      <ProseColumn>
        <section>
          <SectionTitle kicker="Delivery">Where we ship from, and how long it takes</SectionTitle>
          <p>
            Palace of Roman operates through an authorised distribution network with warehouses across Europe and the
            United States. Your order is routed automatically from the warehouse holding the piece.
          </p>
          <ul className="text-sm text-muted-foreground !list-none !pl-0 space-y-1">
            <li><strong className="text-ink font-medium">Italy</strong> — Milan, Giuseppe, Beati, Genova, Florence, Modena, Como, Rome, Pomezia, Napoli, Piacenza, Pescara, Parma</li>
            <li><strong className="text-ink font-medium">Sweden</strong> — Jönköping, Bankeryd, Stockholm</li>
            <li><strong className="text-ink font-medium">Spain</strong> — Alicante</li>
            <li><strong className="text-ink font-medium">Austria</strong> — Salzburg</li>
            <li><strong className="text-ink font-medium">Northern Ireland</strong> — Belfast</li>
            <li><strong className="text-ink font-medium">United States</strong> — Florida, New York</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Warehouses dispatch within 24–48 hours of order confirmation. Delivery is by UPS, FedEx or DHL with an
            active tracking number, sent to you the moment the parcel leaves the warehouse. Couriers and warehouses do
            not operate on weekends or local public holidays.
          </p>

          <div className="not-prose mt-8 overflow-x-auto -mx-2">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  <th className="text-left font-medium py-3 pr-4 border-b border-ink/10">Region</th>
                  <th className="text-left font-medium py-3 pr-4 border-b border-ink/10">Transit</th>
                  <th className="text-left font-medium py-3 pr-4 border-b border-ink/10">Dispatch window</th>
                </tr>
              </thead>
              <tbody>
                {ZONES.map((z) => (
                  <tr key={z.region} className="border-b border-ink/5">
                    <td className="py-4 pr-4 font-serif">{z.region}</td>
                    <td className="py-4 pr-4 text-ink/80">{z.standard}</td>
                    <td className="py-4 pr-4 text-bronze">{z.dispatch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Orders containing pieces from more than one warehouse are dispatched separately and may arrive on different
            days. Shipping is quoted per order at checkout and based on the courier rate plus a per-item handling
            charge that varies by category.
          </p>
        </section>
      </ProseColumn>

      <div className="max-w-[68ch] mx-auto mt-20">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="returns">
            <AccordionTrigger className="text-base font-serif">Returns — within 14 days of delivery</AccordionTrigger>
            <AccordionContent className="text-[15px] leading-[1.75] text-ink/85 space-y-3">
              <p>
                We accept returns within fourteen days of the day your parcel is delivered. Pieces must be unworn, with
                all original tags attached, in their original packaging. To open a return, write to{" "}
                <Link to="/contact" className="underline decoration-bronze/60 underline-offset-4">our concierge</Link>{" "}
                with your order number and the reason for return; we will issue the correct return address and
                instructions for the warehouse that fulfilled your order.
              </p>
              <p>
                Returns must travel with UPS, FedEx or DHL and a live tracking number — regular postal services cannot
                be accepted and parcels sent that way will be declined.
              </p>
              <p className="text-sm text-muted-foreground">
                Sending a return to the wrong warehouse incurs a 20% restocking fee, as it adds significant handling
                and freight cost. We will confirm the correct address before you ship.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="exchanges">
            <AccordionTrigger className="text-base font-serif">Exchanges — sized or coloured differently</AccordionTrigger>
            <AccordionContent className="text-[15px] leading-[1.75] text-ink/85 space-y-3">
              <p>
                To exchange a piece, place a new order for the replacement size or colour and open a return on the
                original order following the steps above. The original piece is refunded as soon as it is received and
                inspected at the warehouse.
              </p>
              <p className="text-sm text-muted-foreground">
                This is the fastest path: it secures your replacement immediately rather than waiting for the return to
                clear before re-reserving stock.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="damaged">
            <AccordionTrigger className="text-base font-serif">A damaged or incorrect piece arrived</AccordionTrigger>
            <AccordionContent className="text-[15px] leading-[1.75] text-ink/85 space-y-3">
              <p>
                Write to us within fourteen days of delivery with clear photographs of the piece, the brand tag, and
                the visible defect or discrepancy. The case is reviewed with the originating warehouse to confirm the
                condition at dispatch.
              </p>
              <p>
                If the issue is confirmed, we provide a prepaid return label and, once the piece is received, issue a
                full refund or arrange a replacement at no cost to you.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="customs">
            <AccordionTrigger className="text-base font-serif">Duties, taxes and customs</AccordionTrigger>
            <AccordionContent className="text-[15px] leading-[1.75] text-ink/85">
              Orders within the European Union ship intra-EU with no further duties. Orders to the United Kingdom, the
              United States, Canada and other destinations may attract import duties and local taxes on arrival, which
              follow your country's customs schedule and are the responsibility of the recipient. Your courier will
              contact you directly if any payment is required before delivery.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="tracking">
            <AccordionTrigger className="text-base font-serif">Tracking your order</AccordionTrigger>
            <AccordionContent className="text-[15px] leading-[1.75] text-ink/85">
              You will receive a dispatch email with a UPS, FedEx or DHL tracking link the moment your parcel leaves
              the warehouse. For any question along the way, write to{" "}
              <Link to="/contact" className="underline decoration-bronze/60 underline-offset-4">our concierge</Link> —
              we reply the same business day.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </EditorialPageShell>
  );
}
