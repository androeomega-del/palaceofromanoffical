import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildPdpFaq } from "@/lib/pdp-faq";

interface PdpFaqProps {
  title: string;
  vendor: string;
  productType: string;
  description: string;
}

/**
 * Visible "On this piece" FAQ block.
 *
 * Renders the same 4 Q&As emitted as FAQPage JSON-LD in the route head().
 * The `.pdp-faq` class is referenced by the route's `speakable` spec so
 * voice/AI assistants can quote answers verbatim.
 */
export function PdpFaq({ title, vendor, productType, description }: PdpFaqProps) {
  const qa = buildPdpFaq({ title, vendor, productType, description });

  return (
    <section
      className="pdp-faq max-w-3xl mx-auto mt-16 md:mt-20 px-4 md:px-0"
      aria-labelledby="pdp-faq-heading"
    >
      <div className="text-center mb-8 md:mb-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--studio-ink)]/50">
          Questions answered
        </p>
        <h2
          id="pdp-faq-heading"
          className="font-serif text-2xl md:text-3xl text-[var(--studio-ink)] mt-2"
        >
          On this piece
        </h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {qa.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left font-serif text-base md:text-lg">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-[var(--studio-ink)]/80">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
