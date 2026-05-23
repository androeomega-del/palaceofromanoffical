import { ShippingMeta } from "@/components/shipping-meta";

type Props = {
  vendor: string | null | undefined;
  handle?: string | null;
  /** Deprecated — kept for backwards compatibility. The unified component
   *  always opens the header popover via the shared location-popover store. */
  onSetLocation?: () => void;
};

/**
 * Thin wrapper that delegates to {@link ShippingMeta} so the PDP and every
 * product card render the same "Ships from … · Get it by …" block with
 * identical placement, icon, and typography.
 */
export function PdpDeliveryBadge({ vendor, handle }: Props) {
  return <ShippingMeta vendor={vendor} handle={handle} variant="pdp" />;
}
