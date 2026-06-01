import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  Circle,
  Loader2,
  RefreshCw,
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
  completed_at: string | null;
  created_at: string;
  updated_at: string;
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

function DailyTasksPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");
  const [showNew, setShowNew] = useState(false);

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

  const updateTask = useMutation({
    mutationFn: async (patch: Partial<DailyTask> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase
        .from("daily_tasks")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "daily-tasks"] }),
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
    }) => {
      const maxSort = Math.max(0, ...(tasks ?? []).map((t) => t.sort_order));
      const { error } = await supabase.from("daily_tasks").insert({
        title: input.title,
        description: input.description || null,
        category: input.category,
        priority: input.priority,
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

  const filtered = (tasks ?? [])
    .filter((t) => {
      if (filter === "open") return t.status !== "done";
      if (filter === "done") return t.status === "done";
      return true;
    })
    .sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (b.status === "done" && a.status !== "done") return -1;
      const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (p !== 0) return p;
      return a.sort_order - b.sort_order;
    });

  const stats = {
    total: tasks?.length ?? 0,
    done: tasks?.filter((t) => t.status === "done").length ?? 0,
    inProgress: tasks?.filter((t) => t.status === "in_progress").length ?? 0,
    critical: tasks?.filter((t) => t.status !== "done" && t.priority === "critical").length ?? 0,
  };

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
              Persistent checklist. Progress is saved to the database.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3 w-3 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowNew((v) => !v)}>
              <Plus className="h-3 w-3 mr-2" /> New task
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="In progress" value={stats.inProgress} />
          <StatCard label="Critical open" value={stats.critical} tone="warn" />
          <StatCard
            label="Completed"
            value={`${stats.done}/${stats.total}`}
            tone="good"
          />
        </div>

        {showNew && (
          <NewTaskForm
            onCancel={() => setShowNew(false)}
            onSubmit={(v) => createTask.mutate(v)}
            submitting={createTask.isPending}
          />
        )}

        <div className="mb-4 flex items-center gap-1">
          {(["open", "all", "done"] as const).map((f) => (
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
                onToggle={() =>
                  updateTask.mutate({
                    id: t.id,
                    status: t.status === "done" ? "todo" : "done",
                  })
                }
                onStatusChange={(status) => updateTask.mutate({ id: t.id, status })}
                onNotesChange={(notes) => updateTask.mutate({ id: t.id, notes })}
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

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
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
  }) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState<DailyTask["priority"]>("medium");

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
          <SelectTrigger className="w-40">
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
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!title.trim() || submitting}
          onClick={() =>
            onSubmit({ title: title.trim(), description: description.trim(), category, priority })
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
  onToggle,
  onStatusChange,
  onNotesChange,
  onDelete,
}: {
  task: DailyTask;
  onToggle: () => void;
  onStatusChange: (s: DailyTask["status"]) => void;
  onNotesChange: (n: string) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notesDraft, setNotesDraft] = useState(task.notes ?? "");
  const done = task.status === "done";

  return (
    <Card className={`p-4 ${done ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={done}
          onCheckedChange={onToggle}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-left flex-1 min-w-0"
            >
              <div className={`font-medium ${done ? "line-through" : ""}`}>
                {task.title}
              </div>
              {task.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {task.description}
                </div>
              )}
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
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Notes…"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={() => {
                  if (notesDraft !== (task.notes ?? "")) onNotesChange(notesDraft);
                }}
                rows={3}
              />
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-3">
                {task.completed_at && (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed {new Date(task.completed_at).toLocaleString()}
                  </span>
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
