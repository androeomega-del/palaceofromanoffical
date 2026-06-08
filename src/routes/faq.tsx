import { createFileRoute, Link } from "@tanstack/react-router";
import { isValidElement, type ReactNode } from "react";
import { EditorialPageShell } from "@/components/editorial-page-shell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { img } from "@/lib/editorial-library";
import { routeHead, absoluteUrl, SITE_NAME, breadcrumbJsonLd } from "@/lib/seo";

/** Flatten a ReactNode tree into plain text for JSON-LD answer bodies. */
function nodeToText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (isValidElement(node)) {
    const children = (node.props as { children?: ReactNode })?.children;
    return nodeToText(children);
  }
  return "";
}

export const Route = createFileRoute("/faq")({
  head: () => {
    const title = "Frequently Asked Questions — Palace of Roman";
    const desc = "Sourcing, authentication, shipping, returns and care — the questions our clients ask most.";
    const rh = routeHead({ path: "/faq", title, description: desc, image: img(48) });
    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      url: absoluteUrl("/faq"),
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".accordion-trigger", ".accordion-content"],
      },
      mainEntity: SECTIONS.flatMap((section) =>
        section.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: nodeToText(item.a).replace(/\s+/g, " ").trim(),
          },
        })),
      ),
    };
    const breadcrumb = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "FAQ", path: "/faq" },
    ]);
    return {
      meta: [{ title }, { name: "description", content: desc }, ...rh.meta],
      links: rh.links,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(faqJsonLd) },
        { type: "application/ld+json", children: JSON.stringify(breadcrumb) },
      ],
    };
  },
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
            Palace of Roman partners with a network of authorised boutiques and distributors around the world,
            offering more than ninety luxury houses — explore the full roster on the{" "}
            <Link to="/brands" className="underline decoration-bronze/60 underline-offset-4">Brands</Link>{" "}
            and{" "}
            <Link to="/designers" className="underline decoration-bronze/60 underline-offset-4">Designers</Link>{" "}
            indexes, including Gucci, Versace, Balenciaga, Dior, Prada, Saint Laurent, Alexander McQueen
            and Armani. Stock is held with partner boutiques across Italy (Milan, Florence, Modena, Como,
            Rome and more), Sweden, Spain, Austria, Northern Ireland and the United States, and shipped
            sealed from the location holding the piece.
          </>
        ),
      },
      {
        q: "Are you an official boutique of the brands you carry?",
        a: (
          <>
            Palace of Roman is an independent boutique that partners with a network of authorised boutiques and
            distributors around the world — the same multi-brand model used by leading luxury platforms. We are not
            a directly appointed flagship of any single house; pieces reach us through the brands' own authorised
            channels. More detail on our sourcing is on the{" "}
            <Link to="/authentication" className="underline decoration-bronze/60 underline-offset-4">Sourcing &amp; Authenticity</Link>{" "}
            page.
          </>
        ),
      },
      {
        q: "How do you guarantee authenticity?",
        a: (
          <>
            Every piece is 100% authentic and sourced directly from the brands or their authorised distributors.
            Orders ship sealed in original packaging with tags and dust bag intact. If an independent authenticator
            ever challenges a piece purchased from us, return it within ninety days for a full refund. Read the full
            chain of custody on the{" "}
            <Link to="/authentication" className="underline decoration-bronze/60 underline-offset-4">Sourcing &amp; Authenticity</Link>{" "}
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
        a: <>Visa, Mastercard, American Express, Apple Pay, Google Pay, Shop Pay and Klarna through our Shopify checkout. Payment is captured at the moment your order is placed.</>,
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
        a: (
          <>
            Each product page lists sizing in its original brand system (IT, FR, UK, US) with a conversion note
            where helpful. Italian sizing runs slightly smaller than the equivalent US size for ready-to-wear.
            Start with the{" "}
            <Link to="/women" className="underline decoration-bronze/60 underline-offset-4">Women</Link> or{" "}
            <Link to="/men" className="underline decoration-bronze/60 underline-offset-4">Men</Link> edit, or
            jump straight to{" "}
            <Link to="/collections/luxury-sneakers" className="underline decoration-bronze/60 underline-offset-4">sneakers</Link>,{" "}
            <Link to="/collections/italian-leather-loafers" className="underline decoration-bronze/60 underline-offset-4">loafers</Link>{" "}
            or{" "}
            <Link to="/collections/designer-mens-shirts" className="underline decoration-bronze/60 underline-offset-4">shirts</Link>{" "}
            for category-specific notes — and if in doubt, write to the concierge.
          </>
        ),
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
        a: (
          <>
            Follow the brand care label sewn into the garment.{" "}
            <Link to="/collections/italian-leather-handbags" className="underline decoration-bronze/60 underline-offset-4">Leather pieces</Link>{" "}
            benefit from a soft, dry storage bag and an annual conditioning.{" "}
            <Link to="/collections/cashmere-sweaters" className="underline decoration-bronze/60 underline-offset-4">Knitwear</Link>{" "}
            should be folded, not hung.{" "}
            <Link to="/collections/silk-scarves" className="underline decoration-bronze/60 underline-offset-4">Silk</Link>{" "}
            is best rolled and kept out of direct light.
          </>
        ),
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

        <aside aria-labelledby="faq-related" className="border-t border-ink/10 pt-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-3">Related reading</p>
          <h2 id="faq-related" className="font-serif text-2xl md:text-3xl tracking-tight mb-6">
            Continue into the edit.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 text-[14px]">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Shop the catalogue</p>
              <ul className="space-y-1.5">
                <li><Link to="/collections/italian-leather-handbags" className="hover:text-bronze">Italian leather handbags →</Link></li>
                <li><Link to="/collections/luxury-sneakers" className="hover:text-bronze">Luxury sneakers →</Link></li>
                <li><Link to="/collections/italian-leather-loafers" className="hover:text-bronze">Italian leather loafers →</Link></li>
                <li><Link to="/collections/designer-sunglasses" className="hover:text-bronze">Designer sunglasses →</Link></li>
                <li><Link to="/collections/cashmere-sweaters" className="hover:text-bronze">Cashmere sweaters →</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">From the editorial</p>
              <ul className="space-y-1.5">
                <li><Link to="/authentication" className="hover:text-bronze">Sourcing &amp; authenticity →</Link></li>
                <li><Link to="/shipping-returns" className="hover:text-bronze">Shipping &amp; returns →</Link></li>
                <li><Link to="/brands" className="hover:text-bronze">Brands index →</Link></li>
                <li><Link to="/designers" className="hover:text-bronze">Designers index →</Link></li>
                <li><Link to="/in-rome" className="hover:text-bronze">In Rome →</Link></li>
              </ul>
            </div>
          </div>
        </aside>

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
