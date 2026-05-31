import { describe, it, expect } from "vitest";
import { classifyUserAgent } from "@/lib/bot-detect";
import { seoMetaForBucket, pickHomeMeta, pickCollectionMeta } from "@/lib/meta-ab";

describe("bot detection", () => {
  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2)",
    "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    "Mozilla/5.0 (compatible; PerplexityBot/1.0)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "facebookexternalhit/1.1",
    "curl/7.88.1",
    "python-requests/2.31.0",
  ])("classifies %s as bot", (ua) => {
    expect(classifyUserAgent(ua, { accept: "*/*", acceptLanguage: "en" }).isBot).toBe(true);
  });

  it.each([
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  ])("classifies %s as human", (ua) => {
    expect(classifyUserAgent(ua, { accept: "text/html,*/*", acceptLanguage: "en-US,en" }).isBot).toBe(false);
  });

  it("fails safe on empty UA", () => {
    expect(classifyUserAgent("", {}).isBot).toBe(true);
    expect(classifyUserAgent(null, {}).isBot).toBe(true);
  });
});

describe("canonical-safety invariants", () => {
  const pageUrl = "https://palaceofromanofficial.com/collections/foo";

  it("default variant is indexable with self-canonical", () => {
    const r = seoMetaForBucket(0, pageUrl);
    expect(r.canonical).toBe(pageUrl);
    expect(r.robots).toBeNull();
  });

  it("variant B emits noindex and canonical to default URL", () => {
    const r = seoMetaForBucket(1, pageUrl);
    expect(r.canonical).toBe(pageUrl);
    expect(r.robots).toContain("noindex");
  });

  it("homepage variants both produce non-empty title + description", () => {
    for (const b of [0, 1] as const) {
      const v = pickHomeMeta(b);
      expect(v.title.length).toBeGreaterThan(0);
      expect(v.description.length).toBeGreaterThan(0);
      expect(v.description.length).toBeLessThanOrEqual(200);
    }
  });

  it("collection variants interpolate base seo and stay non-empty", () => {
    const base = { title: "Cashmere Sweaters", description: "Soft knits." };
    for (const handle of ["cashmere-sweaters", "luxury-sneakers", "italian-leather-handbags", "unknown-handle"]) {
      for (const b of [0, 1] as const) {
        const v = pickCollectionMeta(handle, b, base);
        expect(v.title).toMatch(/Cashmere|Luxury|Italian|Sweaters/);
        expect(v.description.length).toBeGreaterThan(0);
      }
    }
  });
});
