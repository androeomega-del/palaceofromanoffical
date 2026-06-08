/**
 * Pre-cart Vault gate helper.
 *
 * Returns true immediately if the visitor's email is already saved to the
 * persistent abandoned-cart store (returning shoppers don't see the overlay
 * twice). Otherwise opens the Vault Locker overlay and resolves once they
 * either unlock with a valid email or dismiss the dialog.
 *
 * Does NOT touch cart-store, cart mutations, or the checkout URL.
 */
import { getCustomerEmail } from "@/lib/abandoned-cart-capture";
import { useVaultGateStore } from "@/stores/vault-gate-store";

export async function ensureVaultUnlocked(
  options?: { label?: string | null; lowStock?: boolean } | string | null,
): Promise<boolean> {
  if (typeof window === "undefined") return true; // SSR / non-interactive
  const existing = getCustomerEmail();
  if (existing && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(existing)) return true;
  return useVaultGateStore.getState().requestUnlock(options ?? null);
}
