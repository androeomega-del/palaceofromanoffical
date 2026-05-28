import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Export all newsletter subscribers as CSV. Admin-only.
 * Format is Klaviyo / Mailchimp compatible: email, source, consent, created_at.
 */
export const exportNewsletterCsv = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("email, source, marketing_consent, created_at")
      .order("created_at", { ascending: false })
      .limit(10000);
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = "email,source,marketing_consent,created_at";
    const body = rows
      .map((r) =>
        [r.email, r.source ?? "", r.marketing_consent ? "true" : "false", r.created_at]
          .map(escape)
          .join(",")
      )
      .join("\n");

    return {
      filename: `palace-of-roman-subscribers-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: `${header}\n${body}\n`,
      count: rows.length,
    };
  });
