import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, refreshSession, tokenStore } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [aiInfo, setAiInfo] = useState(null);

  /* Restore the session on first paint (silent refresh, no redirect flash). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (tokenStore.refresh) {
          const session = await refreshSession();
          if (!cancelled && session?.user) setUser(session.user);
          else if (!cancelled) tokenStore.clear();
        }
      } catch {
        tokenStore.clear();
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Public server info (AI engine + security policy) for the UI. */
  useEffect(() => {
    api
      .meta()
      .then((meta) => setAiInfo(meta))
      .catch(() => setAiInfo(null));
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await api.login(credentials);
    tokenStore.save(data);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.register(payload);
    tokenStore.save(data);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.refresh;
    try {
      if (refreshToken) await api.logout({ refreshToken });
    } catch {
      /* logging out locally is what matters */
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, booting, aiInfo, login, register, logout, setUser, isAdmin: user?.role === 'admin' }),
    [user, booting, aiInfo, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}