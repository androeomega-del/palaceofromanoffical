// Editorial "Stylist's Note" follow-up email — sent immediately after the
// thank-you email, carrying the AI-generated paragraph + the dynamic
// 48-hour STYLEVIBE discount code.

import { escapeHtml } from "./gmail-send";

const SITE = "https://palaceofromanofficial.com";

export interface StylistNoteEmailInput {
  firstName: string | null;
  orderName: string;
  paragraph: string;
  discount: {
    code: string;
    percentage: number;
    endsAt: string; // ISO
  } | null;
}

function formatExpiry(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return "48 hours from now";
  }
}

export function renderStylistNoteEmail(input: StylistNoteEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const greeting = input.firstName
    ? `Dear ${escapeHtml(input.firstName)},`
    : "Dear client,";

  const subject = input.discount
    ? `A note from your stylist — ${input.discount.percentage}% on your next edit`
    : "A note from your stylist";

  const discountBlock = input.discount
    ? `
      <tr><td style="padding:32px 0 8px;">
        <div style="border-top:1px solid #e6dfd2;"></div>
      </td></tr>
      <tr><td style="padding:24px 0 8px;font-family:Karla,Helvetica,sans-serif;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#8a7355;">
        Your private invitation
      </td></tr>
      <tr><td style="padding:0 0 8px;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;line-height:1.2;color:#1a1a1a;">
        ${input.discount.percentage}% on your next piece
      </td></tr>
      <tr><td style="padding:8px 0 16px;font-family:Karla,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#5a4f42;">
        A single-use code, valid through <strong style="color:#1a1a1a;">${escapeHtml(formatExpiry(input.discount.endsAt))}</strong>.
      </td></tr>
      <tr><td style="padding:8px 0 16px;">
        <div style="display:inline-block;border:1px solid #1a1a1a;padding:14px 28px;font-family:'Courier New',monospace;font-size:18px;letter-spacing:0.2em;color:#1a1a1a;background:#faf6ef;">
          ${escapeHtml(input.discount.code)}
        </div>
      </td></tr>
      <tr><td style="padding:8px 0 24px;">
        <a href="${SITE}/shop?discount=${encodeURIComponent(input.discount.code)}" style="display:inline-block;background:#1a1a1a;color:#faf6ef;padding:14px 32px;font-family:Karla,Helvetica,sans-serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;text-decoration:none;">
          Explore the next edit
        </a>
      </td></tr>
    `
    : "";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#faf6ef;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf6ef;">
    <tr><td align="center" style="padding:48px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border:1px solid #e6dfd2;">
        <tr><td style="padding:40px 48px 16px;text-align:center;font-family:Karla,Helvetica,sans-serif;font-size:10px;letter-spacing:0.4em;text-transform:uppercase;color:#8a7355;">
          Palace of Roman · Stylist's Note
        </td></tr>
        <tr><td style="padding:24px 48px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;line-height:1.2;color:#1a1a1a;">
          ${greeting}
        </td></tr>
        <tr><td style="padding:16px 48px 0;font-family:Karla,Helvetica,sans-serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#8a7355;">
          Order ${escapeHtml(input.orderName)}
        </td></tr>
        <tr><td style="padding:24px 48px 0;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;line-height:1.7;color:#1a1a1a;font-style:italic;">
          ${escapeHtml(input.paragraph)}
        </td></tr>
        <tr><td style="padding:0 48px 32px;">
          ${discountBlock}
        </td></tr>
        <tr><td style="padding:24px 48px 40px;border-top:1px solid #e6dfd2;font-family:Karla,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#7a6a55;">
          With care,<br/>
          <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#1a1a1a;">The Palace of Roman atelier</span>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-family:Karla,Helvetica,sans-serif;font-size:11px;color:#9a8a73;">
        <a href="${SITE}" style="color:#9a8a73;text-decoration:none;">palaceofromanofficial.com</a>
      </p>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `${input.firstName ? `Dear ${input.firstName},` : "Dear client,"}\n\n` +
    `Order ${input.orderName} — A note from your stylist:\n\n` +
    `${input.paragraph}\n\n` +
    (input.discount
      ? `Your private invitation: ${input.discount.percentage}% off your next piece.\n` +
        `Code: ${input.discount.code}\n` +
        `Valid through: ${formatExpiry(input.discount.endsAt)}\n` +
        `Shop: ${SITE}/shop?discount=${encodeURIComponent(input.discount.code)}\n\n`
      : "") +
    `With care,\nThe Palace of Roman atelier\n${SITE}\n`;

  return { subject, html, text };
}
