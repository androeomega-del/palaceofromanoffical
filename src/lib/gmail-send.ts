// Shared Gmail send helper via the Lovable connector gateway.
// Sender: notify@palaceofromanofficial.com (the connected Gmail account).

const GMAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const FROM = "Palace of Roman <notify@palaceofromanofficial.com>";

function b64url(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sanitizeHeader(v: string): string {
  // Strip CR/LF to prevent RFC 2822 header injection.
  return v.replace(/[\r\n]+/g, " ").trim();
}

function buildRfc2822(to: string, subject: string, html: string, text: string): string {
  const safeTo = sanitizeHeader(to);
  const safeSubject = sanitizeHeader(subject);
  const boundary = `por_${Date.now().toString(36)}`;
  return [
    `From: ${FROM}`,
    `To: ${safeTo}`,
    `Subject: ${safeSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    text,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    html,
    ``,
    `--${boundary}--`,
    ``,
  ].join("\r\n");
}

export async function sendGmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<unknown> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const GOOGLE_MAIL_API_KEY = process.env.GOOGLE_MAIL_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!GOOGLE_MAIL_API_KEY) throw new Error("GOOGLE_MAIL_API_KEY is not configured");

  const raw = b64url(buildRfc2822(to, subject, html, text));
  const res = await fetch(`${GMAIL_GATEWAY}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_MAIL_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail send failed [${res.status}]: ${body.slice(0, 500)}`);
  }
  return res.json();
}

export function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─────────────────────────────────────────────────────────────────────────────
// Automated email layout generator — invoked exclusively by server-only
// background cron routines (see growth-jobs-worker.server.ts). The returned
// raw HTML string is fed straight into sendGmail() with no client-side
// drafting or dashboard configuration.
// ─────────────────────────────────────────────────────────────────────────────

const SITE_ORIGIN = "https://palaceofromanofficial.com";

export interface AutomatedCartItem {
  title: string;
  vendor?: string | null;
  imageUrl?: string | null;
  variantTitle?: string | null;
  /** Canonical path back to the product, e.g. "/product/some-handle" */
  path: string;
}

export interface AutomatedAbandonedCartData {
  firstName?: string | null;
  items: AutomatedCartItem[];
  checkoutUrl?: string | null;
}

export interface AutomatedNewArrivalItem {
  title: string;
  vendor?: string | null;
  imageUrl?: string | null;
  /** Optional alt metadata text (category, material, season) */
  meta?: string | null;
  path: string;
}

export interface AutomatedNewArrivalsData {
  firstName?: string | null;
  items: AutomatedNewArrivalItem[];
}

export type AutomatedEmailType = "abandoned_cart" | "new_arrivals";

function shell(inner: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#fbfbfa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbfbfa;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fbfbfa;max-width:600px;">
        <tr><td align="center" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:13px;letter-spacing:0.42em;color:#111111;text-transform:uppercase;padding:8px 0 36px;font-weight:500;">PALACE OF ROMAN</td></tr>
        ${inner}
        <tr><td align="center" style="font-family:Karla,Helvetica,Arial,sans-serif;font-size:11px;color:#7a6a55;padding:40px 0 0;line-height:1.7;letter-spacing:0.04em;">
          <a href="${SITE_ORIGIN}" style="color:#7a6a55;text-decoration:none;">palaceofromanofficial.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function gridCard(opts: {
  title: string;
  vendor?: string | null;
  imageUrl?: string | null;
  meta?: string | null;
  href: string;
}): string {
  // 3:4 aspect via fixed 240x320 image cell
  const img = opts.imageUrl
    ? `<img src="${escapeHtml(opts.imageUrl)}" width="240" height="320" alt="${escapeHtml(opts.title)}" style="display:block;width:240px;height:320px;object-fit:cover;background:#ece6dc;border:0;" />`
    : `<div style="width:240px;height:320px;background:#ece6dc;"></div>`;
  return `
    <tr><td align="center" style="padding:0 0 28px;">
      <a href="${escapeHtml(opts.href)}" style="text-decoration:none;color:#111111;">
        ${img}
        ${opts.vendor ? `<div style="font-family:Karla,Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#7a6a55;padding:14px 0 4px;">${escapeHtml(opts.vendor)}</div>` : ""}
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;line-height:1.3;color:#111111;padding-top:${opts.vendor ? "0" : "14px"};">${escapeHtml(opts.title)}</div>
        ${opts.meta ? `<div style="font-family:Karla,Helvetica,Arial,sans-serif;font-size:12px;color:#3a3328;padding-top:4px;letter-spacing:0.06em;">${escapeHtml(opts.meta)}</div>` : ""}
      </a>
    </td></tr>`;
}

function ctaButton(label: string, href: string): string {
  return `
    <tr><td align="center" style="padding:8px 0 4px;">
      <a href="${escapeHtml(href)}" style="display:inline-block;background:#111111;color:#fbfbfa;text-decoration:none;font-family:Karla,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;padding:18px 40px;">${escapeHtml(label)}</a>
    </td></tr>`;
}

function renderAbandonedCart(data: AutomatedAbandonedCartData): string {
  const greeting = data.firstName
    ? `Dear ${escapeHtml(data.firstName)},`
    : "Dear friend,";
  const cta = data.checkoutUrl || `${SITE_ORIGIN}/cart`;
  const cards = data.items.slice(0, 6).map((it) =>
    gridCard({
      title: it.title,
      vendor: it.vendor ?? null,
      imageUrl: it.imageUrl ?? null,
      meta: it.variantTitle ?? null,
      href: `${SITE_ORIGIN}${it.path.startsWith("/") ? it.path : `/${it.path}`}`,
    }),
  ).join("");

  const inner = `
    <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;line-height:1.2;color:#111111;padding-bottom:14px;text-align:center;">Your atelier edit awaits.</td></tr>
    <tr><td style="font-family:Karla,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.75;color:#3a3328;padding-bottom:32px;text-align:center;">
      ${greeting}<br/>The pieces you set aside are still held for you.
    </td></tr>
    ${cards}
    ${ctaButton("Resume your atelier edit", cta)}
  `;
  return shell(inner);
}

function renderNewArrivals(data: AutomatedNewArrivalsData): string {
  const greeting = data.firstName
    ? `Dear ${escapeHtml(data.firstName)},`
    : "Dear friend,";
  const cards = data.items.slice(0, 6).map((it) =>
    gridCard({
      title: it.title,
      vendor: it.vendor ?? null,
      imageUrl: it.imageUrl ?? null,
      meta: it.meta ?? null,
      href: `${SITE_ORIGIN}${it.path.startsWith("/") ? it.path : `/${it.path}`}`,
    }),
  ).join("");

  const inner = `
    <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;line-height:1.2;color:#111111;padding-bottom:14px;text-align:center;">Newly arrived.</td></tr>
    <tr><td style="font-family:Karla,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.75;color:#3a3328;padding-bottom:32px;text-align:center;">
      ${greeting}<br/>A quiet selection of pieces just added to the curation.
    </td></tr>
    ${cards}
    ${ctaButton("View the new arrivals", `${SITE_ORIGIN}/new-arrivals`)}
  `;
  return shell(inner);
}

/**
 * Server-only. Produces the raw HTML body for an automated email of the
 * given `type`, merged with `data` on the fly. The returned string is fed
 * directly into sendGmail() inside background cron routines.
 */
export function generateAutomatedEmailHtml(
  type: "abandoned_cart",
  data: AutomatedAbandonedCartData,
): string;
export function generateAutomatedEmailHtml(
  type: "new_arrivals",
  data: AutomatedNewArrivalsData,
): string;
export function generateAutomatedEmailHtml(
  type: AutomatedEmailType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
): string {
  if (type === "abandoned_cart") {
    return renderAbandonedCart(data as AutomatedAbandonedCartData);
  }
  return renderNewArrivals(data as AutomatedNewArrivalsData);
}

