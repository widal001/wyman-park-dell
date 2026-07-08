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
    // Honeypot hit → pretend success so bots learn nothing.
    if (spam.silent) return json({ ok: true });
    return json(
      { ok: false, error: 'Verification failed. Please try again.' },
      400,
    );
  }

  const firstName = field(form, 'first_name', 100);
  const lastName = field(form, 'last_name', 100);
  const email = field(form, 'email', 254);
  const interest = field(form, 'interest', 100);
  const message = field(form, 'message', 5000);

  if (!firstName || !lastName || !isValidEmail(email) || !message) {
    return json(
      { ok: false, error: 'Please fill in all required fields.' },
      400,
    );
  }

  const fullName = `${firstName} ${lastName}`;
  try {
    await sendEmail(
      {
        subject: `New contact form message from ${fullName}`,
        replyTo: { name: fullName, email },
        text: [
          `Name: ${fullName}`,
          `Email: ${email}`,
          interest ? `Interested in: ${interest}` : null,
          '',
          message,
        ]
          .filter((l) => l !== null)
          .join('\n'),
        html: `
          <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          ${interest ? `<p><strong>Interested in:</strong> ${escapeHtml(interest)}</p>` : ''}
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        `,
      },
      env,
    );
  } catch (err) {
    console.error('[contact] email send failed:', err);
    return json(
      {
        ok: false,
        error: 'Could not send your message. Please email us directly.',
      },
      502,
    );
  }

  return json({ ok: true });
};
