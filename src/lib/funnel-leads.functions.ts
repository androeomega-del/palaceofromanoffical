/**
 * Funnel Leads — server functions for the Checkout Vault and Vacation
 * Stylist email-capture funnels.
 *
 * Public surfaces:
 *   - captureFunnelLead({ email, funnel_source, departure_date?, ... })
 *       Inserts (or returns existing) a lead row. Returns the verification
 *       token URL fragment so the front-end can hand it off to email.
 *   - verifyFunnelLead({ token })
 *       Flips `is_verified` to true. Idempotent.
 *
 * Admin-only surfaces (service_role via requireAdmin):
 *   - listReminderWindowLeads({ days?: number })
 *       Returns verified Vacation Stylist leads whose 14-day
 *       reminder_trigger_date falls within the next N days (default 7).
 *       Shape is intentionally flat so it can be piped straight into
 *       Klaviyo, a webhook payload, or any external integration.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-middleware";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const FunnelSourceEnum = z.enum(["Checkout_Vault", "Vacation_Stylist"]);

const CaptureInput = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(320)
      .refine((v) => EMAIL_RE.test(v), "Invalid email"),
    funnel_source: FunnelSourceEnum,
    /** ISO-8601 date string (YYYY-MM-DD). Required for Vacation_Stylist. */
    departure_date: z
      .string()
      .trim()
      .regex(ISO_DATE_RE, "departure_date must be YYYY-MM-DD")
      .optional()
      .nullable(),
    product_handle: z.string().trim().max(200).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  })
  .refine(
    (v) =>
      v.funnel_source !== "Vacation_Stylist" ||
      (!!v.departure_date && new Date(v.departure_date) > new Date()),
    {
      message:
        "Vacation_Stylist leads require a future departure_date (YYYY-MM-DD).",
      path: ["departure_date"],
    },
  );

export type CaptureFunnelLeadResult = {
  id: string;
  email: string;
  funnel_source: "Checkout_Vault" | "Vacation_Stylist";
  is_verified: boolean;
  verification_token: string;
  departure_date: string | null;
  reminder_trigger_date: string | null;
  created: boolean;
};

export const captureFunnelLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CaptureInput.parse(input))
  .handler(async ({ data }): Promise<CaptureFunnelLeadResult> => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Idempotent capture: if (email, funnel_source) already exists, return it
    // so the same visitor can re-trigger the verification email without
    // creating duplicate rows.
    const { data: existing, error: selErr } = await supabaseAdmin
      .from("funnel_leads")
      .select(
        "id,email,funnel_source,is_verified,verification_token,departure_date,reminder_trigger_date",
      )
      .eq("email", data.email)
      .eq("funnel_source", data.funnel_source)
      .maybeSingle();

    if (selErr) throw new Error(selErr.message);

    if (existing) {
      // Allow refreshing departure_date if the user revisits the trunk.
      if (
        data.funnel_source === "Vacation_Stylist" &&
        data.departure_date &&
        data.departure_date !== existing.departure_date
      ) {
        const { data: updated, error: updErr } = await supabaseAdmin
          .from("funnel_leads")
          .update({ departure_date: data.departure_date })
          .eq("id", existing.id)
          .select(
            "id,email,funnel_source,is_verified,verification_token,departure_date,reminder_trigger_date",
          )
          .single();
        if (updErr) throw new Error(updErr.message);
        return { ...updated, created: false };
      }
      return { ...existing, created: false };
    }

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("funnel_leads")
      .insert({
        email: data.email,
        funnel_source: data.funnel_source,
        departure_date: data.departure_date ?? null,
        product_handle: data.product_handle ?? null,
        notes: data.notes ?? null,
        metadata: (data.metadata ?? {}) as Record<string, unknown>,
      })
      .select(
        "id,email,funnel_source,is_verified,verification_token,departure_date,reminder_trigger_date",
      )
      .single();

    if (insErr) throw new Error(insErr.message);
    return { ...inserted, created: true };
  });

const VerifyInput = z.object({
  token: z.string().trim().min(16).max(128),
});

export const verifyFunnelLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => VerifyInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: row, error: selErr } = await supabaseAdmin
      .from("funnel_leads")
      .select("id, email, funnel_source, is_verified, verified_at, reminder_trigger_date")
      .eq("verification_token", data.token)
      .maybeSingle();

    if (selErr) throw new Error(selErr.message);
    if (!row) return { ok: false as const, reason: "invalid_token" };

    if (row.is_verified) {
      return { ok: true as const, already_verified: true, lead: row };
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from("funnel_leads")
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq("id", row.id)
      .select(
        "id, email, funnel_source, is_verified, verified_at, departure_date, reminder_trigger_date",
      )
      .single();

    if (updErr) throw new Error(updErr.message);
    return { ok: true as const, already_verified: false, lead: updated };
  });

const ReminderWindowInput = z.object({
  /** Number of days from now to include. Default 7, max 30. */
  days: z.number().int().min(1).max(30).optional(),
});

/**
 * Admin-only feed for external automation (Klaviyo, webhook fan-out, cron).
 * Returns a flat, integration-ready payload of verified Vacation Stylist
 * leads inside the upcoming reminder window.
 */
export const listReminderWindowLeads = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => ReminderWindowInput.parse(input ?? {}))
  .handler(async ({ data }) => {
    const days = data.days ?? 7;
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const now = new Date();
    const upper = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const { data: rows, error } = await supabaseAdmin
      .from("funnel_leads")
      .select(
        "id,email,funnel_source,departure_date,reminder_trigger_date,product_handle,verified_at,metadata,created_at",
      )
      .eq("funnel_source", "Vacation_Stylist")
      .eq("is_verified", true)
      .not("reminder_trigger_date", "is", null)
      .gte("reminder_trigger_date", now.toISOString())
      .lte("reminder_trigger_date", upper.toISOString())
      .order("reminder_trigger_date", { ascending: true });

    if (error) throw new Error(error.message);

    return {
      generated_at: now.toISOString(),
      window_days: days,
      count: rows?.length ?? 0,
      leads: (rows ?? []).map((r) => ({
        id: r.id,
        email: r.email,
        funnel_source: r.funnel_source,
        departure_date: r.departure_date,
        reminder_trigger_date: r.reminder_trigger_date,
        days_until_reminder: r.reminder_trigger_date
          ? Math.max(
              0,
              Math.round(
                (new Date(r.reminder_trigger_date).getTime() - now.getTime()) /
                  (24 * 60 * 60 * 1000),
              ),
            )
          : null,
        product_handle: r.product_handle,
        verified_at: r.verified_at,
        metadata: r.metadata,
        created_at: r.created_at,
      })),
    };
  });
