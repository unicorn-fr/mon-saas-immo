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
        // ── Owner Theme : Cyan / Teal (Propriétaire) ──────────────────────
        cyan: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
        },
        // ── Tenant Theme : Fuchsia / Magenta (Locataire) ──────────────────
        fuchsia: {
          50:  '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
        },
        // ── Accent : Corail Vif (CTA héros) ──────────────────────────────
        accent: {
          50:  '#fff5f0',
          100: '#ffede5',
          200: '#ffd3bd',
          300: '#ffb899',
          400: '#ff8a65',
          500: '#ff6b35',
          600: '#e84e1b',
          700: '#c2410c',
          800: '#9a3412',
        },
        // ── Onyx (sections premium sombres) ──────────────────────────────
        onyx: '#0f172a',
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
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
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
        // ── Cards ────────────────────────────────────────────────────────
        'card':       '0 2px 12px 0 rgba(0,0,0,0.06), 0 1px 3px 0 rgba(0,0,0,0.04)',
        'card-hover': '0 20px 50px -8px rgba(0,0,0,0.14), 0 8px 20px -4px rgba(0,0,0,0.06)',
        // ── Cards flottantes avec glow coloré ─────────────────────────
        'card-glow-cyan':    '0 16px 48px -8px rgba(6, 182, 212, 0.28), 0 4px 12px -2px rgba(0,0,0,0.06)',
        'card-glow-fuchsia': '0 16px 48px -8px rgba(217, 70, 239, 0.24), 0 4px 12px -2px rgba(0,0,0,0.06)',
        'card-glow-violet':  '0 16px 48px -8px rgba(124, 58, 237, 0.20), 0 4px 12px -2px rgba(0,0,0,0.06)',
        'card-glow-blue':    '0 16px 48px -8px rgba(59, 130, 246, 0.24), 0 4px 12px -2px rgba(0,0,0,0.06)',
        // ── Glows boutons/CTA (micro-interactions) ────────────────────
        'glow-primary': '0 4px 16px rgba(59, 130, 246, 0.30)',
        'glow-emerald': '0 4px 16px rgba(16, 185, 129, 0.28)',
        'glow-cyan':    '0 4px 16px rgba(6, 182, 212, 0.28)',
        'glow-blue':    '0 4px 16px rgba(59, 130, 246, 0.32)',
        'glow-magenta': '0 6px 20px rgba(217, 70, 239, 0.50)',
        'glow-accent':  '0 6px 20px rgba(255, 107, 53, 0.55)',
        'glow-success': '0 4px 16px rgba(22, 163, 74, 0.35)',
        // ── Premium ──────────────────────────────────────────────────────
        'float':   '0 24px 64px -12px rgba(0,0,0,0.22)',
        'modal':   '0 25px 65px -12px rgba(0,0,0,0.18)',
        'sidebar': '-4px 0 12px -1px rgba(0,0,0,0.08)',
        // ── Glassmorphism ────────────────────────────────────────────────
        'glass':   '0 8px 32px rgba(6, 182, 212, 0.08), inset 0 1px 0 rgba(255,255,255,0.60)',
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
