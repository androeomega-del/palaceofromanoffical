import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Copy, Check, Printer } from "lucide-react";

export const Route = createFileRoute("/brief/summer-2026")({
  component: BriefPage,
  head: () => ({
    meta: [
      { title: "Creator Brief — Palace of Roman Summer 2026" },
      {
        name: "description",
        content:
          "Luxury fashion UGC brief for the Palace of Roman Summer 2026 yacht campaign. Scenes, hooks, end card, and hashtags for creators.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type Section = { id: string; title: string; body: string };

const SECTIONS: Section[] = [
  {
    id: "campaign",
    title: "Campaign",
    body: `Campaign Name: Palace of Roman Summer 2026
Brand: Palace of Roman — Luxury Designer Fashion Boutique featuring Versace, Roberto Cavalli, Philipp Plein, John Galliano, Dolce & Gabbana, Balmain, Calvin Klein and more.`,
  },
  {
    id: "setting",
    title: "Setting",
    body: `A private luxury yacht on open crystal-blue Mediterranean water during golden hour. Capri / Amalfi coastline cues. Teak deck, ivory cushions, raffia accents, tortoise sunglasses.`,
  },
  {
    id: "scenes",
    title: "Scene Direction",
    body: `1. Walking across the yacht deck in a full designer look, sunglasses on, confident stride.
2. Sitting at the bow with silk resort wear flowing in the wind.
3. Unboxing a designer piece with the open ocean in the background.
4. Close-up of a designer logo with the sea blurred behind it.
5. Golden-hour silhouette shot in a flowing designer outfit on the deck.`,
  },
  {
    id: "tone",
    title: "Visual Tone",
    body: `Azure blue, ivory, champagne gold, warm coral. Natural golden-hour lighting. Cinematic, restrained, effortlessly glamorous. Vogue Italia colour grade. No on-screen text mid-clip — leave clean for trending audio overlay.`,
  },
  {
    id: "hooks",
    title: "Hook Options (first 3 seconds — pick one)",
    body: `• "Summer looks different when you're on a yacht…"
• "This is what luxury resort fashion was made for."
• "POV: you and your designer wardrobe just set sail."`,
  },
  {
    id: "endcard",
    title: "MANDATORY End Card (final 3–5 seconds)",
    body: `Display the following text exactly as written, centered on screen, in an elegant serif font, white or gold colour, 1-second fade in, held for 3 seconds. English only, fully legible, not distorted, not translated, not altered in any way:

Palace of Roman — Summer 2026`,
  },
  {
    id: "hashtags",
    title: "Hashtags",
    body: `#PalaceOfRomanSummer2026 #YachtLife #LuxuryFashion #ResortSummer2026 #Versace #RobertoCavalli #DolceGabbana #Balmain #CalvinKlein #MediterraneanStyle #LuxuryYacht`,
  },
];

const FULL_BRIEF = SECTIONS.map((s) => `${s.title.toUpperCase()}\n${s.body}`).join("\n\n");

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* noop */
        }
      }}
      className="inline-flex items-center gap-2 border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#0a0f1e] transition-colors px-3 py-1.5 text-[11px] tracking-[0.2em] uppercase"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function BriefPage() {
  const printRef = useRef<HTMLDivElement>(null);
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-[#f4ecd8] print:bg-white print:text-black">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div ref={printRef} className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24">
        {/* Header */}
        <header className="text-center border-b border-[#c9a84c]/30 pb-10 mb-12">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#c9a84c] mb-4">
            Palace of Roman · Creator Brief
          </p>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-wide">
            Summer 2026
            <span className="block text-[#c9a84c] italic text-2xl md:text-3xl mt-2">
              The Mediterranean Yacht Edit
            </span>
          </h1>
          <p className="mt-6 text-sm text-[#f4ecd8]/70 max-w-xl mx-auto">
            A luxury UGC brief for creators. Editorial, restrained, cinematic.
            Read it twice. Shoot once.
          </p>

          <div className="no-print mt-8 flex flex-wrap items-center justify-center gap-3">
            <CopyButton text={FULL_BRIEF} label="Copy Full Brief" />
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#0a0f1e] transition-colors px-3 py-1.5 text-[11px] tracking-[0.2em] uppercase"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
          </div>
        </header>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map((s) => {
            const isEndCard = s.id === "endcard";
            return (
              <section
                key={s.id}
                className={
                  isEndCard
                    ? "border border-[#c9a84c] bg-[#c9a84c]/[0.06] p-6 md:p-8"
                    : "border-b border-[#c9a84c]/15 pb-8"
                }
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h2
                    className={
                      isEndCard
                        ? "font-serif text-xl md:text-2xl text-[#c9a84c] tracking-wide"
                        : "font-serif text-lg md:text-xl tracking-wide"
                    }
                  >
                    {s.title}
                  </h2>
                  <div className="no-print shrink-0">
                    <CopyButton text={s.body} />
                  </div>
                </div>
                <pre
                  className={
                    "whitespace-pre-wrap font-sans text-[15px] leading-relaxed " +
                    (isEndCard ? "text-[#f4ecd8]" : "text-[#f4ecd8]/85")
                  }
                  style={{ fontFamily: "inherit" }}
                >
                  {s.body}
                </pre>

                {isEndCard && (
                  <div className="mt-6 border border-[#c9a84c]/50 bg-[#0a0f1e] p-8 text-center">
                    <p className="font-serif text-2xl md:text-3xl text-[#c9a84c] italic">
                      Palace of Roman — Summer 2026
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <footer className="mt-16 pt-8 border-t border-[#c9a84c]/30 text-center">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a84c]">
            Palace of Roman
          </p>
          <p className="text-xs text-[#f4ecd8]/50 mt-2">
            palaceofromanofficial.com · For creator use only
          </p>
        </footer>
      </div>
    </div>
  );
}
