// Editorial cart-abandonment recovery email for Palace of Roman.
// Cream canvas, Cormorant headings, Karla body — matches existing templates.

import { escapeHtml } from "./gmail-send";

const SITE = "https://palaceofromanofficial.com";

export interface CartLineForEmail {
  title: string;
  variant: string | null;
  image: string | null;
  price: string; // pre-formatted "USD 123.00"
  quantity: number;
}

export interface CartAbandonmentInput {
  firstName: string | null;
  lines: CartLineForEmail[];
  total: string;
  checkoutUrl: string | null;
}

function renderLines(lines: CartLineForEmail[]): string {
  return lines
    .map(
      (l) => `
      <tr>
        <td style="padding:12px 0;width:96px;vertical-align:top;">
          ${
            l.image
              ? `<img src="${escapeHtml(l.image)}" width="88" height="110" alt="" style="display:block;border:0;object-fit:cover;border-radius:2px;" />`
              : ""
          }
        </td>
        <td style="padding:12px 16px;vertical-align:top;font-family:'Cormorant Garamond',Georgia,serif;color:#1a1a1a;">
          <div style="font-size:18px;line-height:1.3;">${escapeHtml(l.title)}</div>
          ${l.variant ? `<div style="font-size:13px;color:#7a6a55;font-family:Karla,Helvetica,sans-serif;margin-top:4px;letter-spacing:0.04em;">${escapeHtml(l.variant)}</div>` : ""}
          <div style="font-size:14px;color:#1a1a1a;font-family:Karla,Helvetica,sans-serif;margin-top:8px;">${escapeHtml(l.price)} ${l.quantity > 1 ? `× ${l.quantity}` : ""}</div>
        </td>
      </tr>`,
    )
    .join("");
}

export function renderCartAbandonmentEmail(
  input: CartAbandonmentInput,
): { subject: string; html: string; text: string } {
  const subject = "You left something behind — Palace of Roman";
  const greeting = input.firstName
    ? `Dear ${escapeHtml(input.firstName)},`
    : "Dear friend,";

  const ctaUrl = input.checkoutUrl || `${SITE}/cart`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f3ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ec;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fffaf2;padding:48px 40px;max-width:560px;">
        <tr><td align="center" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;letter-spacing:0.4em;color:#7a6a55;text-transform:uppercase;padding-bottom:32px;">Palace of Roman</td></tr>
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;line-height:1.2;color:#1a1a1a;padding-bottom:16px;">You left something behind.</td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#3a3328;padding-bottom:24px;">
          ${greeting}<br/><br/>
          We noticed you were considering a few pieces from our curation. These items are held for a limited time — we would hate for you to miss them.
        </td></tr>
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8dfc9;border-bottom:1px solid #e8dfc9;">
            ${renderLines(input.lines)}
          </table>
        </td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:14px;color:#1a1a1a;padding:24px 0 0;text-align:right;letter-spacing:0.04em;">
          Total &nbsp; <strong>${escapeHtml(input.total)}</strong>
        </td></tr>
        <tr><td align="center" style="padding:40px 0 8px;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#1a1a1a;color:#fffaf2;text-decoration:none;font-family:Karla,Helvetica,sans-serif;font-size:13px;letter-spacing:0.24em;text-transform:uppercase;padding:16px 36px;">Complete your order</a>
        </td></tr>
        <tr><td align="center" style="font-family:Karla,Helvetica,sans-serif;font-size:12px;color:#9c8c70;padding:32px 0 0;line-height:1.6;">
          Questions? Simply reply to this email.<br/>
          <a href="${SITE}" style="color:#7a6a55;text-decoration:none;">palaceofromanofficial.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `You left something behind at Palace of Roman.\n\n` +
    `${input.firstName ? `Dear ${input.firstName},\n\n` : ""}` +
    `We noticed you were considering a few pieces from our curation. ` +
    `These items are held for a limited time.\n\n` +
    `Total: ${input.total}\n\n` +
    `Complete your order: ${ctaUrl}\n\n` +
    `Palace of Roman — ${SITE}\n`;

  return { subject, html, text };
}
