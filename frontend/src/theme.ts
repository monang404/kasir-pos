/**
 * Design Token Terpusat — kasir-POS
 *
 * Semua literal warna, spacing, radius, dan shadow di-konsolidasikan
 * ke sini (UI-009). Komponen mereferensikan konstanta ini alih-alih
 * mengulang string hex secara manual.
 *
 * Cara pakai:
 *   import { COLORS, RADII, SHADOWS } from '../theme';
 *   style={{ backgroundColor: COLORS.bg.page }}
 */

export const COLORS = {
  /** Background halaman utama */
  bg: {
    page: '#0d472cff',
    card: '#c8c8e0ff',
    input: '#ffffffff',
    inputAlt: '#ffffffff',
    elevated: '#05051a',
    bonus: '#0d2e1a',
    danger: '#2e0d0d',
  },

  /** Border */
  border: {
    default: '#2d2d5f',
    muted: '#1e1e4a',
    success: '#166534',
    danger: '#7f1d1d',
    info: '#1e3a5f',
  },

  /** Teks */
  text: {
    primary: '#e2e8f0',
    secondary: '#94a3b8',
    /** @deprecated — gunakan text.secondary (#94a3b8) agar kontras WCAG AA terpenuhi */
    muted: '#64748b',
    accent: '#38bdf8',
    success: '#4ade80',
    danger: '#f87171',
    warning: '#fb923c',
    amber: '#f59e0b',
  },

  /** Warna brand / aksi utama */
  brand: {
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    success: '#22c55e',
    successHover: '#16a34a',
    danger: '#ef4444',
    dangerBg: '#7f1d1d',
    dangerText: '#fca5a5',
    info: '#38bdf8',
    infoHover: '#0ea5e9',
  },

  /** Sidebar */
  sidebar: {
    bg: '#11113a',
    activeBg: '#1e1e4a',
    activeText: '#38bdf8',
    inactiveText: '#94a3b8',
    border: '#2d2d5f',
  },
} as const;

export const RADII = {
  sm: '4px',
  md: '8px',
  lg: '12px',
} as const;

export const SHADOWS = {
  card: '0 2px 8px rgba(0,0,0,0.3)',
  modal: '0 4px 20px rgba(0,0,0,0.6)',
  toast: '0 4px 16px rgba(0,0,0,0.5)',
} as const;

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
} as const;
