import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: '#0d2e1a', border: '#166534', icon: '✓', text: '#4ade80' },
  error:   { bg: '#2e0d0d', border: '#7f1d1d', icon: '✕', text: '#f87171' },
  warning: { bg: '#2e1d0d', border: '#78350f', icon: '⚠', text: '#fb923c' },
  info:    { bg: '#0d1b2e', border: '#1e3a5f', icon: 'ℹ', text: '#38bdf8' },
};

const AUTO_DISMISS_MS = 4000;

const SingleToast: React.FC<{ toast: ToastItem; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const colors = TOAST_COLORS[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        maxWidth: '380px',
        animation: 'toastSlideIn 0.25s ease-out',
      }}
    >
      <span style={{ color: colors.text, fontWeight: 'bold', fontSize: '1rem', flexShrink: 0, lineHeight: '1.5' }}>
        {colors.icon}
      </span>
      <span style={{ color: '#e2e8f0', fontSize: '0.9rem', flex: 1, lineHeight: '1.5', wordBreak: 'break-word' }}>
        {toast.message}
      </span>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Tutup notifikasi"
        style={{
          background: 'none',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          padding: '0',
          fontSize: '1rem',
          flexShrink: 0,
          lineHeight: '1.5',
          transition: 'color 0.15s',
        }}
        onMouseOver={e => (e.currentTarget.style.color = '#e2e8f0')}
        onMouseOut={e => (e.currentTarget.style.color = '#64748b')}
      >
        ×
      </button>
    </div>
  );
};

const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div
        aria-label="Notifikasi"
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <SingleToast toast={t} onRemove={onRemove} />
          </div>
        ))}
      </div>
    </>
  );
};

export default Toast;
