// Double opt-in confirmation email for newsletter signups.
// Matches the welcome-email aesthetic (cream canvas, Cormorant headings, Karla body).

const SITE = "https://palaceofromanofficial.com";

export function renderConfirmationEmail(confirmUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Confirm your subscription — Palace of Roman";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f3ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ec;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fffaf2;padding:56px 40px;max-width:560px;">
        <tr><td align="center" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;letter-spacing:0.4em;color:#7a6a55;text-transform:uppercase;padding-bottom:40px;">Palace of Roman</td></tr>
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;line-height:1.2;color:#1a1a1a;padding-bottom:20px;">One last step.</td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#3a3328;padding-bottom:28px;">
          Please confirm your email address to complete your subscription. We send a single confirmation so we only ever write to subscribers who truly want to hear from us.
        </td></tr>
        <tr><td align="center" style="padding:8px 0 24px;">
          <a href="${confirmUrl}" style="display:inline-block;background:#1a1a1a;color:#fffaf2;text-decoration:none;font-family:Karla,Helvetica,sans-serif;font-size:13px;letter-spacing:0.24em;text-transform:uppercase;padding:16px 36px;">Confirm subscription</a>
        </td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#7a6a55;padding-bottom:8px;">
          Or copy and paste this link into your browser:
        </td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#3a3328;padding-bottom:36px;word-break:break-all;">
          <a href="${confirmUrl}" style="color:#7a6a55;">${confirmUrl}</a>
        </td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#9c8c70;padding-bottom:8px;">
          If you did not request this, you can safely ignore this email — no subscription will be created.
        </td></tr>
        <tr><td align="center" style="font-family:Karla,Helvetica,sans-serif;font-size:12px;color:#9c8c70;padding:32px 0 0;line-height:1.6;">
          <a href="${SITE}/privacy" style="color:#7a6a55;text-decoration:none;">Privacy Notice</a> &mdash; <a href="${SITE}" style="color:#7a6a55;text-decoration:none;">palaceofromanofficial.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `Confirm your subscription to Palace of Roman.

Please confirm your email address by opening this link:
${confirmUrl}

If you did not request this, you can safely ignore this email — no subscription will be created.

Palace of Roman — ${SITE}
`;

  return { subject, html, text };
}
