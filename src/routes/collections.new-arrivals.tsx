// 301 redirect — new-arrivals handle isn't in Shopify yet, so this route
// hot-swaps to a live-filtered /shop view. Keeps any old links / bookmarks
// alive (zero-downtime infrastructure rule).

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/collections/new-arrivals")({
  beforeLoad: () => {
    throw redirect({
      to: "/shop",
      search: { sort: "CREATED_AT-true", inStock: "true" } as never,
    });
  },
});
