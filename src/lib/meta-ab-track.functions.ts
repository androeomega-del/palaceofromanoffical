/**
 * Meta A/B tracking — server functions for recording exposures and
 * conversions. Called fire-and-forget from the client; failures are
 * swallowed so analytics never break the page.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const pageTypeSchema = z.enum(["home", "collection"]);
const variantSchema = z.enum(["A", "B"]);
const bucketSchema = z.union([z.literal(0), z.literal(1)]);

const exposureSchema = z.object({
  page_type: pageTypeSchema,
  page_path: z.string().max(500).optional().nullable(),
  bucket: bucketSchema,
  variant: variantSchema,
  session_id: z.string().max(128).optional().nullable(),
  is_bot: z.boolean().optional(),
});

export const recordMetaAbExposure = createServerFn({ method: "POST" })
  .inputValidator((input) => exposureSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      await supabaseAdmin.from("meta_ab_exposures").insert({
        page_type: data.page_type,
        page_path: data.page_path ?? null,
        bucket: data.bucket,
        variant: data.variant,
        session_id: data.session_id ?? null,
        is_bot: data.is_bot ?? false,
      });
    } catch (e) {
      console.error("[meta-ab] exposure insert failed", e);
    }
    return { ok: true };
  });

const conversionSchema = z.object({
  page_type: pageTypeSchema,
  bucket: bucketSchema,
  variant: variantSchema,
  event_type: z.enum([
    "add_to_cart",
    "checkout_started",
    "reached_checkout",
    "purchase",
  ]),
  session_id: z.string().max(128).optional().nullable(),
  value_usd: z.number().min(0).max(1_000_000).optional().nullable(),
});

export const recordMetaAbConversion = createServerFn({ method: "POST" })
  .inputValidator((input) => conversionSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      await supabaseAdmin.from("meta_ab_conversions").insert({
        page_type: data.page_type,
        bucket: data.bucket,
        variant: data.variant,
        event_type: data.event_type,
        session_id: data.session_id ?? null,
        value_usd: data.value_usd ?? null,
      });
    } catch (e) {
      console.error("[meta-ab] conversion insert failed", e);
    }
    return { ok: true };
  });
