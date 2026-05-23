// Server-fn wrapper around `fetchShopifyMenuRaw` with a 10-minute in-memory
// cache. Runs server-side so the recursive 3-level Storefront query isn't
// billed against the browser's quota and so the cache is shared across
// every visitor on the same edge instance.

import { createServerFn } from "@tanstack/react-start";
import { fetchShopifyMenuRaw, type ShopifyMenuTree } from "@/lib/shopify-menu";

const CACHE_TTL_MS = 10 * 60 * 1000;

type CacheEntry = { tree: ShopifyMenuTree | null; expiresAt: number };
const cache = new Map<string, CacheEntry>();

export type MenuSource = {
  tree: ShopifyMenuTree | null;
  /** Why the tree is null when it is — useful for the fallback selector. */
  reason: "ok" | "empty-or-denied";
};

export const getShopifyMenu = createServerFn({ method: "GET" }).handler(
  async (): Promise<MenuSource> => {
    const handle = "main-menu";
    const now = Date.now();
    const cached = cache.get(handle);
    if (cached && cached.expiresAt > now) {
      return {
        tree: cached.tree,
        reason: cached.tree ? "ok" : "empty-or-denied",
      };
    }

    const tree = await fetchShopifyMenuRaw(handle);
    cache.set(handle, { tree, expiresAt: now + CACHE_TTL_MS });

    if (tree) {
      console.info(
        `[menu-source] using shopify tree (${tree.items.length} top-level items)`,
      );
    } else {
      console.info("[menu-source] falling back to live-built tree");
    }

    return { tree, reason: tree ? "ok" : "empty-or-denied" };
  },
);
