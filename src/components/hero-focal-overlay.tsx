// Drag-to-crop focal editor that overlays the live collection hero on the
// real /collections/$handle page when `?edit=focal` is in the URL.
//
// Lets you click or drag anywhere on the hero to anchor the focal point,
// previews the crop live (the underlying <img> uses the same object-position),
// then saves to `collection_images.focal_{x,y}` via upsertCollectionFocal.
//
// Sibling of /admin/collection-focal (which works on the unclipped source).
// This one shows you exactly what site visitors will see.

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  upsertCollectionFocal,
  clearCollectionFocal,
} from "@/lib/collection-image-admin.functions";

interface Props {
  handle: string;
  initialFocal: { x: number; y: number };
  hasSavedOverride: boolean;
  onLiveChange: (focal: { x: number; y: number }) => void;
  onExit: () => void;
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function HeroFocalOverlay({
  handle,
  initialFocal,
  hasSavedOverride,
  onLiveChange,
  onExit,
}: Props) {
  const qc = useQueryClient();
  const [focal, setFocal] = useState(initialFocal);
  const dragging = useRef(false);
  const layerRef = useRef<HTMLDivElement | null>(null);

  // Push every change up so the underlying <img> reflects it live.
  useEffect(() => {
    onLiveChange(focal);
  }, [focal, onLiveChange]);

  function update(clientX: number, clientY: number) {
    const el = layerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = clamp(((clientX - r.left) / r.width) * 100);
    const y = clamp(((clientY - r.top) / r.height) * 100);
    setFocal({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  const saveM = useMutation({
    mutationFn: () =>
      upsertCollectionFocal({
        data: { handle, focalX: focal.x, focalY: focal.y },
      }),
    onSuccess: () => {
      toast.success("Focal point saved");
      qc.invalidateQueries({ queryKey: ["collection-focal-map"] });
      qc.invalidateQueries({ queryKey: ["collection-image-meta-map"] });
    },
    onError: (e: Error) => toast.error(e.message || "Save failed"),
  });

  const clearM = useMutation({
    mutationFn: () => clearCollectionFocal({ data: { handle } }),
    onSuccess: () => {
      toast.success("Override cleared");
      qc.invalidateQueries({ queryKey: ["collection-focal-map"] });
      qc.invalidateQueries({ queryKey: ["collection-image-meta-map"] });
    },
    onError: (e: Error) => toast.error(e.message || "Clear failed"),
  });

  return (
    <>
      {/* Drag layer — sits over the hero <img>, transparent so the live crop
          shows through */}
      <div
        ref={layerRef}
        role="application"
        aria-label="Drag to set focal point"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          update(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          update(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          dragging.current = false;
          (e.target as Element).releasePointerCapture?.(e.pointerId);
        }}
        className="absolute inset-0 z-20 cursor-crosshair select-none touch-none"
      >
        {/* Crosshair */}
        <div
          className="absolute h-px w-full bg-white mix-blend-difference pointer-events-none"
          style={{ top: `${focal.y}%` }}
        />
        <div
          className="absolute w-px h-full bg-white mix-blend-difference pointer-events-none"
          style={{ left: `${focal.x}%` }}
        />
        {/* Focal dot */}
        <div
          className="absolute w-6 h-6 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.7)] pointer-events-none"
          style={{
            left: `${focal.x}%`,
            top: `${focal.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Toolbar — top right of the hero */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-black/80 text-white backdrop-blur px-3 py-2 text-[10px] uppercase tracking-[0.2em]">
        <span className="font-mono normal-case tracking-normal opacity-70">
          {focal.x.toFixed(1)}% / {focal.y.toFixed(1)}%
        </span>
        <button
          onClick={() => setFocal(initialFocal)}
          className="px-2 py-1 border border-white/30 hover:bg-white hover:text-black transition"
        >
          Reset
        </button>
        <button
          onClick={() => clearM.mutate()}
          disabled={clearM.isPending || !hasSavedOverride}
          className="px-2 py-1 border border-rose-300 text-rose-200 hover:bg-rose-200 hover:text-rose-900 transition disabled:opacity-40"
        >
          {clearM.isPending ? "Clearing…" : "Clear"}
        </button>
        <button
          onClick={() => saveM.mutate()}
          disabled={saveM.isPending}
          className="px-3 py-1 bg-white text-black hover:opacity-90 transition disabled:opacity-50"
        >
          {saveM.isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onExit}
          aria-label="Exit focal editor"
          className="px-2 py-1 border border-white/30 hover:bg-white hover:text-black transition"
        >
          ✕
        </button>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-black/70 text-white text-[10px] uppercase tracking-[0.25em] px-3 py-1.5 pointer-events-none">
        Drag to anchor — saves to {handle}
      </div>
    </>
  );
}
