/**
 * Concierge open-state store.
 *
 * The <ConciergeWidget/> at the app root subscribes to `open` and renders
 * its drawer accordingly. Any surface (header utility link, hero CTA,
 * concierge band) can `setOpen(true)` to invoke it.
 */
import { create } from "zustand";

type ConciergeState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useConciergeStore = create<ConciergeState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
