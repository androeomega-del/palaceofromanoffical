import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { adminBeforeLoad } from "@/lib/admin-route-guard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  listLookbookImages,
  getLookbookImage,
  createLookbookImage,
  updateHotspot,
  deleteHotspot,
  createHotspot,
  searchCatalogForHotspot,
  getCatalogProductByHandle,
  seedLookbookFromHomepage,
  type LookbookHotspotRow,
} from "@/lib/lookbook-hotspots.functions";
import editorialHero from "@/assets/editorial/may-2026/1.webp";
import mensDetail2 from "@/assets/mens-swim-detail-2.jpg";


import {
  Loader2,
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  ArrowLeftRight,
  AlertTriangle,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/lookbook-hotspots")({
  beforeLoad: adminBeforeLoad,
  component: AdminLookbookHotspots,
  head: () => ({
    meta: [
      { title: "Lookbook Hotspots — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminLookbookHotspots() {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [filterKind, setFilterKind] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  if (selectedImageId) {
    return (
      <ImageDetailView
        imageId={selectedImageId}
        onBack={() => setSelectedImageId(null)}
      />
    );
  }

  return (
    <main className="min-h-screen bg-canvas px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <Link
              to="/admin"
              className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3 inline-block hover:text-foreground"
            >
              ← Admin
            </Link>
            <h1 className="font-serif text-4xl">Lookbook Hotspots</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Audit and correct shoppable placements. Click an image to see its
              hotspots overlaid; click any hotspot to swap or delete the
              linked product.
            </p>
          </div>
          <div className="flex gap-2">
            <SeedFromSourceButton />
            <NewImageDialog />
          </div>
        </div>


        <Card className="p-4 mb-6">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Surface kind
              </Label>
              <Input
                placeholder="e.g. themed-edit, editorial, campaign, homepage, bg_product"
                value={filterKind}
                onChange={(e) => setFilterKind(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Search slug / alt
              </Label>
              <Input
                placeholder="yacht-edit, mens-swim, ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        <ImagesGrid
          filterKind={filterKind}
          searchTerm={searchTerm}
          onSelect={setSelectedImageId}
        />
      </div>
    </main>
  );
}

// ─── Images grid ───────────────────────────────────────────────────────
function ImagesGrid({
  filterKind,
  searchTerm,
  onSelect,
}: {
  filterKind: string;
  searchTerm: string;
  onSelect: (id: string) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["lookbook-images", filterKind, searchTerm],
    queryFn: () =>
      listLookbookImages({
        data: {
          surface_kind: filterKind.trim() || undefined,
          search: searchTerm.trim() || undefined,
        },
      }),
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-bronze" />
      </div>
    );
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No shoppable images in the lookbook tables yet.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Add one with the “New image” button above, or seed from existing
          editorial pages.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((img) => (
        <Card
          key={img.id}
          className="overflow-hidden cursor-pointer hover:border-bronze/50 transition-colors"
          onClick={() => onSelect(img.id)}
        >
          <div className="aspect-[4/5] bg-muted relative">
            <img
              src={img.image_url}
              alt={img.alt_text ?? ""}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <Badge
              variant={img.hotspot_count > 0 ? "default" : "secondary"}
              className="absolute top-2 right-2"
            >
              {img.hotspot_count} hotspot
              {img.hotspot_count === 1 ? "" : "s"}
            </Badge>
          </div>
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-[0.3em] text-bronze">
              {img.surface_kind ?? "—"}
            </div>
            <div className="text-sm font-medium truncate mt-0.5">
              {img.surface_slug ?? img.edition_handle}
            </div>
            {img.chapter_key && (
              <div className="text-xs text-muted-foreground truncate">
                {img.chapter_key}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Detail view ───────────────────────────────────────────────────────
function ImageDetailView({
  imageId,
  onBack,
}: {
  imageId: string;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["lookbook-image", imageId],
    queryFn: () => getLookbookImage({ data: { id: imageId } }),
  });
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(
    null,
  );
  const [addMode, setAddMode] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["lookbook-image", imageId] });
    qc.invalidateQueries({ queryKey: ["lookbook-images"] });
  };

  if (isLoading || !data) {
    return (
      <main className="min-h-screen bg-canvas px-6 py-12">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-bronze" />
      </main>
    );
  }

  const { image, hotspots } = data;
  const selected = hotspots.find((h) => h.id === selectedHotspotId) ?? null;

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!addMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setAddMode(false);
    void createHotspot({
      data: {
        lookbook_image_id: imageId,
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        product_handle: "placeholder",
        label: "New hotspot",
      },
    })
      .then((r) => {
        toast.success("Hotspot added — pick a product.");
        invalidate();
        setSelectedHotspotId(r.hotspot.id);
      })
      .catch((err) => toast.error(String(err.message || err)));
  };

  return (
    <main className="min-h-screen bg-canvas">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          All images
        </button>
        <div className="text-xs text-muted-foreground truncate">
          <span className="uppercase tracking-[0.3em] text-bronze">
            {image.surface_kind ?? "—"}
          </span>{" "}
          / {image.surface_slug ?? image.edition_handle}
          {image.chapter_key ? ` / ${image.chapter_key}` : ""}
        </div>
        <Button
          size="sm"
          variant={addMode ? "default" : "outline"}
          onClick={() => setAddMode((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {addMode ? "Click image to place" : "Add hotspot"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6 p-6 max-w-[1600px] mx-auto">
        <div>
          <div
            className={`relative bg-muted rounded-md overflow-hidden ${
              addMode ? "cursor-crosshair" : ""
            }`}
            onClick={handleCanvasClick}
          >
            <img
              src={image.image_url}
              alt={image.alt_text ?? ""}
              className="w-full h-auto block"
            />
            {hotspots.map((h) => (
              <button
                key={h.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedHotspotId(h.id);
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all ${
                  selectedHotspotId === h.id
                    ? "h-8 w-8 bg-bronze border-white shadow-lg"
                    : "h-6 w-6 bg-white/90 border-bronze hover:bg-bronze hover:border-white"
                }`}
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
                title={`${h.label ?? ""} → ${h.product_handle}`}
              >
                <span className="sr-only">{h.product_handle}</span>
              </button>
            ))}
          </div>
        </div>

        <aside>
          {selected ? (
            <HotspotEditor
              hotspot={selected}
              onClose={() => setSelectedHotspotId(null)}
              onChanged={invalidate}
            />
          ) : (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">
                {hotspots.length === 0
                  ? "No hotspots on this image yet. Click “Add hotspot” to place one."
                  : "Click any hotspot on the image to inspect or replace its linked product."}
              </p>
              {hotspots.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {hotspots.map((h) => (
                    <li key={h.id}>
                      <button
                        className="w-full text-left text-xs px-3 py-2 rounded border border-border hover:border-bronze/50"
                        onClick={() => setSelectedHotspotId(h.id)}
                      >
                        <span className="font-mono">{h.product_handle}</span>
                        {h.label && (
                          <span className="text-muted-foreground">
                            {" "}
                            — {h.label}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </aside>
      </div>
    </main>
  );
}

// ─── Hotspot editor (right pane) ───────────────────────────────────────
function HotspotEditor({
  hotspot,
  onClose,
  onChanged,
}: {
  hotspot: LookbookHotspotRow;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [pendingHandle, setPendingHandle] = useState<string>(
    hotspot.product_handle,
  );
  const [pendingLabel, setPendingLabel] = useState<string>(hotspot.label ?? "");
  const [query, setQuery] = useState("");

  // refresh local state when switching hotspots
  useMemo(() => {
    setPendingHandle(hotspot.product_handle);
    setPendingLabel(hotspot.label ?? "");
    setQuery("");
  }, [hotspot.id]);

  const { data: currentProduct } = useQuery({
    queryKey: ["catalog-product", pendingHandle],
    queryFn: () =>
      getCatalogProductByHandle({ data: { handle: pendingHandle } }).catch(
        () => ({ product: null }),
      ),
    enabled: !!pendingHandle && pendingHandle !== "placeholder",
  });

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["catalog-search", query],
    queryFn: () => searchCatalogForHotspot({ data: { q: query, limit: 20 } }),
    enabled: query.trim().length >= 2,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      updateHotspot({
        data: {
          id: hotspot.id,
          product_handle: pendingHandle,
          label: pendingLabel.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Hotspot updated");
      onChanged();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteHotspot({ data: { id: hotspot.id } }),
    onSuccess: () => {
      toast.success("Hotspot deleted");
      onChanged();
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isDirty =
    pendingHandle !== hotspot.product_handle ||
    (pendingLabel.trim() || null) !== (hotspot.label ?? null);

  const product = currentProduct?.product;

  return (
    <Card className="p-5 sticky top-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-bronze">
            Hotspot
          </div>
          <div className="text-xs text-muted-foreground">
            ({hotspot.x.toFixed(1)}%, {hotspot.y.toFixed(1)}%)
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="mb-4">
        <Label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Currently linked
        </Label>
        <div className="mt-2 p-3 rounded border border-border bg-muted/40">
          {product ? (
            <div className="flex gap-3">
              {product.main_picture && (
                <img
                  src={product.main_picture}
                  alt=""
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">
                  {product.name ?? product.handle}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {product.brand} · {product.color} · {product.subcategory}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground mt-1 truncate">
                  {product.handle}
                </div>
                {!product.in_stock && (
                  <Badge variant="destructive" className="mt-1">
                    Out of stock
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs text-amber-600">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                Handle{" "}
                <span className="font-mono">{pendingHandle}</span> not found in
                the BrandsGateway catalog mirror — this hotspot points to a
                product we don't have. Search below to replace it.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <Label
          htmlFor="hotspot-label"
          className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
        >
          Label (optional)
        </Label>
        <Input
          id="hotspot-label"
          value={pendingLabel}
          onChange={(e) => setPendingLabel(e.target.value)}
          placeholder="e.g. Eyewear, Bag"
          className="mt-1"
        />
      </div>

      <div className="mb-4">
        <Label
          htmlFor="catalog-search"
          className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
        >
          Replace with…
        </Label>
        <div className="relative mt-1">
          <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
          <Input
            id="catalog-search"
            placeholder="Search by name, brand, color, category"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="mt-2 max-h-72 overflow-y-auto space-y-1.5">
          {searching && (
            <div className="text-xs text-muted-foreground py-2 text-center">
              Searching…
            </div>
          )}
          {(searchResults?.items ?? []).map((r) => {
            const isPending = pendingHandle === r.handle;
            return (
              <button
                key={r.sku + r.handle}
                onClick={() => setPendingHandle(r.handle)}
                className={`w-full text-left p-2 rounded border flex gap-2 transition-colors ${
                  isPending
                    ? "border-bronze bg-bronze/10"
                    : "border-border hover:border-bronze/40"
                }`}
              >
                {r.main_picture ? (
                  <img
                    src={r.main_picture}
                    alt=""
                    className="w-12 h-12 object-cover rounded shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">
                    {r.name ?? r.handle}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {r.brand} · {r.color} · {r.subcategory}
                  </div>
                  <div className="flex gap-1 mt-0.5">
                    {r.in_stock ? (
                      <Badge variant="outline" className="text-[9px] py-0">
                        In stock
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] py-0">
                        Out
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {query.trim().length >= 2 &&
            !searching &&
            (searchResults?.items ?? []).length === 0 && (
              <div className="text-xs text-muted-foreground py-2 text-center">
                No matches.
              </div>
            )}
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!isDirty || saveMutation.isPending}
          className="flex-1"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <ArrowLeftRight className="h-4 w-4 mr-1.5" />
          )}
          Save
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (confirm("Delete this hotspot?")) deleteMutation.mutate();
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

// ─── New image dialog ──────────────────────────────────────────────────
function NewImageDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    surface_kind: "editorial",
    surface_slug: "",
    chapter_key: "",
    image_url: "",
    alt_text: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      createLookbookImage({
        data: {
          surface_kind: form.surface_kind.trim(),
          surface_slug: form.surface_slug.trim(),
          chapter_key: form.chapter_key.trim() || undefined,
          image_url: form.image_url.trim(),
          alt_text: form.alt_text.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Image added");
      qc.invalidateQueries({ queryKey: ["lookbook-images"] });
      setOpen(false);
      setForm({
        surface_kind: "editorial",
        surface_slug: "",
        chapter_key: "",
        image_url: "",
        alt_text: "",
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <ImagePlus className="h-4 w-4 mr-1.5" />
        New image
      </Button>
    );
  }

  return (
    <Card className="p-5 fixed top-20 right-6 z-50 w-[420px] shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Add shoppable image</h3>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Surface kind</Label>
          <Input
            value={form.surface_kind}
            onChange={(e) =>
              setForm((f) => ({ ...f, surface_kind: e.target.value }))
            }
            placeholder="editorial, themed-edit, campaign, homepage, bg_product"
          />
        </div>
        <div>
          <Label className="text-xs">Surface slug *</Label>
          <Input
            value={form.surface_slug}
            onChange={(e) =>
              setForm((f) => ({ ...f, surface_slug: e.target.value }))
            }
            placeholder="may-2026, mens-swim, yacht-edit/monaco"
          />
        </div>
        <div>
          <Label className="text-xs">Chapter key (optional)</Label>
          <Input
            value={form.chapter_key}
            onChange={(e) =>
              setForm((f) => ({ ...f, chapter_key: e.target.value }))
            }
            placeholder="hero, look-1, ..."
          />
        </div>
        <div>
          <Label className="text-xs">Image URL *</Label>
          <Input
            value={form.image_url}
            onChange={(e) =>
              setForm((f) => ({ ...f, image_url: e.target.value }))
            }
            placeholder="https://..."
          />
        </div>
        <div>
          <Label className="text-xs">Alt text</Label>
          <Input
            value={form.alt_text}
            onChange={(e) =>
              setForm((f) => ({ ...f, alt_text: e.target.value }))
            }
          />
        </div>
        <Button
          onClick={() => mutation.mutate()}
          disabled={
            mutation.isPending ||
            !form.surface_slug.trim() ||
            !form.image_url.trim()
          }
          className="w-full"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : null}
          Create
        </Button>
      </div>
    </Card>
  );
}
