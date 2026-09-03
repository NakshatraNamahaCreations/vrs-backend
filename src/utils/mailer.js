import nodemailer from "nodemailer";

/**
 * Lazily-built SMTP transport. Cached per warm serverless container so the
 * TLS handshake happens once per cold start instead of per email.
 *
 * Configuration is via env vars:
 *   SMTP_HOST, SMTP_PORT (defaults to 587), SMTP_USER, SMTP_PASS
 *   MAIL_FROM  — the "From" header (defaults to a generic no-reply)
 *
 * If SMTP isn't configured we log a warning and no-op instead of throwing,
 * so a missing config never breaks the order/payment flow.
 */
let cached;

function getTransport() {
  if (cached) return cached;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // implicit TLS for 465, STARTTLS for 587
    auth: { user, pass },
  });
  return cached;
}

export async function sendMail({ to, subject, html, text }) {
  if (!to) return { skipped: true, reason: "no recipient" };

  const transport = getTransport();
  if (!transport) {
    console.warn(
      `[mailer] SMTP not configured — email to ${to} NOT sent. Subject: "${subject}"`
    );
    return { skipped: true, reason: "smtp not configured" };
  }

  const from =
    process.env.MAIL_FROM ||
    `"VRS Water Purifiers" <no-reply@vrswaterpurifiers.in>`;

  const info = await transport.sendMail({ from, to, subject, html, text });
  return { messageId: info.messageId };
}
