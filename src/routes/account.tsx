import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your Account — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountLayout,
});

function AccountLayout() {
  return (
    <main className="studio obsidian min-h-screen bg-canvas pt-16 pb-24">
      <div className="max-w-2xl mx-auto px-6">
        <Outlet />
      </div>
    </main>
  );
}
