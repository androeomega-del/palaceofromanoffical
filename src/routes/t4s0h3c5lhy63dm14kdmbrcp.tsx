import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/t4s0h3c5lhy63dm14kdmbrcp")({
  server: {
    handlers: {
      GET: async () => {
        const key = "t4s0h3c5lhy63dm14kdmbrcp";
        return new Response(key, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Robots-Tag": "noindex",
          },
        });
      },
    },
  },
});
