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
import { toast } from "sonner";
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
import { useServerFn } from "@tanstack/react-start";
import { shareCapsuleLookbook } from "@/lib/capsule-lookbook.functions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

/**
 * Strict Category Taxonomy Map.
 * Each slot defines an explicit list of keyword variations that may appear in
 * a Shopify product's `productType` or any `tags` entry. Matching is
 * case-insensitive, whole-word-ish (word-boundary based) to avoid bleed
 * (e.g. "Tank Top" must not match "Pants").
 *
 * Resolution is single-slot: a product is classified into exactly one slot,
 * evaluated in priority order so footwear/accessories/outerwear cannot leak
 * into Bottom/Top drawers.
 */
const CAPSULE_TAXONOMY: Record<CapsuleSlotKind, string[]> = {
  Footwear: [
    "Sneakers", "Loafers", "Sandals", "Oxfords and Derbies", "Oxfords",
    "Derbies", "Flats", "Pumps", "Slides", "Espadrilles", "Boots", "Shoes",
    "Heels", "Mules", "Clogs",
  ],
  Accessory: [
    "Accessories", "Accessory", "Bags", "Bag", "Handbags", "Crossbody Bags",
    "Tote Bags", "Backpacks", "Shoulder Bags", "Clutch Bags", "Belt Bags",
    "Briefcases", "Belts", "Wallets", "Jewellery", "Jewelry", "Scarves",
    "Hats", "Sunglasses", "Ties", "Keychains", "Gloves", "Watches",
    "Card Holders",
  ],
  Outerwear: [
    "Outerwear", "Jackets", "Jacket", "Coats", "Coat", "Blazers", "Blazer",
    "Trench", "Shearling", "Parkas", "Parka", "Bombers", "Bomber",
    "Overcoats", "Overcoat", "Capes", "Cape", "Puffer", "Puffers",
    "Vest", "Vests", "Gilet", "Gilets", "Anorak", "Windbreaker",
    "Down Jacket", "Quilted",
  ],

  Bottom: [
    "Bottoms", "Bottom", "Pants", "Trousers", "Shorts", "Short", "Skirts",
    "Skirt", "Denim", "Jeans", "Jeans Denim", "Bermuda", "Cargo",
    "Cargo Pants", "Joggers", "Chinos", "Leggings", "Sweatpants", "Culottes",
  ],
  Top: [
    "Shirts", "Shirt", "T-Shirts", "T-Shirt", "Tee", "Tees", "Tops", "Top",
    "Blouses", "Blouse", "Knitwear", "Sweaters", "Sweater", "Cardigans",
    "Cardigan", "Polos", "Polo", "Suits", "Dresses", "Sportswear",
    "Underwear", "Tank", "Camisole", "Bodysuit", "Henley", "Vest", "Tunic",
  ],
};

/**
 * Resolution priority — first slot whose keyword set matches wins. This
 * guarantees a Footwear/Accessory item never appears in a Bottom or Top
 * drawer, even if it carries overlapping brand/material tags.
 */
const TAXONOMY_PRIORITY: CapsuleSlotKind[] = [
  "Footwear",
  "Accessory",
  "Outerwear",
  "Bottom",
  "Top",
];

/** Escape a keyword for safe inclusion in a RegExp. */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Pre-compile one word-boundary, case-insensitive RegExp per slot. */
const TAXONOMY_RE: Record<CapsuleSlotKind, RegExp> = Object.fromEntries(
  (Object.keys(CAPSULE_TAXONOMY) as CapsuleSlotKind[]).map((k) => [
    k,
    new RegExp(`\\b(?:${CAPSULE_TAXONOMY[k].map(escapeRe).join("|")})\\b`, "i"),
  ]),
) as Record<CapsuleSlotKind, RegExp>;

/**
 * Outerwear sub-taxonomy — the Outerwear slot is sub-grouped in the picker
 * into four editorial buckets so shoppers can find the right weight quickly.
 * Order = display order. Resolution is priority-first (most specific wins),
 * with "Lightweight & Mid-Layers" as the catch-all default.
 */
export type OuterwearSubKind =
  | "Lightweight & Mid-Layers"
  | "Insulated & Puffy Jackets"
  | "Heavy Coats"
  | "Vest";

const OUTERWEAR_SUBTAXONOMY: Record<OuterwearSubKind, string[]> = {
  "Vest": ["Vest", "Vests", "Gilet", "Gilets"],
  "Insulated & Puffy Jackets": [
    "Puffer", "Puffers", "Down", "Quilted", "Padded", "Shearling",
    "Insulated", "Parka", "Parkas",
  ],
  "Heavy Coats": [
    "Overcoat", "Overcoats", "Coat", "Coats", "Trench", "Wool Coat",
    "Cashmere Coat", "Cape", "Capes", "Peacoat",
  ],
  "Lightweight & Mid-Layers": [
    "Blazer", "Blazers", "Bomber", "Bombers", "Jacket", "Jackets",
    "Anorak", "Windbreaker", "Cardigan", "Overshirt", "Shacket",
    "Track Jacket", "Harrington",
  ],
};

const OUTERWEAR_SUB_PRIORITY: OuterwearSubKind[] = [
  "Vest",
  "Insulated & Puffy Jackets",
  "Heavy Coats",
  "Lightweight & Mid-Layers",
];

const OUTERWEAR_SUB_RE: Record<OuterwearSubKind, RegExp> = Object.fromEntries(
  OUTERWEAR_SUB_PRIORITY.map((k) => [
    k,
    new RegExp(`\\b(?:${OUTERWEAR_SUBTAXONOMY[k].map(escapeRe).join("|")})\\b`, "i"),
  ]),
) as Record<OuterwearSubKind, RegExp>;

function classifyOuterwearSub(
  productType: string | undefined | null,
  tags?: string[] | null,
  title?: string | null,
  handle?: string | null,
): OuterwearSubKind {
  const haystack = [
    productType ?? "",
    ...(Array.isArray(tags) ? tags : []),
    title ?? "",
    (handle ?? "").replace(/-/g, " "),
  ].join(" | ");
  for (const k of OUTERWEAR_SUB_PRIORITY) {
    if (OUTERWEAR_SUB_RE[k].test(haystack)) return k;
  }
  return "Lightweight & Mid-Layers";
}

/**
 * Classify a product into a single CapsuleSlotKind using productType, tags,
 * and title. Title is included because Shopify `productType` is frequently
 * empty on imported catalogs, but titles almost always carry the category
 * word (e.g. "Loafers", "Belt", "Sunglasses"). Without this fallback the
 * picker shows "No companion pieces available for this slot."
 * Returns null when no taxonomy matches.
 */
function classifyKind(
  productType: string | undefined | null,
  tags?: string[] | null,
  title?: string | null,
  handle?: string | null,
): CapsuleSlotKind | null {
  const haystack = [
    productType ?? "",
    ...(Array.isArray(tags) ? tags : []),
    title ?? "",
    // Handles often carry the category word even when titles are abstract
    // luxury names (e.g. "gucci-horsebit-1955-loafer"). Hyphens are
    // normalised to spaces so word-boundary regexes match cleanly.
    (handle ?? "").replace(/-/g, " "),
  ].join(" | ");
  if (!haystack.trim()) return null;
  for (const kind of TAXONOMY_PRIORITY) {
    if (TAXONOMY_RE[kind].test(haystack)) return kind;
  }
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

  // Strict, taxonomy-driven filter. Each product is classified into exactly
  // one slot via CAPSULE_TAXONOMY (priority-resolved), so Footwear /
  // Accessory / Outerwear items cannot bleed into Bottom or Top drawers —
  // and vice versa — regardless of overlapping brand, material, or color tags.
  const filteredForOpen = React.useMemo(() => {
    if (!openKind) return [];
    const pool = candidatePool.filter((p) => !usedHandles.has(p.handle));
    return pool.filter((p) => {
      const tags = (p as unknown as { tags?: string[] }).tags;
      return classifyKind(p.productType, tags, p.title, p.handle) === openKind;
    });
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

  // Share-lookbook gating: inline form state. No effect on cart store.
  const [shareOpen, setShareOpen] = React.useState(false);
  const [shareEmail, setShareEmail] = React.useState("");
  const [shareStatus, setShareStatus] = React.useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const shareSentForRef = React.useRef<string | null>(null);
  const shareDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const dispatchShare = useServerFn(shareCapsuleLookbook);

  const fireShare = React.useCallback(
    async (email: string) => {
      const filled = slots.filter(
        (s): s is CapsuleSlot & { product: ShopifyProductNode; variantId: string } =>
          Boolean(s.product) && Boolean(s.variantId),
      );
      if (filled.length === 0) return;
      const signature = `${email}::${filled.map((f) => f.variantId).join("|")}`;
      if (shareSentForRef.current === signature) return;
      shareSentForRef.current = signature;
      setShareStatus("sending");
      try {
        const pieces = filled.map((s) => {
          const variantEdge = s.product.variants?.edges?.find(
            (e) => e.node.id === s.variantId,
          );
          const priceAmount = variantEdge?.node.price?.amount ?? null;
          return {
            variantId: s.variantId,
            productHandle: s.product.handle,
            title: s.product.title,
            vendor: s.product.vendor ?? null,
            imageUrl: s.product.images?.edges?.[0]?.node?.url ?? null,
            priceUsd: priceAmount != null ? String(priceAmount) : null,
            slotKind: s.kind,
          };
        });
        await dispatchShare({ data: { email, pieces } });
        setShareStatus("sent");
        toast.success("Lookbook dispatched to your inbox");
      } catch (err) {
        console.error("[capsule-share] dispatch failed", err);
        shareSentForRef.current = null;
        setShareStatus("error");
      }
    },
    [slots, dispatchShare],
  );

  const handleShareEmail = React.useCallback(
    (value: string) => {
      setShareEmail(value);
      setShareStatus("idle");
      if (shareDebounceRef.current) clearTimeout(shareDebounceRef.current);
      const trimmed = value.trim();
      if (!EMAIL_RE.test(trimmed)) return;
      shareDebounceRef.current = setTimeout(() => {
        void fireShare(trimmed.toLowerCase());
      }, 450);
    },
    [fireShare],
  );

  React.useEffect(() => {
    return () => {
      if (shareDebounceRef.current) clearTimeout(shareDebounceRef.current);
    };
  }, []);


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
      toast.success(`${unique.length} item${unique.length === 1 ? "" : "s"} added to your bag`);
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

      <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Curate up to five pieces. Editorial preview only.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <button
            type="button"
            onClick={() => setShareOpen((o) => !o)}
            disabled={slots.every((s) => !s.variantId)}
            className="inline-flex items-center justify-center rounded-sm border border-[color:var(--color-bronze,#7a6a55)] bg-transparent px-4 py-2 text-xs uppercase tracking-[0.28em] text-[color:var(--color-ink,#1a1a1a)] transition-colors hover:bg-[color:var(--color-bronze,#7a6a55)]/10 disabled:cursor-not-allowed disabled:opacity-50"
            aria-expanded={shareOpen}
            aria-controls="capsule-share-archive"
          >
            Share Lookbook
          </button>
          <button
            type="button"
            onClick={onPurchaseLook}
            disabled={isBundling || isLoading || slots.every((s) => !s.variantId)}
            className="inline-flex items-center justify-center rounded-sm border border-foreground/80 bg-foreground px-4 py-2 text-xs uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBundling ? "Bundling…" : "Purchase This Look"}
          </button>
        </div>
      </div>

      <div
        id="capsule-share-archive"
        style={{ contain: "layout", minHeight: shareOpen ? 220 : 0 }}
        aria-hidden={!shareOpen}
      >
        {shareOpen ? (
          <div className="mt-5 rounded-md border border-[color:var(--color-bronze,#7a6a55)]/30 bg-background/80 p-5 transition-opacity duration-300">
            <div className="mb-2 text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-bronze,#7a6a55)]">
              Digital Atelier Archive
            </div>
            <p className="mb-4 max-w-prose text-sm leading-relaxed text-[color:var(--color-ink,#1a1a1a)]/80">
              Enter your email to instantly receive a high-fidelity digital lookbook
              of this custom capsule, complete with direct private checkout access.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <label className="sr-only" htmlFor="capsule-share-email">
                Email
              </label>
              <input
                id="capsule-share-email"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@atelier.com"
                value={shareEmail}
                onChange={(e) => handleShareEmail(e.target.value)}
                onInput={(e) => handleShareEmail((e.target as HTMLInputElement).value)}
                className="flex-1 rounded-sm border border-[color:var(--color-ink,#1a1a1a)]/30 bg-transparent px-3 py-2 text-sm tracking-wide text-[color:var(--color-ink,#1a1a1a)] placeholder:text-[color:var(--color-ink,#1a1a1a)]/40 focus:border-[color:var(--color-bronze,#7a6a55)] focus:outline-none"
                disabled={shareStatus === "sending" || shareStatus === "sent"}
              />
              <span
                className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--color-bronze,#7a6a55)]"
                aria-live="polite"
              >
                {shareStatus === "sending" && "Curating…"}
                {shareStatus === "sent" && "Archive dispatched"}
                {shareStatus === "error" && "Please try again"}
                {shareStatus === "idle" && "Auto-saved on entry"}
              </span>
            </form>
            <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--color-ink,#1a1a1a)]/55">
              Your curation data is handled with absolute discretion. Palace of Roman
              secures your priority access parameters without third-party data tracking.
            </p>
          </div>
        ) : null}
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
              (() => {
                // Group outerwear into sub-sections; flat list for others.
                const isOuterwear = openKind === "Outerwear";
                const groups: Array<{ label: string; items: typeof filteredForOpen }> =
                  isOuterwear
                    ? OUTERWEAR_SUB_PRIORITY
                        .slice()
                        .reverse() // display order: Lightweight first
                        .map((sub) => ({
                          label: sub,
                          items: filteredForOpen.filter((p) => {
                            const tags = (p as unknown as { tags?: string[] }).tags;
                            return classifyOuterwearSub(p.productType, tags, p.title, p.handle) === sub;
                          }),
                        }))
                        .filter((g) => g.items.length > 0)
                    : [{ label: "", items: filteredForOpen }];

                const renderTile = (p: typeof filteredForOpen[number]) => {
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
                };

                return (
                  <div className="space-y-6">
                    {groups.map((g) => (
                      <div key={g.label || "all"}>
                        {g.label ? (
                          <h3 className="mb-2 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                            {g.label}
                            <span className="ml-2 text-foreground/40">· {g.items.length}</span>
                          </h3>
                        ) : null}
                        <ul className="grid grid-cols-1 gap-3">
                          {g.items.map(renderTile)}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

export default CapsuleBuilder;
