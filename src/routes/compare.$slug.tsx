// Archived. The /compare/[competitor] pages have been retired; all variants
// 301 to /in-rome so any link equity flows to the page we're actively ranking.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/compare/$slug")({
  beforeLoad: () => {
    throw redirect({ to: "/in-rome", statusCode: 301 });
  },
  component: () => null,
});
