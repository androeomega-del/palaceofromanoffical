// Editorial post-delivery review-request email. Sent T+10 days after the
// thank-you. Sits in the same cream/Cormorant aesthetic as the other
// lifecycle emails. Each line item gets its own "Share your impressions"
// CTA that deep-links to the product's reviews section on the live site.

import { escapeHtml } from "./gmail-send";

const SITE = "https://palaceofromanofficial.com";

export interface ReviewLineForEmail {
  handle: string;
  title: string;
}

export interface ReviewRequestEmailInput {
  firstName: string | null;
  orderName: string;
  lines: ReviewLineForEmail[];
}

function renderLines(lines: ReviewLineForEmail[]): string {
  return lines
    .map(
      (l) => `
      <tr>
        <td style="padding:18px 0;border-top:1px solid #e8dfc9;">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;line-height:1.3;color:#1a1a1a;">${escapeHtml(l.title)}</div>
          <div style="margin-top:10px;">
            <a href="${SITE}/product/${encodeURIComponent(l.handle)}#reviews"
               style="display:inline-block;font-family:Karla,Helvetica,sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#1a1a1a;border-bottom:1px solid #1a1a1a;padding-bottom:2px;text-decoration:none;">
              Share your impressions →
            </a>
          </div>
        </td>
      </tr>`,
    )
    .join("");
}

export function renderReviewRequestEmail(
  input: ReviewRequestEmailInput,
): { subject: string; html: string; text: string } {
  const subject = `How is your ${input.orderName} settling in?`;
  const greeting = input.firstName
    ? `Dear ${escapeHtml(input.firstName)},`
    : "Dear friend,";

  const lineSummary = input.lines.map((l) => `· ${l.title} — ${SITE}/product/${l.handle}#reviews`).join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f3ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ec;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fffaf2;padding:48px 40px;max-width:560px;">
        <tr><td align="center" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;letter-spacing:0.4em;color:#7a6a55;text-transform:uppercase;padding-bottom:32px;">Palace of Roman</td></tr>
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;line-height:1.2;color:#1a1a1a;padding-bottom:16px;">A quiet question, if we may.</td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#3a3328;padding-bottom:24px;">
          ${greeting}<br/><br/>
          It has been a little while since your order <strong>${escapeHtml(input.orderName)}</strong> made its way to you. We hope each piece has found its place in your wardrobe.<br/><br/>
          If you have a moment, we would be honoured to hear your impressions — the fit, the fabric, the way it wears. Every review is read by a real person and helps the next client find their right piece.
        </td></tr>
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #e8dfc9;">
            ${renderLines(input.lines)}
          </table>
        </td></tr>
        <tr><td align="center" style="font-family:Karla,Helvetica,sans-serif;font-size:12px;color:#9c8c70;padding:40px 0 0;line-height:1.7;">
          Reviews are moderated before publishing — your name is the only thing shown.<br/>
          <a href="${SITE}" style="color:#7a6a55;text-decoration:none;">palaceofromanofficial.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `How is your ${input.orderName} settling in?\n\n` +
    `${input.firstName ? `Dear ${input.firstName},\n\n` : ""}` +
    `It has been a little while since your order arrived. If you have a moment, ` +
    `we would be honoured to hear your impressions.\n\n` +
    `${lineSummary}\n\n` +
    `Palace of Roman — ${SITE}\n`;

  return { subject, html, text };
}
