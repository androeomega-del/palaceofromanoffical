// Capsule Lookbook email — sent when a user requests the digital archive
// of their 5-piece capsule edit from the Capsule Builder.

import { escapeHtml } from "./gmail-send";

const SITE = "https://palaceofromanofficial.com";

export type CapsulePieceForEmail = {
  title: string;
  vendor?: string | null;
  handle: string;
  imageUrl?: string | null;
  priceUsd?: string | null;
  slotKind: string;
};

export function renderCapsuleLookbookEmail(pieces: CapsulePieceForEmail[]): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Your private Palace of Roman lookbook";

  const piecesHtml = pieces
    .map((p) => {
      const url = `${SITE}/product/${encodeURIComponent(p.handle)}`;
      const vendor = p.vendor ? escapeHtml(p.vendor) : "";
      const title = escapeHtml(p.title);
      const price = p.priceUsd ? `$${escapeHtml(p.priceUsd)}` : "";
      const img = p.imageUrl
        ? `<img src="${escapeHtml(p.imageUrl)}" width="120" height="160" alt="${title}" style="display:block;width:120px;height:160px;object-fit:cover;background:#ece3d3;" />`
        : `<div style="width:120px;height:160px;background:#ece3d3;"></div>`;
      return `
        <tr><td style="padding:0 0 22px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:18px;vertical-align:top;">${img}</td>
              <td style="vertical-align:top;">
                <div style="font-family:Karla,Helvetica,sans-serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#7a6a55;padding-bottom:6px;">${escapeHtml(p.slotKind)}</div>
                ${vendor ? `<div style="font-family:Karla,Helvetica,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#5a5040;padding-bottom:4px;">${vendor}</div>` : ""}
                <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;line-height:1.3;color:#1a1a1a;padding-bottom:6px;">${title}</div>
                ${price ? `<div style="font-family:Karla,Helvetica,sans-serif;font-size:13px;color:#3a3328;padding-bottom:10px;">${price}</div>` : ""}
                <a href="${url}" style="display:inline-block;font-family:Karla,Helvetica,sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#1a1a1a;text-decoration:none;border-bottom:1px solid #1a1a1a;padding-bottom:2px;">View piece</a>
              </td>
            </tr>
          </table>
        </td></tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f3ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ec;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fffaf2;padding:56px 40px;max-width:560px;">
        <tr><td align="center" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;letter-spacing:0.4em;color:#7a6a55;text-transform:uppercase;padding-bottom:40px;">Palace of Roman</td></tr>
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;line-height:1.2;color:#1a1a1a;padding-bottom:18px;">Your digital atelier archive.</td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#3a3328;padding-bottom:32px;">
          A high-fidelity record of the capsule you curated, saved for you to revisit. Each piece below opens to a private checkout — your edit, preserved.
        </td></tr>
        <tr><td style="border-top:1px solid #ece3d3;padding-top:28px;font-family:Karla,Helvetica,sans-serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#7a6a55;padding-bottom:20px;">Your five-piece capsule</td></tr>
        ${piecesHtml}
        <tr><td align="center" style="font-family:Karla,Helvetica,sans-serif;font-size:12px;color:#9c8c70;padding:32px 0 0;line-height:1.6;">
          <a href="${SITE}/privacy" style="color:#7a6a55;text-decoration:none;">Privacy Notice</a> &mdash; handled with absolute discretion.
        </td></tr>
        <tr><td align="center" style="font-family:Karla,Helvetica,sans-serif;font-size:12px;color:#9c8c70;padding:8px 0 0;line-height:1.6;">
          <a href="${SITE}" style="color:#7a6a55;text-decoration:none;">palaceofromanofficial.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `Your digital atelier archive.

A high-fidelity record of the capsule you curated.

${pieces
  .map(
    (p) =>
      `- [${p.slotKind}] ${p.vendor ? p.vendor + " — " : ""}${p.title}${p.priceUsd ? ` ($${p.priceUsd})` : ""}\n  ${SITE}/product/${p.handle}`,
  )
  .join("\n\n")}

Palace of Roman — ${SITE}
`;

  return { subject, html, text };
}
