/**
 * Server-side bucket reader for the meta-tag A/B test.
 *
 * - Reads `por_meta_ab` cookie for the visitor's persistent bucket.
 * - Classifies the request via `classifyUserAgent`. Any bot/crawler is
 *   **forced to bucket 0 (variant A)** so SSR for crawlers is
 *   deterministic and the indexed copy never drifts.
 * - Fail-safe: missing/invalid cookie or any error → bucket 0.
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie, getRequestHeader } from "@tanstack/react-start-server";
import { META_AB_COOKIE, parseBucket, type MetaBucket } from "@/lib/meta-ab";
import { classifyUserAgent } from "@/lib/bot-detect";

export interface MetaAbBucketResult {
  bucket: MetaBucket;
  isBot: boolean;
  forced: boolean;
}

export const readMetaAbBucket = createServerFn({ method: "GET" }).handler(
  async (): Promise<MetaAbBucketResult> => {
    try {
      const ua = getRequestHeader("user-agent") ?? "";
      const accept = getRequestHeader("accept") ?? null;
      const acceptLanguage = getRequestHeader("accept-language") ?? null;

      const { isBot } = classifyUserAgent(ua, { accept, acceptLanguage });
      if (isBot) {
        return { bucket: 0, isBot: true, forced: true };
      }

      const raw = getCookie(META_AB_COOKIE);
      return { bucket: parseBucket(raw), isBot: false, forced: false };
    } catch {
      // Fail-safe — serve canonical-safe default on any error.
      return { bucket: 0, isBot: true, forced: true };
    }
  },
);
