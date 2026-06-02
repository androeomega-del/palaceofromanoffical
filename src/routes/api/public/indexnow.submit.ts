// POST /api/public/indexnow/submit — submit a list of URLs (or the default
// Rome-page set) to IndexNow. Protected by a shared secret to prevent abuse.
//
// Usage:
//   curl -X POST https://palaceofromanofficial.com/api/public/indexnow/submit \
//     -H "x-indexnow-secret: $INDEXNOW_SUBMIT_SECRET" \
//     -H "content-type: application/json" \
//     -d '{"preset":"rome"}'
//
// Body shapes:
//   { "preset": "rome" }              -> all 11 Rome pages
//   { "urls": ["https://...", ...] }  -> arbitrary URL list (max 100)

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { submitIndexNow } from "@/lib/indexnow";
import { ROME_BRANDS } from "@/lib/rome-brands";

const SITE = "https://palaceofromanofficial.com";

function romeUrlSet(): string[] {
  return [
    `${SITE}/in-rome`,
    ...ROME_BRANDS.map((b) => `${SITE}/brand/${b.slug}/in-rome`),
  ];
}

const Body = z.union([
  z.object({ preset: z.literal("rome") }),
  z.object({
    urls: z
      .array(z.string().url().startsWith(SITE))
      .min(1)
      .max(100),
  }),
]);

export const Route = createFileRoute("/api/public/indexnow/submit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.INDEXNOW_SUBMIT_SECRET;
        if (!secret) {
          return new Response("Not configured", { status: 503 });
        }
        if (request.headers.get("x-indexnow-secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const parsed = Body.safeParse(raw);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: "Invalid body", issues: parsed.error.issues }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        const urls =
          "preset" in parsed.data ? romeUrlSet() : parsed.data.urls;
        const result = await submitIndexNow(urls);

        return new Response(
          JSON.stringify({
            ok: result.ok,
            status: result.status,
            submitted: result.submitted,
            urls,
            response: result.body,
          }),
          {
            status: result.ok ? 200 : 502,
            headers: { "content-type": "application/json" },
          },
        );
      },
    },
  },
});
