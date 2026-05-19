// Eagerly import every editorial library image. Vite emits hashed URLs and
// asset entries are tree-shaken into a single map at build time.
const modules = import.meta.glob("@/assets/editorial/library/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// Build a numeric index ("1" → url, "2" → url, …) for the 99 source images.
const byIndex: Record<number, string> = (() => {
  const out: Record<number, string> = {};
  for (const [path, url] of Object.entries(modules)) {
    const match = path.match(/\/(\d+)\.png$/);
    if (match) out[Number(match[1])] = url;
  }
  return out;
})();

export function img(n: number): string {
  return byIndex[n] ?? Object.values(byIndex)[0] ?? "";
}

export function imgRange(from: number, to: number): string[] {
  const list: string[] = [];
  for (let i = from; i <= to; i++) {
    const u = byIndex[i];
    if (u) list.push(u);
  }
  return list;
}

export const TOTAL_IMAGES = Object.keys(byIndex).length;

// Deterministic image picker — same key always maps to the same editorial
// image. Used for collection cards, brand tiles, etc., so the visual stays
// stable across renders and SSR/CSR.
export function imgForKey(key: string, offset = 0): string {
  if (TOTAL_IMAGES === 0) return "";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const n = (Math.abs(hash) + offset) % TOTAL_IMAGES;
  return byIndex[n + 1] ?? Object.values(byIndex)[n] ?? "";
}
