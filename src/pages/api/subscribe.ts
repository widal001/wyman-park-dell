import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { checkSpam, field, isValidEmail, json } from '../../lib/form-utils';
import { subscribe } from '../../lib/mailchimp';

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

  const email = field(form, 'email', 254);
  const name = field(form, 'name', 150);

  if (!isValidEmail(email)) {
    return json(
      { ok: false, error: 'Please enter a valid email address.' },
      400,
    );
  }

  try {
    const result = await subscribe({ email, name }, env);
    if (!result.ok) {
      return json(
        {
          ok: false,
          error: 'Could not sign you up right now. Please try again later.',
        },
        502,
      );
    }
    return json({
      ok: true,
      message: result.already
        ? "You're already on the list — thanks!"
        : 'Almost there! Check your inbox to confirm your subscription.',
    });
  } catch (err) {
    console.error('[subscribe] mailchimp request failed:', err);
    return json(
      {
        ok: false,
        error: 'Could not sign you up right now. Please try again later.',
      },
      502,
    );
  }
};
