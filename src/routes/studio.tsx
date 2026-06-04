/**
 * /studio — standalone editorial homepage shell (draft mirror of `/`).
 *
 * Thin wrapper around <HomeStudioLayout variant="standalone"/>:
 *  - Suppresses the global SiteHeader/SiteFooter via useChromeStore
 *    (handled inside HomeStudioLayout when variant === "standalone").
 *  - Concierge wired to the existing `fetchConciergePicks` serverFn.
 *  - Asymmetric grid fed by live `newThisWeekQueryOptions` Shopify handles.
 *  - Noindex — draft surface, not a public page.
 */
import { createFileRoute } from "@tanstack/react-router";
import { HomeStudioLayout } from "@/components/home-studio/home-studio-layout";
import { newThisWeekQueryOptions } from "@/lib/rails/queries";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Studio — Palace of Roman" },
      { name: "description", content: "A minimal design exploration for Palace of Roman." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(newThisWeekQueryOptions("Women"));
    return null;
  },
  component: StudioPage,
});

function StudioPage() {
  return <HomeStudioLayout variant="standalone" />;
}
