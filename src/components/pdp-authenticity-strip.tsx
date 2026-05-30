import { ShieldCheck, Package, RotateCcw } from "lucide-react";

/**
 * Defensible authenticity strip — claims only what our sourcing model
 * supports. No fabricated atelier / in-house QA language.
 */
export function PdpAuthenticityStrip() {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-6 py-10 border-y border-[var(--studio-rule)]">
      <Pillar
        icon={<ShieldCheck className="w-5 h-5" strokeWidth={1.4} />}
        title="100% Authentic"
        sub="Sourced through our network of authorised European boutiques and distributors."
      />
      <Pillar
        icon={<Package className="w-5 h-5" strokeWidth={1.4} />}
        title="Sealed Dispatch"
        sub="Shipped factory-sealed from a brand-authorised European or US warehouse within 24–48 hours."
      />
      <Pillar
        icon={<RotateCcw className="w-5 h-5" strokeWidth={1.4} />}
        title="14-Day Returns"
        sub="Unworn, tagged, in original packaging. Tracked return label on request."
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
