// Cron endpoint: emails admins a daily brief of tasks due today / overdue.
// Throttled per-task per due-date occurrence via `reminder_sent_for`.
// Scheduled daily via pg_cron (see migration / pg_cron config).

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendGmail } from "@/lib/gmail-send";
import { renderDailyTaskReminderEmail } from "@/lib/daily-task-reminder-email";
import { checkWebhookSecret } from "@/lib/webhook-secret";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export const Route = createFileRoute("/api/public/cron/daily-task-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const unauthorized = checkWebhookSecret(request);
        if (unauthorized) return unauthorized;

        const today = todayISO();

        // 1. Find admin recipients (users with admin role + their emails).
        const { data: adminRoles, error: roleErr } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (roleErr) {
          console.error("[task-reminders] role query failed:", roleErr.message);
          return new Response("DB error", { status: 500 });
        }

        const adminIds = (adminRoles ?? []).map((r) => r.user_id);
        if (adminIds.length === 0) {
          return Response.json({ ok: true, recipients: 0, reason: "no admins" });
        }

        const recipients: string[] = [];
        for (const id of adminIds) {
          const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
          if (!error && data?.user?.email) recipients.push(data.user.email);
        }
        if (recipients.length === 0) {
          return Response.json({ ok: true, recipients: 0, reason: "no admin emails" });
        }

        // 2. Pull tasks due today or overdue that have NOT yet been reminded
        //    for this due-date occurrence.
        const { data: tasksRaw, error: taskErr } = await supabaseAdmin
          .from("daily_tasks")
          .select(
            "id, title, category, priority, due_date, recurrence, status, reminder_sent_for",
          )
          .neq("status", "done")
          .not("due_date", "is", null)
          .lte("due_date", today)
          .or(`reminder_sent_for.is.null,reminder_sent_for.neq.${today}`)
          .order("priority", { ascending: true })
          .limit(200);

        if (taskErr) {
          console.error("[task-reminders] task query failed:", taskErr.message);
          return new Response("DB error", { status: 500 });
        }

        const tasks = (tasksRaw ?? []).filter(
          (t) => t.reminder_sent_for !== today,
        );

        if (tasks.length === 0) {
          return Response.json({ ok: true, sent: 0, reason: "no due tasks" });
        }

        const dueToday = tasks
          .filter((t) => t.due_date === today)
          .map((t) => ({
            title: t.title,
            category: t.category,
            priority: t.priority as "low" | "medium" | "high" | "critical",
            due_date: t.due_date,
            recurrence: (t.recurrence ?? "none") as
              | "none"
              | "daily"
              | "weekly"
              | "monthly",
            overdue: false,
          }));

        const overdue = tasks
          .filter((t) => t.due_date && t.due_date < today)
          .map((t) => ({
            title: t.title,
            category: t.category,
            priority: t.priority as "low" | "medium" | "high" | "critical",
            due_date: t.due_date,
            recurrence: (t.recurrence ?? "none") as
              | "none"
              | "daily"
              | "weekly"
              | "monthly",
            overdue: true,
          }));

        // 3. Headline stats for the email.
        const { count: totalCount } = await supabaseAdmin
          .from("daily_tasks")
          .select("id", { head: true, count: "exact" });
        const { count: doneCount } = await supabaseAdmin
          .from("daily_tasks")
          .select("id", { head: true, count: "exact" })
          .eq("status", "done");
        const completionRate =
          !totalCount || totalCount === 0
            ? 0
            : Math.round(((doneCount ?? 0) / totalCount) * 100);

        // Streak: consecutive days ending today (or yesterday) with >=1
        // completion event recorded.
        const since = new Date();
        since.setUTCDate(since.getUTCDate() - 45);
        const { data: completions } = await supabaseAdmin
          .from("daily_task_completions")
          .select("completed_on")
          .gte("completed_on", since.toISOString().slice(0, 10));
        const completedSet = new Set(
          (completions ?? []).map((c) => c.completed_on as string),
        );
        let streak = 0;
        const cursor = new Date();
        if (!completedSet.has(cursor.toISOString().slice(0, 10))) {
          cursor.setUTCDate(cursor.getUTCDate() - 1);
        }
        while (completedSet.has(cursor.toISOString().slice(0, 10))) {
          streak += 1;
          cursor.setUTCDate(cursor.getUTCDate() - 1);
        }

        const { subject, html, text } = renderDailyTaskReminderEmail({
          dueToday,
          overdue,
          completionRate,
          streak,
        });

        // 4. Send to each admin recipient, log each attempt.
        let sent = 0;
        let failed = 0;
        for (const to of recipients) {
          try {
            await sendGmail(to, subject, html, text);
            sent += 1;
            await supabaseAdmin.from("email_dispatch_log").insert({
              template_name: "daily-task-reminder",
              recipient_email: to,
              status: "sent",
              metadata: {
                due_today: dueToday.length,
                overdue: overdue.length,
                date: today,
              },
            });
          } catch (e) {
            failed += 1;
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[task-reminders] send failed for ${to}:`, msg);
            await supabaseAdmin.from("email_dispatch_log").insert({
              template_name: "daily-task-reminder",
              recipient_email: to,
              status: "failed",
              error_message: msg,
              metadata: { date: today },
            });
          }
        }

        // 5. Mark every included task as reminded for today so we don't
        //    re-send the same brief later in the day.
        const ids = tasks.map((t) => t.id);
        if (ids.length > 0) {
          await supabaseAdmin
            .from("daily_tasks")
            .update({ reminder_sent_for: today })
            .in("id", ids);
        }

        return Response.json({
          ok: true,
          recipients: recipients.length,
          sent,
          failed,
          tasks: tasks.length,
          due_today: dueToday.length,
          overdue: overdue.length,
        });
      },
    },
  },
});
