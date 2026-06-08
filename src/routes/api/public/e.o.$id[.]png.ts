import { createFileRoute } from "@tanstack/react-router";

// 1x1 transparent GIF — same trick as the canonical "tracking pixel"
const PIXEL = Uint8Array.from([
  71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33, 249, 4, 1, 0, 0, 0, 0,
  44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59,
]);

export const Route = createFileRoute("/api/public/e/o/$id.png")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = String(params.id ?? "").slice(0, 128);
        try {
          if (id && /^[A-Za-z0-9_\-:]+$/.test(id)) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            // Only flip opened_at the first time; always bump counter
            const { data: row } = await supabaseAdmin
              .from("email_dispatch_log")
              .select("id, opened_at, opened_count")
              .eq("id", id)
              .maybeSingle();
            if (row) {
              await supabaseAdmin
                .from("email_dispatch_log")
                .update({
                  opened_at: row.opened_at ?? new Date().toISOString(),
                  opened_count: (row.opened_count ?? 0) + 1,
                })
                .eq("id", id);
            }
          }
        } catch (err) {
          console.error("[email-open-pixel]", err);
        }
        return new Response(PIXEL, {
          status: 200,
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate, private",
            Pragma: "no-cache",
          },
        });
      },
    },
  },
});
