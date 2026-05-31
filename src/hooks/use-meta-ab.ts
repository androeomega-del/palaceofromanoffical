/**
 * useMetaAb — client-side hook that completes the meta A/B test.
 *
 * Two jobs:
 *
 * 1. **First-visit assignment.** If the visitor has no `por_meta_ab` cookie
 *    yet, flip a coin (0/1), persist it for 90 days, and — if the assigned
 *    bucket differs from what SSR rendered (always 0 for first visits) —
 *    mutate `document.title` and the description meta tags so the visible
 *    page reflects their assigned variant from this session on.
 *
 * 2. **Exposure tracking.** Fire a Plausible `Meta AB Exposure` custom
 *    event with `{ page, bucket, variant }` props every time a participating
 *    page mounts. Conversion goals already configured in Plausible
 *    (add-to-cart, checkout, etc.) can then be segmented by `variant`.
 *
 * The hook never touches canonical / og:url / structured data — only the
 * visible title and description — so the test stays SEO-safe.
 */
import { useEffect } from "react";
import {
  META_AB_COOKIE,
  META_AB_COOKIE_MAX_AGE,
  parseBucket,
  variantLabel,
  type MetaBucket,
  type MetaVariant,
} from "@/lib/meta-ab";

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
  }
}

export function useMetaAb(
  pageKey: string,
  ssrBucket: MetaBucket,
  variants: { a: MetaVariant; b: MetaVariant },
) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    // 1. Read existing cookie or assign a fresh bucket.
    const existing = readCookie(META_AB_COOKIE);
    let bucket: MetaBucket;
    if (existing === "0" || existing === "1") {
      bucket = parseBucket(existing);
    } else {
      bucket = (Math.random() < 0.5 ? 0 : 1) as MetaBucket;
      writeCookie(META_AB_COOKIE, String(bucket), META_AB_COOKIE_MAX_AGE);
    }

    // 2. If the assigned bucket diverges from what SSR rendered, patch the
    //    visible title + description tags in place.
    if (bucket !== ssrBucket) {
      const v = bucket === 1 ? variants.b : variants.a;
      document.title = v.title;
      setMeta("description", v.description, "name");
      setMeta("og:title", v.title, "property");
      setMeta("og:description", v.description, "property");
    }

    // 3. Track exposure (no-op if Plausible script hasn't loaded yet —
    //    plausible.q queues calls until init completes).
    try {
      window.plausible?.("Meta AB Exposure", {
        props: { page: pageKey, bucket: String(bucket), variant: variantLabel(bucket) },
      });
    } catch {
      // analytics must never break the page
    }
  }, [pageKey, ssrBucket, variants.a.title, variants.a.description, variants.b.title, variants.b.description]);
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Cookie helpers (client-only, scoped to this module)                     */
/* ──────────────────────────────────────────────────────────────────────── */

function readCookie(name: string): string | undefined {
  const target = name + "=";
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) return decodeURIComponent(trimmed.slice(target.length));
  }
  return undefined;
}

function writeCookie(name: string, value: string, maxAgeSec: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSec}; SameSite=Lax${secure}`;
}

function setMeta(key: string, value: string, attr: "name" | "property") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}
