// 301 redirect — best-sellers handle isn't in Shopify yet, so this route
// hot-swaps to a live-filtered /shop view. Keeps any old links / bookmarks
// alive (zero-downtime infrastructure rule).

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/collections/best-sellers")({
  beforeLoad: () => {
    throw redirect({
      to: "/shop",
      search: { sort: "BEST_SELLING-false", inStock: "true" } as never,
    });
  },
});
