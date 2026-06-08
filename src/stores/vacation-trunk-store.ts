/**
 * Vacation Trunk store — drives the slide-out "Digital Packing Trunk" overlay.
 *
 * Purely presentational. Does not touch cart-store, checkout URL, or
 * Shopify mutations. Items are an in-memory itinerary the user is curating
 * before handing off their email + departure date to the Vacation Stylist.
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
};

export type VacationTrunkState = {
  open: boolean;
  items: TrunkItem[];
  openTrunk: (item?: TrunkItem) => void;
  closeTrunk: () => void;
  addItem: (item: TrunkItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

export const useVacationTrunkStore = create<VacationTrunkState>((set, get) => ({
  open: false,
  items: [],
  openTrunk: (item) => {
    if (item) {
      const existing = get().items.find((i) => i.id === item.id);
      const items = existing ? get().items : [...get().items, item];
      set({ open: true, items });
    } else {
      set({ open: true });
    }
  },
  closeTrunk: () => set({ open: false }),
  addItem: (item) => {
    if (get().items.some((i) => i.id === item.id)) return;
    set({ items: [...get().items, item] });
  },
  removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  clear: () => set({ items: [] }),
}));
