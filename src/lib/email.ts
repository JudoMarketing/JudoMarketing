import nodemailer from "nodemailer";

/**
 * Emails transaccionales con el diseño de la marca.
 * Salen como "Judo Marketing <info@judomarketing.net>" (alias de Google
 * Workspace) usando SMTP de Gmail. Variables necesarias en Vercel:
 *   SMTP_USER  (la cuenta de Workspace, ej. admin@judomarketing.net)
 *   SMTP_PASS  (App Password de Google, 16 caracteres)
 * Si faltan, el envío se omite silenciosamente (nada se rompe).
 */

const FROM = '"Judo Marketing" <info@judomarketing.net>';
const SITE = "https://judo-marketing.vercel.app";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function brandedEmail({
  title,
  greeting,
  paragraphs,
  ctaLabel,
  ctaUrl,
}: {
  title: string;
  greeting: string;
  paragraphs: string[];
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const body = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;color:#c9c9d4;font-size:14px;line-height:1.6;">${p}</p>`
    )
    .join("");
  const cta =
    ctaLabel && ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px auto 6px;"><tr><td style="border-radius:999px;background:linear-gradient(120deg,#7b2dff,#9a4dff);box-shadow:0 10px 26px -8px rgba(123,45,255,.7);">
          <a href="${ctaUrl}" style="display:inline-block;padding:13px 34px;color:#ffffff;font-weight:700;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;">${ctaLabel}</a>
        </td></tr></table>`
      : "";

  return `<!doctype html><html><body style="margin:0;padding:0;background-color:#0b0b12;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0b12;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#11111a;border:1px solid #3a2a5e;border-radius:18px;padding:36px 30px;font-family:Arial,Helvetica,sans-serif;">
        <tr><td align="center" style="padding-bottom:18px;">
          <img src="${SITE}/brand/logo-white-transparent.png" width="72" height="72" alt="Judo Marketing" style="display:block;" />
        </td></tr>
        <tr><td align="center">
          <h1 style="margin:0 0 6px;color:#f5f5f7;font-size:22px;">${title}</h1>
          <p style="margin:0 0 20px;color:#a855f7;font-size:14px;font-weight:bold;">${greeting}</p>
        </td></tr>
        <tr><td>${body}</td></tr>
        <tr><td align="center">${cta}</td></tr>
        <tr><td align="center" style="padding-top:26px;border-top:1px solid #26263a;">
          <p style="margin:14px 0 0;color:#6b6b7a;font-size:11px;line-height:1.6;">
            Judo Marketing · 66 W Flagler St Suite 900 PMB 11674, Miami, FL 33130<br/>
            <a href="https://www.judomarketing.net" style="color:#a855f7;text-decoration:none;">www.judomarketing.net</a> · +1 305 934 9981
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendBrandedEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({ from: FROM, to, subject, html });
  return true;
}
