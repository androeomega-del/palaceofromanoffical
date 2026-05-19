// Public read for the handle → image URL map populated by the nightly sync.
// Used as the dynamic layer on top of `collectionImage()`'s static fallback.
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
