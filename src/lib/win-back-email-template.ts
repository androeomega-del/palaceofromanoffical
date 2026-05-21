// Editorial win-back re-engagement email for Palace of Roman.
// Includes data-driven product recommendations based on store catalog.
// Cream canvas, Cormorant headings, Karla body.

import { escapeHtml } from "./gmail-send";

const SITE = "https://palaceofromanofficial.com";

export interface ProductRec {
  title: string;
  handle: string;
  image: string | null;
  price: string; // pre-formatted "USD 123.00"
  vendor: string | null;
}

export interface WinBackEmailInput {
  firstName: string | null;
  recommendations: ProductRec[];
  lastOrderDate: string | null; // human-readable e.g. "March 2026"
}

function renderRecs(recs: ProductRec[]): string {
  return recs
    .map(
      (p) => `
      <tr>
        <td style="padding:12px 0;width:120px;vertical-align:top;">
          ${
            p.image
              ? `<img src="${escapeHtml(p.image)}" width="112" height="140" alt="" style="display:block;border:1px solid #e8dfc9;object-fit:cover;border-radius:2px;" />`
              : ""
          }
        </td>
        <td style="padding:12px 16px;vertical-align:top;font-family:'Cormorant Garamond',Georgia,serif;color:#1a1a1a;">
          <div style="font-size:18px;line-height:1.3;">${escapeHtml(p.title)}</div>
          ${p.vendor ? `<div style="font-size:13px;color:#7a6a55;font-family:Karla,Helvetica,sans-serif;margin-top:4px;letter-spacing:0.04em;">${escapeHtml(p.vendor)}</div>` : ""}
          <div style="font-size:14px;color:#1a1a1a;font-family:Karla,Helvetica,sans-serif;margin-top:8px;">${escapeHtml(p.price)}</div>
          <a href="${SITE}/product/${escapeHtml(p.handle)}" style="display:inline-block;margin-top:10px;background:#1a1a1a;color:#fffaf2;text-decoration:none;font-family:Karla,Helvetica,sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;padding:10px 24px;">View</a>
        </td>
      </tr>`,
    )
    .join("");
}

export function renderWinBackEmail(
  input: WinBackEmailInput,
): { subject: string; html: string; text: string } {
  const subject = "We miss you at Palace of Roman";
  const greeting = input.firstName
    ? `Dear ${escapeHtml(input.firstName)},`
    : "Dear friend,";

  const since = input.lastOrderDate
    ? `It has been a while since your last visit — your order from ${escapeHtml(input.lastOrderDate)} is still remembered. `
    : "It has been a while since your last visit. ";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f3ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ec;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fffaf2;padding:48px 40px;max-width:560px;">
        <tr><td align="center" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;letter-spacing:0.4em;color:#7a6a55;text-transform:uppercase;padding-bottom:32px;">Palace of Roman</td></tr>
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;line-height:1.2;color:#1a1a1a;padding-bottom:16px;">We miss you.</td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#3a3328;padding-bottom:24px;">
          ${greeting}<br/><br/>
          ${since}The collection has evolved since then. Here are a few pieces we believe you will appreciate — chosen from our latest arrivals.
        </td></tr>
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8dfc9;">
            ${renderRecs(input.recommendations)}
          </table>
        </td></tr>
        <tr><td align="center" style="padding:40px 0 8px;">
          <a href="${SITE}/collections/new-arrivals" style="display:inline-block;background:#1a1a1a;color:#fffaf2;text-decoration:none;font-family:Karla,Helvetica,sans-serif;font-size:13px;letter-spacing:0.24em;text-transform:uppercase;padding:16px 36px;">Explore new arrivals</a>
        </td></tr>
        <tr><td align="center" style="font-family:Karla,Helvetica,sans-serif;font-size:12px;color:#9c8c70;padding:32px 0 0;line-height:1.6;">
          Should you need anything at all, simply reply to this email.<br/>
          <a href="${SITE}" style="color:#7a6a55;text-decoration:none;">palaceofromanofficial.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `We miss you at Palace of Roman.\n\n` +
    `${input.firstName ? `Dear ${input.firstName},\n\n` : ""}` +
    `${since}` +
    `The collection has evolved. Here are pieces we believe you will appreciate:\n\n` +
    input.recommendations.map((p) => `- ${p.title} — ${p.price}\n  ${SITE}/product/${p.handle}`).join("\n") +
    `\n\nExplore new arrivals: ${SITE}/collections/new-arrivals\n\n` +
    `Palace of Roman — ${SITE}\n`;

  return { subject, html, text };
}
