/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Primary : Blue-500 / Navy (Bleu ardoise institutionnel) ──
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // ── Brand Blue : Couleur de l'agence (bleu électrique) ────────────
        blue: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // ── Owner Thread : Apple Blue ────────────────────────────────────
        'f-owner':  '#007AFF',
        'f-tenant': '#34C759',
        // ── Accent (Apple Blue) ───────────────────────────────────────────
        accent: {
          50:  '#e8f0fe',
          100: '#d0e6ff',
          200: '#aacfff',
          300: '#6eaeff',
          400: '#3d8ef5',
          500: '#007AFF',
          600: '#0066d6',
          700: '#0055b3',
          800: '#003f87',
        },
        // ── Onyx ──────────────────────────────────────────────────────────
        onyx: '#1d1d1f',
        // ── Page bg ───────────────────────────────────────────────────────
        'bg-page':  '#f5f5f7',
        'bg-surface': '#ffffff',
        // ── Success ──────────────────────────────────────────────────────
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        // ── Warning ───────────────────────────────────────────────────────
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        // ── Error ────────────────────────────────────────────────────────
        error: {
          50:  '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"DM Mono"', 'monospace'],
      },
      letterSpacing: {
        'tighter': '-0.03em',
        'tight':   '-0.015em',
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        // ── Cards (Light Premium) ─────────────────────────────────────────
        'card':         '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
        'card-hover':   '0 4px 12px rgba(0,0,0,0.10), 0 12px 32px rgba(0,0,0,0.08)',
        'card-lg':      '0 4px 12px rgba(0,0,0,0.10), 0 12px 32px rgba(0,0,0,0.08)',
        // ── Accents glow (soft, light-friendly) ───────────────────────────
        'card-glow-cyan':    '0 4px 16px rgba(99,102,241,0.18), 0 1px 4px rgba(0,0,0,0.06)',
        'card-glow-fuchsia': '0 4px 16px rgba(99,102,241,0.18), 0 1px 4px rgba(0,0,0,0.06)',
        'card-glow-violet':  '0 4px 16px rgba(99,102,241,0.18), 0 1px 4px rgba(0,0,0,0.06)',
        'card-glow-blue':    '0 4px 16px rgba(59,130,246,0.18),  0 1px 4px rgba(0,0,0,0.06)',
        // ── Button glows ─────────────────────────────────────────────────
        'glow-primary': '0 4px 14px rgba(99,102,241,0.35)',
        'glow-emerald': '0 4px 14px rgba(16,185,129,0.28)',
        'glow-cyan':    '0 4px 14px rgba(99,102,241,0.28)',
        'glow-blue':    '0 4px 14px rgba(59,130,246,0.30)',
        'glow-magenta': '0 4px 14px rgba(99,102,241,0.35)',
        'glow-accent':  '0 4px 14px rgba(99,102,241,0.35)',
        'glow-success': '0 4px 14px rgba(16,185,129,0.30)',
        // ── Premium ───────────────────────────────────────────────────────
        'float':   '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        'modal':   '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.06)',
        'sidebar': '2px 0 8px rgba(0,0,0,0.06)',
        'glass':   '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
        'header':  '0 1px 3px rgba(0,0,0,0.06)',
      },
      animation: {
        'slide-in':   'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up':   'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':    'fadeIn 0.25s ease-out',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'float-y':    'floatY 3s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%':   { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.94)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
