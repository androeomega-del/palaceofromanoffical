import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { getEmailRecoveryDashboard } from "@/lib/email-recovery-dashboard.functions";
import { callAdminServerFn } from "@/lib/admin-server-call";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2, Download } from "lucide-react";

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

const GAP_FIELDS: Array<{ key: keyof CartDetail; label: string }> = [
  { key: "created_at", label: "created" },
  { key: "first_add_at", label: "first add" },
  { key: "reached_checkout_at", label: "checkout reached" },
  { key: "recovery_email_sent_at", label: "email sent" },
];

function detectGaps(c: CartDetail): string[] {
  const gaps: string[] = [];
  for (const f of GAP_FIELDS) {
    if (!c[f.key]) gaps.push(f.label);
  }
  // Logical inconsistencies
  if (c.first_add_at && c.item_count === 0) gaps.push("items empty after add");
  if (c.recovered_at && !c.recovery_email_sent_at) gaps.push("recovered w/o email");
  if (c.checkout_started_at && !c.first_add_at) gaps.push("checkout w/o add");
  return gaps;
}

function CartSparkline({ cart: c }: { cart: CartDetail }) {
  // Build timeline points: created, each add_to_cart, checkout_started, reached_checkout, email sent, recovered
  const start = new Date(c.created_at).getTime();
  const endCandidates = [
    c.last_activity_at,
    c.recovered_at,
    c.recovery_email_sent_at,
    c.reached_checkout_at,
    c.last_add_at,
  ]
    .filter(Boolean)
    .map((s) => new Date(s as string).getTime());
  const end = Math.max(start + 60_000, ...endCandidates);
  const span = Math.max(1, end - start);
  const W = 160;
  const H = 28;
  const x = (iso: string | null) => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    return Math.max(0, Math.min(W, ((t - start) / span) * W));
  };
  const addEvents = c.events.filter((e) => e.event_type === "add_to_cart");
  const points: Array<{ x: number; color: string; title: string }> = [];
  points.push({ x: 0, color: "#9ca3af", title: `created ${c.created_at}` });
  for (const e of addEvents) {
    const px = x(e.created_at);
    if (px != null) points.push({ x: px, color: "#0d9488", title: `add_to_cart ${e.created_at}` });
  }
  const cs = x(c.checkout_started_at);
  if (cs != null) points.push({ x: cs, color: "#2563eb", title: `checkout_started` });
  const rc = x(c.reached_checkout_at);
  if (rc != null) points.push({ x: rc, color: "#1d4ed8", title: `reached_checkout` });
  const es = x(c.recovery_email_sent_at);
  if (es != null) points.push({ x: es, color: "#a16207", title: `email_sent` });
  const rv = x(c.recovered_at);
  if (rv != null) points.push({ x: rv, color: "#059669", title: `recovered` });
  return (
    <svg width={W} height={H} className="block">
      <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="currentColor" strokeOpacity={0.15} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={H / 2} r={3.5} fill={p.color}>
          <title>{p.title}</title>
        </circle>
      ))}
    </svg>
  );
}

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCartsCsv(carts: CartDetail[]) {
  const header = [
    "cart_id","email","customer_name","session_id","items","total_usd","item_count",
    "created_at","first_add_at","last_add_at","checkout_started_at","reached_checkout_at",
    "last_activity_at","recovery_email_sent_at","recovery_email_count","recovered_at",
    "event_count","data_gaps","page_path","checkout_url","event_type","event_time",
    "event_product_handle","event_product_title","event_variant","event_quantity","event_price_usd",
  ];
  const rows: string[] = [header.join(",")];
  for (const c of carts) {
    const gaps = detectGaps(c).join("|");
    const base = [
      c.id, c.email, c.customer_name ?? "", c.session_id ?? "", c.item_count, c.total_usd, c.item_count,
      c.created_at, c.first_add_at ?? "", c.last_add_at ?? "", c.checkout_started_at ?? "",
      c.reached_checkout_at ?? "", c.last_activity_at, c.recovery_email_sent_at ?? "",
      c.recovery_email_count, c.recovered_at ?? "", c.event_count, gaps,
      c.page_path ?? "", c.checkout_url ?? "",
    ];
    if (c.events.length === 0) {
      rows.push([...base, "", "", "", "", "", "", ""].map(csvEscape).join(","));
    } else {
      for (const e of c.events) {
        rows.push(
          [...base, e.event_type, e.created_at, e.product_handle ?? "", e.product_title ?? "",
           e.variant_title ?? "", e.quantity, e.price_usd ?? ""].map(csvEscape).join(",")
        );
      }
    }
  }
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `abandoned-carts-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

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
        <td className="p-3"><CartSparkline cart={c} /></td>
        <td className="p-3">
          {(() => {
            const gaps = detectGaps(c);
            if (gaps.length === 0)
              return <span className="text-emerald-700 text-[10px]">complete</span>;
            return (
              <span
                className="inline-flex items-center gap-1 text-[10px] text-amber-700"
                title={`Missing: ${gaps.join(", ")}`}
              >
                <AlertTriangle className="h-3 w-3" />
                {gaps.length} gap{gaps.length > 1 ? "s" : ""}
              </span>
            );
          })()}
        </td>
      </tr>
      {open ? (
        <tr className="bg-muted/20">
          <td colSpan={13} className="p-4">
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

function toLocalDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

type TrendBucket = {
  key: string;
  label: string;
  start: number;
  created: number;
  withAdd: number;
  withCheckout: number;
  withReached: number;
  recovered: number;
};

function buildTrendBuckets(
  carts: CartDetail[],
  fromT: number,
  toT: number,
): { buckets: TrendBucket[]; granularity: "day" | "week" } {
  const spanDays = Math.max(1, Math.ceil((toT - fromT) / 86400_000));
  const granularity: "day" | "week" = spanDays > 45 ? "week" : "day";
  const bucketMs = granularity === "week" ? 7 * 86400_000 : 86400_000;
  const startDate = new Date(fromT);
  startDate.setUTCHours(0, 0, 0, 0);
  if (granularity === "week") {
    const dow = startDate.getUTCDay();
    const offset = (dow + 6) % 7;
    startDate.setUTCDate(startDate.getUTCDate() - offset);
  }
  const startMs = startDate.getTime();
  const count = Math.max(1, Math.ceil((toT - startMs) / bucketMs));
  const buckets: TrendBucket[] = Array.from({ length: count }, (_, i) => {
    const s = startMs + i * bucketMs;
    const d = new Date(s);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
    return {
      key: String(s),
      label,
      start: s,
      created: 0,
      withAdd: 0,
      withCheckout: 0,
      withReached: 0,
      recovered: 0,
    };
  });
  for (const c of carts) {
    const t = new Date(c.created_at).getTime();
    const idx = Math.floor((t - startMs) / bucketMs);
    if (idx < 0 || idx >= buckets.length) continue;
    const b = buckets[idx];
    b.created++;
    if (c.first_add_at) b.withAdd++;
    if (c.checkout_started_at) b.withCheckout++;
    if (c.reached_checkout_at) b.withReached++;
    if (c.recovered_at) b.recovered++;
  }
  return { buckets, granularity };
}

function BehavioralTrendChart({
  buckets,
  granularity,
}: {
  buckets: TrendBucket[];
  granularity: "day" | "week";
}) {
  const W = 760;
  const H = 240;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 36;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxY = Math.max(1, ...buckets.map((b) => b.created));
  const n = buckets.length;
  const bandW = innerW / Math.max(1, n);
  const barW = Math.max(2, bandW * 0.65);

  const series: Array<{ key: keyof TrendBucket; label: string; color: string }> = [
    { key: "withAdd", label: "Added to cart", color: "#0d9488" },
    { key: "withCheckout", label: "Started checkout", color: "#2563eb" },
    { key: "withReached", label: "Reached Shopify", color: "#1d4ed8" },
    { key: "recovered", label: "Recovered", color: "#059669" },
  ];

  const yTicks = 4;
  const tickStep = Math.max(1, Math.ceil(maxY / yTicks));
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => i * tickStep);

  const linePath = (key: keyof TrendBucket, color: string) => {
    const d = buckets
      .map((b, i) => {
        const v = Number(b[key] ?? 0);
        const x = padL + i * bandW + bandW / 2;
        const y = padT + innerH - (v / Math.max(1, maxY)) * innerH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    return <path d={d} fill="none" stroke={color} strokeWidth={1.75} />;
  };

  const labelEvery = Math.max(1, Math.ceil(n / 10));

  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Funnel trend · {granularity === "week" ? "weekly" : "daily"}
        </div>
        <div className="flex flex-wrap gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-2 bg-muted-foreground/40 rounded-sm" />
            Created
          </span>
          {series.map((s) => (
            <span key={String(s.key)} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-0.5"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg width={W} height={H} className="block min-w-full">
          {ticks.map((t) => {
            const y = padT + innerH - (t / Math.max(1, maxY)) * innerH;
            return (
              <g key={t}>
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                />
                <text
                  x={padL - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={10}
                  fill="currentColor"
                  opacity={0.55}
                >
                  {t}
                </text>
              </g>
            );
          })}
          {buckets.map((b, i) => {
            const h = (b.created / Math.max(1, maxY)) * innerH;
            const x = padL + i * bandW + (bandW - barW) / 2;
            const y = padT + innerH - h;
            return (
              <rect
                key={b.key}
                x={x}
                y={y}
                width={barW}
                height={h}
                fill="currentColor"
                opacity={0.18}
              >
                <title>
                  {b.label}: {b.created} created · {b.withAdd} add ·{" "}
                  {b.withCheckout} checkout · {b.withReached} reached ·{" "}
                  {b.recovered} recovered
                </title>
              </rect>
            );
          })}
          {series.map((s) => (
            <g key={String(s.key)}>{linePath(s.key, s.color)}</g>
          ))}
          {buckets.map((b, i) => {
            if (i % labelEvery !== 0 && i !== n - 1) return null;
            const x = padL + i * bandW + bandW / 2;
            return (
              <text
                key={b.key}
                x={x}
                y={H - padB / 2 + 4}
                textAnchor="middle"
                fontSize={10}
                fill="currentColor"
                opacity={0.55}
              >
                {b.label}
              </text>
            );
          })}
        </svg>
      </div>
      {buckets.every((b) => b.created === 0) ? (
        <p className="mt-2 text-xs text-muted-foreground">
          No carts created in this range.
        </p>
      ) : null}
    </Card>
  );
}

function AdminEmailRecovery() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin", "email-recovery"],
    queryFn: () => callAdminServerFn(getEmailRecoveryDashboard),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const today = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(
    () => toLocalDateInput(new Date(today.getTime() - 30 * 86400_000)),
    [today]
  );
  const defaultTo = useMemo(() => toLocalDateInput(today), [today]);
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  const cartsDetail = (data?.cartsDetail ?? []) as CartDetail[];
  const filteredCarts = useMemo(() => {
    const fromT = fromDate ? new Date(fromDate + "T00:00:00").getTime() : -Infinity;
    const toT = toDate ? new Date(toDate + "T23:59:59").getTime() : Infinity;
    return cartsDetail.filter((c) => {
      const t = new Date(c.created_at).getTime();
      return t >= fromT && t <= toT;
    });
  }, [cartsDetail, fromDate, toDate]);

  const filteredCohort = useMemo(() => {
    const mins = (a: string | null, b: string | null) =>
      a && b ? Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 60000) : null;
    const med = (arr: number[]) => {
      if (!arr.length) return 0;
      const s = [...arr].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
    };
    const ages: number[] = [], emails: number[] = [], recs: number[] = [];
    let withCheckout = 0, withReached = 0, gappy = 0;
    for (const c of filteredCarts) {
      const a = mins(c.created_at, c.last_activity_at); if (a !== null) ages.push(a);
      const e = mins(c.created_at, c.recovery_email_sent_at); if (e !== null) emails.push(e);
      const r = mins(c.recovery_email_sent_at, c.recovered_at); if (r !== null) recs.push(r);
      if (c.checkout_started_at) withCheckout++;
      if (c.reached_checkout_at) withReached++;
      if (detectGaps(c).length > 0) gappy++;
    }
    return {
      medianAgeMin: med(ages),
      medianTimeToFirstEmailMin: med(emails),
      medianTimeToRecoverMin: med(recs),
      withCheckoutStarted: withCheckout,
      withReachedCheckout: withReached,
      gappy,
    };
  }, [filteredCarts]);

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

            {/* Date range filter — applies to Behavioral Timing + Cart Detail */}
            <section>
              <Card className="p-4 flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    max={toDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border border-ink/20 rounded px-2 py-1 text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border border-ink/20 rounded px-2 py-1 text-sm bg-background"
                  />
                </div>
                <div className="flex gap-2">
                  {[
                    { label: "7d", days: 7 },
                    { label: "30d", days: 30 },
                    { label: "All", days: 365 },
                  ].map((p) => (
                    <Button
                      key={p.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFromDate(toLocalDateInput(new Date(Date.now() - p.days * 86400_000)));
                        setToDate(toLocalDateInput(new Date()));
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                  {filteredCarts.length} cart{filteredCarts.length === 1 ? "" : "s"} in range
                </div>
              </Card>
            </section>

            {/* Behavioral cohort timing (filtered) */}
            <section>
              <h2 className="font-serif text-2xl mb-4">Behavioral Timing</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Stat
                  label="Median cart age"
                  value={fmtDuration(filteredCohort.medianAgeMin)}
                  hint="Created → last activity"
                />
                <Stat
                  label="Median time → 1st email"
                  value={fmtDuration(filteredCohort.medianTimeToFirstEmailMin)}
                  hint="Cart created → recovery sent"
                />
                <Stat
                  label="Median time → recovery"
                  value={fmtDuration(filteredCohort.medianTimeToRecoverMin)}
                  hint="Email sent → purchase"
                  tone="good"
                />
                <Stat
                  label="Reached checkout step"
                  value={fmt(filteredCohort.withCheckoutStarted)}
                  hint={`Of ${filteredCarts.length} carts in range`}
                />
                <Stat
                  label="Reached Shopify checkout"
                  value={fmt(filteredCohort.withReachedCheckout)}
                  hint={`Of ${filteredCarts.length} carts in range`}
                />
              </div>
              {filteredCohort.gappy > 0 ? (
                <p className="mt-3 text-xs text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {filteredCohort.gappy} of {filteredCarts.length} carts have missing
                  timestamps (created · first add · checkout reached · email sent). Open a row
                  to see which fields are missing.
                </p>
              ) : null}
            </section>

            {/* Detailed cart log — every timestamp */}
            <section>
              <div className="flex items-baseline justify-between mb-4 gap-4 flex-wrap">
                <h2 className="font-serif text-2xl">Abandoned Cart Detail</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {filteredCarts.length} cart{filteredCarts.length === 1 ? "" : "s"} ·
                    sparkline shows created → adds → checkout
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filteredCarts.length === 0}
                    onClick={() => exportCartsCsv(filteredCarts)}
                  >
                    <Download className="h-4 w-4 mr-1.5" /> CSV
                  </Button>
                </div>
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
                        <th className="text-left p-3">Timeline</th>
                        <th className="text-left p-3">Gaps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCarts.map((c) => (
                        <CartDetailRow key={c.id} cart={c} />
                      ))}
                      {filteredCarts.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="p-6 text-center text-muted-foreground">
                            No abandoned carts in selected range.
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
