import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Icon from './Icon.jsx';

export const SIZES = ['SMALL', 'MEDIUM', 'LARGE'];
export const sizeLabel = (s) => s.charAt(0) + s.slice(1).toLowerCase();
export const PROVINCES = ['Gauteng', 'Free State', 'KwaZulu-Natal', 'Western Cape', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West'];
const TONES = ['#1f5b45', '#9a6a1f', '#8a3b52', '#2f5f8a', '#5b4a8a', '#3d6b6b'];
const toneFor = (name = '') => TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
// Monogram tile used in place of fruit emoji.
export const FruitMark = ({ name = '', size = 'md' }) => (
  <span className={`fruit-mark ${size}`} style={{ '--tone': toneFor(name) }} aria-hidden="true">{name.charAt(0).toUpperCase() || '?'}</span>
);

export const money = (n) => 'M ' + Number(n || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
export const today = () => new Date().toISOString().slice(0, 10);

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((type, message, details) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message, details }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === 'error' ? 7000 : 3500);
  }, []);
  const api = { success: (m) => push('success', m), error: (e) => push('error', e.message || String(e), e.details) };
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <strong>{t.message}</strong>
            {t.details && Array.isArray(t.details) && <ul>{t.details.map((d, i) => <li key={i}>{d}</li>)}</ul>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button></div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, children, hint }) => (
  <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
);

const BADGES = { PAID: 'good', PARTIALLY_PAID: 'warn', UNPAID: 'bad', ACTIVE: 'good', INACTIVE: 'muted' };
export const Badge = ({ value }) => <span className={`badge ${BADGES[value] || 'muted'}`}>{value.replace('_', ' ').toLowerCase()}</span>;

export const PageHeader = ({ title, subtitle, children }) => (
  <header className="page-head"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div><div className="head-actions">{children}</div></header>
);

export const Loading = () => <div className="state"><div className="spinner" /> Loading…</div>;
export const ErrorBox = ({ message, onRetry }) => (
  <div className="state error"><p>{message}</p>{onRetry && <button className="btn ghost" onClick={onRetry}>Try again</button>}</div>
);
export const Empty = ({ children }) => <div className="state">{children}</div>;
