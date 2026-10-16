import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import Captcha from '../components/Captcha.jsx';
import { Alert } from '../components/ui.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const [sent, setSent] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api.forgotPassword({ email: email.trim().toLowerCase(), captchaToken });
      setSent(true);
      setPreview(data.emailPreview ?? null);
    } catch (err) {
      setError(err.message);
      setCaptchaToken(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card auth-card">
      <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>Reset your password</h1>
      <p className="muted">Enter your e-mail and we will send a one-time reset link that expires in 30 minutes.</p>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {sent ? (
        <Alert tone="ok">
          If that e-mail is registered, a reset link is on its way.
          {preview?.resetToken ? (
            <div className="code-box" style={{ marginTop: '0.6rem' }}>
              Demo mode link: /reset-password?token={preview.resetToken}
            </div>
          ) : null}
        </Alert>
      ) : null}

      {!sent && (
        <form className="stack" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="email">E-mail address</label>
            <input id="email" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Captcha purpose="register" token={captchaToken} onToken={setCaptchaToken} />
          <button className="btn btn-primary btn-block" type="submit" disabled={busy || !captchaToken}>
            {busy ? <span className="spinner" /> : null} Send reset link
          </button>
        </form>
      )}

      <p className="tiny center" style={{ marginTop: '1rem' }}>
        <Link to="/login">Back to sign in</Link>
      </p>
    </div>
  );
}