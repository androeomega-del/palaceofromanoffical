import { Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { heritageFor } from "@/lib/brand-heritage";

/**
 * Collapsible "The {Vendor} Story" — pulls from src/lib/brand-heritage.ts.
 * Editorial heritage copy that doubles as long-tail SEO body content.
 */
export function PdpBrandHeritage({
  vendor,
  vendorHandle,
}: {
  vendor: string;
  vendorHandle: string;
}) {
  if (!vendor) return null;
  const h = heritageFor(vendor);

  return (
    <section className="max-w-5xl mx-auto mt-32 pt-20 border-t border-[var(--studio-rule)]">
      <div className="text-center max-w-2xl mx-auto space-y-5 mb-12">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--studio-bronze)] font-semibold">
          {h.meta}
        </p>
        <h2 className="font-serif text-4xl md:text-5xl leading-[1.1] tracking-tight text-balance">
          The {vendor} Story
        </h2>
        <p className="text-[15px] leading-[1.85] text-[var(--studio-muted)] font-serif italic">
          {h.tagline}
        </p>
      </div>

      <Accordion type="single" collapsible className="max-w-3xl mx-auto border-y border-[var(--studio-rule)]">
        <AccordionItem value="heritage" className="border-0">
          <AccordionTrigger className="text-[11px] uppercase tracking-[0.25em] font-bold hover:no-underline py-6 [&>svg]:text-[var(--studio-bronze)]">
            Heritage & House Codes
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-8 pb-4">
              <p className="text-[15px] leading-[1.95] text-[var(--studio-muted)] font-serif">
                {h.description}
              </p>

              {h.signatures.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[var(--studio-ink)]">
                    Iconic from the house
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {h.signatures.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] uppercase tracking-[0.2em] px-3 py-1.5 border border-[var(--studio-rule)] text-[var(--studio-muted)]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Link
                to="/collections/$handle"
                params={{ handle: vendorHandle }}
                className="inline-block text-[10px] uppercase tracking-[0.25em] border-b border-[var(--studio-ink)] pb-1 hover:text-[var(--studio-bronze)] hover:border-[var(--studio-bronze)] transition-colors"
              >
                Explore the {vendor} edit
              </Link>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
