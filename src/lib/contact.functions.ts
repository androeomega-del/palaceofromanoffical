import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Please enter a valid email").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(160),
  message: z.string().trim().min(10, "A short message please").max(4000),
});

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
    // Bound memory by dropping oldest keys when the map grows.
    const firstKey = ipHits.keys().next().value;
    if (firstKey !== undefined) ipHits.delete(firstKey);
  }
  return hits.length > MAX_PER_IP_PER_MINUTE;
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
    return { ok: true as const };
  });
