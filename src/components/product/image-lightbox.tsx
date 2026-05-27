import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cdnImage } from "@/lib/shopify";

type Img = { url: string; altText?: string | null };

/**
 * Fullscreen PDP gallery lightbox.
 * - Pure presentational. Does not touch cart, checkout, or Shopify mutations.
 * - Click image to toggle 2x zoom; click-drag (desktop) or pan (mobile native)
 *   to inspect detail. Arrow keys + on-screen arrows navigate.
 */
export function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
  alt,
}: {
  images: Img[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  alt: string;
}) {
  const [zoomed, setZoomed] = useState(false);

  const next = useCallback(
    () => onIndexChange((index + 1) % images.length),
    [index, images.length, onIndexChange],
  );
  const prev = useCallback(
    () => onIndexChange((index - 1 + images.length) % images.length),
    [index, images.length, onIndexChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [next, prev, onClose]);

  useEffect(() => setZoomed(false), [index]);

  const img = images[index];
  if (!img) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product image viewer"
      className="fixed inset-0 z-[100] bg-[var(--studio-ink)]/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close image viewer"
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 grid place-items-center text-canvas hover:text-[var(--studio-bronze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-bronze)] rounded-full"
      >
        <X className="w-5 h-5" strokeWidth={1.5} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center text-canvas hover:text-[var(--studio-bronze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-bronze)] rounded-full"
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center text-canvas hover:text-[var(--studio-bronze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-bronze)] rounded-full"
          >
            <ChevronRight className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </>
      )}

      <div
        className="relative w-full h-full max-w-[1600px] mx-auto p-6 sm:p-12 flex items-center justify-center overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={cdnImage(img.url, { width: 2000 })}
          alt={img.altText ?? alt}
          onClick={() => setZoomed((z) => !z)}
          className={`select-none transition-transform duration-300 cursor-zoom-${zoomed ? "out" : "in"} ${
            zoomed
              ? "scale-[1.8] max-w-none max-h-none"
              : "max-w-full max-h-full object-contain"
          }`}
          draggable={false}
        />
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 text-canvas/70 text-[10px] uppercase tracking-[0.3em] pointer-events-none">
        <ZoomIn className="w-3 h-3" strokeWidth={1.5} />
        <span>
          {index + 1} / {images.length} · Tap to zoom
        </span>
      </div>
    </div>
  );
}
