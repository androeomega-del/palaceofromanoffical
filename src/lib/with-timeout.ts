/**
 * withTimeout — race any promise against a deadline so SSR loaders never hang.
 *
 * Use in route loaders that await Shopify (or any upstream) and where a cold
 * miss could block the response. On timeout, the returned promise resolves
 * with `fallback` (default `null`), letting the loader return a safe shell
 * the component can hydrate from.
 *
 * Pair with a client-side `useQuery` retry so the page eventually shows
 * real data once the upstream responds.
 */
export function withTimeout<T, F = null>(
  p: Promise<T>,
  ms: number,
  fallback: F = null as unknown as F,
): Promise<T | F> {
  return Promise.race<T | F>([
    p,
    new Promise<F>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * withTimeoutThrow — like withTimeout but rejects on the deadline so the
 * route's errorComponent can take over (used for PDP-class pages where a
 * partial render would harm SEO more than a clean error boundary).
 */
export function withTimeoutThrow<T>(p: Promise<T>, ms: number, label = "request"): Promise<T> {
  return Promise.race<T>([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}
