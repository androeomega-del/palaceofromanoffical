import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

export const Route = createFileRoute("/campaign/summer-2026")({
  component: CampaignPage,
  head: () => ({
    meta: [
      { title: "Summer 2026 — The Mediterranean Yacht Edit · Palace of Roman" },
      {
        name: "description",
        content:
          "Palace of Roman Summer 2026 — a cinematic Mediterranean yacht campaign featuring Versace, Roberto Cavalli, Dolce & Gabbana, Balmain and more.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

const HASHTAGS =
  "#PalaceOfRomanSummer2026 #YachtLife #LuxuryFashion #ResortSummer2026 #Versace #RobertoCavalli #DolceGabbana #Balmain #CalvinKlein #MediterraneanStyle #LuxuryYacht";

function CampaignPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-[#f4ecd8]">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-20">
        <header className="text-center mb-10">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#c9a84c] mb-3">
            Palace of Roman · Campaign Film
          </p>
          <h1 className="font-serif text-4xl md:text-6xl leading-tight">
            Summer 2026
            <span className="block text-[#c9a84c] italic text-2xl md:text-3xl mt-2">
              The Mediterranean Yacht Edit
            </span>
          </h1>
        </header>

        {/* Vertical 9:16 player */}
        <div className="mx-auto max-w-sm">
          <div className="relative aspect-[9/16] bg-black border border-[#c9a84c]/30 overflow-hidden">
            <video
              ref={videoRef}
              src="/campaign/summer-2026.mp4"
              poster=""
              playsInline
              loop
              preload="auto"
              onClick={toggle}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onVolumeChange={(e) => setMuted((e.target as HTMLVideoElement).muted)}
              className="h-full w-full object-cover cursor-pointer"
            />

            {!playing && (
              <button
                type="button"
                onClick={toggle}
                aria-label="Play campaign film"
                className="absolute inset-0 flex items-center justify-center bg-black/30 group"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#c9a84c] text-[#0a0f1e] shadow-2xl transition-transform group-hover:scale-105">
                  <Play className="h-7 w-7 ml-1" strokeWidth={1.5} />
                </span>
              </button>
            )}

            {/* Controls overlay */}
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Pause" : "Play"}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-black/60 text-[#f4ecd8] hover:bg-[#c9a84c] hover:text-[#0a0f1e] transition-colors"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-black/60 text-[#f4ecd8] hover:bg-[#c9a84c] hover:text-[#0a0f1e] transition-colors"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-[#f4ecd8]/50 mt-3">
            Tap the video to play · sound on
          </p>
        </div>

        {/* End card */}
        <div className="mt-12 mx-auto max-w-2xl border border-[#c9a84c] bg-[#c9a84c]/[0.06] p-8 text-center">
          <p className="font-serif text-2xl md:text-3xl text-[#c9a84c] italic">
            Palace of Roman — Summer 2026
          </p>
        </div>

        {/* Brief / hashtags */}
        <section className="mt-14 grid gap-10 md:grid-cols-2 max-w-3xl mx-auto">
          <div>
            <h2 className="font-serif text-lg tracking-wide text-[#c9a84c] mb-3">
              The Edit
            </h2>
            <p className="text-sm leading-relaxed text-[#f4ecd8]/80">
              A private yacht. Open Mediterranean water at golden hour.
              Silk resort wear, ivory kaftans, unbuttoned linen, tortoise
              sunglasses. Capri light. Versace, Roberto Cavalli, Dolce &amp;
              Gabbana, Balmain, Calvin Klein — the Palace of Roman Summer 2026
              wardrobe.
            </p>
          </div>
          <div>
            <h2 className="font-serif text-lg tracking-wide text-[#c9a84c] mb-3">
              Hashtags
            </h2>
            <p className="text-sm leading-relaxed text-[#f4ecd8]/80 break-words">
              {HASHTAGS}
            </p>
          </div>
        </section>

        <footer className="mt-16 pt-8 border-t border-[#c9a84c]/30 text-center">
          <p className="text-[10px] tracking-[0.35em] uppercase text-[#c9a84c]">
            Palace of Roman
          </p>
          <p className="text-xs text-[#f4ecd8]/50 mt-2">
            palaceofromanofficial.com
          </p>
        </footer>
      </div>
    </div>
  );
}
