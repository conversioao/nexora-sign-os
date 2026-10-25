/**
 * Nexora Design System Tokens
 * Derived strictly from the official Nexora Brand Guidelines:
 * - Azul (Tecnologia/Confiança): #2563EB
 * - Roxo (Inovação/Criatividade): #7C3AED
 * - Cíano (Conexão/Modernidade): #06B6D4
 * - Magenta (Energia/Destaque): #EC4899
 * - Azul Escuro (Força/Profissionalismo): #0F172A
 * - Cinza Claro (Equilíbrio/Neutralidade): #F8FAFC
 */

export const tokens = {
  colors: {
    brand: {
      blue: '#2563EB',
      purple: '#7C3AED',
      cyan: '#06B6D4',
      magenta: '#EC4899',
      navy: '#0F172A',
      lightGray: '#F8FAFC',
    },
    canvas: {
      root: '#070B14',      // Deepest midnight blue background
      subtle: '#0B1120',    // Secondary background container
    },
    surface: {
      base: '#0F172A',      // Primary surface (e.g., sidebar, topbar, panel)
      card: '#131D31',      // Card surface
      cardHover: '#18243D', // Elevated card hover
      elevated: '#1E293B',  // Modals, dropdowns, popovers
      active: '#24324D',    // Selected items
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.07)',
      medium: 'rgba(255, 255, 255, 0.12)',
      strong: 'rgba(255, 255, 255, 0.20)',
      brand: '#2563EB',
      cyan: '#06B6D4',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
      muted: '#64748B',
      disabled: '#475569',
      inverse: '#070B14',
    },
    status: {
      online: '#10B981',    // Emerald green for active displays
      offline: '#EF4444',   // Red for disconnected hardware
      maintenance: '#F59E0B',// Amber for maintenance mode
      draft: '#64748B',     // Slate for unpublished draft
      scheduled: '#06B6D4', // Cyan for future campaign
      live: '#2563EB',      // Blue for currently airing
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#06B6D4',
      success: '#10B981',
    },
  },
  typography: {
    fontFamily: {
      display: '"Exo 2", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      body: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
    },
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '9999px',
  },
  shadows: {
    subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.4)',
    card: '0 4px 16px 0 rgba(0, 0, 0, 0.5)',
    elevated: '0 12px 32px 0 rgba(0, 0, 0, 0.6)',
    glowBlue: '0 0 20px -3px rgba(37, 99, 235, 0.35)',
    glowCyan: '0 0 20px -3px rgba(6, 182, 212, 0.35)',
    glowPurple: '0 0 20px -3px rgba(124, 58, 237, 0.35)',
  },
  transitions: {
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
} as const;

export type DesignTokens = typeof tokens;
