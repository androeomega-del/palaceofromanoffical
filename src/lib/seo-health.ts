// Pure SEO health-check logic for the live homepage. No I/O — fetching is done
// by the caller (server fn or public route) and parsed HTML is passed in here.

export const HOMEPAGE_URL = "https://palaceofroman.com/";

export const EXPECTED = {
  title: "Palace of Roman — Curated Luxury Fashion",
  description:
    "Curated luxury fashion from Gucci, Prada, Saint Laurent, Armani and 500+ designer houses. 100% authentic, shipped worldwide.",
  canonical: "https://palaceofroman.com/",
  ogType: "website",
  ogUrl: "https://palaceofroman.com/",
  twitterCard: "summary_large_image",
  googleSiteVerification: "fMHX1ox7fghr5UYvoTTCaxSRNcKuE5BEUuPd-tDZYE4",
} as const;

export type Check = {
  id: string;
  label: string;
  ok: boolean;
  expected: string;
  actual: string;
  note?: string;
};

// ---- HTML parsing helpers (regex-based; the head is small + well-formed) ----

function pickTag(html: string, regex: RegExp): string | null {
  const m = html.match(regex);
  return m ? (m[1] ?? "").trim() : null;
}

function metaByName(html: string, name: string): string | null {
  // Tolerate attribute ordering: name first or content first.
  const a = pickTag(
    html,
    new RegExp(`<meta[^>]*\\bname=["']${name}["'][^>]*\\bcontent=["']([^"']*)["']`, "i"),
  );
  if (a !== null) return a;
  return pickTag(
    html,
    new RegExp(`<meta[^>]*\\bcontent=["']([^"']*)["'][^>]*\\bname=["']${name}["']`, "i"),
  );
}

function metaByProperty(html: string, property: string): string | null {
  const a = pickTag(
    html,
    new RegExp(`<meta[^>]*\\bproperty=["']${property}["'][^>]*\\bcontent=["']([^"']*)["']`, "i"),
  );
  if (a !== null) return a;
  return pickTag(
    html,
    new RegExp(`<meta[^>]*\\bcontent=["']([^"']*)["'][^>]*\\bproperty=["']${property}["']`, "i"),
  );
}

function linkRel(html: string, rel: string): string | null {
  const a = pickTag(
    html,
    new RegExp(`<link[^>]*\\brel=["']${rel}["'][^>]*\\bhref=["']([^"']*)["']`, "i"),
  );
  if (a !== null) return a;
  return pickTag(
    html,
    new RegExp(`<link[^>]*\\bhref=["']([^"']*)["'][^>]*\\brel=["']${rel}["']`, "i"),
  );
}

function titleTag(html: string): string | null {
  return pickTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
}

// ---- Individual checks ----

function check(id: string, label: string, expected: string, actual: string | null, ok: boolean, note?: string): Check {
  return { id, label, expected, actual: actual ?? "(missing)", ok, note };
}

export function runChecks(html: string, ogImageStatus: number | null): Check[] {
  const title = titleTag(html);
  const description = metaByName(html, "description");
  const robots = metaByName(html, "robots");
  const gsv = metaByName(html, "google-site-verification");

  const ogTitle = metaByProperty(html, "og:title");
  const ogDesc = metaByProperty(html, "og:description");
  const ogType = metaByProperty(html, "og:type");
  const ogUrl = metaByProperty(html, "og:url");
  const ogImage = metaByProperty(html, "og:image");

  const twCard = metaByName(html, "twitter:card");
  const twTitle = metaByName(html, "twitter:title");
  const twDesc = metaByName(html, "twitter:description");
  const twImage = metaByName(html, "twitter:image");

  const canonical = linkRel(html, "canonical");

  const checks: Check[] = [];

  checks.push(
    check(
      "title",
      "Title tag",
      `"${EXPECTED.title}" (≤ 60 chars)`,
      title,
      !!title && title.length <= 60 && title === EXPECTED.title,
      title && title.length > 60 ? `Too long: ${title.length} chars` : undefined,
    ),
  );

  checks.push(
    check(
      "description",
      "Meta description",
      `"${EXPECTED.description}" (50–160 chars)`,
      description,
      !!description && description.length >= 50 && description.length <= 160 && description === EXPECTED.description,
      description ? `${description.length} chars` : undefined,
    ),
  );

  checks.push(
    check(
      "canonical",
      "Canonical link",
      EXPECTED.canonical,
      canonical,
      canonical === EXPECTED.canonical || canonical === EXPECTED.canonical.replace(/\/$/, ""),
    ),
  );

  checks.push(check("og:title", "og:title", EXPECTED.title, ogTitle, ogTitle === EXPECTED.title));
  checks.push(
    check("og:description", "og:description", EXPECTED.description, ogDesc, ogDesc === EXPECTED.description),
  );
  checks.push(check("og:type", "og:type", EXPECTED.ogType, ogType, ogType === EXPECTED.ogType));
  checks.push(
    check(
      "og:url",
      "og:url",
      EXPECTED.ogUrl,
      ogUrl,
      ogUrl === EXPECTED.ogUrl || ogUrl === EXPECTED.ogUrl.replace(/\/$/, ""),
    ),
  );
  checks.push(
    check(
      "og:image",
      "og:image (absolute, reachable)",
      "https://… returning HTTP 200",
      ogImage,
      !!ogImage && /^https:\/\//.test(ogImage) && ogImageStatus !== null && ogImageStatus >= 200 && ogImageStatus < 400,
      ogImageStatus !== null ? `HEAD ${ogImageStatus}` : undefined,
    ),
  );

  checks.push(check("twitter:card", "twitter:card", EXPECTED.twitterCard, twCard, twCard === EXPECTED.twitterCard));
  checks.push(check("twitter:title", "twitter:title", EXPECTED.title, twTitle, twTitle === EXPECTED.title));
  checks.push(
    check("twitter:description", "twitter:description", EXPECTED.description, twDesc, twDesc === EXPECTED.description),
  );
  checks.push(
    check("twitter:image", "twitter:image", "matches og:image", twImage, !!twImage && twImage === ogImage),
  );

  const robotsLower = (robots ?? "").toLowerCase();
  checks.push(
    check(
      "robots",
      "robots (no noindex)",
      "must not contain noindex",
      robots ?? "(no robots meta — default index,follow)",
      !robotsLower.includes("noindex"),
    ),
  );

  checks.push(
    check(
      "google-site-verification",
      "Google Search Console verification",
      EXPECTED.googleSiteVerification,
      gsv,
      gsv === EXPECTED.googleSiteVerification,
    ),
  );

  return checks;
}

// ---- Network helper (used by both surfaces) ----

export async function fetchHomepageAndCheck(): Promise<{
  checks: Check[];
  ok: boolean;
  checkedAt: string;
  fetchedStatus: number;
}> {
  const res = await fetch(HOMEPAGE_URL, {
    headers: { "user-agent": "PalaceOfRoman-SEO-HealthCheck/1.0" },
    redirect: "follow",
  });
  const html = await res.text();

  // Probe og:image without downloading the body.
  const ogImage = (
    html.match(/<meta[^>]*\bproperty=["']og:image["'][^>]*\bcontent=["']([^"']*)["']/i) ??
    html.match(/<meta[^>]*\bcontent=["']([^"']*)["'][^>]*\bproperty=["']og:image["']/i)
  )?.[1];

  let ogImageStatus: number | null = null;
  if (ogImage && /^https?:\/\//i.test(ogImage)) {
    try {
      const head = await fetch(ogImage, { method: "HEAD" });
      ogImageStatus = head.status;
    } catch {
      ogImageStatus = 0;
    }
  }

  const checks = runChecks(html, ogImageStatus);
  return {
    checks,
    ok: checks.every((c) => c.ok),
    checkedAt: new Date().toISOString(),
    fetchedStatus: res.status,
  };
}
