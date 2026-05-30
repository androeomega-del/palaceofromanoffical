import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";

type Search = { order?: string; email?: string };

export const Route = createFileRoute("/order-confirmed")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    order: typeof s.order === "string" ? s.order : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Order Confirmed — Palace of Roman" },
      {
        name: "description",
        content:
          "Your order is confirmed. Each piece ships insured, in discreet outer packaging, with the maison's original presentation box inside — a quiet, white-glove arrival.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Order Confirmed — Palace of Roman" },
      {
        property: "og:description",
        content:
          "Insured worldwide delivery in discreet packaging — your Palace of Roman order is on its way.",
      },
    ],
  }),
  component: OrderConfirmedPage,
});

function OrderConfirmedPage() {
  const { order, email } = useSearch({ from: "/order-confirmed" });
  const clearCart = useCartStore((s) => s.clearCart);

  // The buyer just completed a Shopify checkout — clear any lingering local cart state.
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <main className="min-h-[80vh] bg-canvas flex items-center">
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze">
          Palace of Roman
        </p>
        <h1 className="mt-6 font-serif text-4xl md:text-5xl text-ink">
          Thank you for your order
        </h1>
        <p className="mt-6 text-sm md:text-base text-muted-foreground leading-relaxed">
          Your order has been received and is being prepared for dispatch.
          {email ? (
            <>
              {" "}A confirmation has been sent to{" "}
              <span className="text-ink">{email}</span>.
            </>
          ) : (
            <> A confirmation has been sent to your inbox.</>
          )}
        </p>

        {order && (
          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-ink/70">
            Order reference&nbsp;·&nbsp;
            <span className="text-ink">{order}</span>
          </p>
        )}

        <div className="mt-12 border-t border-ink/10 pt-10 grid sm:grid-cols-2 gap-6 text-left">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-bronze">
              Dispatch
            </p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Pieces ship within 3–5 business days from the maison or its
              authorised distributor. Tracking is emailed as soon as your parcel
              leaves the atelier.
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-bronze">
              Concierge
            </p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Questions about your order, fit, or delivery? Write to{" "}
              <a
                href="mailto:concierge@palaceofromanofficial.com"
                className="text-ink underline-offset-4 hover:underline"
              >
                concierge@palaceofromanofficial.com
              </a>
              .
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            className="bg-ink text-canvas hover:bg-ink/90 rounded-none h-12 px-8 text-[11px] uppercase tracking-[0.25em] font-medium"
          >
            <Link to="/">Continue Shopping</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-ink/20 hover:bg-ink/5 rounded-none h-12 px-8 text-[11px] uppercase tracking-[0.25em] font-medium"
          >
            <Link to="/contact">Contact Concierge</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
