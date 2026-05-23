import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface LocationStore {
  zip: string | null;
  /** True when the zip was set silently from IP geo, not by the shopper. */
  autoDetected: boolean;
  setZip: (zip: string, opts?: { auto?: boolean }) => void;
  clear: () => void;
}

/**
 * Shopper's saved US zip code — used to render delivery ETAs in the header
 * and on PDPs. Persisted to localStorage so it follows the shopper across
 * pages and sessions. Country is currently US-only (matches the zip-based
 * UI); other markets continue to use the inferred locale flow.
 */
export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      zip: null,
      autoDetected: false,
      setZip: (zip, opts) =>
        set({ zip: zip.trim().slice(0, 5), autoDetected: opts?.auto === true }),
      clear: () => set({ zip: null, autoDetected: false }),
    }),
    {
      name: "por-location-v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Validate a 5-digit US zip code. */
export function isValidUsZip(zip: string): boolean {
  return /^\d{5}$/.test(zip.trim());
}

/**
 * Ephemeral popover-open signal — lets any component on the page (e.g. the
 * PDP delivery badge) ask the header's `DeliverToButton` to open. Not
 * persisted.
 */
interface LocationPopoverStore {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useLocationPopover = create<LocationPopoverStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
