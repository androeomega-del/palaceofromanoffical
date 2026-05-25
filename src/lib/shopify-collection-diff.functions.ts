// Step 4 — Auto-include new Shopify collections.
//
// Lists every Shopify collection and flags the ones that are NOT linked
// from the curated `main-menu` (which drives the live megamenu). This is
// pure visibility — admin-only, read-only. No nav surface is changed; the
// operator decides whether each pending collection should be added to the
// menu in Shopify admin.

import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { fetchCollections } from "@/lib/shopify";
import {
  fetchShopifyMenuRaw,
  type ShopifyMenuItem,
} from "@/lib/shopify-menu";

export type PendingCollection = {
  handle: string;
  title: string;
  image_url: string | null;
  updated_at: string;
};

export type ShopifyCollectionDiff = {
  total_collections: number;
  in_menu: number;
  pending: PendingCollection[];
  menu_available: boolean;
  fetched_at: string;
};

function collectMenuHandles(items: ShopifyMenuItem[], acc: Set<string>): void {
  for (const it of items) {
    if (it.link?.kind === "collection") acc.add(it.link.handle);
    if (it.items?.length) collectMenuHandles(it.items, acc);
  }
}

export const getShopifyCollectionDiff = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<ShopifyCollectionDiff> => {
    const [menu, collections] = await Promise.all([
      fetchShopifyMenuRaw("main-menu"),
      fetchCollections(500),
    ]);

    const inMenu = new Set<string>();
    if (menu) collectMenuHandles(menu.items, inMenu);

    const pending: PendingCollection[] = [];
    for (const c of collections) {
      if (inMenu.has(c.handle)) continue;
      pending.push({
        handle: c.handle,
        title: c.title,
        image_url: c.image?.url ?? null,
        updated_at: c.updatedAt ?? new Date().toISOString(),
      });
    }

    // Newest first so freshly created collections surface at the top.
    pending.sort((a, b) =>
      a.updated_at < b.updated_at ? 1 : a.updated_at > b.updated_at ? -1 : 0,
    );

    return {
      total_collections: collections.length,
      in_menu: inMenu.size,
      pending,
      menu_available: !!menu,
      fetched_at: new Date().toISOString(),
    };
  });
