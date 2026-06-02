// Archived. The /compare hub has been retired; SEO equity now flows to /in-rome.
// Comparison data is preserved in src/lib/comparisons.ts for future single-angle stories.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/compare/")({
  beforeLoad: () => {
    throw redirect({ to: "/in-rome", statusCode: 301 });
  },
  component: () => null,
});
