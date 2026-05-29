import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";

export const Route = createFileRoute("/admin/creative-brief")({
  ssr: false,
  beforeLoad: adminBeforeLoad,
  component: CreativeBriefApp,
  head: () => ({
    meta: [
      { title: "Palace of Roman Summer 2026 — Creative Brief" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

// ---------------------------------------------------------------------------
// Compliance knowledge base — hard-coded into the app.
// ---------------------------------------------------------------------------
const FLAGGED_WORDS = [
  "sale",
  "discount",
  "only a few left",
  "last chance",
  "official",
  "authorized",
  "authorised",
  "don't miss out",
  "dont miss out",
  "complete your purchase",
  "limited time",
  "hurry",
  "act now",
  "endorsed",
  "affiliated",
  "exclusive deal",
  "cheaper",
  "lowest price",
];

const NEVER_ALLOW = [
  "Brand logos overlaid on creative",
  "Official brand slogans copied from any designer house",
  "Price tags or discount badges on screen",
  "Urgency language (Only a few left, Last chance, Don't miss out, Complete your purchase)",
  "Emojis in ad copy or text overlays",
  "Bright accent colors or heavily designed promotional graphics",
  "Claims of being official, authorized, affiliated with, or endorsed by any designer brand",
  "Campaign images lifted from brand websites",
  "Language implying price superiority or exclusivity",
  "Copy that tries to persuade rather than describe",
  "Aggressive retargeting that feels like chasing the buyer",
];

const ALWAYS_REQUIRE = [
  "Editorial tone — written as a fashion magazine introducing a collection",
  "Neutral, calm, factual language focused on curation and availability",
  "One hero product per frame in all visual direction",
  "Natural lighting and generous negative space",
  "Clean serif or sans-serif typography in white or gold for all text overlays",
  "English-only text — no auto-translations or language switching",
];

const COMPLIANCE_CHECKLIST = [
  "No brand logos overlaid on the creative",
  "No official designer-house slogans used",
  "No price tags, discount badges, or promo graphics on screen",
  "No urgency language (last chance, only a few left, hurry, etc.)",
  "No emojis in copy or on-screen text",
  "No claim of being official, authorized, affiliated, or endorsed by any maison",
  "No imagery lifted from brand websites",
  "Editorial tone — describes, does not persuade",
  "One hero product per frame, natural light, generous negative space",
  "Text overlays are serif/sans-serif in white or gold, English only",
  "Mandatory end card present (3–5s, centered, white or gold serif): \"Palace of Roman Summer 2026\"",
];

// ---------------------------------------------------------------------------
// The brief content
// ---------------------------------------------------------------------------
const BRIEF = {
  campaign: "Palace of Roman Summer 2026",
  brand:
    "Palace of Roman — a curated destination for designer fashion. The summer 2026 edit features pieces from Gucci, Versace, Dolce & Gabbana, Balmain, Calvin Klein, and other European maisons.",
  setting:
    "A private luxury yacht on open crystal-blue Mediterranean water during golden hour.",
  scenes: [
    "Walking slowly across the yacht deck in a full designer look — sunglasses on, confident stride",
    "Seated at the bow of the yacht with silk resort wear moving in the wind",
    "Revealing a designer piece with the open ocean in the background",
    "Close-up of a designer label with the sea softly blurred behind it",
    "Champagne dockside moment in a full luxury outfit",
    "Golden hour backlit silhouette in a flowing designer dress or linen set on the deck",
  ],
  visualTone:
    "Azure blue, ivory, champagne gold, warm coral. Natural golden hour sunlight. No harsh filters. Cinematic, aspirational, effortlessly glamorous. Calm confidence — not excitement or urgency.",
  hooks: [
    "Summer looks different when you're on a yacht…",
    "This is what resort fashion was made for",
    "POV: you and your designer wardrobe just set sail",
    "The most refined summer edit has arrived",
  ],
  hashtags:
    "#PalaceOfRomanSummer2026 #YachtLife #LuxuryFashion #ResortSummer2026 #Gucci #Versace #DolceGabbana #Balmain #CalvinKlein #MediterraneanStyle #LuxuryYacht #DesignerFashion",
  endCard:
    "Palace of Roman Summer 2026",
  endCardSpec:
    "Final 3–5 seconds. Centered on screen in a clean elegant serif font, white or gold. Fully legible English. Must not be translated, distorted, reworded, paraphrased, or altered. 1-second gentle fade-in, hold for a minimum of 3 seconds.",
};

function buildFullBriefText(): string {
  return [
    `Campaign: ${BRIEF.campaign}`,
    ``,
    `Brand: ${BRIEF.brand}`,
    ``,
    `Setting: ${BRIEF.setting}`,
    ``,
    `Scene Direction:`,
    ...BRIEF.scenes.map((s) => `  • ${s}`),
    ``,
    `Visual Tone: ${BRIEF.visualTone}`,
    ``,
    `Hook Options (creator picks one):`,
    ...BRIEF.hooks.map((h) => `  • ${h}`),
    ``,
    `Hashtags:`,
    BRIEF.hashtags,
    ``,
    `Mandatory End Card (last 3–5 seconds, white or gold serif, centered, English only):`,
    `"${BRIEF.endCard}"`,
    BRIEF.endCardSpec,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
function CreativeBriefApp() {
  const [tab, setTab] = useState<"brief" | "tone">("brief");
  const [checks, setChecks] = useState<boolean[]>(() =>
    COMPLIANCE_CHECKLIST.map(() => false),
  );
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const allChecked = checks.every(Boolean);
  const fullText = useMemo(buildFullBriefText, []);

  const violations = useMemo(() => {
    const lower = notes.toLowerCase();
    return FLAGGED_WORDS.filter((w) => lower.includes(w));
  }, [notes]);

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied("error");
    }
  };

  const downloadPdf = () => {
    if (!allChecked) return;
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-[#e9e4d6]">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-card { box-shadow: none !important; border: 1px solid #ccc !important; background: white !important; color: black !important; }
        }
      `}</style>

      <header className="border-b border-[#1a1b22] px-6 py-10 text-center">
        <p className="no-print text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]/70">
          Admin · Creative Brief
        </p>
        <h1
          className="mt-3 text-3xl md:text-5xl font-serif tracking-wide text-[#c9a84c]"
          style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
        >
          Palace of Roman Summer 2026
        </h1>
        <p className="mt-3 text-sm text-[#9a937f] max-w-2xl mx-auto">
          Luxury-compliant creative brief. Every output is filtered through the
          platform-safety and brand-voice rules ingrained in this tool.
        </p>
      </header>

      <nav className="no-print flex justify-center gap-2 border-b border-[#1a1b22] px-6 py-3 text-xs uppercase tracking-[0.3em]">
        {(["brief", "tone"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 transition ${
              tab === t
                ? "text-[#c9a84c] border-b border-[#c9a84c]"
                : "text-[#9a937f] hover:text-[#e9e4d6]"
            }`}
          >
            {t === "brief" ? "Brief" : "Tone Guide"}
          </button>
        ))}
      </nav>

      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]">
        {tab === "brief" ? (
          <section className="space-y-6">
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[#9a937f]">
                Campaign brief
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => copy("all", fullText)}
                  className="border border-[#c9a84c]/40 px-4 py-2 text-xs uppercase tracking-[0.25em] text-[#c9a84c] hover:bg-[#c9a84c]/10"
                >
                  {copied === "all" ? "Copied" : "Copy all"}
                </button>
                <button
                  onClick={downloadPdf}
                  disabled={!allChecked}
                  className="border border-[#c9a84c]/40 px-4 py-2 text-xs uppercase tracking-[0.25em] text-[#c9a84c] hover:bg-[#c9a84c]/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  title={allChecked ? "Print or save as PDF" : "Complete compliance checklist to enable"}
                >
                  Download PDF
                </button>
              </div>
            </div>

            <BriefBlock label="Campaign" value={BRIEF.campaign} onCopy={copy} copied={copied} />
            <BriefBlock label="Brand" value={BRIEF.brand} onCopy={copy} copied={copied} />
            <BriefBlock label="Setting" value={BRIEF.setting} onCopy={copy} copied={copied} />

            <BriefBlock
              label="Scene Direction"
              value={BRIEF.scenes.map((s) => `• ${s}`).join("\n")}
              onCopy={copy}
              copied={copied}
            />

            <BriefBlock
              label="Visual Tone"
              value={BRIEF.visualTone}
              onCopy={copy}
              copied={copied}
            />

            <BriefBlock
              label="Hook Options"
              value={BRIEF.hooks.map((h) => `• ${h}`).join("\n")}
              onCopy={copy}
              copied={copied}
            />

            <BriefBlock label="Hashtags" value={BRIEF.hashtags} onCopy={copy} copied={copied} />

            {/* Mandatory end-card — gold highlighted box */}
            <div
              className="print-card relative rounded-md border-2 border-[#c9a84c] bg-gradient-to-b from-[#1a1408] to-[#0d0a04] p-6 shadow-[0_0_0_4px_rgba(201,168,76,0.08)]"
            >
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]">
                Mandatory End Card · Highest Priority · Cannot Be Skipped
              </p>
              <p className="mt-4 text-xs leading-relaxed text-[#e9e4d6]">
                The final 3 to 5 seconds of every video must display the text
                below exactly as written. Centered on screen in a clean elegant
                serif font, white or gold. Fully legible English. Must not be
                translated, distorted, stylized in a way that reduces
                readability, reworded, paraphrased, or altered in any way.
                Apply a 1 second gentle fade-in and hold for a minimum of 3
                seconds.
              </p>
              <p
                className="mt-6 text-center text-3xl md:text-4xl text-[#c9a84c] tracking-wide"
                style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
              >
                {BRIEF.endCard}
              </p>
              <div className="no-print mt-6 flex justify-end">
                <button
                  onClick={() => copy("endcard", BRIEF.endCard)}
                  className="border border-[#c9a84c]/40 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[#c9a84c] hover:bg-[#c9a84c]/10"
                >
                  {copied === "endcard" ? "Copied" : "Copy end card"}
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-8">
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]">
                Always require
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[#e9e4d6]">
                {ALWAYS_REQUIRE.map((r) => (
                  <li key={r} className="flex gap-3">
                    <span className="text-[#c9a84c]">+</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]">
                Never allow
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[#9a937f]">
                {NEVER_ALLOW.map((r) => (
                  <li key={r} className="flex gap-3">
                    <span className="text-[#7a2a2a]">×</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]">
                Why this matters
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#9a937f]">
                Luxury advertising does not persuade. It reassures. Every
                creative, every word, and every visual must quietly communicate
                legitimacy, credibility, and calm confidence. Meta and Google
                treat branded luxury fashion as a high-risk category — content
                that looks promotional underperforms and risks account
                restrictions. Content must feel native to the feed: editorial,
                not promotional.
              </p>
            </div>
          </section>
        )}

        {/* Sidebar — compliance + notes */}
        <aside className="no-print space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-md border border-[#1a1b22] bg-[#0b0c12] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]">
                Compliance checklist
              </p>
              <span className="text-[10px] text-[#9a937f]">
                {checks.filter(Boolean).length}/{COMPLIANCE_CHECKLIST.length}
              </span>
            </div>
            <ul className="mt-4 space-y-3 text-xs">
              {COMPLIANCE_CHECKLIST.map((item, i) => (
                <li key={item} className="flex gap-3">
                  <input
                    id={`chk-${i}`}
                    type="checkbox"
                    checked={checks[i]}
                    onChange={(e) =>
                      setChecks((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))
                    }
                    className="mt-0.5 h-3.5 w-3.5 accent-[#c9a84c]"
                  />
                  <label
                    htmlFor={`chk-${i}`}
                    className={`leading-relaxed ${
                      checks[i] ? "text-[#9a937f] line-through" : "text-[#e9e4d6]"
                    }`}
                  >
                    {item}
                  </label>
                </li>
              ))}
            </ul>
            <p
              className={`mt-4 text-[10px] uppercase tracking-[0.3em] ${
                allChecked ? "text-[#c9a84c]" : "text-[#9a937f]"
              }`}
            >
              {allChecked ? "Cleared for download" : "Complete all to enable download"}
            </p>
          </div>

          <div className="rounded-md border border-[#1a1b22] bg-[#0b0c12] p-5">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]">
              Creator notes
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes, caption drafts, on-screen text…"
              rows={6}
              className="mt-3 w-full resize-y rounded border border-[#1a1b22] bg-[#07080c] p-3 text-xs text-[#e9e4d6] outline-none focus:border-[#c9a84c]/60"
            />
            {violations.length > 0 ? (
              <div className="mt-3 rounded border border-[#7a2a2a] bg-[#1a0a0a] p-3 text-[11px] text-[#e8b4b4]">
                <p className="uppercase tracking-[0.25em] text-[#e87a7a]">
                  Compliance warning
                </p>
                <p className="mt-2 leading-relaxed">
                  This language violates luxury ad compliance guidelines.
                </p>
                <p className="mt-2 text-[10px] text-[#c98a8a]">
                  Flagged: {violations.join(", ")}
                </p>
              </div>
            ) : notes.trim() ? (
              <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-[#c9a84c]/80">
                No violations detected
              </p>
            ) : null}
          </div>
        </aside>
      </main>
    </div>
  );
}

function BriefBlock({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: (id: string, text: string) => void;
  copied: string | null;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="print-card rounded-md border border-[#1a1b22] bg-[#0b0c12] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a84c]">
          {label}
        </p>
        <button
          onClick={() => onCopy(id, value)}
          className="no-print text-[10px] uppercase tracking-[0.25em] text-[#9a937f] hover:text-[#c9a84c]"
        >
          {copied === id ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#e9e4d6]">
        {value}
      </p>
    </div>
  );
}
