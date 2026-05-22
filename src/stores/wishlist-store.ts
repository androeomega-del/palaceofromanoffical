import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WishlistStore {
  handles: string[];
  has: (handle: string) => boolean;
  toggle: (handle: string) => void;
  add: (handle: string) => void;
  remove: (handle: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      handles: [],
      has: (handle) => get().handles.includes(handle),
      toggle: (handle) =>
        set((state) => ({
          handles: state.handles.includes(handle)
            ? state.handles.filter((h) => h !== handle)
            : [handle, ...state.handles].slice(0, 200),
        })),
      add: (handle) =>
        set((state) =>
          state.handles.includes(handle) ? state : { handles: [handle, ...state.handles] },
        ),
      remove: (handle) =>
        set((state) => ({ handles: state.handles.filter((h) => h !== handle) })),
      clear: () => set({ handles: [] }),
    }),
    {
      name: "por-wishlist",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
