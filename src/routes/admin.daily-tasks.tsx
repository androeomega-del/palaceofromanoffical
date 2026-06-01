import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Flame,
  CalendarClock,
  Repeat,
  BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/admin/daily-tasks")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: DailyTasksPage,
  head: () => ({
    meta: [
      { title: "Daily Tasks — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Recurrence = "none" | "daily" | "weekly" | "monthly";

type DailyTask = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  sort_order: number;
  status: "todo" | "in_progress" | "done";
  notes: string | null;
  due_date: string | null;
  recurrence: Recurrence;
  recurrence_day: number | null;
  last_rolled_over_on: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type Completion = {
  id: string;
  task_id: string;
  completed_at: string;
  completed_on: string;
};

const PRIORITY_ORDER: Record<DailyTask["priority"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const PRIORITY_STYLES: Record<DailyTask["priority"], string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-700 border-slate-200",
};

const CATEGORIES = [
  "seo",
  "ux",
  "email",
  "catalog",
  "growth",
  "analytics",
  "maintenance",
  "general",
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

function getWeekStart(d = new Date()) {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}
function getWeekEnd(d = new Date()) {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diff = 7 - (day === 0 ? 7 : day); // to Sunday
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}
function getMonthStart(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}
function getMonthEnd(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);
}

function DailyTasksPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "open" | "done" | "today" | "overdue">("open");
  const [showNew, setShowNew] = useState(false);

  // Auto-rollover on mount
  useEffect(() => {
    (async () => {
      const { error } = await supabase.rpc("rollover_recurring_daily_tasks");
      if (!error) {
        qc.invalidateQueries({ queryKey: ["admin", "daily-tasks"] });
      }
    })();
  }, [qc]);

  const { data: tasks, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin", "daily-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_tasks")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DailyTask[];
    },
    refetchInterval: 60_000,
  });

  const { data: completions } = useQuery({
    queryKey: ["admin", "daily-task-completions"],
    queryFn: async () => {
      const since = daysAgoISO(60);
      const { data, error } = await supabase
        .from("daily_task_completions")
        .select("id, task_id, completed_at, completed_on")
        .gte("completed_on", since)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Completion[];
    },
    refetchInterval: 60_000,
  });

  const updateTask = useMutation({
    mutationFn: async (patch: Partial<DailyTask> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("daily_tasks").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "daily-tasks"] });
      qc.invalidateQueries({ queryKey: ["admin", "daily-task-completions"] });
    },
    onError: (e: Error) => toast.error("Update failed", { description: e.message }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task deleted");
      qc.invalidateQueries({ queryKey: ["admin", "daily-tasks"] });
    },
    onError: (e: Error) => toast.error("Delete failed", { description: e.message }),
  });

  const createTask = useMutation({
    mutationFn: async (input: {
      title: string;
      description: string;
      category: string;
      priority: DailyTask["priority"];
      recurrence: Recurrence;
      due_date: string | null;
    }) => {
      const maxSort = Math.max(0, ...(tasks ?? []).map((t) => t.sort_order));
      const { error } = await supabase.from("daily_tasks").insert({
        title: input.title,
        description: input.description || null,
        category: input.category,
        priority: input.priority,
        recurrence: input.recurrence,
        due_date: input.due_date,
        sort_order: maxSort + 10,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task added");
      setShowNew(false);
      qc.invalidateQueries({ queryKey: ["admin", "daily-tasks"] });
    },
    onError: (e: Error) => toast.error("Create failed", { description: e.message }),
  });

  const rollover = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("rollover_recurring_daily_tasks");
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => {
      toast.success(`Rolled over ${n ?? 0} task${n === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["admin", "daily-tasks"] });
    },
    onError: (e: Error) => toast.error("Rollover failed", { description: e.message }),
  });

  const today = todayISO();

  const filtered = (tasks ?? [])
    .filter((t) => {
      if (filter === "open") return t.status !== "done";
      if (filter === "done") return t.status === "done";
      if (filter === "today") return t.due_date === today;
      if (filter === "overdue")
        return t.status !== "done" && t.due_date != null && t.due_date < today;
      return true;
    })
    .sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (b.status === "done" && a.status !== "done") return -1;
      // overdue first
      const aOver = a.due_date && a.due_date < today && a.status !== "done";
      const bOver = b.due_date && b.due_date < today && b.status !== "done";
      if (aOver && !bOver) return -1;
      if (bOver && !aOver) return 1;
      const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (p !== 0) return p;
      return a.sort_order - b.sort_order;
    });

  // Summary metrics
  const summary = useMemo(() => {
    const all = tasks ?? [];
    const comps = completions ?? [];
    const open = all.filter((t) => t.status !== "done").length;
    const done = all.filter((t) => t.status === "done").length;
    const total = all.length;
    const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

    const dueToday = all.filter((t) => t.due_date === today);
    const dueTodayDone = dueToday.filter((t) => t.status === "done").length;
    const todayCompletions = comps.filter((c) => c.completed_on === today).length;

    const completedSet = new Set(comps.map((c) => c.completed_on));

    // Streak: consecutive days ending today (or yesterday) with at least 1 completion
    let streak = 0;
    const cursor = new Date();
    // If nothing done today, start counting from yesterday
    if (!completedSet.has(cursor.toISOString().slice(0, 10))) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    while (completedSet.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    // 7-day / 30-day buckets
    const buildSeries = (days: number) => {
      const out: { date: string; count: number }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = daysAgoISO(i);
        out.push({ date: d, count: comps.filter((c) => c.completed_on === d).length });
      }
      return out;
    };
    const series7 = buildSeries(7);
    const series30 = buildSeries(30);
    const active7 = series7.filter((d) => d.count > 0).length;
    const active30 = series30.filter((d) => d.count > 0).length;

    // Weekly metrics (Mon–Sun)
    const ws = getWeekStart();
    const we = getWeekEnd();
    const tasksDueWeek = all.filter(
      (t) => t.due_date != null && t.due_date >= ws && t.due_date <= we
    );
    const weekComps = comps.filter((c) => c.completed_on >= ws && c.completed_on <= we);
    const weekDone = weekComps.length;
    const weekDueCount = tasksDueWeek.length;
    const weekRate = weekDueCount === 0 ? 0 : Math.round((tasksDueWeek.filter((t) => t.status === "done").length / weekDueCount) * 100);
    const weekActiveDays = new Set(weekComps.map((c) => c.completed_on)).size;
    const weekSeries: { date: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + i);
      const ds = d.toISOString().slice(0, 10);
      weekSeries.push({ date: ds, count: comps.filter((c) => c.completed_on === ds).length });
    }

    // Monthly metrics (1st–end)
    const ms = getMonthStart();
    const me = getMonthEnd();
    const tasksDueMonth = all.filter(
      (t) => t.due_date != null && t.due_date >= ms && t.due_date <= me
    );
    const monthComps = comps.filter((c) => c.completed_on >= ms && c.completed_on <= me);
    const monthDone = monthComps.length;
    const monthDueCount = tasksDueMonth.length;
    const monthRate = monthDueCount === 0 ? 0 : Math.round((tasksDueMonth.filter((t) => t.status === "done").length / monthDueCount) * 100);
    const monthActiveDays = new Set(monthComps.map((c) => c.completed_on)).size;
    const monthDays = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 0)).getUTCDate();
    const monthSeries: { date: string; count: number }[] = [];
    for (let i = 0; i < monthDays; i++) {
      const d = new Date(ms + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + i);
      const ds = d.toISOString().slice(0, 10);
      monthSeries.push({ date: ds, count: comps.filter((c) => c.completed_on === ds).length });
    }

    return {
      total,
      open,
      done,
      completionRate,
      dueTodayCount: dueToday.length,
      dueTodayDone,
      todayCompletions,
      streak,
      series7,
      series30,
      active7,
      active30,
      week: {
        label: `${ws.slice(5)} – ${we.slice(5)}`,
        start: ws,
        end: we,
        rate: weekRate,
        done: weekDone,
        due: weekDueCount,
        activeDays: weekActiveDays,
        series: weekSeries,
      },
      month: {
        label: `${ms.slice(0, 7)}`,
        start: ms,
        end: me,
        rate: monthRate,
        done: monthDone,
        due: monthDueCount,
        activeDays: monthActiveDays,
        series: monthSeries,
      },
    };
  }, [tasks, completions, today]);

  return (
    <main className="min-h-screen bg-canvas px-6 py-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Admin
            </Link>
            <h1 className="mt-3 font-serif text-3xl md:text-4xl">Daily Tasks</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Persistent checklist. Recurring tasks auto-roll over each period.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => rollover.mutate()}
              disabled={rollover.isPending}
            >
              <Repeat className={`h-3 w-3 mr-2 ${rollover.isPending ? "animate-spin" : ""}`} />
              Roll over now
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3 w-3 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowNew((v) => !v)}>
              <Plus className="h-3 w-3 mr-2" /> New task
            </Button>
          </div>
        </div>

        {/* Summary panel */}
        <SummaryPanel summary={summary} />

        {/* Weekly & Monthly roll-ups */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <PeriodSummaryPanel
            label="This week"
            period={summary.week}
            comps={completions ?? []}
          />
          <PeriodSummaryPanel
            label="This month"
            period={summary.month}
            comps={completions ?? []}
          />
        </div>

        {showNew && (
          <NewTaskForm
            onCancel={() => setShowNew(false)}
            onSubmit={(v) => createTask.mutate(v)}
            submitting={createTask.isPending}
          />
        )}

        <div className="mb-4 flex items-center gap-1 flex-wrap">
          {(["open", "today", "overdue", "all", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs uppercase tracking-[0.2em] rounded-full border transition-colors ${
                filter === f
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            No tasks here.
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                today={today}
                onToggle={() =>
                  updateTask.mutate({
                    id: t.id,
                    status: t.status === "done" ? "todo" : "done",
                  })
                }
                onStatusChange={(status) => updateTask.mutate({ id: t.id, status })}
                onNotesChange={(notes) => updateTask.mutate({ id: t.id, notes })}
                onDueDateChange={(due_date) => updateTask.mutate({ id: t.id, due_date })}
                onRecurrenceChange={(recurrence) =>
                  updateTask.mutate({ id: t.id, recurrence })
                }
                onDelete={() => {
                  if (confirm(`Delete "${t.title}"?`)) deleteTask.mutate(t.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryPanel({
  summary,
}: {
  summary: {
    total: number;
    open: number;
    completionRate: number;
    dueTodayCount: number;
    dueTodayDone: number;
    todayCompletions: number;
    streak: number;
    series7: { date: string; count: number }[];
    series30: { date: string; count: number }[];
    active7: number;
    active30: number;
  };
}) {
  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Completion rate"
          value={`${summary.completionRate}%`}
          sub={`${summary.total - summary.open}/${summary.total} done`}
        />
        <StatCard
          label="Today"
          value={`${summary.dueTodayDone}/${summary.dueTodayCount || 0}`}
          sub={`${summary.todayCompletions} completed today`}
          tone={
            summary.dueTodayCount > 0 && summary.dueTodayDone === summary.dueTodayCount
              ? "good"
              : undefined
          }
        />
        <StatCard
          label="Streak"
          value={
            <span className="inline-flex items-center gap-1">
              <Flame className="h-5 w-5 text-orange-500" />
              {summary.streak}d
            </span>
          }
          sub={summary.streak === 0 ? "Start a streak today" : "consecutive days"}
        />
        <StatCard
          label="Active days"
          value={`${summary.active7}/7`}
          sub={`${summary.active30}/30 in last 30d`}
        />
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Completion history
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Last 7d</span>
            <span>Last 30d</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Sparkline data={summary.series7} />
          <Sparkline data={summary.series30} />
        </div>
      </Card>
    </div>
  );
}

function PeriodSummaryPanel({
  label,
  period,
  comps,
}: {
  label: string;
  period: {
    label: string;
    start: string;
    end: string;
    rate: number;
    done: number;
    due: number;
    activeDays: number;
    series: { date: string; count: number }[];
  };
  comps: Completion[];
}) {
  // Longest streak within period
  const periodSet = new Set(comps.map((c) => c.completed_on));
  let periodStreak = 0;
  let currentStreak = 0;
  for (const { date } of period.series) {
    if (periodSet.has(date)) {
      currentStreak++;
      periodStreak = Math.max(periodStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {label}
          <span className="ml-2 text-[10px] normal-case tracking-normal text-muted-foreground/70">
            {period.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {periodStreak > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-orange-600">
              <Flame className="h-3 w-3" /> {periodStreak}d streak
            </span>
          )}
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {period.activeDays} active day{period.activeDays === 1 ? "" : "s"}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard
          label="Completion rate"
          value={`${period.rate}%`}
          sub={`${period.due > 0 ? period.done + "/" + period.due + " done" : period.done + " done"}`}
          tone={period.rate >= 80 ? "good" : period.rate < 40 ? "warn" : undefined}
        />
        <StatCard
          label="Tasks done"
          value={period.done}
          sub={`in this ${label.toLowerCase().replace(" this", "")}`}
        />
        <StatCard
          label="Longest streak"
          value={
            <span className="inline-flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              {periodStreak}d
            </span>
          }
          sub={periodStreak === 0 ? "No streak yet" : "best run"}
        />
      </div>
      <Sparkline data={period.series} />
    </Card>
  );
}

function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-[2px] h-16">
      {data.map((d) => {
        const h = (d.count / max) * 100;
        const isToday = d.date === todayISO();
        return (
          <div
            key={d.date}
            className="flex-1 flex flex-col justify-end"
            title={`${d.date}: ${d.count} completion${d.count === 1 ? "" : "s"}`}
          >
            <div
              className={`w-full rounded-sm ${
                d.count === 0
                  ? "bg-slate-100"
                  : isToday
                    ? "bg-orange-500"
                    : "bg-emerald-500"
              }`}
              style={{ height: `${Math.max(d.count === 0 ? 4 : 8, h)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "warn" | "good";
}) {
  const cls =
    tone === "warn" ? "text-red-700" : tone === "good" ? "text-emerald-700" : "";
  return (
    <Card className="p-4">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </div>
      <div className={`mt-2 font-serif text-2xl tabular-nums ${cls}`}>{value}</div>
      {sub && (
        <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          {sub}
        </div>
      )}
    </Card>
  );
}

function NewTaskForm({
  onSubmit,
  onCancel,
  submitting,
}: {
  onSubmit: (v: {
    title: string;
    description: string;
    category: string;
    priority: DailyTask["priority"];
    recurrence: Recurrence;
    due_date: string | null;
  }) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState<DailyTask["priority"]>("medium");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [dueDate, setDueDate] = useState<string>("");

  return (
    <Card className="p-4 mb-4 space-y-3">
      <Input
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <div className="flex flex-wrap gap-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priority}
          onValueChange={(v) => setPriority(v as DailyTask["priority"])}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={recurrence} onValueChange={(v) => setRecurrence(v as Recurrence)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Recurrence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">One-off</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-40"
        />
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!title.trim() || submitting}
          onClick={() =>
            onSubmit({
              title: title.trim(),
              description: description.trim(),
              category,
              priority,
              recurrence,
              due_date: dueDate || null,
            })
          }
        >
          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
        </Button>
      </div>
    </Card>
  );
}

function TaskRow({
  task,
  today,
  onToggle,
  onStatusChange,
  onNotesChange,
  onDueDateChange,
  onRecurrenceChange,
  onDelete,
}: {
  task: DailyTask;
  today: string;
  onToggle: () => void;
  onStatusChange: (s: DailyTask["status"]) => void;
  onNotesChange: (n: string) => void;
  onDueDateChange: (d: string | null) => void;
  onRecurrenceChange: (r: Recurrence) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notesDraft, setNotesDraft] = useState(task.notes ?? "");
  const done = task.status === "done";
  const overdue = !done && task.due_date != null && task.due_date < today;
  const dueToday = task.due_date === today;

  return (
    <Card className={`p-4 ${done ? "opacity-60" : ""} ${overdue ? "border-red-300" : ""}`}>
      <div className="flex items-start gap-3">
        <Checkbox checked={done} onCheckedChange={onToggle} className="mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-left flex-1 min-w-0"
            >
              <div className={`font-medium ${done ? "line-through" : ""}`}>{task.title}</div>
              {task.description && (
                <div className="text-xs text-muted-foreground mt-1">{task.description}</div>
              )}
              <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[10px] uppercase tracking-wider text-muted-foreground">
                {task.due_date && (
                  <span
                    className={`inline-flex items-center gap-1 ${
                      overdue ? "text-red-700" : dueToday ? "text-orange-700" : ""
                    }`}
                  >
                    <CalendarClock className="h-3 w-3" />
                    {overdue ? "Overdue " : dueToday ? "Due today" : `Due ${task.due_date}`}
                    {overdue && task.due_date}
                  </span>
                )}
                {task.recurrence !== "none" && (
                  <span className="inline-flex items-center gap-1 text-blue-700">
                    <Repeat className="h-3 w-3" /> {task.recurrence}
                  </span>
                )}
              </div>
            </button>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[task.priority]}`}
              >
                {task.priority}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {task.category}
              </span>
              <Select
                value={task.status}
                onValueChange={(v) => onStatusChange(v as DailyTask["status"])}
              >
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-7 w-7 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {expanded && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Due
                </label>
                <Input
                  type="date"
                  value={task.due_date ?? ""}
                  onChange={(e) => onDueDateChange(e.target.value || null)}
                  className="w-40 h-8 text-xs"
                />
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-3">
                  Recurrence
                </label>
                <Select
                  value={task.recurrence}
                  onValueChange={(v) => onRecurrenceChange(v as Recurrence)}
                >
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">One-off</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="Notes…"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={() => {
                  if (notesDraft !== (task.notes ?? "")) onNotesChange(notesDraft);
                }}
                rows={3}
              />
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-3 flex-wrap">
                {task.completed_at && (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed {new Date(task.completed_at).toLocaleString()}
                  </span>
                )}
                {task.last_rolled_over_on && (
                  <span>Last rolled over {task.last_rolled_over_on}</span>
                )}
                <span>Updated {new Date(task.updated_at).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
