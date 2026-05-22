import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ItemSchema = z.object({
  handle: z.string().max(255).nullable(),
  title: z.string().max(500).nullable(),
  variant_title: z.string().max(255).nullable(),
  image: z.string().max(1000).nullable(),
  price_usd: z.number().min(0).max(1_000_000),
  quantity: z.number().int().min(1).max(100),
});

const InputSchema = z.object({
  session_id: z.string().min(1).max(128),
  email: z.string().email().max(320),
  items: z.array(ItemSchema).max(50),
  total_usd: z.number().min(0).max(1_000_000),
  item_count: z.number().int().min(0).max(1000),
  checkout_url: z.string().max(1000).nullable().optional(),
  page_path: z.string().max(500).nullable().optional(),
  user_agent: z.string().max(500).nullable().optional(),
});

export const captureAbandonedCart = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();

    // Upsert by session_id. If the cart already received recovery emails, we
    // still keep recording activity (so the dispatcher can see it became
    // active again), but we don't re-arm the email — that's the dispatcher's
    // job based on time + recovery_email_count.
    const { error } = await supabaseAdmin
      .from("abandoned_carts")
      .upsert(
        {
          session_id: data.session_id,
          email,
          items: data.items,
          total_usd: data.total_usd,
          item_count: data.item_count,
          checkout_url: data.checkout_url ?? null,
          page_path: data.page_path ?? null,
          user_agent: data.user_agent ?? null,
          last_activity_at: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      );

    if (error) {
      console.error("[abandoned-cart] upsert failed:", error.message);
      return { ok: false, error: "Could not save cart" };
    }
    return { ok: true };
  });
