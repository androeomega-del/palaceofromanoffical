import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/edits/yacht-edit")({
  component: () => <Outlet />,
});
