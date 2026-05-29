import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGmail } from "./gmail-send";
import { renderWelcomeEmail } from "./welcome-email-template";
import { renderLookbookUnlockEmail } from "./lookbook-unlock-email-template";
import { issueQuizToken, verifyQuizToken } from "./quiz-token.server";


const AnswersSchema = z.object({
  gender: z.enum(["Women", "Men", "Unisex"]).optional(),
  collection: z.string().max(64).optional(),
  q: z.string().max(120).optional(),
  min: z.number().int().min(0).max(1_000_000).optional(),
  max: z.number().int().min(0).max(1_000_000).optional(),
});

export type QuizAnswers = z.infer<typeof AnswersSchema>;

const UnlockInput = z.object({
  email: z.string().min(5).max(320).email(),
  answers: AnswersSchema,
  source: z.string().max(64).optional(),
  userAgent: z.string().max(500).optional(),
  marketingConsent: z.boolean().optional(),
});

// Frequency caps (in hours) per email template. Welcome is one-shot per
// subscriber so we use a large window as a defensive backstop in case the
// newsletter insert path is bypassed.
const EMAIL_FREQUENCY_HOURS: Record<string, number> = {
  quiz_welcome_email: 24 * 365, // effectively one-time
  quiz_lookbook_unlock: 24 * 7, // at most once per 7 days per email
};

const TEMPLATE_WELCOME = "quiz_welcome_email";
const TEMPLATE_LOOKBOOK = "quiz_lookbook_unlock";

/**
 * Returns true if the recipient has opted out of marketing. Subscribers who
 * have never signed up are treated as opted-in (they're actively unlocking
 * the lookbook, which is itself an opt-in action).
 */
async function hasMarketingOptOut(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("marketing_consent")
    .eq("email", email)
    .maybeSingle();
  return data ? data.marketing_consent === false : false;
}

/**
 * Returns true if we sent the given template to this email within the
 * frequency window. Reads append-only email_dispatch_log; service-role
 * bypasses RLS.
 */
async function wasRecentlySent(
  email: string,
  templateName: string,
): Promise<boolean> {
  const hours = EMAIL_FREQUENCY_HOURS[templateName];
  if (!hours) return false;
  const sinceIso = new Date(Date.now() - hours * 3600_000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("email_dispatch_log")
    .select("id")
    .eq("recipient_email", email)
    .eq("template_name", templateName)
    .eq("status", "sent")
    .gte("created_at", sinceIso)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[quiz-unlock] dispatch log lookup failed:", error.message);
    return false; // fail-open: don't silently skip transactional sends
  }
  return !!data;
}

async function logDispatch(
  email: string,
  templateName: string,
  status: "sent" | "failed" | "skipped",
  errorMessage?: string,
  metadata?: Record<string, unknown>,
) {
  const { error } = await supabaseAdmin.from("email_dispatch_log").insert({
    recipient_email: email,
    template_name: templateName,
    status,
    error_message: errorMessage ?? null,
    metadata: (metadata ?? {}) as never,
  });
  if (error) {
    console.error("[quiz-unlock] dispatch log insert failed:", error.message);
  }
}

/**
 * Send wrapper that enforces consent + per-template frequency caps.
 * Records the attempt to email_dispatch_log regardless of outcome.
 */
async function sendGatedEmail(
  email: string,
  templateName: string,
  subject: string,
  html: string,
  text: string,
): Promise<"sent" | "skipped_consent" | "skipped_frequency" | "failed"> {
  if (await hasMarketingOptOut(email)) {
    await logDispatch(email, templateName, "skipped", "marketing_opt_out");
    return "skipped_consent";
  }
  if (await wasRecentlySent(email, templateName)) {
    await logDispatch(email, templateName, "skipped", "frequency_cap");
    return "skipped_frequency";
  }
  try {
    await sendGmail(email, subject, html, text);
    await logDispatch(email, templateName, "sent");
    return "sent";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[quiz-unlock] ${templateName} send failed:`, msg);
    await logDispatch(email, templateName, "failed", msg.slice(0, 500));
    return "failed";
  }
}

const LookupInput = z.object({
  email: z.string().min(5).max(320).email(),
  token: z.string().min(8).max(256),
  iat: z.number().int().positive(),
});


const EVENT_TYPES = [
  "quiz_started",
  "quiz_step",
  "quiz_gate_viewed",
  "quiz_gate_submitted",
  "quiz_lookbook_viewed",
  "quiz_shop_clicked",
  "quiz_unlock_resumed",
] as const;

const FunnelInput = z.object({
  eventType: z.enum(EVENT_TYPES),
  email: z.string().email().max(320).optional(),
  step: z.number().int().min(0).max(20).optional(),
  answers: AnswersSchema.optional(),
  sessionId: z.string().max(64).optional(),
  pagePath: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
});

const LookbookViewInput = z.object({
  email: z.string().min(5).max(320).email(),
  token: z.string().min(8).max(256),
  iat: z.number().int().positive(),
  answers: AnswersSchema.optional(),
  sessionId: z.string().max(64).optional(),
  pagePath: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
});


/**
 * Server-side unlock: subscribes the email to the Atelier List AND records
 * the curated answers so we can verify the unlock later without trusting
 * localStorage. Returns the canonical answers to hydrate the lookbook.
 */
export const unlockQuizLookbook = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => UnlockInput.parse(input))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const source = data.source ?? "style-quiz";

    // Consent: default true (visitor is actively unlocking, which is an
    // opt-in action), but honour an explicit false from the client.
    const consent = data.marketingConsent !== false;

    // 1) Newsletter signup — dedupe via unique index on lower(email).
    const { data: subInserted, error: subErr } = await supabaseAdmin
      .from("newsletter_subscribers")
      .insert({
        email,
        source,
        user_agent: data.userAgent ?? null,
        marketing_consent: consent,
      })
      .select("id")
      .maybeSingle();

    const isNewSubscriber = !subErr && !!subInserted;
    if (subErr && subErr.code !== "23505") {
      console.error("[quiz-unlock] newsletter insert failed:", subErr.message);
    }

    // 2) Upsert the quiz unlock — keep the most recent answers.
    const { error: unlockErr } = await supabaseAdmin
      .from("quiz_unlocks")
      .upsert(
        {
          email,
          answers: data.answers,
          source,
          user_agent: data.userAgent ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );

    if (unlockErr) {
      console.error("[quiz-unlock] upsert failed:", unlockErr.message);
      return {
        ok: false as const,
        error: "Could not save your edit. Please try again.",
      };
    }

    // 3) Welcome email — only for genuinely new subscribers, and only if
    //    consent + frequency cap allow it. The cap is a defensive backstop;
    //    the newsletter unique-index check above is the primary gate.
    if (isNewSubscriber) {
      const welcome = renderWelcomeEmail();
      await sendGatedEmail(
        email,
        TEMPLATE_WELCOME,
        welcome.subject,
        welcome.html,
        welcome.text,
      );
    }

    // 4) Lookbook unlock confirmation — capped to once per 7 days per email,
    //    so repeat quiz takers don't get spammed with the same edit recap.
    const lookbook = renderLookbookUnlockEmail(data.answers);
    await sendGatedEmail(
      email,
      TEMPLATE_LOOKBOOK,
      lookbook.subject,
      lookbook.html,
      lookbook.text,
    );

    const { token, iat } = issueQuizToken(email);
    return {
      ok: true as const,
      already: !isNewSubscriber,
      answers: data.answers,
      token,
      iat,
    };
  });


/**
 * Public lookup: returns the saved answers if the email has an unlock on
 * record, otherwise null. Used by the quiz page (returning visitor) and
 * the homepage (returning-subscriber preview).
 */
export const getQuizUnlock = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LookupInput.parse(input))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    const { data: row, error } = await supabaseAdmin
      .from("quiz_unlocks")
      .select("answers, source, created_at, updated_at")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("[quiz-unlock] lookup failed:", error.message);
      return { unlocked: false as const };
    }
    if (!row) return { unlocked: false as const };

    const parsed = AnswersSchema.safeParse(row.answers ?? {});
    return {
      unlocked: true as const,
      answers: parsed.success ? parsed.data : {},
      updatedAt: row.updated_at,
    };
  });

/**
 * Server-side lookbook view tracking.
 * Verifies the email has a valid unlock before recording the view event,
 * so lookbook views are always tied to a real subscriber record.
 */
export const recordLookbookView = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LookbookViewInput.parse(input))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();

    // Verify the unlock exists server-side — never trust localStorage.
    const { data: unlock, error: lookupErr } = await supabaseAdmin
      .from("quiz_unlocks")
      .select("answers")
      .eq("email", email)
      .maybeSingle();

    if (lookupErr) {
      console.error("[lookbook-view] lookup failed:", lookupErr.message);
      return { recorded: false as const, reason: "lookup_error" };
    }
    if (!unlock) {
      return { recorded: false as const, reason: "no_unlock" };
    }

    // Record the funnel event server-side.
    const { error } = await supabaseAdmin.from("quiz_funnel_events").insert({
      event_type: "quiz_lookbook_viewed",
      email,
      answers_snapshot: data.answers ?? unlock.answers ?? null,
      session_id: data.sessionId ?? null,
      page_path: data.pagePath ?? null,
      user_agent: data.userAgent ?? null,
    });

    if (error) {
      console.error("[lookbook-view] insert failed:", error.message);
      return { recorded: false as const, reason: "insert_error" };
    }

    return { recorded: true as const, answers: unlock.answers as QuizAnswers };
  });

/**
 * Funnel events that must fire EXACTLY ONCE per session. Re-fires from the
 * same session_id are deduped server-side so client retries, React StrictMode
 * double-effects, refreshes, or back-button revisits cannot inflate counts.
 */
const UNIQUE_PER_SESSION_EVENTS = new Set([
  "quiz_started",
  "quiz_gate_viewed",
  "quiz_gate_submitted",
]);

/**
 * Funnel analytics — fire-and-forget. Safe to call from anonymous visitors.
 * Unique events are deduplicated per session_id so each one is recorded
 * exactly once, with the step and page_path captured at first fire.
 */
export const trackQuizFunnel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FunnelInput.parse(input))
  .handler(async ({ data }) => {
    const email = data.email ? data.email.trim().toLowerCase() : null;
    const sessionId = data.sessionId ?? null;

    if (
      UNIQUE_PER_SESSION_EVENTS.has(data.eventType) &&
      sessionId
    ) {
      const { data: existing, error: dupErr } = await supabaseAdmin
        .from("quiz_funnel_events")
        .select("id")
        .eq("event_type", data.eventType)
        .eq("session_id", sessionId)
        .limit(1)
        .maybeSingle();
      if (dupErr) {
        console.error("[quiz-funnel] dedupe lookup failed:", dupErr.message);
      } else if (existing) {
        return { ok: true as const, deduped: true as const };
      }
    }

    const { error } = await supabaseAdmin.from("quiz_funnel_events").insert({
      event_type: data.eventType,
      email,
      step: data.step ?? null,
      answers_snapshot: data.answers ?? null,
      session_id: sessionId,
      page_path: data.pagePath ?? null,
      user_agent: data.userAgent ?? null,
    });
    if (error) {
      console.error("[quiz-funnel] insert failed:", error.message);
      return { ok: false as const };
    }
    return { ok: true as const, deduped: false as const };
  });
