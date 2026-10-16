import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { IconRefresh, IconShield } from './Icons.jsx';

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Load Cloudflare's script once; resolves when window.turnstile is ready. */
let turnstileLoader = null;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileLoader) return turnstileLoader;

  turnstileLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile failed to load')));
    script.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(script);
  });

  return turnstileLoader;
}

/**
 * CAPTCHA widget - renders Cloudflare Turnstile or the built-in image
 * challenge, depending on what the API reports.
 *
 * Both paths hand the parent the same thing: a `captchaToken` to submit with
 * the form, or null once it has been invalidated. The browser never receives
 * the Turnstile secret key - only the public site key, and only the server can
 * verify a token.
 */
export default function Captcha({ purpose = 'login', token, onToken, onError }) {
  const [provider, setProvider] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('loading'); // loading | idle | solving | solved | error
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);
  const widgetRef = useRef(null);   // Cloudflare widget id
  const mountRef = useRef(null);    // Cloudflare container element

  /* ------------------------------------------------------------ turnstile */
  const mountTurnstile = useCallback(
    async (siteKey) => {
      setStatus('loading');
      try {
        const turnstile = await loadTurnstile();
        if (!mountRef.current) return;

        // Clear any previous widget before drawing a new one.
        if (widgetRef.current != null) {
          try { turnstile.remove(widgetRef.current); } catch { /* already gone */ }
          widgetRef.current = null;
        }

        widgetRef.current = turnstile.render(mountRef.current, {
          sitekey: siteKey,
          action: purpose,          // server checks this matches the endpoint
          theme: 'dark',
          size: 'flexible',
          callback: (value) => {
            onToken?.(value);
            setStatus('solved');
            setMessage('');
          },
          'expired-callback': () => {
            onToken?.(null);
            setStatus('idle');
            setMessage('The check expired. Solve it again.');
          },
          'error-callback': () => {
            onToken?.(null);
            setStatus('error');
            setMessage('The security check could not be loaded. Refresh and try again.');
          },
        });
        setStatus('idle');
      } catch (err) {
        setStatus('error');
        setMessage('The security check could not be loaded. Check your connection.');
        onError?.(err);
      }
    },
    [purpose, onToken, onError],
  );

  /* -------------------------------------------------------- built-in path */
  const load = useCallback(async () => {
    setStatus('loading');
    setAnswer('');
    onToken?.(null);
    try {
      const data = await api.captcha(purpose);
      setProvider(data.provider ?? 'builtin');

      if (data.provider === 'turnstile') {
        await mountTurnstile(data.siteKey);
        return;
      }

      setChallenge(data);
      setStatus('idle');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
      onError?.(err);
    }
  }, [purpose, onToken, onError, mountTurnstile]);

  useEffect(() => {
    load();
  }, [load]);

  // Tear the widget down when the form unmounts.
  useEffect(
    () => () => {
      if (widgetRef.current != null && window.turnstile) {
        try { window.turnstile.remove(widgetRef.current); } catch { /* noop */ }
        widgetRef.current = null;
      }
    },
    [],
  );

  const verify = async () => {
    if (answer.trim().length < 4) {
      setMessage('Type the code exactly as shown.');
      inputRef.current?.focus();
      return;
    }
    setStatus('solving');
    try {
      const data = await api.verifyCaptcha({ captchaId: challenge.captchaId, answer: answer.trim(), purpose });
      onToken?.(data.captchaToken);
      setStatus('solved');
      setMessage('Verified.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Incorrect code.');
      load(); // fresh challenge, the old one is burnt
    }
  };

  /* --------------------------------------------------------------- render */
  return (
    <div className="captcha-box">
      <div className="captcha-head">
        <strong>
          <IconShield size={15} /> Security check
        </strong>
        {provider === 'builtin' ? (
          <button type="button" className="btn btn-sm btn-ghost" onClick={load} disabled={status === 'loading'}>
            <IconRefresh size={14} /> New code
          </button>
        ) : (
          <span className="tiny muted">Powered by Cloudflare Turnstile</span>
        )}
      </div>

      {provider === 'turnstile' ? (
        <div ref={mountRef} style={{ minHeight: 65 }} />
      ) : (
        <div className="captcha-actions">
          {challenge ? (
            <img className="captcha-img" src={challenge.image} alt="Captcha challenge" draggable="false" />
          ) : (
            <div className="skeleton" style={{ width: 220, height: 70 }} />
          )}
          <div className="stack-sm" style={{ flex: 1, minWidth: 140 }}>
            <input
              ref={inputRef}
              className="input"
              style={{ textTransform: 'uppercase', letterSpacing: '0.35em', fontFamily: 'var(--mono)' }}
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
              maxLength={challenge?.length ?? 5}
              placeholder={challenge ? '•'.repeat(challenge.length) : 'Loading'}
              value={answer}
              aria-label="Captcha code"
              aria-invalid={status === 'error'}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
            />
            <button type="button" className="btn btn-sm btn-primary" onClick={verify} disabled={status === 'solving' || !challenge}>
              {status === 'solving' ? <span className="spinner" /> : 'Verify code'}
            </button>
          </div>
        </div>
      )}

      <p className="tiny" style={{ margin: 0 }}>
        {status === 'solved' ? (
          <span style={{ color: 'var(--ok)' }}>✓ Security check passed — you can submit now.</span>
        ) : message ? (
          <span className="hint-danger">{message}</span>
        ) : provider === 'turnstile' ? (
          <span className="muted">Cloudflare checks for automated abuse without tracking you.</span>
        ) : (
          <span className="muted">Images are generated by our own server and expire in 3 minutes.</span>
        )}
      </p>
      {token ? <span className="sr-only">Captcha token issued</span> : null}
    </div>
  );
}