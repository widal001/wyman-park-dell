/**
 * Email delivery — the single choke point for outbound mail.
 *
 * Today this sends through Gmail SMTP (an App Password on the FWPD Google
 * account) via `worker-mailer`, which speaks SMTP over Cloudflare's socket API
 * (Nodemailer does not run on Workers). Because everything funnels through
 * `sendEmail`, swapping to Cloudflare Email Routing or Resend later — once
 * wymanparkdell.org is set up — touches only this file.
 */
import { WorkerMailer } from 'worker-mailer';

export type OutboundEmail = {
  subject: string;
  text: string;
  html?: string;
  /** Set to the form submitter so a plain "Reply" in Gmail reaches them. */
  replyTo?: { name?: string; email: string };
};

export async function sendEmail(msg: OutboundEmail, env: Env): Promise<void> {
  const port = Number(env.SMTP_PORT || '587');

  await WorkerMailer.send(
    {
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465, // implicit TLS on 465
      startTls: port !== 465, // STARTTLS upgrade on 587
      credentials: { username: env.SMTP_USER, password: env.SMTP_PASS },
      authType: ['plain', 'login'],
    },
    {
      from: { name: 'FWPD Website', email: env.MAIL_FROM },
      to: { email: env.MAIL_TO },
      reply: msg.replyTo,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    },
  );
}
