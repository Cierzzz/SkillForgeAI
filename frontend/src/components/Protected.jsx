import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Gate for private pages. Redirects to /login and remembers where you wanted to go. */
export default function Protected({ children, adminOnly = false }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

/**
 * Wraps private screens with a per-user watermark.
 * If content ever leaks (a screenshot, a print, a copy-paste) it can be traced
 * back to the exact account it came from.
 */
export function Guarded({ children, className = '' }) {
  const { user } = useAuth();
  const stamp = user ? `${user.email} · ${user.id.slice(0, 8)}` : '';
  return (
    <div className={`protected ${className}`} data-watermark={stamp}>
      {children}
    </div>
  );
}