// Picks a deterministic, unique editorial image for each collection card so
// no two collections share the same hero. Keyed off the handle (stable across
// SSR/CSR and renders). With 99 editorial library images, uniqueness is
// effectively guaranteed for any realistic collection count.

import { imgForKey, TOTAL_IMAGES } from "@/lib/editorial-library";

// Track keys we've already assigned in this process so cards on the same
// page never collide. The map is keyed by handle (or title fallback) and
// memoises the resolved image url.
const assignedByKey = new Map<string, string>();
const usedImages = new Set<string>();

function uniqueImageForKey(key: string): string {
  const existing = assignedByKey.get(key);
  if (existing) return existing;

  // Probe deterministic offsets until we find an unused image (or wrap).
  for (let offset = 0; offset < TOTAL_IMAGES; offset++) {
    const candidate = imgForKey(key, offset);
    if (!usedImages.has(candidate)) {
      assignedByKey.set(key, candidate);
      usedImages.add(candidate);
      return candidate;
    }
  }
  // All images consumed — fall back to the plain deterministic pick.
  const fallback = imgForKey(key);
  assignedByKey.set(key, fallback);
  return fallback;
}

export function collectionImage(input: {
  title?: string;
  handle?: string;
  description?: string | null;
}): string {
  const key =
    (input.handle && input.handle.trim()) ||
    (input.title && input.title.trim()) ||
    "collection";
  return uniqueImageForKey(key.toLowerCase());
}
