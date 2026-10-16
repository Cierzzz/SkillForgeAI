/**
 * The ONLY place the frontend talks to the outside world.
 *
 * Security notes (why this file is short and boring on purpose):
 *  - there is no database key, no AI key and no admin secret in the bundle;
 *  - the access token lives in memory (and sessionStorage so a refresh keeps you
 *    signed in) and is never written to localStorage;
 *  - every call carries X-Client-App so the backend can reject non-browser clients.
 */

export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:8080/api')
).replace(/\/$/, '');
const CLIENT_HEADER = { 'X-Client-App': 'skillforge-web' };

const ACCESS_KEY = 'sf.access';
const REFRESH_KEY = 'sf.refresh';

let accessToken = sessionStorage.getItem(ACCESS_KEY) || null;
let refreshPromise = null;

const listeners = new Set();
export const onSessionChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const emit = (user) => listeners.forEach((fn) => fn(user));

export const tokenStore = {
  get access() {
    return accessToken;
  },
  get refresh() {
    return sessionStorage.getItem(REFRESH_KEY);
  },
  save({ accessToken: access, refreshToken: refresh }) {
    accessToken = access ?? null;
    if (access) sessionStorage.setItem(ACCESS_KEY, access);
    if (refresh) sessionStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    accessToken = null;
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function parse(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function raw(path, { method = 'GET', body, headers = {}, signal, auth = true } = {}) {
  const finalHeaders = {
    ...CLIENT_HEADER,
    Accept: 'application/json',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal,
    credentials: 'omit',
    cache: 'no-store',
    referrerPolicy: 'no-referrer',
    mode: 'cors',
  });

  const payload = await parse(res);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      payload?.error?.code ?? 'request_failed',
      payload?.error?.message ?? `Request failed (${res.status})`,
      payload?.error?.details,
    );
  }
  return payload;
}

/** Single-flight refresh so five parallel 401s trigger one refresh, not five. */
async function refreshSession() {
  if (!refreshPromise) {
    const refreshToken = tokenStore.refresh;
    if (!refreshToken) return null;
    refreshPromise = raw('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      auth: false,
    })
      .then((data) => {
        tokenStore.save(data);
        emit(data.user);
        return data;
      })
      .catch(() => {
        tokenStore.clear();
        emit(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request(path, options = {}, retried = false) {
  try {
    return await raw(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !retried && tokenStore.refresh && options.auth !== false) {
      const refreshed = await refreshSession();
      if (refreshed) return request(path, options, true);
    }
    throw err;
  }
}

/* ------------------------------------------------------------------ endpoints */
export const api = {
  /* health / config */
  meta: () => request('/meta', { auth: false }),
  health: () => request('/health', { auth: false }),

  /* auth */
  captcha: (purpose = 'login') => request(`/auth/captcha?purpose=${purpose}`, { auth: false }),
  verifyCaptcha: (payload) => request('/auth/captcha/verify', { method: 'POST', body: payload, auth: false }),
  validateSignupToken: (code) => request(`/auth/signup-token/validate?code=${encodeURIComponent(code)}`, { auth: false }),
  loginStatus: (email) => request(`/auth/login-status?email=${encodeURIComponent(email)}`, { auth: false }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  logout: (payload) => request('/auth/logout', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
  forgotPassword: (payload) => request('/auth/forgot-password', { method: 'POST', body: payload, auth: false }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: payload, auth: false }),
  verifyEmail: (payload) => request('/auth/verify-email', { method: 'POST', body: payload, auth: false }),
  changePassword: (payload) => request('/auth/change-password', { method: 'POST', body: payload }),

  /* profile */
  profile: () => request('/profile'),
  saveProfile: (payload) => request('/profile', { method: 'PUT', body: payload }),
  saveSkills: (payload) => request('/profile/skills', { method: 'PUT', body: payload }),

  /* catalog + assessment */
  intakeCatalog: () => request('/catalog/intake'),
  catalog: () => request('/catalog/all'),
  quiz: () => request('/assessment/quiz'),
  assessments: () => request('/assessment'),
  submitAssessment: (payload) => request('/assessment', { method: 'POST', body: payload }),
  recommendations: () => request('/assessment/recommendations'),

  /* chat */
  chatSessions: () => request('/chat/sessions'),
  chatSession: (id) => request(`/chat/sessions/${id}`),
  createSession: (payload) => request('/chat/sessions', { method: 'POST', body: payload }),
  deleteSession: (id) => request(`/chat/sessions/${id}`, { method: 'DELETE' }),
  renameSession: (id, payload) => request(`/chat/sessions/${id}`, { method: 'PATCH', body: payload }),
  sendMessage: (payload) => request('/chat/message', { method: 'POST', body: payload }),
  interviewScores: () => request('/chat/interview/scores'),

  /* resumes */
  resumes: () => request('/resumes'),
  resume: (id) => request(`/resumes/${id}`),
  generateResume: (payload) => request('/resumes/generate', { method: 'POST', body: payload }),
  deleteResume: (id) => request(`/resumes/${id}`, { method: 'DELETE' }),

  /* trends */
  skillTrends: (role) => request(`/trends/skills${role ? `?role=${encodeURIComponent(role)}` : ''}`),
  roleTrends: () => request('/trends/roles'),

  /* admin */
  adminOverview: () => request('/admin/overview'),
  adminUsers: (q = '') => request(`/admin/users?q=${encodeURIComponent(q)}`),
  adminUpdateUser: (id, payload) => request(`/admin/users/${id}`, { method: 'PATCH', body: payload }),
  adminRevokeSessions: (id) => request(`/admin/users/${id}/revoke-sessions`, { method: 'POST' }),
  adminTokens: () => request('/admin/signup-tokens'),
  adminCreateToken: (payload) => request('/admin/signup-tokens', { method: 'POST', body: payload }),
  adminRevokeToken: (id) => request(`/admin/signup-tokens/${id}`, { method: 'DELETE' }),
  adminSecurityEvents: () => request('/admin/security-events'),
  adminAudit: () => request('/admin/audit'),
  adminAiUsage: () => request('/admin/ai-usage'),
  adminDiagnostics: () => request('/admin/diagnostics'),
};

export { refreshSession };