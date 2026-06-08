/**
 * Vault Gate store — drives the "Initializing Secure Allocation" overlay.
 *
 * This store DOES NOT modify the cart-store, cart mutations, or the checkout
 * URL. It only manages the pre-cart email-capture overlay state and resolves
 * a queued promise so each Add-to-Cart call site can await user unlock.
 *
 * Usage from any addItem call site:
 *   import { ensureVaultUnlocked } from "@/lib/vault-gate";
 *   if (!(await ensureVaultUnlocked())) return;
 *   const added = await addItem({ ... });
 */
import { create } from "zustand";

export type VaultGateState = {
  open: boolean;
  /** Optional product label rendered inside the overlay (e.g. "Cucinelli Slide"). */
  label: string | null;
  /** Pending resolver awaiting user action (unlock or cancel). */
  pending: ((unlocked: boolean) => void) | null;
  /** Open the overlay and return a promise that resolves to true once unlocked. */
  requestUnlock: (label?: string | null) => Promise<boolean>;
  /** Called by the overlay when a valid email has been saved. */
  confirmUnlock: () => void;
  /** Called when the user dismisses the overlay without unlocking. */
  cancel: () => void;
};

export const useVaultGateStore = create<VaultGateState>((set, get) => ({
  open: false,
  label: null,
  pending: null,
  requestUnlock: (label = null) => {
    // If a previous request is still pending, resolve it as cancelled before
    // overwriting so no caller is left hanging.
    const prev = get().pending;
    if (prev) prev(false);
    return new Promise<boolean>((resolve) => {
      set({ open: true, label, pending: resolve });
    });
  },
  confirmUnlock: () => {
    const resolve = get().pending;
    set({ open: false, pending: null, label: null });
    if (resolve) resolve(true);
  },
  cancel: () => {
    const resolve = get().pending;
    set({ open: false, pending: null, label: null });
    if (resolve) resolve(false);
  },
}));
