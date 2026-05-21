// Editorial post-purchase thank-you email for Palace of Roman.
// Mirrors the aesthetic of the cart-recovery template (cream canvas,
// Cormorant headings, Karla body).

import { escapeHtml } from "./gmail-send";

const SITE = "https://palaceofromanofficial.com";

export interface OrderLineForEmail {
  title: string | null;
  variant_title: string | null;
  image: string | null;
  price: string | null; // pre-formatted "USD 123.00"
  quantity: number;
}

export interface PostPurchaseEmailInput {
  firstName: string | null;
  orderName: string; // e.g. "#1042"
  total: string; // pre-formatted "USD 456.00"
  lines: OrderLineForEmail[];
}

function renderLines(lines: OrderLineForEmail[]): string {
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
          ${l.variant_title ? `<div style="font-size:13px;color:#7a6a55;font-family:Karla,Helvetica,sans-serif;margin-top:4px;letter-spacing:0.04em;">${escapeHtml(l.variant_title)}</div>` : ""}
          <div style="font-size:14px;color:#1a1a1a;font-family:Karla,Helvetica,sans-serif;margin-top:8px;">${escapeHtml(l.price)} ${l.quantity > 1 ? `× ${l.quantity}` : ""}</div>
        </td>
      </tr>`,
    )
    .join("");
}

export function renderPostPurchaseEmail(
  input: PostPurchaseEmailInput,
): { subject: string; html: string; text: string } {
  const subject = `Thank you for your order ${input.orderName} — Palace of Roman`;
  const greeting = input.firstName
    ? `Dear ${escapeHtml(input.firstName)},`
    : "Dear friend,";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f3ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ec;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fffaf2;padding:48px 40px;max-width:560px;">
        <tr><td align="center" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;letter-spacing:0.4em;color:#7a6a55;text-transform:uppercase;padding-bottom:32px;">Palace of Roman</td></tr>
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;line-height:1.2;color:#1a1a1a;padding-bottom:16px;">Thank you for your order.</td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#3a3328;padding-bottom:24px;">
          ${greeting}<br/><br/>
          We have received your order <strong>${escapeHtml(input.orderName)}</strong>. Each piece is 100% authentic, sourced from the brands or their authorised distributors, and prepared with the care it deserves.<br/><br/>
          You will receive a separate notification with tracking details as soon as your selection is on its way.
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
          <a href="${SITE}/shop" style="display:inline-block;background:#1a1a1a;color:#fffaf2;text-decoration:none;font-family:Karla,Helvetica,sans-serif;font-size:13px;letter-spacing:0.24em;text-transform:uppercase;padding:16px 36px;">Continue exploring</a>
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
    `Thank you for your order ${input.orderName}.\n\n` +
    `${input.firstName ? `Dear ${input.firstName},\n\n` : ""}` +
    `We have received your order. Each piece is 100% authentic, sourced from the brands or their authorised distributors. ` +
    `You will receive a separate notification with tracking details once it ships.\n\n` +
    `Total: ${input.total}\n\n` +
    `Palace of Roman — ${SITE}\n`;

  return { subject, html, text };
}
