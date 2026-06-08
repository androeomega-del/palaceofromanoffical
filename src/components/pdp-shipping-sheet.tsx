import { useState, useEffect } from "react";
import { ShieldCheck, Truck, RotateCcw, Package } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@tanstack/react-router";

const ZONES = [
  { region: "European Union", transit: "1–3 business days" },
  { region: "Rest of world", transit: "5–7 business days" },
];

/**
 * Interactive trust strip — renders the same compact line that sat under
 * the Add to Bag CTA, but as a Sheet trigger that opens a progressive-
 * disclosure panel with the full shipping matrix and returns terms.
 *
 * Pure presentation. Does not touch cart, checkout, or any Shopify
 * mutation — see mem://constraints/checkout-protocol.
 */
export function PdpShippingSheet() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="mt-3 w-full flex items-center justify-center gap-2 text-[10.5px] uppercase tracking-[0.22em] text-[var(--studio-muted)] cursor-pointer group focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--studio-bronze)] focus-visible:ring-offset-2 rounded-sm py-1"
          aria-label="View shipping and returns details"
        >
          <ShieldCheck
            className="w-3 h-3 text-[var(--studio-bronze)]"
            strokeWidth={1.6}
          />
          <span>
            <span className="text-[var(--studio-ink)] font-medium underline decoration-dotted decoration-[var(--studio-bronze)]/60 underline-offset-[5px] group-hover:decoration-[var(--studio-bronze)] transition-colors">
              Authenticity &amp; Secure Shipping
            </span>
            <span className="mx-1.5 text-[var(--studio-bronze)]">•</span>
            <span className="text-[var(--studio-ink)] font-medium underline decoration-dotted decoration-[var(--studio-bronze)]/60 underline-offset-[5px] group-hover:decoration-[var(--studio-bronze)] transition-colors">
              14-Day Returns
            </span>
          </span>
        </button>
      </SheetTrigger>

      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={`overflow-y-auto bg-[var(--studio-canvas)] ${isMobile ? "rounded-t-2xl max-h-[85vh] pt-2" : "w-full sm:max-w-md"}`}
      >
        {isMobile && (
          <div className="mx-auto mb-2 flex justify-center">
            <div className="w-10 h-1 rounded-full bg-[var(--studio-rule)]" />
          </div>
        )}
        <SheetHeader className="text-left">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--studio-bronze)] font-semibold">
            Client Care
          </p>
          <SheetTitle className="font-serif text-2xl text-[var(--studio-ink)]">
            Shipping & Returns
          </SheetTitle>
          <SheetDescription className="text-[13px] leading-[1.65] text-[var(--studio-muted)]">
            Dispatched factory-sealed from a brand-authorised European or US
            partner warehouse within 24–48 hours. Fully tracked, fully insured — at no extra cost.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-8">
          <Pillar
            icon={<ShieldCheck className="w-4 h-4" strokeWidth={1.4} />}
            title="100% Authentic"
            sub="Sourced through our network of authorised European boutiques and distributors."
          />
          <Pillar
            icon={<Package className="w-4 h-4" strokeWidth={1.4} />}
            title="Insured Shipping"
            sub="Ships within 24–48 hours via UPS, FedEx or DHL with a live tracking link sent the moment the parcel leaves the warehouse. Every shipment is fully insured at no extra cost."
          />

          <div>
            <div className="flex items-center gap-2 text-[var(--studio-bronze)]">
              <Truck className="w-4 h-4" strokeWidth={1.4} />
              <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-[var(--studio-ink)]">
                Delivery Windows
              </p>
            </div>
            <table className="mt-3 w-full text-[12.5px] border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.2em] text-[var(--studio-muted)]">
                  <th className="text-left font-medium py-2 pr-3 border-b border-[var(--studio-rule)]">
                    Region
                  </th>
                  <th className="text-left font-medium py-2 border-b border-[var(--studio-rule)]">
                    Transit
                  </th>
                </tr>
              </thead>
              <tbody>
                {ZONES.map((z) => (
                  <tr key={z.region} className="border-b border-[var(--studio-rule)]/60">
                    <td className="py-2.5 pr-3 font-serif text-[var(--studio-ink)]">
                      {z.region}
                    </td>
                    <td className="py-2.5 text-[var(--studio-ink)]/80">{z.transit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[11.5px] leading-[1.6] text-[var(--studio-muted)]">
              Orders sourced from more than one warehouse dispatch separately
              and may arrive on different days. Couriers do not operate on
              weekends or local public holidays. We cannot currently deliver
              to Russia, Belarus or Ukraine due to the ongoing conflict.
            </p>
          </div>

          <Pillar
            icon={<RotateCcw className="w-4 h-4" strokeWidth={1.4} />}
            title="14-Day Returns"
            sub="Return any unworn, tagged piece in its original packaging within 14 days of delivery. Returns must travel with UPS, FedEx or DHL — tracked return label issued on request."
          />

          <div className="pt-4 border-t border-[var(--studio-rule)]">
            <Link
              to="/shipping-returns"
              onClick={() => setOpen(false)}
              className="text-[11px] uppercase tracking-[0.25em] font-medium text-[var(--studio-ink)] underline decoration-[var(--studio-bronze)]/60 underline-offset-[5px] hover:decoration-[var(--studio-bronze)]"
            >
              Full shipping & returns policy →
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Pillar({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[var(--studio-bronze)]">
        {icon}
        <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-[var(--studio-ink)]">
          {title}
        </p>
      </div>
      <p className="text-[12.5px] leading-[1.7] text-[var(--studio-muted)]">{sub}</p>
    </div>
  );
}
