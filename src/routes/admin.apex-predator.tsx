import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Radar, Crosshair, Target, Zap, Copy, Mail, FileDown, RefreshCw, AlertTriangle } from "lucide-react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { callAdminServerFn } from "@/lib/admin-server-call";
import {
  getApexStatus,
  getPoacherFeed,
  refreshPoacherFeed,
  draftPoacherPitch,
  draftPoacherPitchInline,
  getHijackFeed,
  generateContentBlueprint,
  getStrikingPipeline,
  generateStrikePlan,
  generateHighIntentSeoPatch,
  type ContentBlueprint,
  type StrikePlan,
  type HighIntentSeoPatch,
} from "@/lib/apex-predator.functions";

export const Route = createFileRoute("/admin/apex-predator")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: ApexPredatorTerminal,
  head: () => ({
    meta: [
      { title: "Apex Predator — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

// ---------- Terminal tokens (scoped, inline) ----------
const T = {
  bg: "#0a0e1a",
  surface: "#11172a",
  border: "#1f2942",
  grid: "#1a2138",
  ink: "#e6eaf5",
  muted: "#7a8aa8",
  neon: "#39ff88",
  amber: "#ffb547",
  red: "#ff5c8a",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
};

function copyText(t: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) void navigator.clipboard.writeText(t);
}

function fmt(n: number | null | undefined, d = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
}

/** Bulletproof date renderer — never throws, always returns a display string. */
function renderSafeUIDate(rawDate: unknown): string {
  if (rawDate === null || rawDate === undefined || rawDate === "") return "Pending";
  try {
    const parsed = new Date(rawDate as string | number | Date);
    if (Number.isNaN(parsed.getTime())) {
      const s = String(rawDate);
      return s.split("T")[0] || "Recent";
    }
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Recent";
  }
}

// =============================================================
function ApexPredatorTerminal() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    // Shield Plausible analytics safely behind a window check
    if (typeof window !== "undefined" && (window as unknown as { plausible?: unknown }).plausible) {
      try {
        // Plausible logic goes here if needed, safely caught
      } catch {
        console.log("Plausible initialization shielded.");
      }
    }
  }, []);

  const [tab, setTab] = useState<"poacher" | "hijack" | "striking">("poacher");

  const status = useQuery({
    queryKey: ["apex", "status"],
    queryFn: () => callAdminServerFn(getApexStatus),
    refetchInterval: 60_000,
    enabled: isMounted,
  });

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#11141a] text-[#00ff00] font-mono p-8 flex items-center justify-center">
        <div className="border border-[#1a2333] p-6 bg-[#141923] shadow-xl max-w-md w-full text-center">
          <p className="tracking-widest animate-pulse">⚡ INITIALIZING APEX PREDATOR TERMINAL...</p>
        </div>
      </div>
    );
  }


  return (
    <main
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.ink,
        fontFamily: T.mono,
        backgroundImage:
          `linear-gradient(${T.grid} 1px, transparent 1px), linear-gradient(90deg, ${T.grid} 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
      }}
    >
      {/* Status bar */}
      <div style={{ borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "10px 24px", display: "flex", alignItems: "center", gap: 24, fontSize: 11, letterSpacing: "0.08em" }}>
          <Link to="/admin" style={{ color: T.muted, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <ArrowLeft size={12} /> ADMIN
          </Link>
          <span style={{ color: T.neon, fontWeight: 700 }}>APEX PREDATOR</span>
          <span style={{ color: T.muted }}>// OURS: <span style={{ color: T.neon }}>{OUR_DOMAIN}</span> <span style={{ color: T.muted }}>← legacy: {OUR_LEGACY_DOMAIN}</span></span>
          <span style={{ color: T.muted }}>// SEMRUSH QUOTA: <span style={{ color: T.ink }}>{status.data?.semrushQuota ? `${fmt(status.data.semrushQuota.used)} / ${fmt(status.data.semrushQuota.limit)}` : "—"}</span></span>
          <span style={{ marginLeft: "auto", color: T.muted }}>LAST RUN: <span style={{ color: T.ink }}>{renderSafeUIDate(status.data?.lastRuns?.[0]?.created_at)}</span> <span style={{ color: T.neon, marginLeft: 6 }}>●</span></span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", maxWidth: 1400, margin: "0 auto" }}>
        {/* Module nav */}
        <nav style={{ borderRight: `1px solid ${T.border}`, padding: "24px 0", minHeight: "calc(100vh - 41px)" }}>
          {[
            { k: "poacher", label: "Backlink Intercept", desc: "Poach SSENSE / Net-a-Porter links", icon: Radar },
            { k: "hijack", label: "Hijack", desc: "Giant-competitor reverse-eng.", icon: Crosshair },
            { k: "striking", label: "Striking", desc: "Impact pipeline", icon: Target },
          ].map(({ k, label, desc, icon: Icon }) => {
            const active = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k as typeof tab)}
                style={{
                  width: "100%", textAlign: "left", padding: "14px 20px", border: 0, background: active ? T.surface : "transparent",
                  borderLeft: `2px solid ${active ? T.neon : "transparent"}`, color: active ? T.ink : T.muted, cursor: "pointer", fontFamily: T.mono,
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <Icon size={14} style={{ color: active ? T.neon : T.muted }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em" }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{desc}</div>
                </div>
              </button>
            );
          })}
        </nav>

        <section style={{ padding: 24 }}>
          {tab === "poacher" && <PoacherModule />}
          {tab === "hijack" && <HijackModule />}
          {tab === "striking" && <StrikingModule />}
        </section>
      </div>
    </main>
  );
}

// =============================================================
type SandboxRow = {
  id: string;
  source_url: string;
  source_domain: string;
  target_url: string;
  anchor: string;
  page_ascore: number;
  page_title: string;
  is_nofollow: boolean;
  is_net_new: boolean;
  first_seen_at: string;
};

const OUR_DOMAIN = "palaceofromanofficial.com";
const OUR_LEGACY_DOMAIN = "palaceofroman.com";
const COMPETITOR_DOMAINS = ["net-a-porter.com", "ssense.com", "mytheresa.com"] as const;

const SANDBOX_ROWS: SandboxRow[] = [
  {
    id: "sandbox-vogue-ssense",
    source_url: "https://www.vogue.com/article/ultimate-luxury-resale-guide",
    source_domain: "vogue.com",
    target_url: "https://www.ssense.com/en-us/women/product/bottega-veneta/black-mini-jodie-bag/12345678",
    anchor: "Bottega Veneta Mini Jodie",
    page_ascore: 92,
    page_title: "The Ultimate Luxury Resale Guide",
    is_nofollow: false,
    is_net_new: true,
    first_seen_at: "2026-06-07T00:00:00.000Z",
  },
  {
    id: "sandbox-gq-nap",
    source_url: "https://www.gq.com/story/best-designer-bags-of-the-season",
    source_domain: "gq.com",
    target_url: "https://www.net-a-porter.com/en-us/shop/product/loewe/bags/shoulder-bags/puzzle-small-leather-shoulder-bag/1647597289421987",
    anchor: "Loewe Puzzle Small",
    page_ascore: 88,
    page_title: "Best Designer Bags of the Season",
    is_nofollow: false,
    is_net_new: true,
    first_seen_at: "2026-06-07T00:00:00.000Z",
  },
];

function PoacherModule() {
  const qc = useQueryClient();
  const [sandboxMode, setSandboxMode] = useState(false);
  const [sandboxPitches, setSandboxPitches] = useState<Record<string, { subject: string; body: string }>>({});

  const feed = useQuery({
    queryKey: ["apex", "poacher"],
    queryFn: () => callAdminServerFn(getPoacherFeed),
    enabled: !sandboxMode,
  });
  const refresh = useMutation({
    mutationFn: async () => {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          for (const k of Object.keys(window.localStorage)) {
            if (k.startsWith("apex.") || k.startsWith("apex-predator")) window.localStorage.removeItem(k);
          }
        }
      } catch { /* ignore */ }
      qc.removeQueries({ queryKey: ["apex", "poacher"] });
      return callAdminServerFn(refreshPoacherFeed);
    },
    onSuccess: () => feed.refetch(),
  });
  const draft = useMutation({
    mutationFn: (id: string) => callAdminServerFn(draftPoacherPitch, { data: { id } }),
    onSuccess: () => feed.refetch(),
  });
  const draftSandbox = useMutation({
    mutationFn: (row: SandboxRow) =>
      callAdminServerFn(draftPoacherPitchInline, {
        data: {
          source_url: row.source_url,
          source_domain: row.source_domain,
          anchor: row.anchor,
          target_url: row.target_url,
          page_title: row.page_title,
        },
      }),
    onSuccess: (res, row) => {
      setSandboxPitches((prev) => ({ ...prev, [row.id]: res }));
    },
  });

  type DisplayRow = {
    id: string;
    source_url: string;
    source_domain: string;
    target_url: string | null;
    anchor: string | null;
    page_ascore: number | null;
    is_nofollow: boolean;
    is_net_new: boolean;
    first_seen_at: string;
    pitch_subject: string | null;
    pitch_body: string | null;
    isSandbox: boolean;
    sandboxSource?: SandboxRow;
  };

  const rows: DisplayRow[] = sandboxMode
    ? SANDBOX_ROWS.map((r) => ({
        id: r.id,
        source_url: r.source_url,
        source_domain: r.source_domain,
        target_url: r.target_url,
        anchor: r.anchor,
        page_ascore: r.page_ascore,
        is_nofollow: r.is_nofollow,
        is_net_new: r.is_net_new,
        first_seen_at: r.first_seen_at,
        pitch_subject: sandboxPitches[r.id]?.subject ?? null,
        pitch_body: sandboxPitches[r.id]?.body ?? null,
        isSandbox: true,
        sandboxSource: r,
      }))
    : (feed.data?.rows ?? []).map((r) => ({
        id: r.id,
        source_url: r.source_url,
        source_domain: r.source_domain,
        target_url: r.target_url,
        anchor: r.anchor,
        page_ascore: r.page_ascore,
        is_nofollow: r.is_nofollow,
        is_net_new: r.is_net_new,
        first_seen_at: r.first_seen_at,
        pitch_subject: r.pitch_subject,
        pitch_body: r.pitch_body,
        isSandbox: false,
      }));

  return (
    <div>
      <ModuleHeader
        title="BACKLINK INTERCEPT"
        sub={`Tracking net-new high-authority backlinks earned by ${COMPETITOR_DOMAINS.slice(0, 2).join(" + ")}. For every AS ≥ 40 editorial link pointing at a designer item, draft outreach pitching ${OUR_DOMAIN} as the curated alternative source.`}
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setSandboxMode((v) => !v)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: sandboxMode ? "rgba(57,255,136,0.12)" : "transparent",
                border: `1px solid ${sandboxMode ? T.neon : T.border}`,
                color: sandboxMode ? T.neon : T.muted,
                padding: "5px 10px", fontFamily: T.mono, fontSize: 10,
                letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase",
              }}
              aria-pressed={sandboxMode}
            >
              <span
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: sandboxMode ? T.neon : T.border,
                  boxShadow: sandboxMode ? `0 0 8px ${T.neon}` : "none",
                }}
              />
              {sandboxMode ? "Mode: Premium Media Sandbox" : "Mode: Live Semrush"}
            </button>
            {!sandboxMode && (
              <ActionBtn onClick={() => refresh.mutate()} disabled={refresh.isPending} color={T.neon}>
                <RefreshCw size={12} className={refresh.isPending ? "animate-spin" : ""} />
                {refresh.isPending ? "INTERCEPTING…" : "INTERCEPT FEED"}
              </ActionBtn>
            )}
          </div>
        }
      />
      {sandboxMode && (
        <Banner color={T.neon}>
          Premium Media Sandbox active — drafting against {SANDBOX_ROWS.length} prestige test rows (Vogue → SSENSE, GQ → Net-a-Porter). Live DB feed paused; no rows are written.
        </Banner>
      )}
      {!sandboxMode && refresh.isError && <Banner color={T.red}>{(refresh.error as Error).message}</Banner>}
      {!sandboxMode && feed.isError && <Banner color={T.red}>FEED ERROR: {(feed.error as Error).message}</Banner>}
      {!sandboxMode && feed.data?.error && <Banner color={T.red}>SERVER: {feed.data.error}</Banner>}
      {!sandboxMode && feed.data?.seeded && <Banner color={T.amber}>Showing placeholder data — click INTERCEPT FEED to pull live backlinks from Semrush.</Banner>}
      {!sandboxMode && feed.isLoading && <div style={{ color: T.muted, fontSize: 12 }}>Loading interception feed…</div>}
      {draftSandbox.isError && <Banner color={T.red}>PITCH ERROR: {(draftSandbox.error as Error).message}</Banner>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((row) => {
          const isDrafting =
            (row.isSandbox && draftSandbox.isPending && draftSandbox.variables?.id === row.id) ||
            (!row.isSandbox && draft.isPending && draft.variables === row.id);
          const onDraft = () => {
            if (row.isSandbox && row.sandboxSource) draftSandbox.mutate(row.sandboxSource);
            else draft.mutate(row.id);
          };
          const draftDisabled = isDrafting || (!row.isSandbox && row.id.startsWith("seed-"));
          return (
            <article key={row.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${row.is_net_new ? T.neon : T.border}`, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ color: row.page_ascore && row.page_ascore >= 50 ? T.neon : T.ink, fontSize: 11, fontWeight: 700 }}>AS {row.page_ascore ?? "—"}</span>
                <span style={{ color: T.muted, fontSize: 11 }}>{row.source_domain}</span>
                <a href={row.source_url} target="_blank" rel="noreferrer" style={{ color: T.ink, fontSize: 12, textDecoration: "none", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.source_url}
                </a>
                {row.isSandbox && <span style={{ color: T.neon, fontSize: 10, letterSpacing: "0.1em" }}>● SANDBOX</span>}
                {row.is_net_new && <span style={{ color: T.neon, fontSize: 10, letterSpacing: "0.1em" }}>● NET-NEW</span>}
                {row.is_nofollow && <span style={{ color: T.muted, fontSize: 10 }}>nofollow</span>}
                <span style={{ color: T.muted, fontSize: 10 }}>{renderSafeUIDate(row.first_seen_at)}</span>
                <ActionBtn onClick={onDraft} disabled={draftDisabled} color={T.amber}>
                  <Zap size={11} />
                  {isDrafting ? "DRAFTING…" : row.pitch_body ? "REGENERATE" : "SECURE BACKLINK"}
                </ActionBtn>
              </div>
              {row.isSandbox && row.sandboxSource && (
                <div style={{ marginTop: 6, fontSize: 11, color: T.muted }}>
                  Title: <span style={{ color: T.ink }}>"{row.sandboxSource.page_title}"</span>
                </div>
              )}
              {row.anchor && (
                <div style={{ marginTop: 6, fontSize: 11, color: T.muted }}>
                  Anchor: <span style={{ color: T.ink }}>"{row.anchor}"</span>{row.target_url ? <> → {row.target_url}</> : null}
                </div>
              )}
              {row.pitch_body && (
                <div style={{ marginTop: 12, borderTop: `1px dashed ${T.border}`, paddingTop: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: T.neon, fontSize: 10, letterSpacing: "0.1em" }}>PITCH</span>
                    <span style={{ color: T.ink, fontSize: 12, fontWeight: 600 }}>{row.pitch_subject}</span>
                    <ActionBtn onClick={() => copyText(`Subject: ${row.pitch_subject}\n\n${row.pitch_body}`)} color={T.ink}>
                      <Copy size={11} /> COPY
                    </ActionBtn>
                    <ActionBtn
                      onClick={() => window.open(`https://mail.google.com/mail/?view=cm&su=${encodeURIComponent(row.pitch_subject || "")}&body=${encodeURIComponent(row.pitch_body || "")}`, "_blank")}
                      color={T.ink}
                    >
                      <Mail size={11} /> GMAIL
                    </ActionBtn>
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, color: T.ink, fontFamily: T.mono, margin: 0 }}>{row.pitch_body}</pre>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================
function HijackModule() {
  const [domain, setDomain] = useState<(typeof COMPETITOR_DOMAINS)[number]>(COMPETITOR_DOMAINS[0]);
  const [transactionalOnly, setTransactionalOnly] = useState(true);
  const feed = useQuery({
    queryKey: ["apex", "hijack", domain, transactionalOnly],
    queryFn: () => callAdminServerFn(getHijackFeed, { data: { domain, transactionalOnly } }),
  });
  const refresh = useMutation({
    mutationFn: () => callAdminServerFn(getHijackFeed, { data: { domain, transactionalOnly, force: true } }),
    onSuccess: () => feed.refetch(),
  });
  const [openBlueprint, setOpenBlueprint] = useState<string | null>(null);
  const [blueprints, setBlueprints] = useState<Record<string, ContentBlueprint>>({});
  const blueprint = useMutation({
    mutationFn: (vars: { url: string; targetKeyword?: string }) => callAdminServerFn(generateContentBlueprint, { data: vars }),
    onSuccess: (data, vars) => {
      setBlueprints((b) => ({ ...b, [vars.url]: data }));
      setOpenBlueprint(vars.url);
    },
  });

  const intentColor = (intent: string) =>
    intent === "transactional" ? T.neon : intent === "commercial" ? T.amber : T.muted;

  return (
    <div>
      <ModuleHeader
        title="HIJACK FEED — TRANSACTION TARGETS"
        sub={`Reverse-engineering ${domain}'s highest-revenue pages. ${transactionalOnly ? "Filtered to commercial + transactional intent only — every row is a credit-card-swipe candidate." : "Showing all intents."} Generate a content brief to outrank each.`}
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setTransactionalOnly((v) => !v)}
              style={{
                background: transactionalOnly ? T.neon : "transparent",
                color: transactionalOnly ? T.bg : T.neon,
                border: `1px solid ${T.neon}`,
                padding: "5px 10px",
                fontSize: 10,
                letterSpacing: "0.1em",
                fontFamily: T.mono,
                fontWeight: 700,
                cursor: "pointer",
              }}
              title="Show only Commercial + Transactional intent keywords"
            >
              {transactionalOnly ? "● TXN ONLY" : "○ ALL INTENTS"}
            </button>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as (typeof COMPETITOR_DOMAINS)[number])}
              style={{ background: T.surface, color: T.ink, border: `1px solid ${T.border}`, padding: "5px 8px", fontFamily: T.mono, fontSize: 11 }}
            >
              {COMPETITOR_DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ActionBtn onClick={() => refresh.mutate()} disabled={refresh.isPending} color={T.neon}>
              <RefreshCw size={12} className={refresh.isPending ? "animate-spin" : ""} />
              {refresh.isPending ? "PULLING…" : "REFRESH"}
            </ActionBtn>
          </div>
        }
      />
      {feed.isLoading && <div style={{ color: T.muted, fontSize: 12 }}>Loading top ranking pages…</div>}
      {feed.isError && <Banner color={T.red}>FEED ERROR: {(feed.error as Error).message}</Banner>}
      {feed.data?.error && <Banner color={T.red}>SEMRUSH: {feed.data.error}</Banner>}
      {feed.data?.seeded && <Banner color={T.amber}>Showing placeholder data for {domain} — click REFRESH to pull live data from Semrush.</Banner>}
      {feed.data && feed.data.filteredOut > 0 && (
        <Banner color={T.muted}>
          {feed.data.filteredOut} informational/navigational row{feed.data.filteredOut === 1 ? "" : "s"} hidden — toggle ALL INTENTS to see every page.
        </Banner>
      )}
      {feed.data && feed.data.rows.length === 0 && !feed.isLoading && (
        <Banner color={T.amber}>
          No commercial/transactional pages found for {domain} with current filter — toggle ALL INTENTS or REFRESH.
        </Banner>
      )}
      {feed.data && feed.data.rows.length > 0 && (
        <div style={{ border: `1px solid ${T.border}`, background: T.surface }}>
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 80px 80px 1fr 60px 60px 80px 160px", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.muted, letterSpacing: "0.1em" }}>
            <span>#</span><span>URL</span><span style={{ textAlign: "right" }}>TRAFFIC</span><span style={{ textAlign: "right" }}>KWS</span><span>TOP KW</span><span style={{ textAlign: "right" }}>VOL</span><span style={{ textAlign: "right" }}>KD</span><span>INTENT</span><span></span>
          </div>
          {feed.data.rows.map((row, i) => (
            <div key={row.url}>
              <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 80px 80px 1fr 60px 60px 80px 160px", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${T.border}`, fontSize: 11, alignItems: "center" }}>
                <span style={{ color: T.muted }}>{i + 1}</span>
                <a href={row.url} target="_blank" rel="noreferrer" style={{ color: T.ink, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.url.replace(/^https?:\/\/[^/]+/, "")}</a>
                <span style={{ textAlign: "right", color: T.neon }}>{fmt(row.est_traffic)}</span>
                <span style={{ textAlign: "right", color: T.ink }}>{fmt(row.keyword_count)}</span>
                <span style={{ color: T.amber, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.top_keyword || "—"}</span>
                <span style={{ textAlign: "right" }}>{fmt(row.top_keyword_volume)}</span>
                <span style={{ textAlign: "right", color: row.top_keyword_kd > 60 ? T.amber : T.ink }}>{row.top_keyword_kd || "—"}</span>
                <span style={{ color: intentColor(row.top_keyword_intent), fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>{row.top_keyword_intent}</span>
                <ActionBtn onClick={() => blueprint.mutate({ url: row.url, targetKeyword: row.top_keyword || undefined })} disabled={blueprint.isPending && blueprint.variables?.url === row.url} color={T.neon}>
                  <Zap size={11} /> BLUEPRINT
                </ActionBtn>
              </div>
              {openBlueprint === row.url && blueprints[row.url] && <BlueprintPanel bp={blueprints[row.url]} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BlueprintPanel({ bp }: { bp: ContentBlueprint }) {
  const md = blueprintToMarkdown(bp);
  return (
    <div style={{ background: T.bg, padding: 16, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ color: T.neon, fontSize: 10, letterSpacing: "0.1em" }}>CONTENT BLUEPRINT</span>
        <span style={{ color: T.ink, fontSize: 12 }}>{bp.targetKeyword} · {bp.searchIntent} · ~{fmt(bp.wordCount)} words</span>
        <ActionBtn onClick={() => copyText(md)} color={T.ink}><Copy size={11} /> COPY MD</ActionBtn>
        <ActionBtn onClick={() => download(`blueprint-${bp.targetKeyword.replace(/\W+/g, "-")}.md`, md)} color={T.ink}><FileDown size={11} /> EXPORT</ActionBtn>
      </div>
      <div style={{ fontSize: 11, color: T.ink, marginBottom: 8 }}>{bp.intentBrief}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 11 }}>
        <div>
          <div style={{ color: T.muted, fontSize: 10, letterSpacing: "0.1em", marginBottom: 4 }}>SEMANTIC TERMS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {bp.semanticTerms.map((t) => <span key={t} style={{ border: `1px solid ${T.border}`, padding: "2px 6px", fontSize: 10, color: T.ink }}>{t}</span>)}
          </div>
          <div style={{ color: T.muted, fontSize: 10, letterSpacing: "0.1em", margin: "12px 0 4px" }}>INTERNAL LINKS</div>
          {bp.internalLinkTargets.map((t) => <div key={t} style={{ color: T.amber }}>→ {t}</div>)}
          <div style={{ color: T.muted, fontSize: 10, letterSpacing: "0.1em", margin: "12px 0 4px" }}>SCHEMA</div>
          {bp.schemaTypes.map((t) => <span key={t} style={{ color: T.neon, marginRight: 8 }}>{t}</span>)}
        </div>
        <div>
          <div style={{ color: T.muted, fontSize: 10, letterSpacing: "0.1em", marginBottom: 4 }}>OUTLINE</div>
          {bp.outline.map((s, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ color: T.ink, fontWeight: 600 }}>{s.h2}</div>
              {s.h3s.map((h, j) => <div key={j} style={{ color: T.muted, paddingLeft: 12 }}>· {h}</div>)}
            </div>
          ))}
          <div style={{ color: T.muted, fontSize: 10, letterSpacing: "0.1em", margin: "12px 0 4px" }}>E-E-A-T SIGNALS</div>
          {bp.eatSignals.map((s, i) => <div key={i} style={{ color: T.ink }}>· {s}</div>)}
        </div>
      </div>
    </div>
  );
}

function blueprintToMarkdown(bp: ContentBlueprint): string {
  return `# Content Blueprint: ${bp.targetKeyword}\n\n**Intent:** ${bp.searchIntent}\n**Target word count:** ${bp.wordCount}\n\n${bp.intentBrief}\n\n## Semantic terms\n${bp.semanticTerms.map((t) => `- ${t}`).join("\n")}\n\n## Outline\n${bp.outline.map((s) => `### ${s.h2}\n${s.h3s.map((h) => `- ${h}`).join("\n")}\n\n_${s.evidence}_`).join("\n\n")}\n\n## Internal links\n${bp.internalLinkTargets.map((t) => `- ${t}`).join("\n")}\n\n## Schema\n${bp.schemaTypes.join(", ")}\n\n## E-E-A-T signals\n${bp.eatSignals.map((s) => `- ${s}`).join("\n")}\n`;
}

function download(name: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// =============================================================
function StrikingModule() {
  const pipe = useQuery({
    queryKey: ["apex", "striking"],
    queryFn: () => callAdminServerFn(getStrikingPipeline),
  });
  const [plans, setPlans] = useState<Record<string, StrikePlan>>({});
  const [patches, setPatches] = useState<Record<string, HighIntentSeoPatch>>({});
  const plan = useMutation({
    mutationFn: (vars: { query: string; page: string | null; position: number; impressions: number; kd: number }) =>
      callAdminServerFn(generateStrikePlan, { data: vars }),
    onSuccess: (data, vars) => setPlans((p) => ({ ...p, [vars.query]: data })),
  });
  const patch = useMutation({
    mutationFn: (vars: { productTitle: string; productUrl: string | null; query: string }) =>
      callAdminServerFn(generateHighIntentSeoPatch, { data: vars }),
    onSuccess: (data, vars) => setPatches((p) => ({ ...p, [vars.query]: data })),
  });

  const planFor = useCallback((q: string) => plans[q], [plans]);
  const patchFor = useCallback((q: string) => patches[q], [patches]);

  /** Derive a clean product-title-style string from a Palace of Roman product URL slug. */
  const productTitleFromPage = (page: string | null, query: string): { title: string; isProduct: boolean } => {
    if (!page) return { title: query, isProduct: false };
    const m = page.match(/\/products?\/([^/?#]+)/i);
    if (!m) return { title: query, isProduct: false };
    const slug = m[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return { title: slug, isProduct: true };
  };

  return (
    <div>
      <ModuleHeader
        title="STRIKING-DISTANCE PIPELINE"
        sub="Positions 4–11, ranked by Impact Score (impressions × CTR lift to top-3 × inverse KD). STRIKE PLAN rewrites editorial pages; HIGH-INTENT PATCH rewrites product pages for transactional buyers."
      />
      {pipe.data?.quotaWarning && <Banner color={T.amber}>{pipe.data.quotaWarning}</Banner>}
      {pipe.isLoading && <div style={{ color: T.muted, fontSize: 12 }}>Scanning GSC + Semrush KD…</div>}
      {pipe.data && pipe.data.rows.length === 0 && <Banner color={T.amber}>No striking-distance queries found in the latest weekly review.</Banner>}
      {pipe.data && (
        <div style={{ border: `1px solid ${T.border}`, background: T.surface }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 70px 90px 60px 90px 220px", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${T.border}`, fontSize: 10, color: T.muted, letterSpacing: "0.1em" }}>
            <span style={{ textAlign: "right" }}>IMPACT</span><span>QUERY</span><span style={{ textAlign: "right" }}>POS</span><span style={{ textAlign: "right" }}>IMPR</span><span style={{ textAlign: "right" }}>KD</span><span>PAGE</span><span>ACTIONS</span>
          </div>
          {pipe.data.rows.map((row, i) => {
            const isTop = i < 10;
            const p = planFor(row.query);
            const hp = patchFor(row.query);
            const { title: productTitle, isProduct } = productTitleFromPage(row.page, row.query);
            return (
              <div key={row.query + i}>
                <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 70px 90px 60px 90px 220px", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${T.border}`, fontSize: 11, alignItems: "center", borderLeft: `3px solid ${isTop ? T.neon : "transparent"}` }}>
                  <span style={{ textAlign: "right", color: isTop ? T.neon : T.ink, fontWeight: 700 }}>{fmt(row.impactScore)}</span>
                  <span style={{ color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.query}</span>
                  <span style={{ textAlign: "right", color: T.amber }}>{row.position.toFixed(1)}</span>
                  <span style={{ textAlign: "right" }}>{fmt(row.impressions)}</span>
                  <span style={{ textAlign: "right", color: row.kd > 50 ? T.amber : T.ink }}>{row.kd}</span>
                  <span style={{ color: T.muted, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.page ? row.page.replace(/^https?:\/\/[^/]+/, "") : "—"}
                    {isProduct && <span style={{ color: T.neon, marginLeft: 6 }}>● PRODUCT</span>}
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <ActionBtn onClick={() => plan.mutate({ query: row.query, page: row.page, position: row.position, impressions: row.impressions, kd: row.kd })} disabled={plan.isPending && plan.variables?.query === row.query} color={isTop ? T.neon : T.amber}>
                      <Zap size={11} /> STRIKE PLAN
                    </ActionBtn>
                    {isProduct && (
                      <ActionBtn
                        onClick={() => patch.mutate({ productTitle, productUrl: row.page, query: row.query })}
                        disabled={patch.isPending && patch.variables?.query === row.query}
                        color={T.neon}
                        title="Rewrite this product page's <title>, H1 and meta for high-intent commercial buyers"
                      >
                        <Target size={11} /> HIGH-INTENT PATCH
                      </ActionBtn>
                    )}
                  </div>
                </div>
                {p && <StrikePlanPanel plan={p} />}
                {hp && <HighIntentPatchPanel patch={hp} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HighIntentPatchPanel({ patch }: { patch: HighIntentSeoPatch }) {
  const text = `# High-Intent SEO Patch\nProduct: ${patch.productTitle}\nURL: ${patch.productUrl || "(unknown)"}\n\nTarget keyword: ${patch.targetKeyword}\nSecondary: ${patch.secondaryKeywords.join(", ")}\n\nTitle: ${patch.newTitle}\nH1: ${patch.newH1}\nMeta: ${patch.newMetaDescription}\n\nRationale: ${patch.rationale}`;
  return (
    <div style={{ background: T.bg, padding: 14, borderBottom: `1px solid ${T.border}`, fontSize: 11, borderLeft: `3px solid ${T.neon}` }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
        <span style={{ color: T.neon, fontSize: 10, letterSpacing: "0.1em", fontWeight: 700 }}>● HIGH-INTENT SEO PATCH</span>
        <span style={{ color: T.muted, fontSize: 10 }}>raw: "{patch.productTitle}"</span>
        <ActionBtn onClick={() => copyText(text)} color={T.ink}><Copy size={11} /> COPY</ActionBtn>
        <ActionBtn onClick={() => download(`high-intent-${Date.now()}.md`, text)} color={T.ink}><FileDown size={11} /> EXPORT</ActionBtn>
      </div>
      <div><span style={{ color: T.muted }}>Target KW    </span><span style={{ color: T.neon }}>{patch.targetKeyword}</span></div>
      <div><span style={{ color: T.muted }}>Secondary KW </span><span style={{ color: T.amber }}>{patch.secondaryKeywords.join(" · ")}</span></div>
      <div style={{ marginTop: 6 }}><span style={{ color: T.muted }}>&lt;title&gt; </span><span style={{ color: T.ink }}>{patch.newTitle}</span> <span style={{ color: T.muted }}>({patch.newTitle.length}c)</span></div>
      <div><span style={{ color: T.muted }}>H1      </span><span style={{ color: T.ink }}>{patch.newH1}</span> <span style={{ color: T.muted }}>({patch.newH1.length}c)</span></div>
      <div><span style={{ color: T.muted }}>Meta    </span><span style={{ color: T.ink }}>{patch.newMetaDescription}</span> <span style={{ color: T.muted }}>({patch.newMetaDescription.length}c)</span></div>
      <div style={{ marginTop: 8, color: T.ink, fontStyle: "italic" }}>{patch.rationale}</div>
    </div>
  );
}

function StrikePlanPanel({ plan }: { plan: StrikePlan }) {
  const patch = `Title: ${plan.newTitle}\nMeta: ${plan.newMetaDescription}\nH1: ${plan.newH1}\n\nInternal links:\n${plan.internalLinkSources.map((l) => `- from ${l.fromPath} anchor: "${l.anchorText}"`).join("\n")}\n\nRationale: ${plan.rationale}`;
  return (
    <div style={{ background: T.bg, padding: 14, borderBottom: `1px solid ${T.border}`, fontSize: 11 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <span style={{ color: T.neon, fontSize: 10, letterSpacing: "0.1em" }}>STRIKE PLAN</span>
        <ActionBtn onClick={() => copyText(patch)} color={T.ink}><Copy size={11} /> COPY PATCH</ActionBtn>
        <ActionBtn onClick={() => download(`strike-${Date.now()}.md`, patch)} color={T.ink}><FileDown size={11} /> EXPORT</ActionBtn>
      </div>
      <div><span style={{ color: T.muted }}>Title </span><span style={{ color: T.ink }}>{plan.newTitle}</span> <span style={{ color: T.muted }}>({plan.newTitle.length}c)</span></div>
      <div><span style={{ color: T.muted }}>Meta  </span><span style={{ color: T.ink }}>{plan.newMetaDescription}</span> <span style={{ color: T.muted }}>({plan.newMetaDescription.length}c)</span></div>
      <div><span style={{ color: T.muted }}>H1    </span><span style={{ color: T.ink }}>{plan.newH1}</span></div>
      <div style={{ marginTop: 8, color: T.muted, fontSize: 10, letterSpacing: "0.1em" }}>INTERNAL LINK SOURCES</div>
      {plan.internalLinkSources.map((l, i) => (
        <div key={i}><span style={{ color: T.amber }}>→ {l.fromPath}</span> <span style={{ color: T.muted }}>anchor:</span> "{l.anchorText}"</div>
      ))}
      <div style={{ marginTop: 8, color: T.ink, fontStyle: "italic" }}>{plan.rationale}</div>
    </div>
  );
}

// =============================================================
function ModuleHeader({ title, sub, action }: { title: string; sub: string; action?: React.ReactNode }) {
  return (
    <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
      <div>
        <div style={{ color: T.neon, fontSize: 11, letterSpacing: "0.2em", fontWeight: 700 }}>{title}</div>
        <div style={{ color: T.muted, fontSize: 12, marginTop: 4, maxWidth: 720 }}>{sub}</div>
      </div>
      {action}
    </header>
  );
}

function ActionBtn({ children, color, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { color: string }) {
  return (
    <button
      {...props}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "transparent", border: `1px solid ${color}`, color, padding: "5px 10px",
        fontSize: 10, letterSpacing: "0.1em", fontFamily: T.mono, cursor: props.disabled ? "wait" : "pointer",
        opacity: props.disabled ? 0.5 : 1, fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

function Banner({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", border: `1px solid ${color}`, color, marginBottom: 12, fontSize: 11 }}>
      <AlertTriangle size={12} /> {children}
    </div>
  );
}
