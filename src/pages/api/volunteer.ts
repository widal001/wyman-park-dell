import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  checkSpam,
  escapeHtml,
  field,
  isValidEmail,
  json,
} from '../../lib/form-utils';
import { sendEmail } from '../../lib/email';

// On-demand (SSR) route; everything else in the site stays prerendered.
export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Invalid submission.' }, 400);
  }

  const ip = clientAddress ?? request.headers.get('cf-connecting-ip');
  const spam = await checkSpam(form, env, ip);
  if (!spam.pass) {
    if (spam.silent) return json({ ok: true });
    return json(
      { ok: false, error: 'Verification failed. Please try again.' },
      400,
    );
  }

  const name = field(form, 'name', 150);
  const email = field(form, 'email', 254);
  const phone = field(form, 'phone', 40);
  const message = field(form, 'message', 5000);

  if (!name || !isValidEmail(email)) {
    return json(
      { ok: false, error: 'Please provide your name and a valid email.' },
      400,
    );
  }

  try {
    await sendEmail(
      {
        subject: `New volunteer sign-up from ${name}`,
        replyTo: { name, email },
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          phone ? `Phone: ${phone}` : null,
          message ? `\n${message}` : null,
        ]
          .filter((l) => l !== null)
          .join('\n'),
        html: `
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
          ${message ? `<p><strong>Message:</strong></p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>` : ''}
        `,
      },
      env,
    );
  } catch (err) {
    console.error('[volunteer] email send failed:', err);
    return json(
      {
        ok: false,
        error: 'Could not send your sign-up. Please email us directly.',
      },
      502,
    );
  }

  return json({ ok: true });
};
