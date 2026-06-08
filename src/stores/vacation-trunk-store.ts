/**
 * Vacation Trunk store — drives the slide-out "Digital Packing Trunk" overlay.
 *
 * Purely presentational. Does not touch cart-store, checkout URL, or
 * Shopify mutations.
 */
import { create } from "zustand";

export type TrunkItem = {
  id: string;
  handle?: string | null;
  title: string;
  vendor?: string | null;
  imageUrl?: string | null;
  priceLabel?: string | null;
  variantTitle?: string | null;
  /**
   * Flipped to true when the catalog reports this variant as 0-stock while
   * still inside the 14-day pre-departure window. Drives the "Request
   * Archival Piece Substitution" UI.
   */
  outOfStock?: boolean;
};

export type VacationTrunkState = {
  open: boolean;
  items: TrunkItem[];
  /** Shows the "Competing Allocation" notice above the email input. */
  lowStock: boolean;
  openTrunk: (item?: TrunkItem, opts?: { lowStock?: boolean }) => void;
  closeTrunk: () => void;
  addItem: (item: TrunkItem) => void;
  removeItem: (id: string) => void;
  markOutOfStock: (id: string, value?: boolean) => void;
  clear: () => void;
};

export const useVacationTrunkStore = create<VacationTrunkState>((set, get) => ({
  open: false,
  items: [],
  lowStock: false,
  openTrunk: (item, opts) => {
    const lowStock = !!opts?.lowStock;
    if (item) {
      const existing = get().items.find((i) => i.id === item.id);
      const items = existing
        ? get().items.map((i) => (i.id === item.id ? { ...i, ...item } : i))
        : [...get().items, item];
      set({ open: true, items, lowStock });
    } else {
      set({ open: true, lowStock });
    }
  },
  closeTrunk: () => set({ open: false, lowStock: false }),
  addItem: (item) => {
    if (get().items.some((i) => i.id === item.id)) return;
    set({ items: [...get().items, item] });
  },
  removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  markOutOfStock: (id, value = true) =>
    set({
      items: get().items.map((i) =>
        i.id === id ? { ...i, outOfStock: value } : i,
      ),
    }),
  clear: () => set({ items: [], lowStock: false }),
}));
