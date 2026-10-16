import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import PasswordField from '../components/PasswordField.jsx';
import { Alert } from '../components/ui.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword({ token, password });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card auth-card">
      <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>Choose a new password</h1>
      {token ? (
        <p className="muted">Your one-time reset token was found. Pick a strong password to finish.</p>
      ) : (
        <Alert tone="error">This link is missing its token. Request a new reset link.</Alert>
      )}

      {error ? <Alert tone="error">{error}</Alert> : null}

      <form className="stack" onSubmit={submit} noValidate>
        <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} autoComplete="new-password" showMeter />
        <PasswordField id="confirm-password" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        <button className="btn btn-primary btn-block" type="submit" disabled={busy || !token}>
          {busy ? <span className="spinner" /> : null} Update password
        </button>
      </form>

      <p className="tiny center" style={{ marginTop: '1rem' }}>
        <Link to="/login">Back to sign in</Link>
      </p>
    </div>
  );
}