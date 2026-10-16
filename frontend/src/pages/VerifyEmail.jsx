import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Alert, Spinner } from '../components/ui.jsx';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState('pending');
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setState('error');
      setError('This verification link is missing its token.');
      return;
    }
    api
      .verifyEmail({ token })
      .then(() => setState('ok'))
      .catch((err) => {
        setState('error');
        setError(err.message);
      });
  }, [token]);

  return (
    <div className="card auth-card center">
      <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>E-mail verification</h1>
      {state === 'pending' ? <Spinner label="Confirming your account…" /> : null}
      {state === 'ok' ? (
        <>
          <Alert tone="ok">Your e-mail is verified. Your account is fully active.</Alert>
          <Link to="/dashboard" className="btn btn-primary btn-block">
            Continue to dashboard
          </Link>
        </>
      ) : null}
      {state === 'error' ? (
        <>
          <Alert tone="error">{error}</Alert>
          <Link to="/dashboard" className="btn btn-block">
            Go to dashboard
          </Link>
        </>
      ) : null}
    </div>
  );
}