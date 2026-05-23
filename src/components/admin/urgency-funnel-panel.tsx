import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Loader2, Eye, MousePointerClick, ShoppingBag } from "lucide-react";
import { getUrgencyFunnel } from "@/lib/urgency-funnel.functions";

export function UrgencyFunnelPanel() {
  const fn = useServerFn(getUrgencyFunnel);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "urgency-funnel"],
    queryFn: () => fn(),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
      </Card>
    );
  }
  if (error || !data) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Could not load urgency funnel.
      </Card>
    );
  }

  const maxStep = Math.max(data.views, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-medium">Urgency conversion</h2>
          <p className="text-xs text-muted-foreground">
            Scarcity surfaces seen, clicked, and carted — last {data.windowDays} days.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Scarcity views" value={data.views} icon={<Eye className="h-4 w-4" />} />
        <Metric
          label="Clicks → PDP"
          value={data.clicks}
          sub={`${data.ctrPct}% CTR`}
          icon={<MousePointerClick className="h-4 w-4" />}
        />
        <Metric
          label="Add to cart"
          value={data.carts}
          sub={`${data.cartRatePct}% of clicks`}
          icon={<ShoppingBag className="h-4 w-4" />}
        />
        <Metric
          label="View → cart"
          value={`${data.conversionPct}%`}
          sub="end-to-end"
        />
      </div>

      <Card className="p-5">
        <p className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
          Funnel
        </p>
        <FunnelBar label="Scarcity views" value={data.views} max={maxStep} />
        <FunnelBar label="Scarcity clicks" value={data.clicks} max={maxStep} />
        <FunnelBar label="Scarcity carts" value={data.carts} max={maxStep} />
      </Card>

      <Card className="p-5">
        <p className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
          Top urgency drivers
        </p>
        {data.topHandles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scarcity events recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4 tabular-nums">Views</th>
                  <th className="py-2 pr-4 tabular-nums">Clicks</th>
                  <th className="py-2 pr-4 tabular-nums">Carts</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.topHandles.map((h) => (
                  <tr key={h.handle}>
                    <td className="py-2 pr-4 font-mono text-xs">{h.handle}</td>
                    <td className="py-2 pr-4 tabular-nums">{h.views}</td>
                    <td className="py-2 pr-4 tabular-nums">{h.clicks}</td>
                    <td className="py-2 pr-4 tabular-nums">{h.carts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  );
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${Math.max(pct, value > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}
