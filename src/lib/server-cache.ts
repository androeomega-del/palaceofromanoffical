/**
 * Server-side in-memory TTL cache (per-Worker instance).
 *
 * Generic wrapper that mirrors the pattern shipped in
 * `vacation-destinations.server.ts` — a tiny `Map<string, {value, expiresAt}>`
 * keyed by an opaque string. Intended for high-frequency Shopify Storefront
 * / Supabase reads behind server functions and route loaders so heavy
 * crawler passes don't redundantly hit the upstream APIs and TTFB stays
 * predictable.
 *
 * Semantics:
 *   - Per-Worker memory: every isolate has its own cache, which is fine for
 *     editorial / catalog reads that change via admin tooling, not per-request.
 *   - Default TTL 60_000 ms. Pass `ttlMs` per call to tune.
 *   - In-flight de-duplication: concurrent calls for the same key share one
 *     pending promise, so a stampede after expiry still issues a single
 *     upstream request.
 *   - Failures are NOT cached. A rejected loader removes the in-flight entry
 *     so the next caller retries cleanly.
 *
 * SERVER-ONLY. Never import from client code — the cache state would be
 * meaningless in the browser and would defeat the per-request isolation
 * guarantee.
 */

type Entry<T> = { value: T; expiresAt: number };

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export const DEFAULT_TTL_MS = 60_000;

/**
 * Read-through cache. Returns the cached value if fresh, otherwise invokes
 * `loader()`, stores the result for `ttlMs`, and returns it.
 */
export async function cached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > now) return hit.value;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const p = (async () => {
    try {
      const value = await loader();
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}

/** Drop a single key. */
export function invalidateCache(key: string): void {
  store.delete(key);
}

/** Drop every key whose prefix matches — useful after admin writes. */
export function invalidateCachePrefix(prefix: string): void {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

/** Test/diagnostic only — wipes the entire cache. */
export function __clearCacheForTests(): void {
  store.clear();
  inflight.clear();
}
