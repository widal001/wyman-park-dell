/**
 * Mailchimp Marketing API — newsletter subscribe.
 *
 * We POST a new member with status `pending` (double opt-in: Mailchimp emails
 * the person a confirmation link). Using POST /members avoids needing an MD5 of
 * the email (which the PUT-upsert path requires and Workers' crypto can't do
 * natively). An already-subscribed address returns 400 "Member Exists", which
 * we treat as success so the visitor sees a friendly result either way.
 *
 * Auth is HTTP Basic: any username + the API key as the password.
 */

export type SubscribeInput = { email: string; name?: string };
export type SubscribeResult = { ok: boolean; already?: boolean };

export async function subscribe(
  input: SubscribeInput,
  env: Env,
): Promise<SubscribeResult> {
  const url = `https://${env.MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${env.MAILCHIMP_AUDIENCE_ID}/members`;

  const merge_fields: Record<string, string> = {};
  const name = (input.name ?? '').trim();
  if (name) {
    const [first, ...rest] = name.split(/\s+/);
    merge_fields.FNAME = first;
    if (rest.length) merge_fields.LNAME = rest.join(' ');
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Basic ${btoa(`anystring:${env.MAILCHIMP_API_KEY}`)}`,
    },
    body: JSON.stringify({
      email_address: input.email,
      status: 'pending',
      merge_fields,
    }),
  });

  if (res.ok) return { ok: true };

  const data = (await res.json().catch(() => null)) as {
    title?: string;
  } | null;
  if (res.status === 400 && /member exists/i.test(data?.title ?? '')) {
    return { ok: true, already: true };
  }
  // Log status + title only — the full body's `detail` can echo a submitter's
  // email address, and we don't want PII in logs.
  console.error('[mailchimp] subscribe failed:', res.status, data?.title);
  return { ok: false };
}
