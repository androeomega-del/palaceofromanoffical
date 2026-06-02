import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-middleware";

const LeadInput = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  first_name: z.string().trim().max(100).optional().nullable(),
  last_name: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(64).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  segment: z.string().trim().max(64).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

const ImportInput = z.object({
  source: z.string().trim().min(1).max(120).default("acquired_list"),
  leads: z.array(LeadInput).min(1).max(5000),
});

export const importAcquiredLeads = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input) => ImportInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const batchId = crypto.randomUUID();

    // Dedupe by email within payload
    const seen = new Set<string>();
    const rows = data.leads
      .filter((l) => {
        if (seen.has(l.email)) return false;
        seen.add(l.email);
        return true;
      })
      .map((l) => ({
        ...l,
        source: data.source,
        import_batch_id: batchId,
        status: "new" as const,
      }));

    // Upsert on email — preserves existing status/opted_in for re-imports
    const { data: inserted, error } = await supabase
      .from("acquired_leads")
      .upsert(rows, { onConflict: "email", ignoreDuplicates: true })
      .select("id");

    if (error) throw new Error(error.message);

    return {
      batch_id: batchId,
      submitted: data.leads.length,
      deduped_in_payload: data.leads.length - rows.length,
      inserted: inserted?.length ?? 0,
      skipped_existing: rows.length - (inserted?.length ?? 0),
    };
  });

export const getAcquiredLeadsStats = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("acquired_leads")
      .select("status, state");
    if (error) throw new Error(error.message);

    const byStatus: Record<string, number> = {};
    const byState: Record<string, number> = {};
    for (const row of data ?? []) {
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
      const s = (row.state ?? "Unknown").toUpperCase();
      byState[s] = (byState[s] ?? 0) + 1;
    }
    return {
      total: data?.length ?? 0,
      by_status: byStatus,
      by_state: byState,
    };
  });
