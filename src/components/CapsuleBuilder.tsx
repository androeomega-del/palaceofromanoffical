/**
 * CapsuleBuilder — Phase 3: item selection interface.
 *
 * Renders a 5-slot capsule wardrobe canvas (Top, Bottom, Outerwear,
 * Footwear, Accessory). Slot 1 is seeded with the current PDP product.
 * Clicking an empty slot opens a side-panel (Sheet) that filters a
 * server-preloaded `candidatePool` of related products by the slot's
 * kind. Selecting an item fills the slot via local React state.
 *
 * Safety:
 * - Uses the official `useCartStore.addItem` + `openDrawer` actions only.
 *   No edits to cart-store, cart-drawer, use-cart-sync, or checkout URL gen.
 * - No new network calls — drawer is populated from the preloaded
 *   `candidatePool` prop.
 * - Strict CSS containment + reserved min-height to prevent CLS.
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import type { ShopifyProductNode } from "@/lib/shopify";
import { cdnImage } from "@/lib/cdn-image";
import { buildLuxuryListingAlt } from "@/lib/product-alt";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useCartStore } from "@/stores/cart-store";

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
  /**
   * Server-preloaded pool of related/curated products. Used to populate
   * the slot-fill drawer without issuing new network calls.
   */
  candidatePool?: ShopifyProductNode[];
  className?: string;
}

const SLOT_ORDER: CapsuleSlotKind[] = [
  "Top",
  "Bottom",
  "Outerwear",
  "Footwear",
  "Accessory",
];

/** Map a Shopify productType string → CapsuleSlotKind. */
function classifyKind(productType: string | undefined | null): CapsuleSlotKind | null {
  const t = (productType ?? "").toLowerCase();
  if (!t) return null;
  if (/shoe|sneaker|boot|loafer|sandal|slipper|heel|oxford|derby|brogue|espadrille|mule|pump|flip.flop|slide|clog/.test(t)) return "Footwear";
  if (/pant|trouser|jean|short|skirt|legging|sweatpant|chino|slack|brief|boxer|swim|trunk|jogger/.test(t)) return "Bottom";
  if (/jacket|coat|blazer|overcoat|parka|trench|bomber|windbreaker|anorak|cape|cardigan|sweater|hoodie|sweatshirt|knitwear|fleece|gilet|pullover|turtleneck|poncho/.test(t)) return "Outerwear";
  if (/bag|belt|tie|scarf|hat|cap|glove|watch|jewelry|jewellery|necklace|bracelet|ring|earring|sunglass|wallet|card holder|keyring|pocket square|cufflink|brooch|headband|umbrella|phone case|strap|mask|lanyard|accessory/.test(t)) return "Accessory";
  if (/shirt|t-shirt|tee|polo|top|blouse|tank|camisole|bodysuit|tunic|henley|vest/.test(t)) return "Top";
  return null;
}

function SlotTile({
  slot,
  onClickEmpty,
}: {
  slot: CapsuleSlot;
  onClickEmpty?: () => void;
}) {
  const node = slot.product;
  const img = node?.images?.edges?.[0]?.node;
  const filled = Boolean(node);

  const baseClass = cn(
    "relative flex flex-col overflow-hidden rounded-md border bg-card text-card-foreground",
    "transition-colors",
    filled ? "border-border" : "border-dashed border-border/60 hover:border-foreground/60 cursor-pointer",
  );
  const tileStyle: React.CSSProperties = {
    contain: "layout style",
    aspectRatio: "3 / 4",
  };
  const innerLabel = `${slot.kind} slot${filled ? "" : " — empty, click to add"}`;

  const content = (
    <>
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
            + {slot.kind}
          </span>
        </div>
      )}
      <div className="absolute left-2 top-2 rounded-sm bg-background/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-foreground/80 backdrop-blur">
        {slot.kind}
      </div>
    </>
  );

  if (!filled) {
    return (
      <button
        type="button"
        onClick={onClickEmpty}
        className={baseClass}
        style={tileStyle}
        aria-label={innerLabel}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={baseClass} style={tileStyle} aria-label={innerLabel}>
      {content}
    </div>
  );
}

export function CapsuleBuilder({
  seedProduct,
  seedVariantId = null,
  seedKind = "Top",
  candidatePool = [],
  className,
}: CapsuleBuilderProps) {
  const [slots, setSlots] = React.useState<CapsuleSlot[]>(() =>
    SLOT_ORDER.map((kind) =>
      kind === seedKind
        ? { kind, product: seedProduct, variantId: seedVariantId }
        : { kind, product: null, variantId: null },
    ),
  );

  // Re-seed if the host swaps products (PDP route change).
  React.useEffect(() => {
    setSlots(
      SLOT_ORDER.map((kind) =>
        kind === seedKind
          ? { kind, product: seedProduct, variantId: seedVariantId }
          : { kind, product: null, variantId: null },
      ),
    );
  }, [seedProduct, seedVariantId, seedKind]);

  const [openKind, setOpenKind] = React.useState<CapsuleSlotKind | null>(null);

  // Exclude products already used in any slot (incl. seed) from the picker.
  const usedHandles = React.useMemo(
    () => new Set(slots.map((s) => s.product?.handle).filter(Boolean) as string[]),
    [slots],
  );

  const filteredForOpen = React.useMemo(() => {
    if (!openKind) return [];
    const pool = candidatePool.filter((p) => !usedHandles.has(p.handle));
    const matches = pool.filter((p) => classifyKind(p.productType) === openKind);
    // Per spec: if no direct matches, fall back to the full curated edit.
    return matches.length > 0 ? matches : pool;
  }, [openKind, candidatePool, usedHandles]);

  const handleSelect = React.useCallback(
    (product: ShopifyProductNode) => {
      const variantId =
        product.variants?.edges?.find((e) => e.node.availableForSale)?.node.id ??
        product.variants?.edges?.[0]?.node.id ??
        null;
      setSlots((prev) =>
        prev.map((s) =>
          s.kind === openKind ? { ...s, product, variantId } : s,
        ),
      );
      setOpenKind(null);
    },
    [openKind],
  );

  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const isLoading = useCartStore((s) => s.isLoading);
  const [isBundling, setIsBundling] = React.useState(false);

  const onPurchaseLook = React.useCallback(async () => {
    if (isBundling) return;
    // Collect filled slots only — empty slots are ignored.
    const filled = slots.filter(
      (s): s is CapsuleSlot & { product: ShopifyProductNode; variantId: string } =>
        Boolean(s.product) && Boolean(s.variantId),
    );
    if (filled.length === 0) return;

    // De-dupe by variantId so a single accidental repeat doesn't stack lines.
    const seen = new Set<string>();
    const unique = filled.filter((s) => {
      if (seen.has(s.variantId)) return false;
      seen.add(s.variantId);
      return true;
    });

    setIsBundling(true);
    try {
      // Sequential adds — the cart store creates the cart on the first call
      // and appends on subsequent calls. Parallel would race the cartId.
      for (const slot of unique) {
        const product = slot.product;
        const variantEdge =
          product.variants?.edges?.find((e) => e.node.id === slot.variantId) ??
          product.variants?.edges?.find((e) => e.node.availableForSale) ??
          product.variants?.edges?.[0];
        const variantNode = variantEdge?.node;
        if (!variantNode) continue;
        await addItem({
          product: { node: product },
          variantId: slot.variantId,
          variantTitle: variantNode.title ?? "",
          price: variantNode.price,
          quantity: 1,
          selectedOptions: variantNode.selectedOptions ?? [],
        });
      }
      openDrawer();
    } finally {
      setIsBundling(false);
    }
  }, [slots, addItem, openDrawer, isBundling]);

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
          <SlotTile
            key={slot.kind}
            slot={slot}
            onClickEmpty={() => setOpenKind(slot.kind)}
          />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 sm:mt-6">
        <p className="text-xs text-muted-foreground">
          Curate up to five pieces. Editorial preview only.
        </p>
        <button
          type="button"
          onClick={onPurchaseLook}
          disabled={isBundling || isLoading || slots.every((s) => !s.variantId)}
          className="inline-flex items-center justify-center rounded-sm border border-foreground/80 bg-foreground px-4 py-2 text-xs uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBundling ? "Bundling…" : "Purchase This Look"}
        </button>
      </div>

      <Sheet open={openKind !== null} onOpenChange={(o) => !o && setOpenKind(null)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md flex flex-col"
          style={{ contain: "layout style" }}
        >
          <SheetHeader className="text-left">
            <SheetTitle className="font-serif text-xl">
              Select {openKind}
            </SheetTitle>
            <SheetDescription className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Curated from your edit
            </SheetDescription>
          </SheetHeader>

          <div
            className="mt-4 flex-1 overflow-y-auto pr-1"
            style={{ contain: "layout style" }}
          >
            {filteredForOpen.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No companion pieces available for this slot.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-3">
                {filteredForOpen.map((p) => {
                  const thumb = p.images?.edges?.[0]?.node;
                  return (
                    <li key={p.handle}>
                      <button
                        type="button"
                        onClick={() => handleSelect(p)}
                        className="group flex w-full items-center gap-3 rounded-md border border-border bg-card p-2 text-left transition-colors hover:border-foreground/60"
                      >
                        <div
                          className="relative shrink-0 overflow-hidden rounded-sm bg-muted"
                          style={{ width: 72, height: 96, contain: "layout style" }}
                        >
                          {thumb ? (
                            <img
                              src={cdnImage(thumb.url, { width: 240, format: "webp" })}
                              alt={buildLuxuryListingAlt({ title: p.title, vendor: p.vendor })}
                              width={72}
                              height={96}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : null}
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                          {p.vendor ? (
                            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                              {p.vendor}
                            </span>
                          ) : null}
                          <span className="line-clamp-2 text-sm font-medium text-foreground">
                            {p.title}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

export default CapsuleBuilder;
