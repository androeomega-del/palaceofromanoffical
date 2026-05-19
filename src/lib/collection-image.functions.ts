// Public read for the handle → image URL map populated by the nightly sync.
// Used as the dynamic layer on top of `collectionImage()`'s static fallback.
//
// We expose two shapes:
//  - `getCollectionImageMap`     → `{ [handle]: url }`           (legacy callers)
//  - `getCollectionImageMetaMap` → `{ [handle]: { url, width, height } }`
//    used by the focal-point fallback so we can pick `object-position` from
//    the stored Shopify image orientation when a handle isn't hand-mapped.
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface CollectionImageMeta {
  url: string;
  width: number | null;
  height: number | null;
}

export const getCollectionImageMap = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<string, string>> => {
    const { data, error } = await supabaseAdmin
      .from("collection_images")
      .select("handle, image_url");
    if (error || !data) return {};
    const map: Record<string, string> = {};
    for (const row of data) {
      if (row.handle && row.image_url) map[row.handle] = row.image_url;
    }
    return map;
  }
);

export const getCollectionImageMetaMap = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<string, CollectionImageMeta>> => {
    const { data, error } = await supabaseAdmin
      .from("collection_images")
      .select("handle, image_url, width, height");
    if (error || !data) return {};
    const map: Record<string, CollectionImageMeta> = {};
    for (const row of data) {
      if (row.handle && row.image_url) {
        map[row.handle] = {
          url: row.image_url,
          width: row.width ?? null,
          height: row.height ?? null,
        };
      }
    }
    return map;
  }
);
