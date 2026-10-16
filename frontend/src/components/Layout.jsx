import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './Toast.jsx';
import { BoardControls } from '../lib/theme.jsx';
import Brandmark from './Brandmark.jsx';
import {
  IconChat, IconHome, IconLogout, IconQuiz, IconResume, IconShield, IconTrends, IconUser, IconBrain,
} from './Icons.jsx';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: <IconHome size={18} /> },
  { to: '/intake', label: 'Skill Quiz', icon: <IconQuiz size={18} /> },
  { to: '/chat', label: 'AI Chat', icon: <IconChat size={18} /> },
  { to: '/resume', label: 'Resume', icon: <IconResume size={18} /> },
  { to: '/trends', label: 'Skill Trends', icon: <IconTrends size={18} /> },
  { to: '/profile', label: 'Profile', icon: <IconUser size={18} /> },
];

export default function Layout() {
  const { user, logout, aiInfo } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  /* Light copy deterrent on private pages (it is deterrence, not real DRM -
     the actual protection is the API: no data is ever in the static bundle). */
  useEffect(() => {
    if (!user) return undefined;
    const onCopy = (e) => {
      const selection = window.getSelection()?.toString() ?? '';
      if (!selection) return;
      e.preventDefault();
      toast.info('Copying personal recommendations is disabled on this page.');
    };
    document.addEventListener('copy', onCopy);
    return () => document.removeEventListener('copy', onCopy);
  }, [user, toast]);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out.');
    navigate('/');
  };

  const isPrivate = Boolean(user);
  const links = isPrivate ? NAV : [];

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="topbar">
        <div className="container topbar-inner">
          <Link to={user ? '/dashboard' : '/'} className="brand">
            <Brandmark size={30} />
            <span>
              SkillForge <span className="brand-ai">AI</span>
            </span>
          </Link>

          <nav className="nav-desktop" aria-label="Main">
            {links.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {item.label}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Admin
              </NavLink>
            )}
          </nav>

          {!isPrivate && (
            <div className="nav-desktop">
              <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Sign in
              </NavLink>
              <Link to="/register" className="btn btn-sm btn-primary">
                Create account
              </Link>
            </div>
          )}

          <div className="nav-desktop nav-settings">
            <BoardControls />
          </div>

          {isPrivate && (
            <div className="row" style={{ marginInlineStart: 'auto', gap: '0.5rem' }}>
              <span className="badge badge-brand" title={`Signed in as ${user.email}`}>
                {user.role === 'admin' ? 'Admin' : user.fullName?.split(' ')[0] || 'Member'}
              </span>
              <button type="button" className="btn btn-sm btn-ghost" onClick={handleLogout} title="Sign out">
                <IconLogout size={16} /> <span className="tiny">Exit</span>
              </button>
            </div>
          )}

          <button
            type="button"
            className="burger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            <span />
          </button>
        </div>

        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile">
            {links.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {item.label}
              </NavLink>
            ))}
            {user?.role === 'admin' && <NavLink to="/admin">Admin panel</NavLink>}
            {isPrivate ? (
              <>
                <div className="divider" />
                <div className="stack-sm" style={{ paddingBlock: '1rem' }}>
                  <span className="level">Appearance</span>
                  <BoardControls compact />
                </div>
                <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                  <IconLogout size={16} /> Sign out
                </button>
              </>
            ) : (
              <>
                <div className="divider" />
                <NavLink to="/login">Sign in</NavLink>
                <NavLink to="/register">Create account</NavLink>
              </>
            )}
          </nav>
        )}
      </header>

      <main id="main" className="app-main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} SkillForge AI — EdTech &amp; career advisory platform.</span>
          <span className="row" style={{ gap: '0.5rem' }}>
            <IconShield size={14} />
            <span>
              {aiInfo?.security?.registrationTokenRequired ? 'Code + captcha protected' : 'Protected'} · noindex · no-store
            </span>
          </span>
        </div>
      </footer>
    </div>
  );
}

export { IconBrain };