/**
 * CapsuleBuilder — Phase 1 visual foundation.
 *
 * Renders a 5-slot capsule wardrobe canvas (Top, Bottom, Outerwear,
 * Footwear, Accessory). Slot 1 is seeded with the current PDP product
 * passed in via props; the remaining slots render empty placeholders.
 *
 * Safety:
 * - No cart/checkout state mutations. The "Purchase This Look" button
 *   logs the gathered variant IDs to the console only.
 * - Strict CSS containment + reserved min-height to prevent CLS.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import type { ShopifyProductNode } from "@/lib/shopify";
import { cdnImage } from "@/lib/cdn-image";
import { buildLuxuryListingAlt } from "@/lib/product-alt";

export type CapsuleSlotKind =
  | "Top"
  | "Bottom"
  | "Outerwear"
  | "Footwear"
  | "Accessory";

export type CapsuleSlot = {
  kind: CapsuleSlotKind;
  product?: ShopifyProductNode | null;
  variantId?: string | null;
};

export interface CapsuleBuilderProps {
  /** Seed product for Slot 1 (typically the current PDP product). */
  seedProduct: ShopifyProductNode;
  /** Optional pre-selected variant id for the seed product. */
  seedVariantId?: string | null;
  /** Inferred slot kind for the seed product. Defaults to "Top". */
  seedKind?: CapsuleSlotKind;
  className?: string;
}

const SLOT_ORDER: CapsuleSlotKind[] = [
  "Top",
  "Bottom",
  "Outerwear",
  "Footwear",
  "Accessory",
];

function SlotTile({ slot }: { slot: CapsuleSlot }) {
  const node = slot.product?.node;
  const img = node?.images?.edges?.[0]?.node;
  const filled = Boolean(node);

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-md border bg-card text-card-foreground",
        "transition-colors",
        filled ? "border-border" : "border-dashed border-border/60",
      )}
      style={{ contain: "layout style", aspectRatio: "3 / 4" }}
      aria-label={`${slot.kind} slot${filled ? "" : " — empty"}`}
    >
      {filled && img ? (
        <img
          src={cdnImage(img.url, { width: 480, format: "webp" })}
          alt={buildLuxuryListingAlt({ title: node!.title, vendor: node!.vendor })}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {slot.kind}
          </span>
        </div>
      )}
      <div className="absolute left-2 top-2 rounded-sm bg-background/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-foreground/80 backdrop-blur">
        {slot.kind}
      </div>
    </div>
  );
}

export function CapsuleBuilder({
  seedProduct,
  seedVariantId = null,
  seedKind = "Top",
  className,
}: CapsuleBuilderProps) {
  const slots = React.useMemo<CapsuleSlot[]>(() => {
    return SLOT_ORDER.map((kind) =>
      kind === seedKind
        ? { kind, product: seedProduct, variantId: seedVariantId }
        : { kind, product: null, variantId: null },
    );
  }, [seedProduct, seedVariantId, seedKind]);

  const onPurchaseLook = React.useCallback(() => {
    const variantIds = slots
      .map((s) => s.variantId)
      .filter((v): v is string => Boolean(v));
    // Phase 1: log-only. No cart mutations.
    // eslint-disable-next-line no-console
    console.log("[CapsuleBuilder] Purchase This Look — variantIds:", variantIds);
  }, [slots]);

  return (
    <section
      aria-labelledby="capsule-builder-heading"
      className={cn(
        "w-full rounded-lg border bg-background/60 p-4 sm:p-6",
        className,
      )}
      style={{ contain: "layout style", minHeight: "450px" }}
    >
      <header className="mb-4 flex flex-col gap-1 sm:mb-6">
        <h2
          id="capsule-builder-heading"
          className="font-serif text-lg tracking-tight sm:text-xl"
        >
          Build Your Capsule
        </h2>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Five pieces · One considered wardrobe
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
        {slots.map((slot) => (
          <SlotTile key={slot.kind} slot={slot} />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 sm:mt-6">
        <p className="text-xs text-muted-foreground">
          Curate up to five pieces. Editorial preview only.
        </p>
        <button
          type="button"
          onClick={onPurchaseLook}
          className="inline-flex items-center justify-center rounded-sm border border-foreground/80 bg-foreground px-4 py-2 text-xs uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90"
        >
          Purchase This Look
        </button>
      </div>
    </section>
  );
}

export default CapsuleBuilder;
