import { enqueueInteractionEvent } from "@/lib/interaction-flush";

/**
 * Capsule interaction analytics.
 *
 * Mirrors capsule UI events into the append-only `interaction_events`
 * table so we can measure mistrust-causing flows (mis-categorized seeds,
 * orphan removes, sticky slots, abandoned bundles) and tie them to
 * conversion downstream.
 *
 * All calls are fire-and-forget — never block UX, never throw.
 */

export type CapsuleSlotKindLower =
  | "top"
  | "bottom"
  | "footwear"
  | "outerwear"
  | "accessory";

export type CapsuleEvent =
  | "capsule_view"
  | "capsule_open"
  | "capsule_add"
  | "capsule_remove"
  | "capsule_swap"
  | "capsule_mismatch"
  | "capsule_checkout"
  | "capsule_share";

function slotSurface(kind: string | null | undefined): string | undefined {
  if (!kind) return undefined;
  const k = String(kind).toLowerCase().trim();
  if (!/^[a-z0-9-]+$/.test(k)) return undefined;
  return `capsule:${k}`;
}

export function trackCapsuleEvent(input: {
  event: CapsuleEvent;
  handle: string;
  slot?: string | null;
  vendor?: string | null;
  productType?: string | null;
  /** 0-indexed slot index when ordering matters (e.g. slot position). */
  position?: number;
}): void {
  if (!input.handle) return;
  try {
    enqueueInteractionEvent({
      handle: input.handle,
      event_type: input.event,
      vendor: input.vendor ?? undefined,
      productType: input.productType ?? undefined,
      surface: slotSurface(input.slot),
      position: input.position,
    });
  } catch {
    /* never throw from analytics */
  }
}
