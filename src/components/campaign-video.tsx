import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

type Props = {
  src: string;
  poster: string;
  className?: string;
  /** Optional aria label for the tap-to-play fallback */
  label?: string;
};

/**
 * Autoplaying, muted, looping background video with a robust mobile
 * fallback. Some iOS / data-saver / low-power configurations refuse to
 * autoplay even with muted+playsInline, so we explicitly retry .play() once
 * loaded and surface a tap-to-play overlay if the browser blocks it.
 */
export function CampaignVideo({ src, poster, className, label = "Play campaign film" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.then === "function") {
        p.catch(() => setNeedsTap(true));
      }
    };
    if (v.readyState >= 2) tryPlay();
    else v.addEventListener("loadeddata", tryPlay, { once: true });
    return () => v.removeEventListener("loadeddata", tryPlay);
  }, [src]);

  return (
    <>
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={poster}
        className={className}
        // Some browsers need the source as a child element + type to start
        // streaming reliably; src on the element alone occasionally fails.
      >
        <source src={src} type="video/mp4" />
      </video>
      {needsTap && (
        <button
          type="button"
          aria-label={label}
          onClick={() => {
            const v = ref.current;
            if (!v) return;
            v.play().then(() => setNeedsTap(false)).catch(() => {});
          }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-ink/20 backdrop-blur-[1px] group"
        >
          <span className="flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-full bg-canvas/95 text-ink shadow-2xl transition-transform group-hover:scale-105">
            <Play className="h-6 w-6 md:h-7 md:w-7 ml-1" strokeWidth={1.5} />
          </span>
        </button>
      )}
    </>
  );
}
