import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useCustomerStore } from "@/stores/customer-store";
import { getCustomer, type CustomerOrder } from "@/lib/shopify-customer";
import { formatPrice } from "@/lib/shopify";

export const Route = createFileRoute("/account/")({
  component: AccountDashboard,
});

function AccountDashboard() {
  const getValidToken = useCustomerStore((s) => s.getValidToken);
  const signOut = useCustomerStore((s) => s.signOut);
  const navigate = useNavigate();
  const token = getValidToken();

  useEffect(() => {
    if (!token) navigate({ to: "/account/login" });
  }, [token, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["customer", token],
    queryFn: () => getCustomer(token as string),
    enabled: !!token,
    staleTime: 30_000,
  });

  if (!token) return null;
  if (isLoading) {
    return <p className="text-sm uppercase tracking-[0.3em] text-ink/50">Loading…</p>;
  }
  if (!data || data.errors.length > 0 || !data.data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink/70">
          {data?.errors[0]?.message ?? "We couldn't load your account."}
        </p>
        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/account/login" });
          }}
          className="text-[11px] uppercase tracking-[0.3em] underline hover:text-bronze"
        >
          Sign in again
        </button>
      </div>
    );
  }

  const { firstName, email, orders } = data.data;

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze">Your Account</p>
        <h1 className="font-serif text-3xl md:text-4xl">
          Welcome{firstName ? `, ${firstName}` : ""}.
        </h1>
        {email && <p className="text-sm text-ink/60">{email}</p>}
      </header>

      <section className="space-y-4">
        <h2 className="text-[11px] uppercase tracking-[0.3em] text-ink">Order History</h2>
        {orders.length === 0 ? (
          <div className="border border-ink/15 p-8 text-center space-y-4">
            <p className="text-sm text-ink/70">You haven't placed any orders yet.</p>
            <Link
              to="/shop"
              className="inline-block text-[11px] uppercase tracking-[0.3em] underline hover:text-bronze"
            >
              Discover the edit
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-ink/10 border-y border-ink/10">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </section>

      <button
        onClick={async () => {
          await signOut();
          navigate({ to: "/" });
        }}
        className="text-[11px] uppercase tracking-[0.3em] text-ink/60 hover:text-bronze underline"
      >
        Sign out
      </button>
    </div>
  );
}

function OrderRow({ order }: { order: CustomerOrder }) {
  const date = new Date(order.processedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <li className="py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">Order {order.name}</p>
        <p className="text-xs text-ink/60">
          {date} · {order.fulfillmentStatus ?? "Processing"} ·{" "}
          {order.financialStatus ?? "—"}
        </p>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-sm tabular-nums">
          {formatPrice(order.currentTotalPrice)}
        </span>
        <a
          href={order.statusUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] uppercase tracking-[0.3em] underline hover:text-bronze"
        >
          View order
        </a>
      </div>
    </li>
  );
}
