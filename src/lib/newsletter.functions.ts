import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGmail } from "./gmail-send";
import { renderWelcomeEmail } from "./welcome-email-template";

const SubscribeInput = z.object({
  email: z.string().min(5).max(320).email(),
  source: z.string().max(64).optional(),
  userAgent: z.string().max(500).optional(),
  marketingConsent: z.boolean().optional(),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubscribeInput.parse(input))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();

    // Insert; dedupe via unique index on lower(email).
    const { data: inserted, error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .insert({
        email,
        source: data.source ?? "welcome_modal",
        user_agent: data.userAgent ?? null,
        marketing_consent: data.marketingConsent ?? true,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      // 23505 = unique_violation → already subscribed, treat as success.
      if (error.code === "23505") {
        return { ok: true, already: true };
      }
      console.error("[newsletter] insert failed:", error.message);
      return { ok: false, error: "Could not subscribe. Please try again." };
    }

    if (!inserted) return { ok: true, already: true };

    // Fire welcome email. Don't block the response on email errors.
    try {
      const { subject, html, text } = renderWelcomeEmail();
      await sendGmail(email, subject, html, text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[newsletter] welcome email failed:", msg);
    }

    return { ok: true, already: false };
  });
