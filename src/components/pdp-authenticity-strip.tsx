import { ShieldCheck, Package, RotateCcw } from "lucide-react";

/**
 * Defensible authenticity + logistics strip. Claims map 1:1 to our
 * sourcing model — insured express from European hubs, live-synced
 * inventory, buyer-protected checkout. No fabricated atelier language.
 */
export function PdpAuthenticityStrip() {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-6 py-10 border-y border-[var(--studio-rule)]">
      <Pillar
        icon={<Package className="w-5 h-5" strokeWidth={1.4} />}
        title="Insured Express, From Europe Direct"
        sub="Every order ships via DHL, FedEx, or UPS premium air service, fully insured end-to-end and released only against signature. Dispatched from European hubs within 24–48 hours of order."
      />
      <Pillar
        icon={<ShieldCheck className="w-5 h-5" strokeWidth={1.4} />}
        title="Live European Inventory"
        sub="Our catalogue is synchronised in real time with authorised European warehouses. What you see is what is physically held, in your size, at the moment you view it — new-season availability confirmed at the instant of order."
      />
      <Pillar
        icon={<RotateCcw className="w-5 h-5" strokeWidth={1.4} />}
        title="Buyer-Protected Checkout"
        sub="All payments are processed through globally regulated, buyer-protected gateways with full chargeback rights and bank-grade encryption. Zero exposure, zero ambiguity."
      />
    </ul>
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
    <li className="space-y-2">
      <div className="flex items-center gap-2 text-[var(--studio-bronze)]">
        {icon}
        <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-[var(--studio-ink)]">
          {title}
        </p>
      </div>
      <p className="text-[12px] leading-[1.7] text-[var(--studio-muted)]">{sub}</p>
    </li>
  );
}
