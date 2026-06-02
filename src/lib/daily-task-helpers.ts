// Helpers for the Daily Tasks admin page:
//  - Default deep-links per category (used when a task has no explicit action_url)
//  - Structured note templates per category, inserted with a single click

export const CATEGORY_DEFAULT_ACTION: Record<
  string,
  { url: string; label: string } | undefined
> = {
  seo: { url: "/admin/gsc-monitor", label: "Open GSC Monitor" },
  ux: { url: "/admin/homepage-curation", label: "Open Homepage Curation" },
  email: { url: "/admin/email-recovery", label: "Open Email Recovery" },
  catalog: { url: "/admin/product-images", label: "Open Product Images" },
  growth: { url: "/admin/growth-os", label: "Open Growth OS" },
  analytics: { url: "/admin/analytics", label: "Open Cart Analytics" },
  maintenance: { url: "/admin/shopify-sync", label: "Open Shopify Sync" },
  general: undefined,
};

// Keyword-driven action overrides — when a task's title/description matches one
// of these patterns, the action button deep-links to the right purpose-built
// admin tool, ignoring the generic category default. Explicit action_url on
// the task row still wins over everything.
const KEYWORD_ACTIONS: { test: RegExp; url: string; label: string }[] = [
  {
    test: /\b(structured\s*data|rich\s*results|json[-\s]?ld|schema\.org)\b/i,
    url: "/admin/structured-data-test",
    label: "Open Structured Data Test",
  },
];

export function resolveTaskAction(task: {
  action_url: string | null;
  action_label: string | null;
  category: string;
  title?: string | null;
  description?: string | null;
}): { url: string; label: string } | null {
  if (task.action_url) {
    return { url: task.action_url, label: task.action_label || "Open tool" };
  }
  const hay = `${task.title ?? ""} ${task.description ?? ""}`;
  for (const k of KEYWORD_ACTIONS) {
    if (k.test.test(hay)) return { url: k.url, label: k.label };
  }
  return CATEGORY_DEFAULT_ACTION[task.category] ?? null;
}

export type NoteTemplate = { id: string; label: string; body: string };

// Each category has 1–3 ready-to-fill outcome templates.
// Designed so a single paste captures what was done, what was found, and next step.
export const NOTE_TEMPLATES: Record<string, NoteTemplate[]> = {
  seo: [
    {
      id: "gsc-drop",
      label: "GSC drop check",
      body: [
        "Run: GSC drop check",
        "Date: " + new Date().toISOString().slice(0, 10),
        "Affected URLs / queries:",
        "- ",
        "Suspected cause:",
        "Action taken:",
        "Follow-up:",
      ].join("\n"),
    },
    {
      id: "sitemap-audit",
      label: "Sitemap & redirect audit",
      body: [
        "Run: Sitemap + redirect audit",
        "Total URLs checked:",
        "200 / 301 / 404 / other:",
        "Broken or unexpected:",
        "- ",
        "Fix applied:",
      ].join("\n"),
    },
    {
      id: "url-inspection",
      label: "URL inspection",
      body: [
        "URLs inspected:",
        "- ",
        "Coverage / indexing state:",
        "Page fetch:",
        "Notes:",
      ].join("\n"),
    },
  ],
  email: [
    {
      id: "abandoned-cart-review",
      label: "Abandoned cart review",
      body: [
        "Carts reviewed:",
        "Recovery emails sent:",
        "Recovered:",
        "Issues / bounces:",
        "Next step:",
      ].join("\n"),
    },
    {
      id: "dispatch-errors",
      label: "Dispatch error sweep",
      body: [
        "Failed sends:",
        "Root cause:",
        "Resolved? (y/n):",
        "Action:",
      ].join("\n"),
    },
  ],
  catalog: [
    {
      id: "image-qa",
      label: "Product image QA",
      body: [
        "SKUs reviewed:",
        "Approved:",
        "Rejected (reason):",
        "Regenerated:",
        "Outstanding:",
      ].join("\n"),
    },
    {
      id: "hotspot-audit",
      label: "Lookbook hotspot audit",
      body: [
        "Surfaces checked:",
        "Mis-tagged hotspots:",
        "- ",
        "Fixes applied:",
      ].join("\n"),
    },
  ],
  growth: [
    {
      id: "social-pilot",
      label: "Social pilot push",
      body: [
        "Channel(s):",
        "Posts approved & queued:",
        "Topic / angle:",
        "Expected publish window:",
        "Notes:",
      ].join("\n"),
    },
    {
      id: "growth-jobs",
      label: "Growth jobs review",
      body: [
        "Jobs reviewed:",
        "Failed (with reason):",
        "Retried:",
        "Backlog:",
      ].join("\n"),
    },
  ],
  analytics: [
    {
      id: "funnel-review",
      label: "Funnel & revenue review",
      body: [
        "Window:",
        "Sessions / ATC / Checkout / Revenue:",
        "Notable shifts:",
        "Hypothesis:",
        "Experiment to run:",
      ].join("\n"),
    },
  ],
  ux: [
    {
      id: "homepage-curation",
      label: "Homepage curation",
      body: [
        "Today's layout edits:",
        "- ",
        "Hotspots verified:",
        "Force refresh? (y/n):",
        "Notes:",
      ].join("\n"),
    },
  ],
  maintenance: [
    {
      id: "sync-run",
      label: "Sync run check",
      body: [
        "Sync type:",
        "Processed / updated / failed:",
        "Errors:",
        "Follow-up:",
      ].join("\n"),
    },
  ],
  general: [
    {
      id: "freeform",
      label: "Outcome log",
      body: [
        "What I did:",
        "What I found:",
        "Decision / next step:",
      ].join("\n"),
    },
  ],
};

export function getTemplatesFor(category: string): NoteTemplate[] {
  return NOTE_TEMPLATES[category] ?? NOTE_TEMPLATES.general;
}
