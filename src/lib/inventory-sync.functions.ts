import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type InventorySyncRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "error";
  dry_run: boolean;
  total: number;
  processed: number;
  updated: number;
  activated: number;
  failed: number;
  flipped: number;
  error_message: string | null;
};

export type InventorySyncDashboard = {
  current: InventorySyncRun | null;
  last: InventorySyncRun | null;
  recent: InventorySyncRun[];
};

export const getInventorySyncDashboard = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async (): Promise<InventorySyncDashboard> => {
    const { data, error } = await supabaseAdmin
      .from("inventory_sync_runs")
      .select(
        "id, started_at, finished_at, status, dry_run, total, processed, updated, activated, failed, flipped, error_message"
      )
      .order("started_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(`inventory_sync_runs: ${error.message}`);

    const rows = (data ?? []) as InventorySyncRun[];
    const current = rows.find((r) => r.status === "running") ?? null;
    const last = rows.find((r) => r.status !== "running") ?? null;
    return { current, last, recent: rows };
  });
