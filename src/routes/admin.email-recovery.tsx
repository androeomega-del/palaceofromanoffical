import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { getEmailRecoveryDashboard } from "@/lib/email-recovery-dashboard.functions";
import { callAdminServerFn } from "@/lib/admin-server-call";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admin/email-recovery")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: AdminEmailRecovery,
  head: () => ({
    meta: [
      { title: "Email Recovery — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);
const usd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "good";
}) {
  const toneCls = tone === "warn" ? "text-red-700" : tone === "good" ? "text-emerald-700" : "";
  return (
    <Card className="p-6">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className={`mt-3 font-serif text-3xl md:text-4xl tabular-nums ${toneCls}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDuration(min: number): string {
  if (!min || min <= 0) return "—";
  if (min < 60) return `${Math.round(min)}m`;
  const h = min / 60;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

type CartDetail = {
  id: string;
  email: string;
  customer_name: string | null;
  session_id: string | null;
  total_usd: number;
  item_count: number;
  items: unknown;
  page_path: string | null;
  user_agent: string | null;
  checkout_url: string | null;
  created_at: string;
  last_activity_at: string;
  updated_at: string;
  first_add_at: string | null;
  last_add_at: string | null;
  checkout_started_at: string | null;
  reached_checkout_at: string | null;
  recovery_email_sent_at: string | null;
  recovery_email_count: number;
  recovered_at: string | null;
  event_count: number;
  events: Array<{
    id: string;
    event_type: string;
    product_handle: string | null;
    product_title: string | null;
    variant_title: string | null;
    quantity: number;
    price_usd: number | null;
    page_path: string | null;
    created_at: string;
  }>;
};

function CartDetailRow({ cart: c }: { cart: CartDetail }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="border-t border-ink/10 hover:bg-muted/30 cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <td className="p-3 font-mono truncate max-w-[220px]" title={c.email}>
          {c.email}
          {c.customer_name ? (
            <div className="text-[10px] text-muted-foreground">{c.customer_name}</div>
          ) : null}
        </td>
        <td className="p-3 text-right tabular-nums">{c.item_count}</td>
        <td className="p-3 text-right tabular-nums">{usd(c.total_usd)}</td>
        <td className="p-3 whitespace-nowrap">{formatWhen(c.created_at)}</td>
        <td className="p-3 whitespace-nowrap">{formatWhen(c.first_add_at)}</td>
        <td className="p-3 whitespace-nowrap">{formatWhen(c.last_add_at)}</td>
        <td className="p-3 whitespace-nowrap">
          {c.reached_checkout_at
            ? formatWhen(c.reached_checkout_at)
            : c.checkout_started_at
              ? formatWhen(c.checkout_started_at)
              : "—"}
        </td>
        <td className="p-3 whitespace-nowrap">{formatWhen(c.last_activity_at)}</td>
        <td className="p-3 whitespace-nowrap">
          {c.recovery_email_sent_at ? (
            <span>
              {formatWhen(c.recovery_email_sent_at)}
              {c.recovery_email_count > 1 ? (
                <span className="ml-1 text-muted-foreground">×{c.recovery_email_count}</span>
              ) : null}
            </span>
          ) : (
            "—"
          )}
        </td>
        <td className="p-3 whitespace-nowrap">
          {c.recovered_at ? (
            <span className="text-emerald-700">{formatWhen(c.recovered_at)}</span>
          ) : (
            "—"
          )}
        </td>
        <td className="p-3 text-right tabular-nums">{c.event_count}</td>
      </tr>
      {open ? (
        <tr className="bg-muted/20">
          <td colSpan={11} className="p-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Session context
                </div>
                <dl className="text-xs space-y-1">
                  <div className="flex gap-2"><dt className="text-muted-foreground w-24">Session</dt><dd className="font-mono break-all">{c.session_id ?? "—"}</dd></div>
                  <div className="flex gap-2"><dt className="text-muted-foreground w-24">Page</dt><dd className="break-all">{c.page_path ?? "—"}</dd></div>
                  <div className="flex gap-2"><dt className="text-muted-foreground w-24">User agent</dt><dd className="break-all">{c.user_agent ?? "—"}</dd></div>
                  <div className="flex gap-2"><dt className="text-muted-foreground w-24">Updated</dt><dd>{formatWhen(c.updated_at)}</dd></div>
                  {c.checkout_url ? (
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground w-24">Checkout</dt>
                      <dd className="break-all">
                        <a className="underline" href={c.checkout_url} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Event timeline ({c.events.length} of {c.event_count})
                </div>
                {c.events.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No granular cart_events for this session.
                  </p>
                ) : (
                  <ul className="text-xs space-y-1 max-h-72 overflow-auto">
                    {c.events.map((e) => (
                      <li key={e.id} className="flex gap-3 border-b border-ink/5 pb-1">
                        <span className="text-muted-foreground whitespace-nowrap w-32">
                          {formatWhen(e.created_at)}
                        </span>
                        <span className="uppercase tracking-wider text-[10px] w-28">
                          {e.event_type}
                        </span>
                        <span className="flex-1 truncate">
                          {e.product_title ?? e.product_handle ?? "—"}
                          {e.variant_title ? ` · ${e.variant_title}` : ""}
                          {e.quantity && e.quantity > 1 ? ` ×${e.quantity}` : ""}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {e.price_usd != null ? usd(Number(e.price_usd)) : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function AdminEmailRecovery() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "email-recovery"],
    queryFn: () => callAdminServerFn(getEmailRecoveryDashboard),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return (
    <main className="min-h-screen bg-canvas px-6 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">
              Admin · Lifecycle
            </p>
            <h1 className="font-serif text-4xl md:text-5xl">Email Recovery</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Cart recovery, opt-ins, and dispatch errors. Last 30 days.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Admin
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <Card className="p-6 border-red-200">
            <p className="text-sm text-red-700">
              Failed to load dashboard: {error instanceof Error ? error.message : String(error)}
            </p>
          </Card>
        ) : data ? (
          <div className="space-y-12">
            {/* Cart recovery */}
            <section>
              <h2 className="font-serif text-2xl mb-4">Cart Recovery</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat
                  label="Abandoned carts"
                  value={fmt(data.cartRecovery.totalCarts)}
                  hint="With captured email"
                />
                <Stat label="Recovery emails sent" value={fmt(data.cartRecovery.emailsSent)} />
                <Stat
                  label="Recovered"
                  value={fmt(data.cartRecovery.recovered)}
                  hint={`${data.cartRecovery.recoveryRate}% of sends`}
                  tone="good"
                />
                <Stat label="Recovered value" value={usd(data.cartRecovery.recoveredValueUsd)} />
                <Stat
                  label="Eligible right now"
                  value={fmt(data.cartRecovery.eligibleNow)}
                  hint="In 1h–24h window"
                />
              </div>
            </section>

            {/* Behavioral cohort timing */}
            <section>
              <h2 className="font-serif text-2xl mb-4">Behavioral Timing</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Stat
                  label="Median cart age"
                  value={fmtDuration(data.cohort.medianAgeMin)}
                  hint="Created → last activity"
                />
                <Stat
                  label="Median time → 1st email"
                  value={fmtDuration(data.cohort.medianTimeToFirstEmailMin)}
                  hint="Cart created → recovery sent"
                />
                <Stat
                  label="Median time → recovery"
                  value={fmtDuration(data.cohort.medianTimeToRecoverMin)}
                  hint="Email sent → purchase"
                  tone="good"
                />
                <Stat
                  label="Reached checkout step"
                  value={fmt(data.cohort.withCheckoutStarted)}
                  hint="Of latest 100 carts"
                />
                <Stat
                  label="Reached Shopify checkout"
                  value={fmt(data.cohort.withReachedCheckout)}
                  hint="Of latest 100 carts"
                />
              </div>
            </section>

            {/* Detailed cart log — every timestamp */}
            <section>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-serif text-2xl">Abandoned Cart Detail</h2>
                <span className="text-xs text-muted-foreground">
                  Latest {data.cartsDetail.length} · full timeline per cart
                </span>
              </div>
              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="text-left p-3">Email</th>
                        <th className="text-right p-3">Items</th>
                        <th className="text-right p-3">Total</th>
                        <th className="text-left p-3">Created</th>
                        <th className="text-left p-3">First add</th>
                        <th className="text-left p-3">Last add</th>
                        <th className="text-left p-3">Checkout</th>
                        <th className="text-left p-3">Last activity</th>
                        <th className="text-left p-3">Email sent</th>
                        <th className="text-left p-3">Recovered</th>
                        <th className="text-right p-3">Events</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cartsDetail.map((c) => (
                        <CartDetailRow key={c.id} cart={c} />
                      ))}
                      {data.cartsDetail.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="p-6 text-center text-muted-foreground">
                            No abandoned carts in the last 30 days.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>


            {/* Dispatch health */}
            <section>
              <h2 className="font-serif text-2xl mb-4">Dispatch Health</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Stat label="Sent (30d)" value={fmt(data.dispatch.sentCount)} tone="good" />
                <Stat
                  label="Failed (30d)"
                  value={fmt(data.dispatch.failedCount)}
                  tone={data.dispatch.failedCount > 0 ? "warn" : "default"}
                />
                <Stat label="Sent (7d)" value={fmt(data.dispatch.sentLast7d)} />
                <Stat
                  label="Failed (7d)"
                  value={fmt(data.dispatch.failedLast7d)}
                  tone={data.dispatch.failedLast7d > 0 ? "warn" : "default"}
                />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-4 w-4 text-red-700" />
                    <h3 className="font-serif text-lg">Recent errors</h3>
                  </div>
                  {data.dispatch.recentErrors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No dispatch errors in the last 30 days.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {data.dispatch.recentErrors.map((e) => (
                        <li key={e.id} className="border-b border-ink/10 pb-3 last:border-0">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-sm font-medium truncate">
                              {e.recipient_email}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                              {e.template_name}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                              {formatWhen(e.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-red-700 font-mono break-words">
                            {e.error_message ?? "Unknown error"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <h3 className="font-serif text-lg">Recent dispatches</h3>
                  </div>
                  {data.dispatch.recentSends.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No dispatches yet. The cron job runs every 15 minutes.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-96 overflow-auto">
                      {data.dispatch.recentSends.map((d) => (
                        <li
                          key={d.id}
                          className="flex items-baseline justify-between gap-3 text-xs"
                        >
                          <span
                            className={`inline-block min-w-[52px] text-[10px] uppercase tracking-wider ${
                              d.status === "sent" ? "text-emerald-700" : "text-red-700"
                            }`}
                          >
                            {d.status}
                          </span>
                          <span className="inline-block min-w-[100px] text-[10px] uppercase tracking-wider text-muted-foreground">
                            {d.template_name}
                          </span>
                          <span className="flex-1 truncate font-mono">{d.recipient_email}</span>
                          <span className="text-muted-foreground whitespace-nowrap">
                            {formatWhen(d.created_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </section>

            {/* Newsletter / consent */}
            <section>
              <h2 className="font-serif text-2xl mb-4">Newsletter & Consent</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat label="Total subscribers" value={fmt(data.newsletter.totalSubs)} />
                <Stat
                  label="Marketing opt-in"
                  value={`${data.newsletter.optInRate}%`}
                  hint={`${fmt(data.newsletter.optedIn)} of ${fmt(data.newsletter.totalSubs)}`}
                  tone="good"
                />
                <Stat label="New (7d)" value={fmt(data.newsletter.subsLast7d)} />
                <Stat label="New (30d)" value={fmt(data.newsletter.subsLast30d)} />
              </div>
              {data.newsletter.optedOut > 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {fmt(data.newsletter.optedOut)} subscribers did not opt in to marketing
                  (transactional only).
                </p>
              ) : null}
            </section>

            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Generated {formatWhen(data.generatedAt)}
            </p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
