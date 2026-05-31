/**
 * Server-side bucket reader for the meta-tag A/B test.
 *
 * Reads the `por_meta_ab` cookie from the request and returns the assigned
 * bucket. Missing / unrecognised cookie → bucket 0 (variant A), which is
 * the canonical-safe default for bots and first-time visitors.
 *
 * No assignment happens here — that's done on the client (see
 * `useMetaAb`), so the SSR pass for crawlers is deterministic and the
 * indexed copy never drifts.
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start-server";
import { META_AB_COOKIE, parseBucket, type MetaBucket } from "@/lib/meta-ab";

export const readMetaAbBucket = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ bucket: MetaBucket }> => {
    try {
      const raw = getCookie(META_AB_COOKIE);
      return { bucket: parseBucket(raw) };
    } catch {
      // getCookie can throw if called outside a request context (rare —
      // dev SSR edge cases). Fall back to the canonical-safe variant.
      return { bucket: 0 };
    }
  },
);
