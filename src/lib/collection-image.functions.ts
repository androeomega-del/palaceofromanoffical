// Public read for the handle → image URL map populated by the nightly sync.
// Used as the dynamic layer on top of `collectionImage()`'s static fallback.
//
// We expose three shapes:
//  - `getCollectionImageMap`     → `{ [handle]: url }`           (legacy callers)
//  - `getCollectionImageMetaMap` → `{ [handle]: { url, width, height, focalX, focalY } }`
//    used by the focal-point fallback so we can pick `object-position` from
//    the stored Shopify image orientation when a handle isn't hand-mapped,
//    and to surface admin-tuned focal overrides.
//  - `getCollectionFocalMap`     → `{ [handle]: "x% y%" }` ready for object-position
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface CollectionImageMeta {
  url: string;
  width: number | null;
  height: number | null;
  focalX: number | null;
  focalY: number | null;
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
      .select("handle, image_url, width, height, focal_x, focal_y");
    if (error || !data) return {};
    const map: Record<string, CollectionImageMeta> = {};
    for (const row of data as Array<{
      handle: string;
      image_url: string;
      width: number | null;
      height: number | null;
      focal_x: number | null;
      focal_y: number | null;
    }>) {
      if (row.handle && row.image_url) {
        map[row.handle] = {
          url: row.image_url,
          width: row.width ?? null,
          height: row.height ?? null,
          focalX: row.focal_x ?? null,
          focalY: row.focal_y ?? null,
        };
      }
    }
    return map;
  }
);

/**
 * Compact handle → CSS `object-position` string map, derived from the
 * focal_x / focal_y overrides saved in the admin focal-point editor.
 * Returns only handles that have a saved override.
 */
export const getCollectionFocalMap = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<string, string>> => {
    const { data, error } = await supabaseAdmin
      .from("collection_images")
      .select("handle, focal_x, focal_y")
      .not("focal_x", "is", null)
      .not("focal_y", "is", null);
    if (error || !data) return {};
    const map: Record<string, string> = {};
    for (const row of data as Array<{ handle: string; focal_x: number; focal_y: number }>) {
      if (row.handle) {
        const x = Math.max(0, Math.min(100, Number(row.focal_x)));
        const y = Math.max(0, Math.min(100, Number(row.focal_y)));
        map[row.handle] = `${x}% ${y}%`;
      }
    }
    return map;
  }
);
