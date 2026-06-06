// Capsule Lookbook gating — persists the email + selected variant IDs into
// the acquired_leads tracking layer and dispatches a Gmail-rendered
// digital atelier archive to the visitor's inbox.
//
// Strict boundary: this function is invoked from the Capsule Builder share
// flow only. It does NOT touch the cart store, checkout URL generator, or
// any Shopify mutation.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PieceSchema = z.object({
  variantId: z.string().min(1).max(255),
  productHandle: z.string().min(1).max(255),
  title: z.string().min(1).max(500),
  vendor: z.string().max(255).nullish(),
  imageUrl: z.string().url().max(2000).nullish(),
  priceUsd: z.string().max(32).nullish(),
  slotKind: z.string().min(1).max(64),
});

const InputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email()
    .max(320),
  pieces: z.array(PieceSchema).min(1).max(5),
});

export type ShareCapsuleLookbookInput = z.infer<typeof InputSchema>;

export const shareCapsuleLookbook = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const { email, pieces } = data;

    const [{ supabaseAdmin }, { sendGmail }, { renderCapsuleLookbookEmail }] =
      await Promise.all([
        import("@/integrations/supabase/client.server"),
        import("./gmail-send"),
        import("./capsule-lookbook-email-template"),
      ]);

    const variantIds = pieces.map((p) => p.variantId);

    // Persist the lead + capsule snapshot. acquired_leads has a unique
    // constraint on email, so upsert (merge) onto that key.
    const { error: upsertError } = await supabaseAdmin
      .from("acquired_leads")
      .upsert(
        {
          email,
          source: "capsule_lookbook",
          segment: "capsule_share",
          status: "new",
          notes: JSON.stringify({
            kind: "capsule_lookbook_share",
            shared_at: new Date().toISOString(),
            variant_ids: variantIds,
            pieces: pieces.map((p) => ({
              variantId: p.variantId,
              handle: p.productHandle,
              title: p.title,
              vendor: p.vendor ?? null,
              slotKind: p.slotKind,
            })),
          }),
        },
        { onConflict: "email" },
      );

    if (upsertError) {
      console.error("[capsule-lookbook] upsert failed", upsertError);
    }

    // Dispatch the digital atelier archive email in parallel with the
    // tracking write above (already awaited; email send is independent).
    let emailSent = false;
    try {
      const { subject, html, text } = renderCapsuleLookbookEmail(
        pieces.map((p) => ({
          title: p.title,
          vendor: p.vendor ?? null,
          handle: p.productHandle,
          imageUrl: p.imageUrl ?? null,
          priceUsd: p.priceUsd ?? null,
          slotKind: p.slotKind,
        })),
      );
      await sendGmail(email, subject, html, text);
      emailSent = true;
    } catch (err) {
      console.error("[capsule-lookbook] gmail dispatch failed", err);
    }

    return { ok: true, emailSent };
  });
