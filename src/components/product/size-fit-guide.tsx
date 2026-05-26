import { Link } from "@tanstack/react-router";
import { Ruler } from "lucide-react";

type FitProfile = {
  label: string;
  fitNote: string;
  rec: string;
  measurements: { label: string; value: string }[];
};

const PROFILES: Record<string, FitProfile> = {
  shoes: {
    label: "Italian Footwear",
    fitNote:
      "Italian sizing runs slightly narrow through the toebox. Leather will mould to the foot over the first two to three wears.",
    rec: "If you sit between sizes, take the size down for loafers, drivers, and dress shoes; size up for sneakers and rubber-soled silhouettes.",
    measurements: [
      { label: "EU 39 / US 6", value: "24.5 cm" },
      { label: "EU 41 / US 8", value: "26.0 cm" },
      { label: "EU 43 / US 10", value: "27.5 cm" },
      { label: "EU 45 / US 12", value: "29.0 cm" },
    ],
  },
  rtw: {
    label: "Ready-to-Wear",
    fitNote:
      "Pieces are cut to the maison's standard fit — neither slim nor relaxed unless noted. Long-staple cottons and finer knits soften with wear without losing shape.",
    rec: "Between sizes? Size up for relaxed silhouettes (overshirts, knitwear, outerwear) and size down for tailored cuts (shirts, polos, tees).",
    measurements: [
      { label: "S — chest", value: "94–98 cm" },
      { label: "M — chest", value: "99–104 cm" },
      { label: "L — chest", value: "105–110 cm" },
      { label: "XL — chest", value: "111–116 cm" },
    ],
  },
  outerwear: {
    label: "Outerwear",
    fitNote:
      "Sized to layer cleanly over a fine knit or tailored shirt. Shoulders are constructed to sit naturally without padding the line.",
    rec: "If you intend to wear a heavy knit underneath, size up. Otherwise stay true to your jacket size.",
    measurements: [
      { label: "48 IT / S", value: "Chest 96 cm" },
      { label: "50 IT / M", value: "Chest 100 cm" },
      { label: "52 IT / L", value: "Chest 104 cm" },
      { label: "54 IT / XL", value: "Chest 108 cm" },
    ],
  },
  bottoms: {
    label: "Trousers & Denim",
    fitNote:
      "Italian and Japanese mills cut bottoms close through the seat with a clean break at the hem. Raw denim will relax by half a size after the first wear.",
    rec: "Take your usual waist size. For raw denim, size down one if you prefer a closer fit out of the box.",
    measurements: [
      { label: "30 W", value: "76 cm" },
      { label: "32 W", value: "81 cm" },
      { label: "34 W", value: "86 cm" },
      { label: "36 W", value: "91 cm" },
    ],
  },
  swim: {
    label: "Swim",
    fitNote:
      "Swim shorts are sized to the waist with a drawcord for fine adjustment. The fit sits just at the iliac, with a 5–7 inch inseam depending on silhouette.",
    rec: "Take your usual trouser waist. The drawcord allows a half-size of give in either direction.",
    measurements: [
      { label: "S", value: "Waist 76–80 cm" },
      { label: "M", value: "Waist 81–86 cm" },
      { label: "L", value: "Waist 87–92 cm" },
      { label: "XL", value: "Waist 93–98 cm" },
    ],
  },
  accessory: {
    label: "Accessories",
    fitNote:
      "One-size pieces are cut to a universal standard. Belts are sized to the waist of the trouser they pair with — never the natural waist.",
    rec: "For belts, take the size of the trouser waist they will be worn through (e.g. 32 W trouser → size 85 belt).",
    measurements: [
      { label: "Belt 85", value: "Trouser 30–32 W" },
      { label: "Belt 90", value: "Trouser 32–34 W" },
      { label: "Belt 95", value: "Trouser 34–36 W" },
      { label: "Belt 100", value: "Trouser 36–38 W" },
    ],
  },
  bag: {
    label: "Bags & Leather Goods",
    fitNote:
      "Dimensions are listed below for reference. Leather will soften with use and develop a subtle patina without losing structure.",
    rec: "If you carry a 13–14\" laptop daily, opt for the larger silhouette in the range.",
    measurements: [
      { label: "Card holder", value: "10 × 7 cm" },
      { label: "Bifold wallet", value: "11 × 9 cm" },
      { label: "Crossbody", value: "22 × 17 × 6 cm" },
      { label: "Tote", value: "38 × 30 × 12 cm" },
    ],
  },
};

function classify(productType?: string | null, title?: string | null): keyof typeof PROFILES {
  const hay = `${productType ?? ""} ${title ?? ""}`.toLowerCase();
  if (/swim|trunk|board\s?short/.test(hay)) return "swim";
  if (/shoe|sneaker|loafer|boot|driver|mule|sandal|slide|espadrille|derby|oxford/.test(hay))
    return "shoes";
  if (/jacket|coat|blazer|parka|gilet|vest|bomber/.test(hay)) return "outerwear";
  if (/trouser|pant|jean|denim|short|chino|cargo/.test(hay)) return "bottoms";
  if (/bag|tote|backpack|clutch|pouch|wallet|cardholder|card holder|crossbody/.test(hay))
    return "bag";
  if (/belt|tie|scarf|hat|cap|sunglass|jewel|cufflink|sock/.test(hay)) return "accessory";
  return "rtw";
}

export function SizeFitGuide({
  productType,
  title,
}: {
  productType?: string | null;
  title?: string | null;
}) {
  const key = classify(productType, title);
  const profile = PROFILES[key];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[var(--studio-bronze)]">
        <Ruler className="w-4 h-4" strokeWidth={1.4} />
        <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[var(--studio-ink)]">
          {profile.label}
        </p>
      </div>

      <p className="text-sm leading-[1.85] text-[var(--studio-muted)]">{profile.fitNote}</p>

      <div className="border-t border-[var(--studio-rule)] pt-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--studio-ink)] font-semibold mb-3">
          Our Recommendation
        </p>
        <p className="text-sm leading-[1.85] text-[var(--studio-muted)]">{profile.rec}</p>
      </div>

      <div className="border-t border-[var(--studio-rule)] pt-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--studio-ink)] font-semibold mb-3">
          Reference Measurements
        </p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px]">
          {profile.measurements.map((m) => (
            <div key={m.label} className="flex justify-between border-b border-[var(--studio-rule)]/60 py-2">
              <dt className="text-[var(--studio-muted)]">{m.label}</dt>
              <dd className="text-[var(--studio-ink)] tabular-nums">{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="text-[11px] leading-[1.7] text-[var(--studio-muted)] pt-2">
        Need a personal fit check?{" "}
        <Link
          to="/contact"
          className="underline underline-offset-4 hover:text-[var(--studio-ink)]"
        >
          Message concierge
        </Link>{" "}
        before ordering — we'll confirm against the maison's spec sheet.
      </p>
    </div>
  );
}
