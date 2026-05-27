/**
 * Gift-wrap toggle for the cart drawer. Complimentary house service —
 * shoppers can attach a private message that travels with the order.
 * Syncs to the Shopify cart via cart attributes + note so the merchant
 * sees the request on the order without us touching the cart store.
 */
import { Gift } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useGiftWrapStore } from "@/stores/gift-wrap-store";
import { setCartAttributes, setCartNote } from "@/lib/cart-attributes";
import { useCartStore } from "@/stores/cart-store";

export function GiftWrapOption() {
  const enabled = useGiftWrapStore((s) => s.enabled);
  const message = useGiftWrapStore((s) => s.message);
  const setEnabled = useGiftWrapStore((s) => s.setEnabled);
  const setMessage = useGiftWrapStore((s) => s.setMessage);
  const cartId = useCartStore((s) => s.cartId);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && enabled) setOpen(true);
  }, [mounted, enabled]);

  // Debounced sync to Shopify cart attributes + note.
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!mounted || !cartId) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const attrs = enabled
        ? [
            { key: "Gift Wrap", value: "Yes — complimentary house wrap" },
            ...(message.trim() ? [{ key: "Gift Message", value: message.trim() }] : []),
          ]
        : [];
      setCartAttributes(attrs).catch(() => {});
      if (enabled && message.trim()) {
        setCartNote(`Gift wrap requested. Message: ${message.trim()}`).catch(() => {});
      } else if (!enabled) {
        setCartNote("").catch(() => {});
      }
    }, 400);
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [enabled, message, cartId, mounted]);

  if (!mounted) return null;

  return (
    <div className="border-t border-ink/10 px-6 py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left group"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5">
          <Gift className="w-4 h-4 text-bronze" strokeWidth={1.5} />
          <span className="text-[11px] uppercase tracking-[0.25em] font-medium group-hover:text-bronze transition-colors">
            Complimentary Gift Wrap
          </span>
        </span>
        <span className="text-[10px] uppercase tracking-[0.25em] text-ink/50">
          {enabled ? "On" : open ? "Hide" : "Add"}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-bronze cursor-pointer"
            />
            <span className="text-[11px] text-ink/80 leading-relaxed">
              Wrap my order in house gift packaging. No prices on the receipt.
            </span>
          </label>

          {enabled && (
            <div className="space-y-1.5">
              <label
                htmlFor="gift-message"
                className="text-[10px] uppercase tracking-[0.25em] text-ink/60"
              >
                Private message (optional)
              </label>
              <textarea
                id="gift-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="A note for the recipient…"
                rows={2}
                maxLength={240}
                className="w-full border border-ink/15 bg-canvas px-3 py-2 text-xs leading-relaxed focus:outline-none focus:border-bronze resize-none"
              />
              <p className="text-[9px] uppercase tracking-[0.25em] text-ink/40 text-right tabular-nums">
                {message.length}/240
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
