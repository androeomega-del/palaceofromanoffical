// Public endpoint: subscribe to back-in-stock alerts for a product variant.
// Called from the product page when a customer sees an out-of-stock item.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SubscribeInput = z.object({
  email: z.string().email(),
  variantGid: z.string().min(1),
  productHandle: z.string().min(1),
  productTitle: z.string().min(1),
  variantTitle: z.string().optional(),
  imageUrl: z.string().url().optional(),
  priceUsd: z.string().optional(),
});

export const Route = createFileRoute("/api/public/stock-alerts/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const parse = SubscribeInput.safeParse(body);
        if (!parse.success) {
          return new Response(JSON.stringify({ ok: false, error: "Invalid input" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const data = parse.data;
        const email = data.email.trim().toLowerCase();

        const { error } = await supabaseAdmin
          .from("stock_alert_subscriptions")
          .insert({
            email,
            variant_gid: data.variantGid,
            product_handle: data.productHandle,
            product_title: data.productTitle,
            variant_title: data.variantTitle ?? null,
            image_url: data.imageUrl ?? null,
            price_usd: data.priceUsd ?? null,
          });

        if (error) {
          if (error.code === "23505") {
            return Response.json({ ok: true, already: true });
          }
          console.error("[stock-alert-subscribe] insert failed:", error.message);
          return new Response(JSON.stringify({ ok: false, error: "Could not subscribe" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        return Response.json({ ok: true, already: false });
      },
    },
  },
});
