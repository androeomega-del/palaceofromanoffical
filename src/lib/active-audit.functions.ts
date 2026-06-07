/**
 * Active Audit — on-demand runtime checks across Tech/Security, SEO/Perf,
 * Sales/Conversion, and UX/A11y. Returns a single structured report.
 *
 * Admin-only. No AI calls. Targets the LIVE published site so the audit
 * reflects what real visitors see, not the local preview build.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/admin-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { PALACE_DOMAIN } from "@/lib/brand-voice";

export type AuditSeverity = "pass" | "warn" | "fail";

export type AuditCheck = {
  id: string;
  label: string;
  severity: AuditSeverity;
  detail: string;
  remediation?: string;
};

export type AuditCategory = {
  key: "tech_security" | "seo_perf" | "sales" | "ux_a11y";
  label: string;
  checks: AuditCheck[];
};

export type AuditReport = {
  ranAt: string;
  durationMs: number;
  categories: AuditCategory[];
  summary: { pass: number; warn: number; fail: number };
};

const SITE = PALACE_DOMAIN;

const FETCH_HEADERS = {
  // Identify our own audit traffic so it doesn't pollute analytics
  "User-Agent": "PalaceOfRoman-ActiveAudit/1.0",
} as const;

async function timedFetch(url: string, init?: RequestInit) {
  const start = Date.now();
  try {
    const res = await fetch(url, { ...init, headers: { ...FETCH_HEADERS, ...(init?.headers ?? {}) }, redirect: "manual" });
    const text = await res.text();
    return { ok: true as const, status: res.status, headers: res.headers, text, ms: Date.now() - start };
  } catch (e) {
    return { ok: false as const, status: 0, ms: Date.now() - start, error: e instanceof Error ? e.message : "fetch failed" };
  }
}

// ---------------------------------------------------------------------------
// Tech + Security
// ---------------------------------------------------------------------------
async function checkTechSecurity(): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];

  // 1. sitemap.xml
  const sitemap = await timedFetch(`${SITE}/sitemap.xml`);
  if (sitemap.ok && sitemap.status === 200 && "text" in sitemap) {
    const urlCount = (sitemap.text.match(/<url>/g) ?? []).length;
    checks.push({
      id: "sitemap",
      label: "Sitemap reachable + valid",
      severity: urlCount > 50 ? "pass" : urlCount > 0 ? "warn" : "fail",
      detail: `${urlCount} URLs emitted`,
      remediation: urlCount === 0 ? "Sitemap parsed but contained no <url> entries." : undefined,
    });
  } else {
    checks.push({ id: "sitemap", label: "Sitemap reachable + valid", severity: "fail", detail: `HTTP ${sitemap.status || "error"}`, remediation: "/sitemap.xml did not return 200." });
  }

  // 2. robots.txt + Sitemap directive
  const robots = await timedFetch(`${SITE}/robots.txt`);
  if (robots.ok && robots.status === 200 && "text" in robots) {
    const hasSitemap = /^\s*Sitemap:/im.test(robots.text);
    const blockedAll = /User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*$/im.test(robots.text);
    checks.push({
      id: "robots",
      label: "robots.txt declares sitemap",
      severity: blockedAll ? "fail" : hasSitemap ? "pass" : "warn",
      detail: blockedAll ? "Wildcard Disallow: / blocks every crawler" : hasSitemap ? "Sitemap: directive present" : "No Sitemap: line found",
      remediation: !hasSitemap ? "Add a `Sitemap: https://palaceofromanofficial.com/sitemap.xml` line to public/robots.txt." : undefined,
    });
  } else {
    checks.push({ id: "robots", label: "robots.txt reachable", severity: "fail", detail: `HTTP ${robots.status || "error"}` });
  }

  // 3. Canonical collection-handle redirect (proves the dedupe fix is live)
  const dupe = await timedFetch(`${SITE}/collections/men-accessories`);
  if (dupe.ok && (dupe.status === 301 || dupe.status === 302 || dupe.status === 307 || dupe.status === 308)) {
    const loc = dupe.headers.get("location") ?? "";
    const ok = loc.includes("/collections/mens-accessories");
    checks.push({
      id: "canonical_redirect",
      label: "Duplicate collection handles redirect to canonical",
      severity: ok ? "pass" : "fail",
      detail: ok ? `${dupe.status} → ${loc}` : `Redirects to "${loc}" instead of canonical`,
    });
  } else {
    checks.push({
      id: "canonical_redirect",
      label: "Duplicate collection handles redirect to canonical",
      severity: "fail",
      detail: `Expected 3xx, got ${dupe.status}`,
      remediation: "Non-canonical handles should 308 to the canonical handle (see src/lib/collection-canonical.ts).",
    });
  }

  // 4. Spot-check critical public routes
  const routes = ["/", "/shop", "/brands", "/collections", "/about"];
  const results = await Promise.all(routes.map((r) => timedFetch(`${SITE}${r}`)));
  const broken = results.filter((r, i) => !r.ok || r.status >= 400).map((_, i) => routes[i]).filter(Boolean);
  checks.push({
    id: "route_smoke",
    label: "Critical routes return 200",
    severity: broken.length === 0 ? "pass" : broken.length <= 1 ? "warn" : "fail",
    detail: broken.length === 0 ? `${routes.length}/${routes.length} healthy` : `Broken: ${broken.join(", ")}`,
  });

  // 5. Webhook / API secrets present in the server env
  const requiredEnv = [
    "LOVABLE_API_KEY",
    "SHOPIFY_WEBHOOK_SECRET",
    "SHOPIFY_STOREFRONT_ACCESS_TOKEN",
    "SHOPIFY_ADMIN_API_CLIENT_ID",
    "SHOPIFY_ADMIN_API_SECRET",
  ];
  const missing = requiredEnv.filter((k) => !process.env[k]);
  checks.push({
    id: "server_secrets",
    label: "Required server secrets configured",
    severity: missing.length === 0 ? "pass" : "fail",
    detail: missing.length === 0 ? `${requiredEnv.length} secrets present` : `Missing: ${missing.join(", ")}`,
    remediation: missing.length ? "Add missing secrets in Cloud → Secrets." : undefined,
  });

  // 6. Sensitive table not readable as anon (proves RLS is doing its job for the highest-risk table)
  try {
    const anonUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (anonUrl && anonKey) {
      const res = await fetch(`${anonUrl}/rest/v1/shopify_variant_map?select=sku&limit=1`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      const body = await res.json().catch(() => []);
      const leaked = Array.isArray(body) && body.length > 0;
      checks.push({
        id: "rls_sensitive_tables",
        label: "Sensitive tables blocked from anon",
        severity: leaked ? "fail" : "pass",
        detail: leaked ? "shopify_variant_map readable by anon" : "shopify_variant_map correctly blocked",
        remediation: leaked ? "Restore the admin-only SELECT policy on shopify_variant_map." : undefined,
      });
    }
  } catch (e) {
    checks.push({ id: "rls_sensitive_tables", label: "Sensitive tables blocked from anon", severity: "warn", detail: "RLS probe could not run" });
  }

  return checks;
}

// ---------------------------------------------------------------------------
// SEO + Performance
// ---------------------------------------------------------------------------
function extractMeta(html: string) {
  const grab = (re: RegExp) => html.match(re)?.[1]?.trim() ?? "";
  const title = grab(/<title>([^<]+)<\/title>/i);
  const desc = grab(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const canonical = grab(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const ogTitle = grab(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  const ogDesc = grab(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const ogImage = grab(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  return { title, desc, canonical, ogTitle, ogDesc, ogImage };
}

async function checkSeoPerf(): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];

  const routes = [
    { path: "/", label: "Homepage" },
    { path: "/shop", label: "Shop" },
    { path: "/collections", label: "Collections index" },
  ];

  for (const r of routes) {
    const res = await timedFetch(`${SITE}${r.path}`);
    if (!res.ok || res.status !== 200 || !("text" in res)) {
      checks.push({ id: `meta_${r.path}`, label: `${r.label} — meta tags`, severity: "fail", detail: `HTTP ${res.status}` });
      continue;
    }
    const meta = extractMeta(res.text);
    const missing: string[] = [];
    if (!meta.title || meta.title.length < 10) missing.push("title");
    if (!meta.desc || meta.desc.length < 50) missing.push("description");
    if (!meta.canonical) missing.push("canonical");
    if (!meta.ogTitle) missing.push("og:title");
    if (!meta.ogDesc) missing.push("og:description");
    // og:image is optional but recommended on landing routes

    checks.push({
      id: `meta_${r.path}`,
      label: `${r.label} — meta tag completeness`,
      severity: missing.length === 0 ? "pass" : missing.length <= 2 ? "warn" : "fail",
      detail: missing.length === 0 ? "title, description, canonical, og:title, og:description all set" : `Missing: ${missing.join(", ")}`,
    });
  }

  // Homepage performance snapshot
  const home = await timedFetch(`${SITE}/`);
  if (home.ok && "text" in home) {
    const bytes = home.text.length;
    const scriptCount = (home.text.match(/<script\b/gi) ?? []).length;
    const ttfb = home.ms;
    const sizeKb = Math.round(bytes / 1024);

    const sizeSeverity: AuditSeverity = sizeKb < 300 ? "pass" : sizeKb < 600 ? "warn" : "fail";
    const ttfbSeverity: AuditSeverity = ttfb < 800 ? "pass" : ttfb < 2000 ? "warn" : "fail";

    checks.push({ id: "home_size", label: "Homepage HTML payload", severity: sizeSeverity, detail: `${sizeKb} KB, ${scriptCount} <script> tags` });
    checks.push({ id: "home_ttfb", label: "Homepage TTFB (cold edge)", severity: ttfbSeverity, detail: `${ttfb} ms` });
  }

  return checks;
}

// ---------------------------------------------------------------------------
// Sales / Conversion (last 7 days)
// ---------------------------------------------------------------------------
async function checkSales(): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // cart_events funnel
  const { data: events } = await supabaseAdmin
    .from("cart_events")
    .select("event_type")
    .gte("created_at", since);
  const ev = events ?? [];
  const adds = ev.filter((e) => e.event_type === "add_to_cart").length;
  const starts = ev.filter((e) => e.event_type === "checkout_started").length;
  const reached = ev.filter((e) => e.event_type === "reached_checkout").length;
  const conv = adds > 0 ? Math.round((reached / adds) * 1000) / 10 : 0;
  checks.push({
    id: "funnel",
    label: "Cart → checkout funnel (7d)",
    severity: adds === 0 ? "warn" : conv < 5 ? "warn" : "pass",
    detail: `${adds} add_to_cart → ${starts} checkout_started → ${reached} reached_checkout (${conv}% conv)`,
    remediation: adds === 0 ? "No cart activity recorded in the last 7 days." : undefined,
  });

  // abandoned carts
  const { data: ac } = await supabaseAdmin
    .from("abandoned_carts")
    .select("recovered_at, recovery_email_sent_at")
    .gte("created_at", since);
  const total = ac?.length ?? 0;
  const recovered = ac?.filter((r) => r.recovered_at).length ?? 0;
  const emailed = ac?.filter((r) => r.recovery_email_sent_at).length ?? 0;
  checks.push({
    id: "abandoned",
    label: "Abandoned-cart recovery (7d)",
    severity: total > 0 && emailed === 0 ? "warn" : "pass",
    detail: `${total} captured · ${emailed} emailed · ${recovered} recovered`,
    remediation: total > 0 && emailed === 0 ? "Carts captured but no recovery emails dispatched — verify cron is firing." : undefined,
  });

  // newsletter signups
  const { count: subs } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);
  checks.push({
    id: "newsletter",
    label: "Newsletter signups (7d)",
    severity: (subs ?? 0) > 0 ? "pass" : "warn",
    detail: `${subs ?? 0} new subscribers`,
  });

  // email dispatch health
  const { data: emails } = await supabaseAdmin
    .from("email_dispatch_log")
    .select("status, template_name")
    .gte("created_at", since);
  const sent = emails?.filter((e) => e.status === "sent").length ?? 0;
  const failed = emails?.filter((e) => e.status !== "sent").length ?? 0;
  checks.push({
    id: "email_health",
    label: "Email dispatch health (7d)",
    severity: failed > sent ? "fail" : failed > 0 ? "warn" : "pass",
    detail: `${sent} sent · ${failed} failed`,
    remediation: failed > 0 ? "Inspect email_dispatch_log for failed sends." : undefined,
  });

  return checks;
}

// ---------------------------------------------------------------------------
// UX / A11y heuristics (homepage HTML)
// ---------------------------------------------------------------------------
async function checkUxA11y(): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];
  const home = await timedFetch(`${SITE}/`);
  if (!home.ok || !("text" in home)) {
    return [{ id: "ux_fetch", label: "UX/A11y heuristics", severity: "fail", detail: "Could not fetch homepage" }];
  }
  const html = home.text;

  // <img> without alt
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  const imgsNoAlt = imgs.filter((tag) => !/\balt\s*=/.test(tag)).length;
  checks.push({
    id: "img_alt",
    label: "Images carry alt text",
    severity: imgsNoAlt === 0 ? "pass" : imgsNoAlt <= 2 ? "warn" : "fail",
    detail: `${imgs.length} images · ${imgsNoAlt} missing alt`,
    remediation: imgsNoAlt > 0 ? "Add descriptive alt text to every <img> (decorative images can use alt=\"\")." : undefined,
  });

  // Icon-only buttons / anchors without accessible name
  const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi) ?? [];
  const ariaLess = buttons.filter((b) => {
    if (/aria-label\s*=/.test(b)) return false;
    const inner = b.replace(/<[^>]+>/g, "").trim();
    return inner.length === 0;
  }).length;
  checks.push({
    id: "btn_name",
    label: "Buttons have accessible names",
    severity: ariaLess === 0 ? "pass" : ariaLess <= 2 ? "warn" : "fail",
    detail: `${buttons.length} buttons · ${ariaLess} icon-only without aria-label`,
  });

  // h-screen leftover (should be h-dvh on mobile)
  const hScreen = (html.match(/\bh-screen\b/g) ?? []).length;
  checks.push({
    id: "h_screen",
    label: "Mobile viewport uses h-dvh, not h-screen",
    severity: hScreen === 0 ? "pass" : "warn",
    detail: hScreen === 0 ? "No `h-screen` in rendered HTML" : `${hScreen} occurrences of h-screen detected`,
    remediation: hScreen > 0 ? "Swap h-screen for h-dvh to avoid mobile address-bar layout shifts." : undefined,
  });

  // Single <main> landmark
  const mains = (html.match(/<main\b/gi) ?? []).length;
  checks.push({
    id: "single_main",
    label: "Exactly one <main> landmark",
    severity: mains === 1 ? "pass" : "warn",
    detail: `${mains} <main> elements`,
  });

  return checks;
}

// ---------------------------------------------------------------------------
// Aggregator
// ---------------------------------------------------------------------------
export const runActiveAudit = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async (): Promise<AuditReport> => {
    const start = Date.now();
    const [tech, seo, sales, ux] = await Promise.all([
      checkTechSecurity().catch((e) => [{ id: "tech_error", label: "Tech/Security checks crashed", severity: "fail" as const, detail: e instanceof Error ? e.message : "unknown" }]),
      checkSeoPerf().catch((e) => [{ id: "seo_error", label: "SEO/Perf checks crashed", severity: "fail" as const, detail: e instanceof Error ? e.message : "unknown" }]),
      checkSales().catch((e) => [{ id: "sales_error", label: "Sales checks crashed", severity: "fail" as const, detail: e instanceof Error ? e.message : "unknown" }]),
      checkUxA11y().catch((e) => [{ id: "ux_error", label: "UX/A11y checks crashed", severity: "fail" as const, detail: e instanceof Error ? e.message : "unknown" }]),
    ]);

    const categories: AuditCategory[] = [
      { key: "tech_security", label: "Technical & Security", checks: tech },
      { key: "seo_perf", label: "SEO & Performance", checks: seo },
      { key: "sales", label: "Sales & Conversion (7d)", checks: sales },
      { key: "ux_a11y", label: "UX & Accessibility", checks: ux },
    ];

    const all = categories.flatMap((c) => c.checks);
    const summary = {
      pass: all.filter((c) => c.severity === "pass").length,
      warn: all.filter((c) => c.severity === "warn").length,
      fail: all.filter((c) => c.severity === "fail").length,
    };

    return {
      ranAt: new Date().toISOString(),
      durationMs: Date.now() - start,
      categories,
      summary,
    };
  });
