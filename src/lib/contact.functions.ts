import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGmail, escapeHtml } from "./gmail-send";

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Please enter a valid email").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(160),
  message: z.string().trim().min(10, "A short message please").max(4000),
});

const NOTIFY_TO = "support@palaceofromanofficial.com";

// Very simple in-memory rate limiter keyed by IP. Bounded map size to avoid
// unbounded growth. Worker instances are short-lived so this is best-effort —
// the DB-backed check below is the real ceiling.
const MAX_PER_IP_PER_MINUTE = 3;
const ipHits = new Map<string, number[]>();

function getClientIp(): string {
  try {
    const req = getRequest();
    const h = req?.headers;
    if (!h) return "unknown";
    return (
      h.get("cf-connecting-ip") ||
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

function ipRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const hits = (ipHits.get(ip) ?? []).filter((t) => t > windowStart);
  hits.push(now);
  ipHits.set(ip, hits);
  if (ipHits.size > 5000) {
    const firstKey = ipHits.keys().next().value;
    if (firstKey !== undefined) ipHits.delete(firstKey);
  }
  return hits.length > MAX_PER_IP_PER_MINUTE;
}

function renderNotificationEmail(data: z.infer<typeof ContactSchema>) {
  const subject = `[Concierge] ${data.subject} — ${data.name}`;
  const safeMsg = escapeHtml(data.message).replace(/\n/g, "<br>");
  const html = `<!doctype html><html><body style="font-family:Georgia,serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px;">
<p style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#8a6d3b;margin:0 0 16px;">Palace of Roman — Concierge</p>
<h1 style="font-size:20px;margin:0 0 18px;">New message: ${escapeHtml(data.subject)}</h1>
<table style="font-size:13px;line-height:1.6;border-collapse:collapse;width:100%;margin-bottom:18px;">
<tr><td style="color:#666;padding:4px 0;width:80px;">From</td><td style="padding:4px 0;">${escapeHtml(data.name)}</td></tr>
<tr><td style="color:#666;padding:4px 0;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color:#8a6d3b;">${escapeHtml(data.email)}</a></td></tr>
</table>
<div style="border-top:1px solid #e0d8c8;padding-top:18px;font-size:14px;line-height:1.6;color:#333;">${safeMsg}</div>
<p style="font-size:11px;color:#999;margin-top:32px;">Reply directly to ${escapeHtml(data.email)} to respond.</p>
</body></html>`;
  const text = `New concierge message\n\nFrom: ${data.name} <${data.email}>\nSubject: ${data.subject}\n\n${data.message}\n\n— Reply to ${data.email}`;
  return { subject, html, text };
}

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ContactSchema.parse(input))
  .handler(async ({ data }) => {
    const ip = getClientIp();
    if (ipRateLimited(ip)) {
      return {
        ok: false as const,
        error: "Too many submissions — please wait a minute before trying again.",
      };
    }

    // DB-backed throttle: cap recent submissions for the same email.
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countErr } = await supabaseAdmin
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("email", data.email)
      .gte("created_at", hourAgo);

    if (countErr) {
      console.error("[contact] rate-limit count failed:", countErr.message);
    } else if ((count ?? 0) >= 5) {
      return {
        ok: false as const,
        error: "We've already received several notes from this address. Please try again later.",
      };
    }

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    });
    if (error) {
      console.error("[contact] insert failed:", error.message);
      return { ok: false as const, error: "We could not deliver your note. Please try again in a moment." };
    }

    // Fire-and-forget notification to the concierge inbox. Never block the
    // user response on email — capture in DB is the source of truth.
    try {
      const { subject, html, text } = renderNotificationEmail(data);
      await sendGmail(NOTIFY_TO, subject, html, text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[contact] notification email failed:", msg);
    }

    return { ok: true as const };
  });
