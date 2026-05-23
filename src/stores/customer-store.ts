// Customer access token store — Phase 2, Sprint 2.
//
// Stores ONLY the Shopify Storefront access token + expiry in localStorage.
// Never persists password or PII. Auto-expires when the token's expiresAt
// has passed. Sign-out best-effort revokes the token server-side, then
// clears local state either way.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { customerAccessTokenDelete, type AccessToken } from "@/lib/shopify-customer";

interface CustomerStore {
  accessToken: string | null;
  expiresAt: string | null;
  setToken: (token: AccessToken) => void;
  /** Returns the access token only if still valid; clears it if expired. */
  getValidToken: () => string | null;
  signOut: () => Promise<void>;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      expiresAt: null,
      setToken: ({ accessToken, expiresAt }) =>
        set({ accessToken, expiresAt }),
      getValidToken: () => {
        const { accessToken, expiresAt } = get();
        if (!accessToken || !expiresAt) return null;
        if (Date.now() >= new Date(expiresAt).getTime()) {
          set({ accessToken: null, expiresAt: null });
          return null;
        }
        return accessToken;
      },
      signOut: async () => {
        const { accessToken } = get();
        if (accessToken) {
          await customerAccessTokenDelete(accessToken);
        }
        set({ accessToken: null, expiresAt: null });
      },
    }),
    {
      name: "por-customer-token-v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? ({
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
              clear: () => undefined,
              key: () => null,
              length: 0,
            } as unknown as Storage)
          : localStorage,
      ),
    },
  ),
);
