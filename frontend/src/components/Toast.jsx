import React, { createContext, useContext, useCallback, useReducer } from 'react';

/* ---- Context & reducer ----------------------------------- */
const ToastContext = createContext(null);

let _nextId = 1;

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, action.toast];
    case 'REMOVE':
      return state.filter(t => t.id !== action.id);
    default:
      return state;
  }
}

/* ---- Icons for each variant ------------------------------ */
function ToastIcon({ variant }) {
  const paths = {
    success: 'M5 10l3.5 3.5L15 7',
    warn:    'M10 6v5M10 14v.5',
    error:   'M6 6l8 8M14 6l-8 8',
    info:    'M10 7v.5M10 10v4',
  };
  const d = paths[variant] || paths.info;
  return (
    <svg className="toast-icon" viewBox="0 0 20 20" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round"
         strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="8" strokeOpacity="0.4" />
      <path d={d} />
    </svg>
  );
}

/* ---- Individual Toast ------------------------------------ */
function ToastItem({ toast, onRemove }) {
  return (
    <div
      className={['toast', toast.variant].filter(Boolean).join(' ')}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <ToastIcon variant={toast.variant} />
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
      >
        &#x2715;
      </button>
    </div>
  );
}

/* ---- Provider -------------------------------------------- */
export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const addToast = useCallback(({ message, variant = 'info', duration = 4500 }) => {
    const id = _nextId++;
    dispatch({ type: 'ADD', toast: { id, message, variant } });
    if (duration > 0) {
      setTimeout(() => dispatch({ type: 'REMOVE', id }), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE', id });
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-region" aria-label="Notifications" role="region">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ---- Hook ------------------------------------------------ */
/**
 * const toast = useToast();
 *
 * toast.success('Claim submitted successfully');
 * toast.error('Validation failed — check diagnosis codes');
 * toast.warn('Partially matched ERA');
 * toast.info('Auto-posting ERA batch…');
 *
 * Or low-level:
 * toast.add({ message: '…', variant: 'success', duration: 6000 });
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');

  return {
    add:     (opts) => ctx.addToast(opts),
    remove:  (id)  => ctx.removeToast(id),
    success: (msg, opts = {}) => ctx.addToast({ message: msg, variant: 'success', ...opts }),
    error:   (msg, opts = {}) => ctx.addToast({ message: msg, variant: 'error',   ...opts }),
    warn:    (msg, opts = {}) => ctx.addToast({ message: msg, variant: 'warn',     ...opts }),
    info:    (msg, opts = {}) => ctx.addToast({ message: msg, variant: 'info',     ...opts }),
  };
}
