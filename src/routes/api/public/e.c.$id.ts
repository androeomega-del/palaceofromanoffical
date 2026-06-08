import { createFileRoute } from "@tanstack/react-router";

const HOME = "https://palaceofromanofficial.com/";

function safeUrl(raw: string | null): string {
  if (!raw) return HOME;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return HOME;
    return u.toString();
  } catch {
    return HOME;
  }
}

export const Route = createFileRoute("/api/public/e/c/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const id = String(params.id ?? "").slice(0, 128);
        const url = new URL(request.url);
        const target = safeUrl(url.searchParams.get("u"));

        try {
          if (id && /^[A-Za-z0-9_\-:]+$/.test(id)) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data: row } = await supabaseAdmin
              .from("email_dispatch_log")
              .select("id, clicked_at, clicked_count, opened_at")
              .eq("id", id)
              .maybeSingle();
            if (row) {
              const now = new Date().toISOString();
              await supabaseAdmin
                .from("email_dispatch_log")
                .update({
                  clicked_at: row.clicked_at ?? now,
                  clicked_count: (row.clicked_count ?? 0) + 1,
                  last_click_url: target.slice(0, 1000),
                  // A click implies an open
                  opened_at: row.opened_at ?? now,
                })
                .eq("id", id);
            }
          }
        } catch (err) {
          console.error("[email-click-redirect]", err);
        }

        return new Response(null, {
          status: 302,
          headers: { Location: target, "Cache-Control": "no-store" },
        });
      },
    },
  },
});
