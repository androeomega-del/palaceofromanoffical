/**
 * Capsule Stylist — drawer open-state + seed product context.
 *
 * Lightweight Zustand store (NOT persisted, no localStorage). The drawer
 * is opened from a PDP trigger that passes the current product as the
 * "seed" piece; the drawer pulls complementary catalog products around it
 * via the live Storefront API. Closing the drawer wipes seed context.
 */
import { create } from "zustand";
import type { Money, ShopifyProductNode } from "@/lib/shopify";

export interface CapsuleSeed {
  product: ShopifyProductNode;
  variantId: string;
  variantTitle: string;
  price: Money;
  selectedOptions: Array<{ name: string; value: string }>;
}

interface CapsuleStylistStore {
  isOpen: boolean;
  seed: CapsuleSeed | null;
  open: (seed: CapsuleSeed) => void;
  close: () => void;
}

export const useCapsuleStylistStore = create<CapsuleStylistStore>((set) => ({
  isOpen: false,
  seed: null,
  open: (seed) => set({ isOpen: true, seed }),
  close: () => set({ isOpen: false, seed: null }),
}));
