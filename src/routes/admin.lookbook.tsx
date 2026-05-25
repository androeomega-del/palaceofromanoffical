/**
 * /admin/lookbook — upload lookbook images per Edition handle, place hotspots
 * by clicking on the preview, and pick the product each hotspot links to.
 * Admin-only via RLS; the UI is also gated by `useIsAdmin`.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { useIsAdmin } from "@/hooks/use-is-admin";
import { supabase } from "@/integrations/supabase/client";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";

export const Route = createFileRoute("/admin/lookbook")({
  head: () => ({
    meta: [{ title: "Lookbook Editor — Palace of Roman" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminLookbookPage,
});

interface LookbookImageRow {
  id: string;
  edition_handle: string;
  image_url: string;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  sort_order: number;
}

interface HotspotRow {
  id: string;
  lookbook_image_id: string;
  x: number;
  y: number;
  product_handle: string;
  label: string | null;
  sort_order: number;
}

const KNOWN_EDITIONS = ["resort-2026", "may-2026", "the-new-evening", "swimwear", "new-arrivals"];

function AdminLookbookPage() {
  const isAdmin = useIsAdmin();
  const [editionHandle, setEditionHandle] = useState<string>(KNOWN_EDITIONS[0]);
  const [customHandle, setCustomHandle] = useState("");
  const [images, setImages] = useState<LookbookImageRow[]>([]);
  const [hotspots, setHotspots] = useState<HotspotRow[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handle = customHandle.trim() || editionHandle;

  const load = async (h: string) => {
    setLoading(true);
    try {
      const { data: imgs } = await supabase
        .from("lookbook_images")
        .select("*")
        .eq("edition_handle", h)
        .order("sort_order", { ascending: true });
      setImages(imgs ?? []);
      const ids = (imgs ?? []).map((i) => i.id);
      if (ids.length) {
        const { data: hs } = await supabase
          .from("lookbook_hotspots")
          .select("*")
          .in("lookbook_image_id", ids)
          .order("sort_order", { ascending: true });
        setHotspots(hs ?? []);
      } else {
        setHotspots([]);
      }
      setActiveImageId(imgs?.[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    load(handle);
  }, [handle, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4">Restricted</p>
          <h1 className="font-serif text-3xl mb-4">Admin access required</h1>
          <p className="text-sm text-muted-foreground mb-8">
            This editor is reserved for the boutique team.
          </p>
          <Link to="/" className="text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1">
            Return home →
          </Link>
        </div>
      </div>
    );
  }

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `lookbook/${handle}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("collection-images").upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("collection-images").getPublicUrl(path);
      // Probe natural dimensions for explicit width/height (CLS-free).
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const i = new Image();
        i.onload = () => resolve({ w: i.naturalWidth, h: i.naturalHeight });
        i.onerror = () => resolve({ w: 0, h: 0 });
        i.src = pub.publicUrl;
      });
      const nextOrder = (images[images.length - 1]?.sort_order ?? -1) + 1;
      const { data: inserted, error: insErr } = await supabase
        .from("lookbook_images")
        .insert({
          edition_handle: handle,
          image_url: pub.publicUrl,
          width: dims.w || null,
          height: dims.h || null,
          alt_text: file.name.replace(/\.[^.]+$/, ""),
          sort_order: nextOrder,
        })
        .select()
        .single();
      if (insErr) throw insErr;
      setImages((arr) => [...arr, inserted as LookbookImageRow]);
      setActiveImageId(inserted!.id);
      toast.success("Image added");
    } catch (e) {
      console.error(e);
      toast.error("Upload failed", { description: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (id: string) => {
    if (!confirm("Remove this image and its hotspots?")) return;
    const { error } = await supabase.from("lookbook_images").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setImages((a) => a.filter((i) => i.id !== id));
    setHotspots((a) => a.filter((h) => h.lookbook_image_id !== id));
    if (activeImageId === id) setActiveImageId(images[0]?.id ?? null);
  };

  const activeImage = images.find((i) => i.id === activeImageId) ?? null;
  const activeHotspots = useMemo(
    () => hotspots.filter((h) => h.lookbook_image_id === activeImageId),
    [hotspots, activeImageId],
  );

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10 py-12">
        <header className="mb-10 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-2">Admin</p>
            <h1 className="font-serif text-3xl md:text-4xl">Lookbook Editor</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Add images to an Edition and tap the preview to place shoppable hotspots.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[10px] uppercase tracking-[0.25em] text-ink/70">Edition</label>
            <select
              value={editionHandle}
              onChange={(e) => {
                setEditionHandle(e.target.value);
                setCustomHandle("");
              }}
              className="border border-ink/20 bg-canvas px-3 py-2 text-sm"
            >
              {KNOWN_EDITIONS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="…or custom handle"
              value={customHandle}
              onChange={(e) => setCustomHandle(e.target.value)}
              className="border border-ink/20 bg-canvas px-3 py-2 text-sm"
            />
          </div>
        </header>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-ink/40" />
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8">
            {/* Sidebar: image list + uploader */}
            <aside className="col-span-12 md:col-span-3 space-y-4">
              <label className="block">
                <span className="sr-only">Upload image</span>
                <div className={`border-2 border-dashed border-ink/20 hover:border-bronze ${uploading ? "opacity-60" : "cursor-pointer"} p-6 text-center transition-colors`}>
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-ink/50" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mx-auto mb-2 text-ink/50" />
                      <p className="text-[11px] uppercase tracking-[0.25em] text-ink/70">Upload image</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {images.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">No images yet for this edition.</p>
              ) : (
                <ul className="space-y-2">
                  {images.map((img) => (
                    <li
                      key={img.id}
                      className={`relative group cursor-pointer border ${activeImageId === img.id ? "border-bronze" : "border-transparent"}`}
                      onClick={() => setActiveImageId(img.id)}
                    >
                      <img
                        src={img.image_url}
                        alt=""
                        className="w-full aspect-[3/4] object-cover"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 p-1 bg-canvas/85 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.id);
                        }}
                        aria-label="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="text-[10px] text-ink/60 px-1 py-0.5">
                        {hotspots.filter((h) => h.lookbook_image_id === img.id).length} hotspot{hotspots.filter((h) => h.lookbook_image_id === img.id).length === 1 ? "" : "s"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            {/* Main: editor */}
            <main className="col-span-12 md:col-span-9">
              {activeImage ? (
                <HotspotEditor
                  image={activeImage}
                  hotspots={activeHotspots}
                  onAdd={(h) => setHotspots((a) => [...a, h])}
                  onUpdate={(h) =>
                    setHotspots((a) => a.map((x) => (x.id === h.id ? h : x)))
                  }
                  onRemove={(id) => setHotspots((a) => a.filter((x) => x.id !== id))}
                />
              ) : (
                <div className="border border-dashed border-ink/20 py-24 text-center text-sm text-muted-foreground">
                  Upload an image to start.
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

function HotspotEditor({
  image,
  hotspots,
  onAdd,
  onUpdate,
  onRemove,
}: {
  image: LookbookImageRow;
  hotspots: HotspotRow[];
  onAdd: (h: HotspotRow) => void;
  onUpdate: (h: HotspotRow) => void;
  onRemove: (id: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [placing, setPlacing] = useState(false);
  const [pendingProduct, setPendingProduct] = useState("");

  // Quick product picker — fetches a small set; admin can also type a handle.
  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<ShopifyProduct[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!productSearch.trim()) {
      setProductOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const edges = await fetchProducts({ first: 8, query: productSearch.trim() });
        setProductOptions(edges);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [productSearch]);

  const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placing) return;
    const handle = pendingProduct.trim();
    if (!handle) {
      toast.error("Pick a product handle first");
      return;
    }
    const rect = boxRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const nextOrder = (hotspots[hotspots.length - 1]?.sort_order ?? -1) + 1;
    const { data, error } = await supabase
      .from("lookbook_hotspots")
      .insert({
        lookbook_image_id: image.id,
        x,
        y,
        product_handle: handle,
        sort_order: nextOrder,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    onAdd(data as HotspotRow);
    setPlacing(false);
    toast.success("Hotspot placed");
  };

  const removeHotspot = async (id: string) => {
    const { error } = await supabase.from("lookbook_hotspots").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onRemove(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="font-serif text-xl">Image</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search product…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="border border-ink/20 bg-canvas px-3 py-2 text-xs"
          />
          {productOptions.length > 0 && (
            <select
              value={pendingProduct}
              onChange={(e) => setPendingProduct(e.target.value)}
              className="border border-ink/20 bg-canvas px-3 py-2 text-xs max-w-[260px]"
            >
              <option value="">{searching ? "Searching…" : "Pick product…"}</option>
              {productOptions.map((p) => (
                <option key={p.node.id} value={p.node.handle}>
                  {p.node.title}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="…or paste handle"
            value={pendingProduct}
            onChange={(e) => setPendingProduct(e.target.value)}
            className="border border-ink/20 bg-canvas px-3 py-2 text-xs"
          />
          <button
            type="button"
            onClick={() => setPlacing((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.25em] border ${placing ? "bg-ink text-canvas border-ink" : "border-ink/30 hover:border-ink"}`}
          >
            {placing ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {placing ? "Cancel" : "Place hotspot"}
          </button>
        </div>
      </div>

      <div
        ref={boxRef}
        className={`relative bg-ink/5 ${placing ? "cursor-crosshair" : ""}`}
        onClick={handleClick}
      >
        <img
          src={image.image_url}
          alt={image.alt_text ?? ""}
          className="w-full h-auto block select-none"
          draggable={false}
        />
        {hotspots.map((h) => (
          <div
            key={h.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}
          >
            <div className="relative group">
              <span className="block w-6 h-6 rounded-full bg-white border border-ink shadow-md" />
              <span className="absolute inset-[8px] rounded-full bg-ink" />
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-canvas border border-ink/20 px-2 py-1 text-[10px] tracking-wide opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                {h.product_handle}
                <button
                  type="button"
                  className="text-destructive hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHotspot(h.id);
                  }}
                >
                  remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        {placing
          ? "Click anywhere on the image to drop the hotspot."
          : `${hotspots.length} hotspot${hotspots.length === 1 ? "" : "s"} placed.`}
      </p>
    </div>
  );
}
