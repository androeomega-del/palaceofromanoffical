import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// Dev/reference tool — lists all images bundled under src/assets/**.
// NOT linked from production navigation. To remove before launch, delete
// this file (src/routes/assets.tsx). To protect it instead, move it under
// src/routes/_authenticated/assets.tsx so the auth layout gates access.

export const Route = createFileRoute("/assets")({
  head: () => ({
    meta: [
      { title: "Asset Index — Palace of Roman (Dev)" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AssetsIndex,
});

// Eager-glob all images under src/assets — Vite returns hashed URLs.
const srcAssetModules = import.meta.glob(
  "/src/assets/**/*.{png,jpg,jpeg,webp,gif,svg,avif}",
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;

// Public-folder images we know exist (served at site root).
const publicImages: { path: string; url: string }[] = [
  { path: "public/favicon.ico", url: "/favicon.ico" },
  { path: "public/favicon-16.png", url: "/favicon-16.png" },
  { path: "public/favicon-32.png", url: "/favicon-32.png" },
  { path: "public/favicon-192.png", url: "/favicon-192.png" },
  { path: "public/favicon-512.png", url: "/favicon-512.png" },
  { path: "public/apple-touch-icon.png", url: "/apple-touch-icon.png" },
  { path: "public/og-image.jpg", url: "/og-image.jpg" },
];

type AssetItem = {
  path: string;       // repo-relative path
  url: string;        // browser URL (hashed for src/assets, root for public/)
  importPath: string; // recommended import / reference path
  filename: string;
  ext: string;
  folder: string;     // top-level grouping
};

function buildItems(): AssetItem[] {
  const src: AssetItem[] = Object.entries(srcAssetModules).map(([p, url]) => {
    const path = p.replace(/^\//, "");
    const parts = path.split("/");
    const filename = parts[parts.length - 1];
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const folder = parts.slice(0, -1).join("/");
    const importPath = "@/" + path.replace(/^src\//, "");
    return { path, url, importPath, filename, ext, folder };
  });
  const pub: AssetItem[] = publicImages.map((p) => {
    const filename = p.path.split("/").pop()!;
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    return {
      path: p.path,
      url: p.url,
      importPath: p.url,
      filename,
      ext,
      folder: "public",
    };
  });
  return [...src, ...pub].sort((a, b) => a.path.localeCompare(b.path));
}

function AssetsIndex() {
  const items = useMemo(buildItems, []);
  const folders = useMemo(
    () => Array.from(new Set(items.map((i) => i.folder))).sort(),
    [items],
  );
  const exts = useMemo(
    () => Array.from(new Set(items.map((i) => i.ext))).sort(),
    [items],
  );

  const [folder, setFolder] = useState<string>("all");
  const [ext, setExt] = useState<string>("all");
  const [q, setQ] = useState("");

  const filtered = items.filter(
    (i) =>
      (folder === "all" || i.folder === folder) &&
      (ext === "all" || i.ext === ext) &&
      (q === "" || i.path.toLowerCase().includes(q.toLowerCase())),
  );

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${label}`);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="min-h-screen bg-canvas px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-2">
            Dev tool — not linked from nav
          </p>
          <h1 className="text-4xl font-serif mb-2">Asset Index</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} images across src/assets and public/. Click an image
            to open it; use Copy to grab the import path.
          </p>
        </header>

        <div className="flex flex-wrap gap-3 mb-8 text-xs">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search path…"
            className="border border-ink/20 px-3 py-2 bg-transparent flex-1 min-w-[200px]"
          />
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="border border-ink/20 px-3 py-2 bg-canvas"
          >
            <option value="all">All folders ({items.length})</option>
            {folders.map((f) => (
              <option key={f} value={f}>
                {f} ({items.filter((i) => i.folder === f).length})
              </option>
            ))}
          </select>
          <select
            value={ext}
            onChange={(e) => setExt(e.target.value)}
            className="border border-ink/20 px-3 py-2 bg-canvas"
          >
            <option value="all">All types</option>
            {exts.map((e) => (
              <option key={e} value={e}>
                .{e}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((item) => (
            <AssetCard key={item.path} item={item} onCopy={copy} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">
            No assets match these filters.
          </p>
        )}
      </div>
    </div>
  );
}

function AssetCard({
  item,
  onCopy,
}: {
  item: AssetItem;
  onCopy: (text: string, label: string) => void;
}) {
  const [dims, setDims] = useState<string>("…");
  return (
    <div className="border border-ink/15 bg-white/40 flex flex-col">
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="block aspect-square bg-[repeating-conic-gradient(#f2f2f2_0%_25%,#fff_0%_50%)_50%/16px_16px] overflow-hidden"
      >
        <img
          src={item.url}
          alt={item.filename}
          loading="lazy"
          onLoad={(e) => {
            const img = e.currentTarget;
            setDims(`${img.naturalWidth}×${img.naturalHeight}`);
          }}
          onError={() => setDims("error")}
          className="w-full h-full object-contain"
        />
      </a>
      <div className="p-3 text-[11px] space-y-1">
        <div className="font-medium truncate" title={item.filename}>
          {item.filename}
        </div>
        <div className="text-muted-foreground truncate" title={item.path}>
          {item.path}
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>{dims}</span>
          <span className="uppercase">.{item.ext}</span>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onCopy(item.importPath, "import path")}
            className="flex-1 border border-ink/20 px-2 py-1 hover:bg-ink hover:text-canvas transition-colors"
          >
            Copy import
          </button>
          <button
            onClick={() => onCopy(item.path, "file path")}
            className="flex-1 border border-ink/20 px-2 py-1 hover:bg-ink hover:text-canvas transition-colors"
          >
            Copy path
          </button>
        </div>
      </div>
    </div>
  );
}
