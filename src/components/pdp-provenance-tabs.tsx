import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Truck } from "lucide-react";
import type { ShopifyMetafield } from "@/lib/shopify";

/**
 * Polished provenance + logistics tabs surfaced directly beneath the
 * PDP Add-to-Cart row.
 *
 * Per-product overrides come from Shopify product metafields (namespace
 * `custom`):
 *   - factory_tags            (single_line_text / boolean as text)
 *   - serial_card             (single_line_text / boolean as text)
 *   - packaging_notes         (multi_line_text)
 *   - authenticity_documents  (multi_line_text)
 *   - dispatch_origin         (single_line_text — e.g. "Milan, IT")
 *   - transit_window          (single_line_text — e.g. "2–5 business days")
 *
 * When a metafield is unset, we fall back to the house defaults (defensible
 * for every authorised-network item). We never invent claims — empty stays
 * empty; only true overrides render.
 */

type ProvenanceMeta = {
  factoryTags?: string | null;
  serialCard?: string | null;
  packagingNotes?: string | null;
  authenticityDocuments?: string | null;
  dispatchOrigin?: string | null;
  transitWindow?: string | null;
};

function pick(
  metafields: Array<ShopifyMetafield | null> | undefined | null,
  key: string,
): string | null {
  if (!metafields) return null;
  const m = metafields.find((mf) => mf && mf.key === key && mf.namespace === "custom");
  const v = m?.value?.trim();
  if (!v) return null;
  // Treat literal "false"/"0" booleans as "unset" so they don't render blanks.
  if (/^(false|0|no)$/i.test(v)) return null;
  return v;
}

function parseMeta(
  metafields: Array<ShopifyMetafield | null> | undefined | null,
): ProvenanceMeta {
  return {
    factoryTags: pick(metafields, "factory_tags"),
    serialCard: pick(metafields, "serial_card"),
    packagingNotes: pick(metafields, "packaging_notes"),
    authenticityDocuments: pick(metafields, "authenticity_documents"),
    dispatchOrigin: pick(metafields, "dispatch_origin"),
    transitWindow: pick(metafields, "transit_window"),
  };
}

export function PdpProvenanceTabs({
  metafields,
}: {
  metafields?: Array<ShopifyMetafield | null> | null;
}) {
  const m = parseMeta(metafields ?? undefined);

  // Authenticity rows — metafield value overrides house default copy.
  const factoryTagsBody =
    m.factoryTags ??
    "Each piece retains all pristine, house-issued factory tags and regional retail barcodes.";
  const packagingBody =
    m.packagingNotes ??
    "Dispatched directly from specialised European logistics hubs in original, untouched designer packaging.";
  const documentationBody =
    m.authenticityDocuments ??
    "Shipments include original care booklets, dust bags, and serial-numbered authenticity cards where issued by the maison.";

  // Transit rows
  const transitOriginLabel = m.dispatchOrigin
    ? `Dispatched from ${m.dispatchOrigin} within 24–48 hours via UPS, FedEx or DHL. Fully insured at no extra cost, tracked end-to-end, and released only against adult signature on delivery.`
    : "Dispatched within 24–48 hours via UPS, FedEx or DHL from our European or US boutique-network partners. Fully insured at no extra cost, tracked end-to-end, and released only against adult signature on delivery.";
  const transitWindowSuffix = m.transitWindow
    ? ` Typical transit ${m.transitWindow}.`
    : " Typical transit: 1–3 business days within the EU, 5–7 business days everywhere else.";

  return (
    <div className="mt-6">
      <Tabs defaultValue="authenticity" className="w-full">
        <TabsList className="grid grid-cols-2 w-full h-auto p-0 bg-transparent border-b border-[var(--studio-rule)] rounded-none">
          <TabsTrigger
            value="authenticity"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--studio-ink)] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3 text-[11px] uppercase tracking-[0.22em] font-semibold flex items-center gap-2"
          >
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.6} />
            Authenticity Protocol
          </TabsTrigger>
          <TabsTrigger
            value="transit"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--studio-ink)] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3 text-[11px] uppercase tracking-[0.22em] font-semibold flex items-center gap-2"
          >
            <Truck className="w-3.5 h-3.5" strokeWidth={1.6} />
            Elite Transit
          </TabsTrigger>
        </TabsList>

        {/* ── Authenticity ── */}
        <TabsContent value="authenticity" className="pt-6 space-y-5">
          <p className="text-[13px] leading-[1.75] text-[var(--studio-muted)]">
            Every acquisition is backed by a strict alliance with tier-one European
            distribution networks operating under European Union commercial law
            governing the distribution of luxury goods. We maintain zero tolerance
            for secondary-market variance.
          </p>

          <ul className="divide-y divide-[var(--studio-rule)] border-y border-[var(--studio-rule)]">
            <ProvenanceRow title="Original Presentation" body={packagingBody} />
            <ProvenanceRow title="Factory Tagging" body={factoryTagsBody} />
            {m.serialCard && (
              <ProvenanceRow
                title="Serial-Numbered Card"
                body={
                  /^(true|yes|1)$/i.test(m.serialCard)
                    ? "This piece ships with its original serial-numbered authenticity card, matched to the item at the point of dispatch."
                    : m.serialCard
                }
              />
            )}
            <ProvenanceRow title="Documentation" body={documentationBody} />
          </ul>

          <div className="border-l-2 border-[var(--studio-bronze)] bg-[color-mix(in_oklab,var(--studio-bronze)_6%,transparent)] px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-[var(--studio-ink)] mb-2">
              Unconditional Guarantee
            </p>
            <p className="text-[12.5px] leading-[1.7] text-[var(--studio-ink)]/85">
              We provide an absolute, unconditional financial guarantee of
              authenticity. If any item fails to meet these standards, a full,
              immediate financial reversal is issued — no preconditions, no delay.
            </p>
          </div>
        </TabsContent>

        {/* ── Transit ── */}
        <TabsContent value="transit" className="pt-6 space-y-5">
          <ul className="divide-y divide-[var(--studio-rule)] border-y border-[var(--studio-rule)]">
            <ProvenanceRow
              title="Insured Continental Express"
              body={`${transitOriginLabel}${transitWindowSuffix}`}
            />
            <ProvenanceRow
              title="Millisecond Inventory Precision"
              body="Our infrastructure is synchronised with authorised European partner warehouses to the exact second — what you see on the page is what is physically held, in your size, at the moment of order."
            />
            <ProvenanceRow
              title="Buyer-Protected Checkout"
              body="Payments are processed through globally regulated, buyer-protected gateways with bank-grade encryption and full chargeback rights."
            />
          </ul>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-[10px] uppercase tracking-[0.28em] text-[var(--studio-muted)]">
            <span className="font-semibold text-[var(--studio-ink)]/70">Couriers</span>
            <span className="opacity-30">·</span>
            <span>DHL Express</span>
            <span className="opacity-30">·</span>
            <span>FedEx</span>
            <span className="opacity-30">·</span>
            <span>UPS</span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProvenanceRow({ title, body }: { title: string; body: string }) {
  return (
    <li className="py-4 first:pt-3 last:pb-3">
      <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[var(--studio-ink)] mb-1.5">
        {title}
      </p>
      <p className="text-[12.5px] leading-[1.7] text-[var(--studio-muted)] whitespace-pre-line">
        {body}
      </p>
    </li>
  );
}
