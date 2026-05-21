// Editorial back-in-stock notification email for Palace of Roman.
// Cream canvas, Cormorant headings, Karla body.

import { escapeHtml } from "./gmail-send";

const SITE = "https://palaceofromanofficial.com";

export interface BackInStockInput {
  firstName: string | null;
  productTitle: string;
  variantTitle: string | null;
  productHandle: string;
  image: string | null;
  price: string; // pre-formatted "USD 123.00"
}

export function renderBackInStockEmail(
  input: BackInStockInput,
): { subject: string; html: string; text: string } {
  const subject = `Back in stock: ${input.productTitle} — Palace of Roman`;
  const greeting = input.firstName
    ? `Dear ${escapeHtml(input.firstName)},`
    : "Dear friend,";

  const productUrl = `${SITE}/product/${escapeHtml(input.productHandle)}`;
  const variantLabel = input.variantTitle ? ` — ${escapeHtml(input.variantTitle)}` : "";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f3ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ec;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fffaf2;padding:48px 40px;max-width:560px;">
        <tr><td align="center" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;letter-spacing:0.4em;color:#7a6a55;text-transform:uppercase;padding-bottom:32px;">Palace of Roman</td></tr>
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;line-height:1.2;color:#1a1a1a;padding-bottom:16px;">It has returned.</td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#3a3328;padding-bottom:24px;">
          ${greeting}<br/><br/>
          The piece you have been waiting for is back in stock. Availability is limited — we wanted you to know first.
        </td></tr>
        <tr><td align="center" style="padding:8px 1px 24px;">
          ${
            input.image
              ? `<img src="${escapeHtml(input.image)}" width="280" height="350" alt="" style="display:block;border:1px solid #e8dfc9;object-fit:cover;border-radius:2px;" />`
              : ""
          }
        </td></tr>
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#1a1a1a;text-align:center;padding-bottom:4px;">${escapeHtml(input.productTitle)}${variantLabel}</td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:14px;color:#1a1a1a;text-align:center;letter-spacing:0.04em;padding-bottom:24px;">${escapeHtml(input.price)}</td></tr>
        <tr><td align="center" style="padding:8px 0 16px;">
          <a href="${productUrl}" style="display:inline-block;background:#1a1a1a;color:#fffaf2;text-decoration:none;font-family:Karla,Helvetica,sans-serif;font-size:13px;letter-spacing:0.24em;text-transform:uppercase;padding:16px 36px;">Shop now</a>
        </td></tr>
        <tr><td align="center" style="font-family:Karla,Helvetica,sans-serif;font-size:12px;color:#9c8c70;padding:32px 0 0;line-height:1.6;">
          Simply reply to this email if you have any questions.<br/>
          <a href="${SITE}" style="color:#7a6a55;text-decoration:none;">palaceofromanofficial.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `Back in stock: ${input.productTitle}${variantLabel}\n\n` +
    `${input.firstName ? `Dear ${input.firstName},\n\n` : ""}` +
    `The piece you have been waiting for is back in stock. ` +
    `Availability is limited — we wanted you to know first.\n\n` +
    `${input.productTitle}${variantLabel}\n` +
    `${input.price}\n\n` +
    `Shop now: ${productUrl}\n\n` +
    `Palace of Roman — ${SITE}\n`;

  return { subject, html, text };
}
