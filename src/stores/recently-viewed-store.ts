import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ViewedItem = {
  handle: string;
  vendor: string;
  productType?: string;
  ts: number;
};

interface RecentlyViewedStore {
  items: ViewedItem[];
  push: (item: Omit<ViewedItem, "ts">) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      items: [],
      push: (item) =>
        set((state) => {
          const filtered = state.items.filter((i) => i.handle !== item.handle);
          return {
            items: [{ ...item, ts: Date.now() }, ...filtered].slice(0, 30),
          };
        }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "por-recently-viewed",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
