import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Default zip used when IP geolocation fails, the shopper is outside the US,
 * or detection hasn't run yet. NYC (10001) is chosen because it produces a
 * representative US delivery window (East Coast routing into JFK/EWR).
 * Flagged as `autoDetected` so the UI shows the "Not you? Change" hint.
 */
export const DEFAULT_ZIP = "10001";

interface LocationStore {
  zip: string | null;
  /** True when the zip was set silently (IP geo or default), not by the shopper. */
  autoDetected: boolean;
  setZip: (zip: string, opts?: { auto?: boolean }) => void;
  clear: () => void;
}

/**
 * Shopper's saved US zip code — used to render delivery ETAs in the header,
 * on product cards, and on PDPs. Persisted to localStorage so it follows
 * the shopper across pages and sessions.
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
 * Effective zip for delivery calculations — always returns a value so the
 * UI never breaks. Returns the saved zip if present, otherwise the global
 * {@link DEFAULT_ZIP}. Use this in any component that renders a delivery
 * date; use the raw `zip` field only when you need to distinguish between
 * "user set" vs "fallback".
 */
export function useEffectiveZip(): string {
  const zip = useLocationStore((s) => s.zip);
  return zip ?? DEFAULT_ZIP;
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
