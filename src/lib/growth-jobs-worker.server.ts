// Server-only worker that drains `growth_jobs`.
//
// Pulls pending jobs (run_after <= now, attempts < max_attempts), dispatches
// each to a registered handler, then updates status/attempts/last_error.
// Bounded batch size so a single run can't hold a Worker invocation open
// forever. Both the cron endpoint and the admin "Run queue now" button call
// `drainGrowthJobs()` — single source of truth.
//
// Job handlers register themselves in JOB_HANDLERS below. To add a new job
// type: write a handler, register it, and start inserting rows with that
// `job_type` from elsewhere in the app. The worker stays generic.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type JobHandlerResult = { ok: true; result?: unknown } | { ok: false; error: string };
export type JobHandler = (payload: unknown, jobId: string) => Promise<JobHandlerResult>;

// Registry — Wave 3 will add `send_review_request` here.
const JOB_HANDLERS: Record<string, JobHandler> = {};

export function registerJobHandler(jobType: string, handler: JobHandler) {
  JOB_HANDLERS[jobType] = handler;
}

interface DrainOptions {
  batchSize?: number;
}

export interface DrainResult {
  picked: number;
  succeeded: number;
  failed: number;
  skipped_unknown_type: number;
  details: Array<{ id: string; job_type: string; status: "succeeded" | "failed" | "skipped"; error?: string }>;
}

export async function drainGrowthJobs(opts: DrainOptions = {}): Promise<DrainResult> {
  const batchSize = Math.min(Math.max(opts.batchSize ?? 25, 1), 100);

  const { data: jobs, error } = await supabaseAdmin
    .from("growth_jobs")
    .select("id, job_type, payload, attempts, max_attempts")
    .eq("status", "pending")
    .lte("run_after", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    console.error("[growth-jobs-worker] query failed:", error.message);
    throw new Error("Internal error");
  }

  const result: DrainResult = {
    picked: jobs?.length ?? 0,
    succeeded: 0,
    failed: 0,
    skipped_unknown_type: 0,
    details: [],
  };

  for (const job of jobs ?? []) {
    const handler = JOB_HANDLERS[job.job_type];

    // Claim the job optimistically so a concurrent drain can't double-process.
    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from("growth_jobs")
      .update({ status: "running", attempts: job.attempts + 1, updated_at: new Date().toISOString() })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (claimErr || !claimed) continue; // someone else got it

    if (!handler) {
      await supabaseAdmin
        .from("growth_jobs")
        .update({ status: "failed", last_error: `Unknown job_type: ${job.job_type}` })
        .eq("id", job.id);
      result.skipped_unknown_type++;
      result.details.push({ id: job.id, job_type: job.job_type, status: "skipped", error: "unknown_type" });
      continue;
    }

    try {
      const out = await handler(job.payload, job.id);
      if (out.ok) {
        await supabaseAdmin
          .from("growth_jobs")
          .update({ status: "succeeded", result: (out.result ?? null) as never, last_error: null })
          .eq("id", job.id);
        result.succeeded++;
        result.details.push({ id: job.id, job_type: job.job_type, status: "succeeded" });
      } else {
        const isTerminal = job.attempts + 1 >= job.max_attempts;
        await supabaseAdmin
          .from("growth_jobs")
          .update({
            status: isTerminal ? "failed" : "pending",
            last_error: out.error.slice(0, 2000),
            run_after: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          })
          .eq("id", job.id);
        result.failed++;
        result.details.push({ id: job.id, job_type: job.job_type, status: "failed", error: out.error });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const isTerminal = job.attempts + 1 >= job.max_attempts;
      await supabaseAdmin
        .from("growth_jobs")
        .update({
          status: isTerminal ? "failed" : "pending",
          last_error: msg.slice(0, 2000),
          run_after: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })
        .eq("id", job.id);
      result.failed++;
      result.details.push({ id: job.id, job_type: job.job_type, status: "failed", error: msg });
    }
  }

  return result;
}
