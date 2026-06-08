/**
 * Vault Gate store — drives the "Initializing Secure Allocation" overlay.
 *
 * This store DOES NOT modify the cart-store, cart mutations, or the checkout
 * URL. It only manages the pre-cart email-capture overlay state and resolves
 * a queued promise so each Add-to-Cart call site can await user unlock.
 */
import { create } from "zustand";

export type VaultGateOptions = {
  /** Optional product label rendered inside the overlay (e.g. "Cucinelli Slide"). */
  label?: string | null;
  /**
   * If true, the overlay shows the "Competing Allocation" notice above the
   * email input — used when stock count is 1 or another live client is on
   * the checkout screen for the same SKU.
   */
  lowStock?: boolean;
};

export type VaultGateState = {
  open: boolean;
  label: string | null;
  lowStock: boolean;
  pending: ((unlocked: boolean) => void) | null;
  requestUnlock: (
    options?: VaultGateOptions | string | null,
  ) => Promise<boolean>;
  confirmUnlock: () => void;
  cancel: () => void;
};

export const useVaultGateStore = create<VaultGateState>((set, get) => ({
  open: false,
  label: null,
  lowStock: false,
  pending: null,
  requestUnlock: (options) => {
    // Backward-compat: callers may still pass a plain string label.
    const opts: VaultGateOptions =
      typeof options === "string" || options === null || options === undefined
        ? { label: (options as string | null) ?? null }
        : options;

    const prev = get().pending;
    if (prev) prev(false);
    return new Promise<boolean>((resolve) => {
      set({
        open: true,
        label: opts.label ?? null,
        lowStock: !!opts.lowStock,
        pending: resolve,
      });
    });
  },
  confirmUnlock: () => {
    const resolve = get().pending;
    set({ open: false, pending: null, label: null, lowStock: false });
    if (resolve) resolve(true);
  },
  cancel: () => {
    const resolve = get().pending;
    set({ open: false, pending: null, label: null, lowStock: false });
    if (resolve) resolve(false);
  },
}));
