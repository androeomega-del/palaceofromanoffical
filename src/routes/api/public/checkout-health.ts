import { createFileRoute } from "@tanstack/react-router";
import { EXPECTED_CHECKOUT_HOST, inspectCheckoutUrl } from "@/lib/checkout-url";

const CHECKS = [
  "https://mwuwqi-vy.myshopify.com/checkouts/cn/example-token",
  "https://checkout.palaceofromanofficial.com/checkouts/cn/example-token",
];

export const Route = createFileRoute("/api/public/checkout-health")({
  server: {
    handlers: {
      GET: async () => {
        const checks = CHECKS.map((url) => inspectCheckoutUrl(url));
        const ok = checks.every((check) => check.ok);

        return new Response(
          JSON.stringify(
            {
              ok,
              expectedCheckoutHost: EXPECTED_CHECKOUT_HOST,
              checks,
              checkedAt: new Date().toISOString(),
            },
            null,
            2,
          ),
          {
            status: ok ? 200 : 503,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          },
        );
      },
    },
  },
});