// Admin-only server functions for the growth_jobs queue.

import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { drainGrowthJobs } from "@/lib/growth-jobs-worker.server";

export const drainGrowthJobsNow = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const result = await drainGrowthJobs({ batchSize: 25 });
    return { ok: true as const, ...result };
  });

export const getGrowthJobsSummary = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("growth_jobs")
      .select("status")
      .limit(1000);
    if (error) throw new Error(error.message);
    const counts = { pending: 0, running: 0, succeeded: 0, failed: 0 } as Record<string, number>;
    for (const r of data ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return counts;
  });
