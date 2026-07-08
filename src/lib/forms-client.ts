/**
 * Progressive form enhancement + lazy Turnstile.
 *
 * Loaded on every page (via BaseLayout) but does almost nothing until a visitor
 * interacts with a form:
 *   - On load: stamps each form's hidden timestamp (for the server timing check).
 *   - On first focus/pointer within a form: injects Turnstile's api.js ONCE and
 *     renders the widget. Visitors who never touch a form pay zero cost.
 *   - On submit: fetches the token, POSTs as FormData, shows an inline result.
 */

interface TurnstileAPI {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  getResponse(id: string): string | undefined;
  reset(id?: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}

const API_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let loadPromise: Promise<TurnstileAPI> | null = null;

function loadTurnstile(): Promise<TurnstileAPI> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<TurnstileAPI>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = API_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => {
      const start = Date.now();
      (function waitForGlobal() {
        if (window.turnstile) return resolve(window.turnstile);
        if (Date.now() - start > 5000) {
          return reject(new Error('Turnstile not ready'));
        }
        setTimeout(waitForGlobal, 50);
      })();
    });
    script.addEventListener('error', () =>
      reject(new Error('Turnstile failed to load')),
    );
    document.head.appendChild(script);
  });

  return loadPromise;
}

type FormKind = { selector: string; success: string; buttonSuccess: string };

const FORM_KINDS: FormKind[] = [
  {
    selector: '[data-contact-form]',
    success: 'Thanks! Your message has been sent.',
    buttonSuccess: 'Sent ✓',
  },
  {
    selector: '[data-volunteer-form]',
    success: "Thanks for signing up! We'll be in touch soon.",
    buttonSuccess: 'Signed up ✓',
  },
  {
    selector: '[data-newsletter-form]',
    success: 'Almost there — check your inbox to confirm.',
    buttonSuccess: 'Subscribed ✓',
  },
];

function stamp(form: HTMLFormElement): void {
  const ts = form.querySelector<HTMLInputElement>('[data-form-timestamp]');
  if (ts) ts.value = String(Date.now());
}

function initForm(form: HTMLFormElement, kind: FormKind): void {
  const slot = form.querySelector<HTMLElement>('.cf-turnstile-slot');
  const statusEl = form.querySelector<HTMLElement>('[data-form-status]');
  const submitBtn = form.querySelector<HTMLButtonElement>(
    'button[type="submit"]',
  );

  stamp(form);

  const originalLabel = submitBtn?.textContent ?? '';
  let revertTimer: ReturnType<typeof setTimeout> | undefined;

  // Flash the submit button into a success state, then restore it.
  function showButtonSuccess(): void {
    const btn = submitBtn;
    if (!btn) return;
    clearTimeout(revertTimer);
    btn.textContent = kind.buttonSuccess;
    btn.classList.add('is-success');
    btn.disabled = true;
    revertTimer = setTimeout(() => {
      btn.textContent = originalLabel;
      btn.classList.remove('is-success');
      btn.disabled = false;
    }, 4000);
  }

  let widgetId: string | null = null;
  let rendering: Promise<void> | null = null;
  let resolveToken: () => void = () => {};
  let tokenReady = new Promise<void>((r) => (resolveToken = r));

  function ensureWidget(): Promise<void> {
    if (rendering) return rendering;
    if (!slot) return Promise.resolve();
    rendering = loadTurnstile()
      .then((ts) => {
        widgetId = ts.render(slot, {
          sitekey: slot.dataset.sitekey,
          callback: () => resolveToken(),
          'expired-callback': () => {
            tokenReady = new Promise<void>((r) => (resolveToken = r));
          },
        });
      })
      .catch(() => {
        rendering = null; // allow a retry on next interaction/submit
      });
    return rendering;
  }

  // Lazy: only fetch Turnstile once the visitor engages the form.
  form.addEventListener('focusin', ensureWidget, { once: true });
  form.addEventListener('pointerdown', ensureWidget, { once: true });

  function setStatus(msg: string, state?: 'error' | 'success'): void {
    if (!statusEl) return;
    statusEl.textContent = msg;
    if (state) statusEl.dataset.state = state;
    else delete statusEl.dataset.state;
  }

  async function getToken(): Promise<string> {
    const ts = window.turnstile;
    if (!ts || !widgetId) return '';
    let token = ts.getResponse(widgetId) ?? '';
    if (token) return token;
    setStatus('Verifying…');
    await Promise.race([tokenReady, new Promise((r) => setTimeout(r, 8000))]);
    token = ts.getResponse(widgetId) ?? '';
    return token;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');

    // Turnstile is presence-gated: the slot only exists when a site key is set.
    // With no slot, submit without a token (honeypot + timing still apply).
    let token = '';
    if (slot) {
      await ensureWidget();
      token = await getToken();
      if (!token) {
        setStatus('Verification is still loading — please try again.', 'error');
        return;
      }
    }

    const data = new FormData(form);
    if (token) data.set('cf-turnstile-response', token);

    if (submitBtn) submitBtn.disabled = true;
    setStatus('Sending…');
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { accept: 'application/json' },
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };
      if (res.ok && payload.ok) {
        form.reset();
        stamp(form);
        setStatus(payload.message || kind.success, 'success');
        showButtonSuccess();
      } else {
        setStatus(
          payload.error || 'Something went wrong. Please try again.',
          'error',
        );
        if (submitBtn) submitBtn.disabled = false;
      }
    } catch {
      setStatus('Network error. Please try again.', 'error');
      if (submitBtn) submitBtn.disabled = false;
    } finally {
      // Note: on success the button stays disabled until showButtonSuccess'
      // timer restores it; only error paths re-enable it above.
      if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
      tokenReady = new Promise<void>((r) => (resolveToken = r));
    }
  });
}

function init(): void {
  for (const kind of FORM_KINDS) {
    document
      .querySelectorAll<HTMLFormElement>(kind.selector)
      .forEach((form) => initForm(form, kind));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
