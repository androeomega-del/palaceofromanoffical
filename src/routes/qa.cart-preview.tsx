import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CartDrawer } from "@/components/cart-drawer";

export const Route = createFileRoute("/qa/cart-preview")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "QA — Cart Preview" }] }),
  component: QACartPreview,
});

function QACartPreview() {
  const [open, setOpen] = useState(true);
  return (
    <main className="min-h-screen bg-canvas text-ink flex items-center justify-center px-6">
      <button
        onClick={() => setOpen(true)}
        className="text-xs uppercase tracking-[0.3em] border-b border-ink pb-1"
      >
        Re-open Cart Drawer
      </button>
      <CartDrawer open={open} onOpenChange={setOpen} />
    </main>
  );
}
