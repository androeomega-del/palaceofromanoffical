// Admin daily-task reminder email — sent the morning a task is due, or
// when it becomes overdue. Editorial styling consistent with other
// Palace of Roman transactional emails.

import { escapeHtml } from "./gmail-send";

const SITE = "https://palaceofromanofficial.com";

export interface TaskReminderRow {
  title: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  due_date: string | null;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  overdue: boolean;
}

export interface TaskReminderInput {
  dueToday: TaskReminderRow[];
  overdue: TaskReminderRow[];
  completionRate: number;
  streak: number;
}

function priorityColor(p: TaskReminderRow["priority"]): string {
  switch (p) {
    case "critical":
      return "#b91c1c";
    case "high":
      return "#c2410c";
    case "medium":
      return "#a16207";
    default:
      return "#475569";
  }
}

function renderRows(rows: TaskReminderRow[]): string {
  if (rows.length === 0) return "";
  return rows
    .map(
      (r) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #e8e4dd;">
          <div style="font-family:Cormorant Garamond, Georgia, serif;font-size:18px;color:#1a1a1a;">
            ${escapeHtml(r.title)}
          </div>
          <div style="margin-top:4px;font-family:Karla, Arial, sans-serif;font-size:12px;color:#6b6b6b;letter-spacing:.06em;text-transform:uppercase;">
            <span style="color:${priorityColor(r.priority)};">${escapeHtml(r.priority)}</span>
            &nbsp;·&nbsp; ${escapeHtml(r.category)}
            ${r.recurrence !== "none" ? `&nbsp;·&nbsp; ${escapeHtml(r.recurrence)}` : ""}
            ${r.due_date ? `&nbsp;·&nbsp; due ${escapeHtml(r.due_date)}` : ""}
            ${r.overdue ? `&nbsp;·&nbsp; <span style="color:#b91c1c;">overdue</span>` : ""}
          </div>
        </td>
      </tr>`,
    )
    .join("");
}

export function renderDailyTaskReminderEmail(input: TaskReminderInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { dueToday, overdue, completionRate, streak } = input;
  const subject =
    overdue.length > 0
      ? `${overdue.length} overdue · ${dueToday.length} due today`
      : `${dueToday.length} task${dueToday.length === 1 ? "" : "s"} due today`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:Karla, Arial, sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ee;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;max-width:560px;">
        <tr><td style="padding:32px 32px 8px;">
          <div style="font-family:Cormorant Garamond, Georgia, serif;font-size:13px;letter-spacing:.3em;text-transform:uppercase;color:#6b6b6b;">
            Palace of Roman · Daily brief
          </div>
          <h1 style="margin:12px 0 0;font-family:Cormorant Garamond, Georgia, serif;font-size:28px;font-weight:400;color:#1a1a1a;">
            ${overdue.length > 0 ? `${overdue.length} overdue, ${dueToday.length} due today` : `${dueToday.length} task${dueToday.length === 1 ? "" : "s"} due today`}
          </h1>
          <div style="margin-top:8px;font-size:13px;color:#6b6b6b;">
            ${completionRate}% completion rate · ${streak}-day streak
          </div>
        </td></tr>

        ${
          overdue.length > 0
            ? `<tr><td style="padding:24px 32px 0;">
                <div style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#b91c1c;margin-bottom:8px;">Overdue</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${renderRows(overdue)}</table>
              </td></tr>`
            : ""
        }

        ${
          dueToday.length > 0
            ? `<tr><td style="padding:24px 32px 0;">
                <div style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#6b6b6b;margin-bottom:8px;">Due today</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${renderRows(dueToday)}</table>
              </td></tr>`
            : ""
        }

        <tr><td style="padding:32px;">
          <a href="${SITE}/admin/daily-tasks" style="display:inline-block;background:#1a1a1a;color:#ffffff;text-decoration:none;padding:14px 28px;font-family:Karla, Arial, sans-serif;font-size:12px;letter-spacing:.2em;text-transform:uppercase;">
            Open daily tasks
          </a>
        </td></tr>

        <tr><td style="padding:0 32px 32px;font-size:11px;color:#9a9a9a;line-height:1.6;">
          Sent by your store's internal task scheduler. Reminders fire once per due-date occurrence per task.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const lines: string[] = [];
  lines.push(`${overdue.length} overdue · ${dueToday.length} due today`);
  lines.push(`${completionRate}% completion rate · ${streak}-day streak`);
  lines.push("");
  if (overdue.length > 0) {
    lines.push("OVERDUE");
    for (const r of overdue)
      lines.push(`- [${r.priority}] ${r.title} (due ${r.due_date ?? "n/a"})`);
    lines.push("");
  }
  if (dueToday.length > 0) {
    lines.push("DUE TODAY");
    for (const r of dueToday)
      lines.push(`- [${r.priority}] ${r.title}`);
    lines.push("");
  }
  lines.push(`${SITE}/admin/daily-tasks`);

  return { subject, html, text: lines.join("\n") };
}
