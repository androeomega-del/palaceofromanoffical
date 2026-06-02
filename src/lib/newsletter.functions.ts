import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGmail } from "./gmail-send";
import { renderWelcomeEmail } from "./welcome-email-template";
import { renderConfirmationEmail } from "./confirmation-email-template";

const SITE = "https://palaceofromanofficial.com";

const SubscribeInput = z.object({
  email: z.string().min(5).max(320).email(),
  source: z.string().max(64).optional(),
  userAgent: z.string().max(500).optional(),
  marketingConsent: z.boolean().optional(),
});

function newToken(): string {
  // 32 bytes of randomness → 43 url-safe base64 chars.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendConfirmation(email: string, token: string) {
  const confirmUrl = `${SITE}/newsletter/confirm?token=${encodeURIComponent(token)}`;
  const { subject, html, text } = renderConfirmationEmail(confirmUrl);
  await sendGmail(email, subject, html, text);
}

/**
 * Double opt-in subscribe. Always returns ok unless the email is invalid or
 * an unexpected error occurred; the caller should instruct the user to check
 * their inbox to confirm.
 */
export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubscribeInput.parse(input))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const token = newToken();
    const nowIso = new Date().toISOString();

    // Try to insert as pending with a fresh confirmation token.
    const { data: inserted, error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .insert({
        email,
        source: data.source ?? "welcome_modal",
        user_agent: data.userAgent ?? null,
        marketing_consent: data.marketingConsent ?? true,
        status: "pending",
        confirmation_token: token,
        confirmation_sent_at: nowIso,
      })
      .select("id")
      .maybeSingle();

    if (error && error.code !== "23505") {
      console.error("[newsletter] insert failed:", error.message);
      return { ok: false as const, error: "Could not subscribe. Please try again." };
    }

    if (inserted) {
      try {
        await sendConfirmation(email, token);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[newsletter] confirmation email failed:", msg);
      }
      return { ok: true as const, already: false, pending: true };
    }

    // Duplicate — fetch existing row to decide what to do.
    const { data: existing } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("status")
      .eq("email", email)
      .maybeSingle();

    if (existing?.status === "confirmed") {
      // Already a confirmed subscriber — nothing to do.
      return { ok: true as const, already: true, pending: false };
    }

    // Pending: rotate the token and resend the confirmation.
    await supabaseAdmin
      .from("newsletter_subscribers")
      .update({
        confirmation_token: token,
        confirmation_sent_at: nowIso,
      })
      .eq("email", email);

    try {
      await sendConfirmation(email, token);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[newsletter] confirmation resend failed:", msg);
    }
    return { ok: true as const, already: true, pending: true };
  });

// ── Confirm endpoint ──────────────────────────────────────────────────────

const ConfirmInput = z.object({
  token: z.string().min(20).max(128),
});

export const confirmNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ConfirmInput.parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email, status")
      .eq("confirmation_token", data.token)
      .maybeSingle();

    if (error) {
      console.error("[newsletter] confirm lookup failed:", error.message);
      return { ok: false as const, reason: "error" as const };
    }
    if (!row) return { ok: false as const, reason: "invalid" as const };

    if (row.status === "confirmed") {
      return { ok: true as const, alreadyConfirmed: true, email: row.email };
    }

    const { error: updErr } = await supabaseAdmin
      .from("newsletter_subscribers")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        confirmation_token: null,
      })
      .eq("id", row.id);

    if (updErr) {
      console.error("[newsletter] confirm update failed:", updErr.message);
      return { ok: false as const, reason: "error" as const };
    }

    // Send welcome only after the address has been verified.
    try {
      const { subject, html, text } = renderWelcomeEmail();
      await sendGmail(row.email, subject, html, text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[newsletter] welcome email failed:", msg);
    }

    return { ok: true as const, alreadyConfirmed: false, email: row.email };
  });
