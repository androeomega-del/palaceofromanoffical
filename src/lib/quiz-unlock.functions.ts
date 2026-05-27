import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGmail } from "./gmail-send";
import { renderWelcomeEmail } from "./welcome-email-template";
import { renderLookbookUnlockEmail } from "./lookbook-unlock-email-template";

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
});

const LookupInput = z.object({
  email: z.string().min(5).max(320).email(),
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

    // 1) Newsletter signup — dedupe via unique index on lower(email).
    const { data: subInserted, error: subErr } = await supabaseAdmin
      .from("newsletter_subscribers")
      .insert({
        email,
        source,
        user_agent: data.userAgent ?? null,
        marketing_consent: true,
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

    // 3) Welcome email for genuinely new subscribers only.
    if (isNewSubscriber) {
      try {
        const { subject, html, text } = renderWelcomeEmail();
        await sendGmail(email, subject, html, text);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[quiz-unlock] welcome email failed:", msg);
      }
    }

    // 4) Lookbook unlock confirmation — sent on every unlock so returning
    //    subscribers also get the curated shop links for their latest answers.
    try {
      const { subject, html, text } = renderLookbookUnlockEmail(data.answers);
      await sendGmail(email, subject, html, text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[quiz-unlock] lookbook confirmation email failed:", msg);
    }

    return {
      ok: true as const,
      already: !isNewSubscriber,
      answers: data.answers,
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
 * Funnel analytics — fire-and-forget. Safe to call from anonymous visitors.
 */
export const trackQuizFunnel = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FunnelInput.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("quiz_funnel_events").insert({
      event_type: data.eventType,
      email: data.email ? data.email.trim().toLowerCase() : null,
      step: data.step ?? null,
      answers_snapshot: data.answers ?? null,
      session_id: data.sessionId ?? null,
      page_path: data.pagePath ?? null,
      user_agent: data.userAgent ?? null,
    });
    if (error) {
      console.error("[quiz-funnel] insert failed:", error.message);
      return { ok: false as const };
    }
    return { ok: true as const };
  });
