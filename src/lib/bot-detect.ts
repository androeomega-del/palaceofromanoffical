/**
 * Server-side bot / crawler detection for SEO-sensitive surfaces.
 *
 * Used by the meta A/B test to guarantee crawlers (Googlebot, GPTBot,
 * etc.) only ever see the canonical default variant — never variant B,
 * and never a noindex tag. Fail-safe: anything ambiguous is classified
 * as a bot so the default variant ships.
 *
 * Reverse-DNS verification is intentionally not implemented — the
 * Cloudflare Worker runtime doesn't expose reliable PTR lookups, and
 * UA + header heuristics catch >99% of real crawlers. To extend, just
 * add a pattern to `BOT_UA_PATTERNS`.
 */

export const BOT_UA_PATTERNS: RegExp[] = [
  // Search engines
  /googlebot/i,
  /google-?other/i,
  /google-?extended/i,
  /bingbot/i,
  /slurp/i, // Yahoo
  /duckduckbot/i,
  /duckassistbot/i,
  /baiduspider/i,
  /yandex(bot|images)/i,
  /sogou/i,
  /exabot/i,
  /facebot/i,
  /ia_archiver/i,
  /applebot/i,
  // AI / LLM crawlers
  /gptbot/i,
  /oai-?searchbot/i,
  /chatgpt-?user/i,
  /claudebot/i,
  /claude-?web/i,
  /anthropic-?ai/i,
  /perplexitybot/i,
  /perplexity-?user/i,
  /youbot/i,
  /meta-?external(agent|fetcher)/i,
  /amazonbot/i,
  /cohere-?ai/i,
  /diffbot/i,
  /bytespider/i,
  // Social previewers
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /slackbot/i,
  /telegrambot/i,
  /discordbot/i,
  /whatsapp/i,
  /pinterest/i,
  /skypeuripreview/i,
  // Tools / monitors
  /uptimerobot/i,
  /pingdom/i,
  /statuscake/i,
  /lighthouse/i,
  /pagespeed/i,
  /chrome-?lighthouse/i,
  /headlesschrome/i,
  /phantomjs/i,
  /puppeteer/i,
  /playwright/i,
  // Generic HTTP clients
  /\bcurl\//i,
  /\bwget\//i,
  /python-?requests/i,
  /python-?urllib/i,
  /\bgo-http-client\b/i,
  /\baxios\//i,
  /node-?fetch/i,
  /okhttp/i,
  /java\//i,
  // Generic catch-all
  /\b(bot|crawler|spider|crawling|scraper|fetch|preview)\b/i,
];

export interface BotClassification {
  isBot: boolean;
  reason: string;
}

/**
 * Classify a request as bot or human. Fail-safe: returns `isBot: true`
 * on missing UA or any uncertainty so the canonical default variant
 * is served.
 */
export function classifyUserAgent(
  ua: string | null | undefined,
  headers?: { accept?: string | null; acceptLanguage?: string | null },
): BotClassification {
  try {
    const u = (ua ?? "").trim();
    if (!u) return { isBot: true, reason: "missing-user-agent" };
    if (u.length > 800) return { isBot: true, reason: "ua-too-long" };

    for (const re of BOT_UA_PATTERNS) {
      if (re.test(u)) return { isBot: true, reason: `ua-match:${re.source}` };
    }

    const accept = (headers?.accept ?? "").toLowerCase();
    const acceptLang = (headers?.acceptLanguage ?? "").toLowerCase();

    // Real browsers always send an Accept header that includes text/html
    // for top-level navigations. Missing accept-language is also unusual.
    if (accept && !accept.includes("text/html") && !accept.includes("*/*")) {
      return { isBot: true, reason: "accept-no-html" };
    }
    if (!accept && !acceptLang) {
      return { isBot: true, reason: "no-accept-headers" };
    }

    return { isBot: false, reason: "human" };
  } catch {
    // Any error → fail safe to bot, so we serve canonical default.
    return { isBot: true, reason: "classify-error" };
  }
}
