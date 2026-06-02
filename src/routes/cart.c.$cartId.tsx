import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/cart/c/$cartId")({
  component: CheckoutRedirect,
});

function CheckoutRedirect() {
  const { cartId } = Route.useParams();
  const search = Route.useSearch() as Record<string, string | string[] | undefined>;

  useEffect(() => {
    const url = new URL(`https://checkout.palaceofromanofficial.com/cart/c/${encodeURIComponent(cartId)}`);
    for (const [key, value] of Object.entries(search)) {
      if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, v));
      else if (value) url.searchParams.set(key, value);
    }
    url.searchParams.set("_fd", "0");
    url.searchParams.set("channel", "online_store");
    window.location.replace(url.toString());
  }, [cartId, search]);

  return (
    <main className="min-h-screen bg-canvas text-ink flex items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Opening secure checkout…</p>
    </main>
  );
}