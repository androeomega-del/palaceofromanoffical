import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { getMetaAbReport, type MetaAbReport, type EventType } from "@/lib/meta-ab-report.functions";

export const Route = createFileRoute("/admin/meta-ab")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  head: () => ({
    meta: [
      { title: "Meta A/B — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MetaAbDashboard,
});

function MetaAbDashboard() {
  const fetchReport = useServerFn(getMetaAbReport);
  const [days, setDays] = useState(30);
  const [eventType, setEventType] = useState<EventType>("add_to_cart");
  const { data, isLoading, error } = useQuery({
    queryKey: ["meta-ab-report", days, eventType],
    queryFn: () => fetchReport({ data: { days, eventType } }),
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-serif text-3xl mb-2">Meta A/B Report</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Homepage + collection meta-tag test. Bots are forced to variant A and excluded from exposures.
      </p>

      <div className="flex gap-4 mb-8 text-xs uppercase tracking-[0.2em]">
        <label className="flex items-center gap-2">
          Window
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border px-2 py-1 bg-background">
            <option value={7}>7d</option>
            <option value={30}>30d</option>
            <option value={90}>90d</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          Event
          <select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)} className="border px-2 py-1 bg-background">
            <option value="add_to_cart">add_to_cart</option>
            <option value="checkout_started">checkout_started</option>
            <option value="reached_checkout">reached_checkout</option>
            <option value="purchase">purchase</option>
          </select>
        </label>
      </div>

      {isLoading && <p className="text-sm">Loading…</p>}
      {error && <p className="text-sm text-destructive">Failed to load report. Admin access required.</p>}
      {data && <ReportTables report={data} />}
    </div>
  );
}

function ReportTables({ report }: { report: MetaAbReport }) {
  return (
    <div className="space-y-12">
      {report.pages.map((pt) => (
        <section key={pt.page_type}>
          <h2 className="text-xs uppercase tracking-[0.3em] text-bronze mb-3">{pt.page_type}</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider">
                <th className="py-2">Variant</th>
                <th className="py-2 text-right">Exposures</th>
                <th className="py-2 text-right">Conv.</th>
                <th className="py-2 text-right">CR</th>
                <th className="py-2 text-right">Lift vs A</th>
              </tr>
            </thead>
            <tbody>
              {pt.variants.map((v) => (
                <tr key={v.variant} className="border-b">
                  <td className="py-2">{v.variant}{v.variant === "A" ? " (default)" : ""}</td>
                  <td className="py-2 text-right tabular-nums">{v.exposures.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums">{v.primaryConversions.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums">{(v.conversionRate * 100).toFixed(2)}%</td>
                  <td className="py-2 text-right tabular-nums">
                    {v.variant === "B" && pt.lift !== null ? `${(pt.lift * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted-foreground">
            Significance: <span className="font-medium">{pt.significance.label}</span>
            {pt.significance.z !== null && ` · z=${pt.significance.z.toFixed(2)}, p=${pt.significance.p!.toFixed(4)}`}
          </p>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">
        Generated {new Date(report.generatedAt).toLocaleString()} · {report.windowDays}-day window · event {report.eventType}
      </p>
    </div>
  );
}
