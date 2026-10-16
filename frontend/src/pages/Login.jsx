import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Captcha from '../components/Captcha.jsx';
import StrandGame from '../components/StrandGame.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { Alert } from '../components/ui.jsx';
import { IconKey, IconLock, IconShield } from '../components/Icons.jsx';

const CAPTCHA_AFTER = 5;

export default function Login() {
  const { login, user, aiInfo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(CAPTCHA_AFTER);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const threshold = aiInfo?.security?.captchaAfterAttempts ?? CAPTCHA_AFTER;

  /* Ask the server whether this e-mail needs a captcha (it decides, not the UI). */
  const checkStatus = async (value) => {
    if (!value || !value.includes('@')) return;
    try {
      const status = await api.loginStatus(value.trim());
      setCaptchaRequired(status.captchaRequired);
      setAttemptsLeft(status.attemptsUntilCaptcha);
      setLockedUntil(status.lockedUntil);
    } catch {
      /* status is advisory only */
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const signedIn = await login({ email: email.trim().toLowerCase(), password, captchaToken, website: honeypot });
      toast.success(`Welcome back, ${signedIn.fullName?.split(' ')[0] || 'friend'}!`);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setCaptchaToken(null);
      const details = err.details;
      if (typeof details?.failedAttempts === 'number') {
        setAttemptsLeft(Math.max(0, threshold - details.failedAttempts));
        if (details.captchaRequired) setCaptchaRequired(true);
      }
      checkStatus(email);
      // A failed attempt invalidates any solved captcha: force a new one.
      setCaptchaRequired((prev) => prev || err.code === 'captcha_invalid');
    } finally {
      setBusy(false);
    }
  };

  const usedAttempts = Math.max(0, threshold - attemptsLeft);
  const isLocked = lockedUntil && new Date(lockedUntil).getTime() > Date.now();

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)' }}>Welcome back</h1>
        <p className="muted">Sign in to your dashboard, AI advisor and resume builder.</p>

        {error ? <Alert tone="error">{error}</Alert> : null}
        {isLocked ? <Alert tone="warn">This account is temporarily locked after too many failed attempts. Try again in a few minutes.</Alert> : null}

        <form className="stack" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="email">E-mail address</label>
            <input
              id="email"
              name="email"
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => checkStatus(email)}
            />
          </div>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          {/* Honeypot: hidden from people, irresistible to bots. */}
          <div className="hp-field" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>

          {/* Captcha appears only after LOGIN_CAPTCHA_AFTER (default 5) failures. */}
          {captchaRequired ? (
            <Captcha purpose="login" token={captchaToken} onToken={setCaptchaToken} />
          ) : (
            <div className="alert alert-info row" style={{ justifyContent: 'space-between' }}>
              <span className="tiny">
                <IconShield size={14} /> Captcha unlocks after {threshold} failed attempts — {attemptsLeft} left.
              </span>
              <span className="attempt-meter" aria-label={`${usedAttempts} failed attempts`}>
                {Array.from({ length: threshold }).map((_, i) => (
                  <i key={i} className={`attempt-dot ${i < usedAttempts ? (i >= threshold - 2 ? 'hot' : 'on') : ''}`} />
                ))}
              </span>
            </div>
          )}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy || isLocked}>
            {busy ? <span className="spinner" /> : null}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="row-between tiny">
            <Link to="/forgot-password">Forgot your password?</Link>
            <Link to="/register">Need an account?</Link>
          </div>
        </form>
      </div>

      <aside className="auth-aside">
        <StrandGame compact />

        <div className="card">
          <h3>
            <IconKey size={18} /> Account access
          </h3>
          <ul className="auth-list">
            <li>
              <span className="tick">✓</span> <span>Sign-in is rate limited per e-mail and IP.</span>
            </li>
            <li>
              <span className="tick">✓</span> <span>A captcha is required from attempt {threshold + 1} onwards.</span>
            </li>
            <li>
              <span className="tick">✓</span> <span>10 failed attempts locks the account for 15 minutes.</span>
            </li>
            <li>
              <span className="tick">✓</span> <span>Sessions use short-lived access tokens with rotating refresh tokens.</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
