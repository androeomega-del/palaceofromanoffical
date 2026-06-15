import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Hover/focus prefetch for every <Link>. Loaders fire on intent so the
    // route + its primed query are usually warm by the time the user clicks.
    defaultPreload: "intent",
    defaultPreloadDelay: 80,
    // Let TanStack Query own freshness (it has its own staleTime per query).
    defaultPreloadStaleTime: 0,
  });

  return router;
};
