// Editorial welcome email for newsletter signups.
// Matches cart-recovery aesthetic: cream canvas, Cormorant headings, Karla body.

const SITE = "https://palaceofromanofficial.com";

export function renderWelcomeEmail(): { subject: string; html: string; text: string } {
  const subject = "Welcome to Palace of Roman";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f3ec;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ec;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fffaf2;padding:56px 40px;max-width:560px;">
        <tr><td align="center" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:14px;letter-spacing:0.4em;color:#7a6a55;text-transform:uppercase;padding-bottom:40px;">Palace of Roman</td></tr>
        <tr><td style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;line-height:1.2;color:#1a1a1a;padding-bottom:20px;">Welcome to the dispatch.</td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#3a3328;padding-bottom:24px;">
          Thank you for joining us. You'll be among the first to receive new arrivals, private editorials, and quiet notes from the atelier &mdash; nothing more, nothing less.
        </td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#3a3328;padding-bottom:32px;">
          Palace of Roman curates a considered selection of pieces from the world's defining maisons. Every item is 100% authentic, sourced from the brands or their authorised distributors.
        </td></tr>
        <tr><td align="center" style="padding:8px 0 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid #d8c9ad;background:#fffaf2;">
            <tr><td align="center" style="padding:22px 36px;">
              <div style="font-family:Karla,Helvetica,sans-serif;font-size:11px;letter-spacing:0.32em;color:#7a6a55;text-transform:uppercase;padding-bottom:10px;">A welcome from us</div>
              <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;letter-spacing:0.16em;color:#1a1a1a;padding-bottom:8px;">ROMAN10</div>
              <div style="font-family:Karla,Helvetica,sans-serif;font-size:13px;color:#3a3328;line-height:1.6;">10% off your first order &middot; one use per client</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:0 0 24px;">
          <a href="${SITE}/shop" style="display:inline-block;background:#1a1a1a;color:#fffaf2;text-decoration:none;font-family:Karla,Helvetica,sans-serif;font-size:13px;letter-spacing:0.24em;text-transform:uppercase;padding:16px 36px;">Explore the collection</a>
        </td></tr>
        <tr><td style="font-family:Karla,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:#5a5040;padding:8px 0 0;font-style:italic;" align="center">
          A quiet word &mdash; share Palace of Roman with friends and family, and we'll thank you with a further private discount on your next piece. Simply reply to this email once they've placed their first order.
        </td></tr>
        <tr><td align="center" style="font-family:Karla,Helvetica,sans-serif;font-size:12px;color:#9c8c70;padding:40px 0 0;line-height:1.6;">
          <a href="${SITE}/privacy" style="color:#7a6a55;text-decoration:none;">Privacy Notice</a> &mdash; you may unsubscribe at any time.
        </td></tr>
        <tr><td align="center" style="font-family:Karla,Helvetica,sans-serif;font-size:12px;color:#9c8c70;padding:8px 0 0;line-height:1.6;">
          <a href="${SITE}" style="color:#7a6a55;text-decoration:none;">palaceofromanofficial.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `Welcome to Palace of Roman.

Thank you for joining us. You'll be among the first to receive new arrivals, private editorials, and quiet notes from the atelier.

A welcome from us: use code ROMAN10 for 10% off your first order (one use per client).

Explore the collection: ${SITE}/shop

Palace of Roman — ${SITE}
`;

  return { subject, html, text };
}
