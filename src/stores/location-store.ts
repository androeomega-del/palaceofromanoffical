import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface LocationStore {
  zip: string | null;
  setZip: (zip: string) => void;
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
      setZip: (zip) => set({ zip: zip.trim().slice(0, 5) }),
      clear: () => set({ zip: null }),
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
