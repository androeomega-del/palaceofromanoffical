import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialPageShell } from "@/components/editorial-page-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { img } from "@/lib/editorial-library";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently Asked Questions — Palace of Roman" },
      { name: "description", content: "Sourcing, authentication, shipping, returns and care — the questions our clients ask most." },
      { property: "og:title", content: "Frequently Asked Questions — Palace of Roman" },
    ],
  }),
  component: FaqPage,
});

type QA = { q: string; a: React.ReactNode };

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const SECTIONS: { title: string; items: QA[] }[] = [
  {
    title: "Sourcing & authenticity",
    items: [
      {
        q: "Where do the pieces come from?",
        a: (
          <>
            Every piece is sourced through an authorised European distribution partner with direct relationships to the
            maisons we carry — Gucci, Prada, Alexander McQueen, Armani and others. Stock is held in brand-authorised
            partner warehouses across Italy (Milan, Florence, Modena, Como, Rome and more), Sweden, Spain, Austria,
            Northern Ireland and the United States, and shipped sealed from the warehouse holding the piece.
          </>
        ),
      },
      {
        q: "Are you an official boutique of the brands you carry?",
        a: (
          <>
            Palace of Roman is an independent curated boutique. We are not directly affiliated with the maisons listed
            on the site; pieces are supplied through our authorised distribution partner. Read more on{" "}
            <Link to="/about" className="underline decoration-bronze/60 underline-offset-4">House Notes</Link>.
          </>
        ),
      },
      {
        q: "How do you guarantee authenticity?",
        a: (
          <>
            Every order is inspected and dispatched directly from the brand-authorised warehouse and ships with its
            original tags, dust bag and packaging. See the five-stage process on the{" "}
            <Link to="/authentication" className="underline decoration-bronze/60 underline-offset-4">Authentication</Link>{" "}
            page.
          </>
        ),
      },
    ],
  },
  {
    title: "Orders & payment",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: <>All major cards, Apple Pay, Google Pay and Shop Pay through our Shopify checkout. Payment is captured at the moment your order is placed.</>,
      },
      {
        q: "Can I cancel or amend an order after checkout?",
        a: <>Warehouses begin preparing orders within 24 hours, so we can only amend or cancel before dispatch. Write to the concierge immediately and we will do our best to intercept the order before it ships.</>,
      },
      {
        q: "Will my pieces arrive together?",
        a: <>If your order contains pieces from more than one warehouse, each warehouse dispatches its parcel separately. You will receive a tracking number for each.</>,
      },
    ],
  },
  {
    title: "Shipping",
    items: [
      {
        q: "How long will my order take to arrive?",
        a: (
          <>
            Warehouses dispatch within 24–48 hours of order confirmation. Typical transit from dispatch is 2–3 business
            days within the EU, 3–5 business days to the UK, Switzerland and Norway, 4–7 business days to the United
            States and Canada, and 5–10 business days to the rest of the world. Full breakdown on{" "}
            <Link to="/shipping-returns" className="underline decoration-bronze/60 underline-offset-4">Shipping &amp; Returns</Link>.
          </>
        ),
      },
      {
        q: "Which couriers do you use?",
        a: <>UPS, FedEx and DHL, always with a live tracking number. Warehouses and couriers do not operate on weekends or local public holidays.</>,
      },
      {
        q: "Do you ship worldwide?",
        a: <>Yes — we ship across the European Union, the United Kingdom, the United States, Canada and most of the world. A few destinations are restricted by the originating warehouse; checkout will confirm before payment.</>,
      },
      {
        q: "Will I pay duties or import taxes?",
        a: <>Orders within the European Union ship intra-EU with no further duties. Orders to the United Kingdom, the United States, Canada and other destinations may attract import duties and local taxes on arrival, charged by your local customs and payable to the courier.</>,
      },
    ],
  },
  {
    title: "Returns & exchanges",
    items: [
      {
        q: "What is your return window?",
        a: <>Fourteen days from the day your parcel is delivered. Pieces must be unworn, with all original tags attached and in their original packaging.</>,
      },
      {
        q: "How do I open a return?",
        a: (
          <>
            Write to{" "}
            <Link to="/contact" className="underline decoration-bronze/60 underline-offset-4">our concierge</Link>{" "}
            with your order number and reason for return. We issue the correct return address for the originating
            warehouse and walk you through the next steps.
          </>
        ),
      },
      {
        q: "How should I send a return back?",
        a: <>By UPS, FedEx or DHL with a live tracking number. Regular postal services cannot be accepted and parcels sent that way will be declined. Returning to the wrong warehouse incurs a 20% restocking fee, so always confirm the address with us first.</>,
      },
      {
        q: "How do I exchange for a different size?",
        a: <>The fastest path is to place a new order for the replacement size and open a return on the original. As soon as the return is received and inspected at the warehouse, the original is refunded.</>,
      },
      {
        q: "What if my piece arrives damaged or incorrect?",
        a: (
          <>
            Write within fourteen days of delivery with photographs of the piece, the brand tag, and the visible
            defect. Once the case is confirmed, we provide a prepaid return label and arrange a full refund or a
            replacement at no cost.
          </>
        ),
      },
    ],
  },
  {
    title: "Sizing & care",
    items: [
      {
        q: "Which sizing system do you use?",
        a: <>Each product page lists sizing in its original brand system (IT, FR, UK, US) with a conversion note where helpful. Italian sizing runs slightly smaller than the equivalent US size for ready-to-wear; if in doubt, write to the concierge.</>,
      },
      {
        q: "Can the concierge advise on fit?",
        a: (
          <>
            Yes — share the piece and your usual size, and we will respond with the maker's fit notes and a personal
            recommendation the same business day. Reach us through the{" "}
            <Link to="/contact" className="underline decoration-bronze/60 underline-offset-4">Contact</Link> page.
          </>
        ),
      },
      {
        q: "How should I care for my pieces?",
        a: <>Follow the brand care label sewn into the garment. Leather pieces benefit from a soft, dry storage bag and an annual conditioning. Knitwear should be folded, not hung.</>,
      },
    ],
  },
];

function FaqPage() {
  return (
    <EditorialPageShell
      eyebrow="Client Care"
      title="Frequently asked"
      intro="The questions our clients ask most often. If your question isn't answered here, our concierge replies the same business day."
      heroImage={img(48)}
      heroAlt="Editorial detail"
    >
      <div className="max-w-[68ch] mx-auto space-y-16">
        <nav aria-label="FAQ topics" className="border-y border-ink/10 py-5">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Jump to a topic</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {SECTIONS.map((section) => (
              <li key={section.title}>
                <a
                  href={`#${slugify(section.title)}`}
                  className="text-[12px] uppercase tracking-[0.18em] text-ink/80 border-b border-transparent hover:text-bronze hover:border-bronze transition-colors pb-0.5"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {SECTIONS.map((section) => (
          <section key={section.title} id={slugify(section.title)} className="scroll-mt-28">
            <h2 className="font-serif text-2xl md:text-3xl tracking-tight mb-6">{section.title}</h2>
            <Accordion type="single" collapsible className="w-full">
              {section.items.map((item, i) => (
                <AccordionItem key={i} value={`${section.title}-${i}`}>
                  <AccordionTrigger className="text-base font-serif text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-[15px] leading-[1.75] text-ink/85">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}

        <div className="border-t border-ink/10 pt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">Still have a question?</p>
          <Link
            to="/contact"
            className="inline-block text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors"
          >
            Write to the Concierge
          </Link>
        </div>
      </div>
    </EditorialPageShell>
  );
}
