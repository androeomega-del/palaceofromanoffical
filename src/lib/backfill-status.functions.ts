import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type BackfillStatus = {
  id: string;
  cursor: string | null;
  total_products: number;
  total_seen: number;
  products_type_updated: number;
  variants_barcoded: number;
  errors: number;
  last_error: string | null;
  status: "idle" | "running" | "done" | "error";
  started_at: string | null;
  updated_at: string;
  finished_at: string | null;
};

export const getBackfillStatus = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<BackfillStatus | null> => {
    const { data, error } = await supabaseAdmin
      .from("backfill_status")
      .select("*")
      .eq("id", "shopify-backfill")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as BackfillStatus | null) ?? null;
  });
