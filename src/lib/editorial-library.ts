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
