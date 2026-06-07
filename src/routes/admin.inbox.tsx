import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { getInbox } from "@/lib/admin-management.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Bell, ShoppingBag, Inbox as InboxIcon } from "lucide-react";

export const Route = createFileRoute("/admin/inbox")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: AdminInbox,
  head: () => ({
    meta: [
      { title: "Inbox — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Tab = "contact" | "newsletter" | "stock" | "carts";

const fmt = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

function AdminInbox() {
  const [tab, setTab] = useState<Tab>("contact");
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "inbox"],
    queryFn: () => getInbox(),
    refetchInterval: 60_000,
  });

  const counts = {
    contact: data?.contact_messages.length ?? 0,
    newsletter: data?.newsletter.length ?? 0,
    stock: data?.stock_alerts.length ?? 0,
    carts: data?.abandoned_carts.length ?? 0,
  };

  return (
    <main className="min-h-screen bg-canvas px-6 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/admin"
          className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Admin
        </Link>
        <h1 className="font-serif text-3xl md:text-4xl mt-3">Inbox</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Read-only feeds of inbound activity.
        </p>

        <div className="flex gap-2 mb-6 flex-wrap">
          <TabBtn icon={Mail} label="Contact" count={counts.contact} active={tab === "contact"} onClick={() => setTab("contact")} />
          <TabBtn icon={InboxIcon} label="Newsletter" count={counts.newsletter} active={tab === "newsletter"} onClick={() => setTab("newsletter")} />
          <TabBtn icon={Bell} label="Stock alerts" count={counts.stock} active={tab === "stock"} onClick={() => setTab("stock")} />
          <TabBtn icon={ShoppingBag} label="Abandoned carts" count={counts.carts} active={tab === "carts"} onClick={() => setTab("carts")} />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tab === "contact" ? (
          <div className="space-y-3">
            {data?.contact_messages.length ? (
              data.contact_messages.map((m) => (
                <Card key={m.id} className="p-5">
                  <div className="flex justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-serif text-base">{m.name}</p>
                      <a href={`mailto:${m.email}`} className="text-xs text-muted-foreground underline">
                        {m.email}
                      </a>
                    </div>
                    <span className="text-xs text-muted-foreground">{fmt(m.created_at)}</span>
                  </div>
                  <p className="text-sm font-semibold mt-3">{m.subject}</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{m.message}</p>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-sm">No messages.</Card>
            )}
          </div>
        ) : tab === "newsletter" ? (
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Email</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Source</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Consent</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">When</th>
                </tr>
              </thead>
              <tbody>
                {data?.newsletter.map((n) => (
                  <tr key={n.id} className="border-t border-border/40">
                    <td className="px-4 py-3">{n.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{n.source ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={n.marketing_consent ? "default" : "outline"}>
                        {n.marketing_consent ? "yes" : "no"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(n.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : tab === "stock" ? (
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Email</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Product</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Variant</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Notified</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Created</th>
                </tr>
              </thead>
              <tbody>
                {data?.stock_alerts.map((s) => (
                  <tr key={s.id} className="border-t border-border/40">
                    <td className="px-4 py-3">{s.email}</td>
                    <td className="px-4 py-3">{s.product_title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.variant_title ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(s.notified_at)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Customer</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Items</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Total</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Status</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]">Last activity</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-[10px]" />
                </tr>
              </thead>
              <tbody>
                {data?.abandoned_carts.map((c) => (
                  <tr key={c.id} className="border-t border-border/40">
                    <td className="px-4 py-3">
                      <div>{c.customer_name ?? "—"}</div>
                      <div className="text-muted-foreground">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{c.item_count}</td>
                    <td className="px-4 py-3 tabular-nums">${Number(c.total_usd).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {c.recovered_at ? (
                        <Badge variant="default">recovered</Badge>
                      ) : c.recovery_email_count ? (
                        <Badge variant="secondary">emailed ×{c.recovery_email_count}</Badge>
                      ) : (
                        <Badge variant="outline">open</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmt(c.last_activity_at)}</td>
                    <td className="px-4 py-3">
                      {c.checkout_url ? (
                        <a
                          href={c.checkout_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline"
                        >
                          Checkout
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </main>
  );
}

function TabBtn({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button variant={active ? "default" : "outline"} size="sm" onClick={onClick}>
      <Icon className="h-3.5 w-3.5 mr-1.5" />
      {label}
      <span className="ml-2 text-[10px] opacity-70">{count}</span>
    </Button>
  );
}
