import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { IconAlert, IconCheck } from './Icons.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((message, tone = 'info', ttl = 4200) => {
    idRef.current += 1;
    const id = idRef.current;
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), ttl);
  }, []);

  const value = useMemo(
    () => ({
      toast: push,
      success: (m) => push(m, 'ok'),
      error: (m) => push(m, 'error', 6000),
      info: (m) => push(m, 'info'),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            <span className="toast-icon">{t.tone === 'ok' ? <IconCheck size={16} /> : <IconAlert size={16} />}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}