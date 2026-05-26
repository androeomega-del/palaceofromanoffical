// Editorial cart-abandonment recovery emails for Palace of Roman.
// Three variants escalating across the +1h / +24h / +72h cadence.
// Cream canvas, Cormorant headings, Karla body — no discounts, ever.

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
  /** 1 = +1h soft reminder, 2 = +24h concierge, 3 = +72h close */
  variant: 1 | 2 | 3;
}

function renderLines(lines: CartLineForEmail[]): string {
  return lines
    .slice(0, 4)
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

interface VariantCopy {
  subject: string;
  headline: string;
  body: string; // HTML-safe (already wrapped in <br/> where needed)
  cta: string;
  closing: string;
}

function copyFor(variant: 1 | 2 | 3, firstName: string | null): VariantCopy {
  const greet = firstName ? `Dear ${escapeHtml(firstName)},` : "Dear friend,";

  if (variant === 1) {
    return {
      subject: "Your selection at Palace of Roman",
      headline: "Your selection awaits.",
      body:
        `${greet}<br/><br/>` +
        `The pieces you set aside are still held for you. When the moment is right, your selection is one click away.`,
      cta: "Return to your selection",
      closing:
        "100% authentic. Sourced from the brands or their authorised distributors.<br/>" +
        "Questions? Simply reply to this email.",
    };
  }

  if (variant === 2) {
    return {
      subject: "A quiet note about your selection",
      headline: "May we help?",
      body:
        `${greet}<br/><br/>` +
        `Your chosen pieces are still reserved. If anything is unclear — sizing, fit, materials, or shipping to your country — simply reply to this message. ` +
        `A real person reads every note and will respond personally.<br/><br/>` +
        `Complimentary shipping and gift wrapping are included on every order.`,
      cta: "Complete your order",
      closing:
        "Reply to this email for personal assistance.<br/>" +
        "100% authentic. Sourced from the brands or their authorised distributors.",
    };
  }

  return {
    subject: "Your selection — a final note",
    headline: "Before your selection is released.",
    body:
      `${greet}<br/><br/>` +
      `Inventory in our curation moves quickly, and the pieces you set aside will soon be returned to circulation. ` +
      `If you would still like to bring them home, your cart is intact and one moment away.<br/><br/>` +
      `Every order ships with full authenticity documentation and complimentary returns.`,
    cta: "Secure your selection",
    closing:
      "Should you have any questions at all, simply reply to this email.<br/>" +
      "100% authentic. Sourced from the brands or their authorised distributors.",
  };
}

export function renderCartAbandonmentEmail(
  input: CartAbandonmentInput,
): { subject: string; html: string; text: string } {
  const c = copyFor(input.variant, input.firstName);
  const ctaUrl = input.checkoutUrl || `${SITE}/cart`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f3ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ec;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fffaf2;padding:48px 40px;max-width:560px;">
        <tr><td align="center" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;letter-spacing:0.4em;color:#7a6a55;text-transform:uppercase;padding-bottom:32px;">Palace of Roman</td></tr>
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;line-height:1.2;color:#1a1a1a;padding-bottom:16px;">${c.headline}</td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#3a3328;padding-bottom:24px;">
          ${c.body}
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
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#1a1a1a;color:#fffaf2;text-decoration:none;font-family:Karla,Helvetica,sans-serif;font-size:13px;letter-spacing:0.24em;text-transform:uppercase;padding:16px 36px;">${c.cta}</a>
        </td></tr>
        <tr><td align="center" style="font-family:Karla,Helvetica,sans-serif;font-size:12px;color:#9c8c70;padding:32px 0 0;line-height:1.7;">
          ${c.closing}<br/>
          <a href="${SITE}" style="color:#7a6a55;text-decoration:none;">palaceofromanofficial.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `${c.headline}\n\n` +
    `${input.firstName ? `Dear ${input.firstName},\n\n` : ""}` +
    c.body.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "") +
    `\n\nTotal: ${input.total}\n\n` +
    `${c.cta}: ${ctaUrl}\n\n` +
    `Palace of Roman — ${SITE}\n` +
    `Reply to this email for personal assistance.\n`;

  return { subject: c.subject, html, text };
}
