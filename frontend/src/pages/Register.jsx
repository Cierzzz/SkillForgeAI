import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Captcha from '../components/Captcha.jsx';
import StrandGame from '../components/StrandGame.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { Alert, Spinner } from '../components/ui.jsx';
import {
  IconCheck,
  IconKey,
  IconShield,
} from '../components/Icons.jsx';

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    signupToken: '',
    acceptTerms: false });
  const [honeypot, setHoneypot] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);
  const [codeState, setCodeState] = useState({ status: 'idle', message: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  /* Validate the registration code as the student types it. */
  useEffect(() => {
    const code = form.signupToken.trim();
    if (code.length < 6) {
      setCodeState({ status: 'idle', message: '' });
      return undefined;
    }
    let cancelled = false;
    setCodeState({ status: 'checking', message: 'Checking code…' });
    const timer = setTimeout(async () => {
      try {
        const result = await api.validateSignupToken(code);
        if (cancelled) return;
        setCodeState(
          result.valid
            ? { status: 'valid', message: `Valid code · ${result.label || result.role} · ${result.remainingUses} use(s) left` }
            : { status: 'invalid', message: result.reason },
        );
      } catch {
        if (!cancelled) setCodeState({ status: 'invalid', message: 'Could not verify that code.' });
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.signupToken]);

  const validate = () => {
    const next = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid e-mail address.';
    if (form.password.length < 10) next.password = 'Use at least 10 characters.';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.';
    if (form.signupToken.trim().length < 6) next.signupToken = 'A registration code is required.';
    if (!form.acceptTerms) next.acceptTerms = 'Please accept the terms.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setBusy(true);
    try {
      const data = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        signupToken: form.signupToken.trim(),
        captchaToken,
        acceptTerms: true,
        website: honeypot });
      toast.success('Account created. Welcome to SkillForge AI!');
      if (data.emailPreview?.verificationToken) {
        toast.info(`Demo mode: verify your e-mail with token ${data.emailPreview.verificationToken}`);
      }
      navigate('/intake', { replace: true });
    } catch (err) {
      setError(err.message);
      if (err.code === 'captcha_invalid' || err.code === 'captcha_replay') setCaptchaToken(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginTop: '0.75rem' }}>Create your account</h1>
        <p className="muted">Every new account needs a valid registration code and a captcha.</p>

        {error ? <Alert tone="error">{error}</Alert> : null}

        <form className="stack" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" className="input" autoComplete="name" required value={form.fullName} onChange={update('fullName')} />
            {errors.fullName ? <span className="hint hint-danger">{errors.fullName}</span> : null}
          </div>

          <div className="field">
            <label htmlFor="email">E-mail address</label>
            <input id="email" className="input" type="email" autoComplete="email" required value={form.email} onChange={update('email')} />
            {errors.email ? <span className="hint hint-danger">{errors.email}</span> : null}
          </div>

          <PasswordField id="password" label="Password" value={form.password} onChange={update('password')} autoComplete="new-password" showMeter error={errors.password} />
          <PasswordField id="confirmPassword" label="Confirm password" value={form.confirmPassword} onChange={update('confirmPassword')} autoComplete="new-password" error={errors.confirmPassword} />

          <div className="field">
            <label htmlFor="signupToken">Registration code</label>
            <input
              id="signupToken"
              className="input mono"
              placeholder="SKILLFORGE-XXXX-XXXX"
              autoComplete="off"
              spellCheck="false"
              value={form.signupToken}
              onChange={(e) => setForm((f) => ({ ...f, signupToken: e.target.value.toUpperCase() }))}
              aria-invalid={codeState.status === 'invalid' ? 'true' : undefined}
            />
            {errors.signupToken ? (
              <span className="hint hint-danger">{errors.signupToken}</span>
            ) : codeState.status === 'checking' ? (
              <span className="hint row" style={{ gap: '0.4rem' }}>
                <Spinner label="Checking code…" />
              </span>
            ) : codeState.status === 'valid' ? (
              <span className="hint" style={{ color: 'var(--ok)' }}>
                <IconCheck size={13} /> {codeState.message}
              </span>
            ) : codeState.status === 'invalid' ? (
              <span className="hint hint-danger">{codeState.message}</span>
            ) : (
              <span className="hint">Ask your school or class adviser for your code.</span>
            )}
          </div>

          <div className="hp-field" aria-hidden="true">
            <label htmlFor="company">Company</label>
            <input id="company" name="company_url" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>

          {/* Sign-up always requires the captcha. */}
          <Captcha purpose="register" token={captchaToken} onToken={setCaptchaToken} />

          <label className="checkbox">
            <input type="checkbox" checked={form.acceptTerms} onChange={(e) => setForm((f) => ({ ...f, acceptTerms: e.target.checked }))} />
            <span>
              I agree to the terms of use and understand my profile data is stored to generate personal recommendations.
            </span>
          </label>
          {errors.acceptTerms ? <span className="hint hint-danger">{errors.acceptTerms}</span> : null}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy || !captchaToken}>
            {busy ? <span className="spinner" /> : null}
            {busy ? 'Creating your account…' : 'Create account'}
          </button>

          <p className="tiny center" style={{ marginBottom: 0 }}>
            Already registered? <Link to="/login">Sign in instead</Link>
          </p>
        </form>
      </div>

      <aside className="auth-aside">
        <StrandGame compact />
        <div className="card">
          <h3>
            <IconShield size={18} /> Why a code?
          </h3>
          <p>
            SkillForge is deployed for schools and programmes. A registration code keeps sign-ups controlled so nobody can
            flood the platform or harvest the AI quota.
          </p>
          <ul className="auth-list">
            <li><span className="tick">✓</span> <span>Codes are single-use or limited-use, with an expiry date.</span></li>
            <li><span className="tick">✓</span> <span>Registration is rate limited to 5 attempts per hour per e-mail/IP.</span></li>
            <li><span className="tick">✓</span> <span>A captcha is required for every single registration.</span></li>
            <li><span className="tick">✓</span> <span>Admins can revoke a code instantly from the admin panel.</span></li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
