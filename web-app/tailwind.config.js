/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Theme Backgrounds ─────────────────────────────────
        screen:   'var(--bg-screen)',
        page:     'var(--bg-page)',
        card:     'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        sidebar:  'var(--bg-sidebar)',
        header:   'var(--bg-header)',

        // ── Theme Borders ─────────────────────────────────────
        'border-default': 'var(--border-default)',
        'border-hover':   'var(--border-hover)',
        'border-accent':  'var(--border-accent)',

        // ── Theme Typography ──────────────────────────────────
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted:     'var(--text-muted)',
        dimmed:    'var(--text-dimmed)',

        // ── AI Brand color (Indigo) ───────────────────────────
        ai: {
          DEFAULT: 'var(--accent-ai)',
          light:   'var(--accent-ai-light)',
          soft:    'var(--accent-ai-soft)',
          glow:    'var(--accent-ai-glow)',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },

      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },

      boxShadow: {
        'ai':       '0 0 30px rgba(99, 102, 241, 0.18)',
        'ai-lg':    '0 0 60px rgba(99, 102, 241, 0.28)',
        'ai-ring':  '0 0 0 1px rgba(99, 102, 241, 0.35), 0 0 30px rgba(99, 102, 241, 0.18)',
        'card':     '0 4px 24px rgba(0, 0, 0, 0.40)',
        'card-lg':  '0 8px 40px rgba(0, 0, 0, 0.55)',
        'inset-top':'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'danger':   '0 0 20px rgba(244, 63, 94, 0.25)',
        'success':  '0 0 20px rgba(16, 185, 129, 0.25)',
        'amber':    '0 0 20px rgba(245, 158, 11, 0.25)',
      },

      backgroundImage: {
        // Gradient untuk CTA buttons
        'gradient-ai':     'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
        'gradient-amber':  'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
        'gradient-danger': 'linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)',
        'gradient-success':'linear-gradient(135deg, #10b981 0%, #059669 100%)',

        // Mesh gradient background
        'mesh-dark': `
          radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(124, 58, 237, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 80%, rgba(245, 158, 11, 0.05) 0%, transparent 50%)
        `,

        // Grid dots background
        'grid-dots': `radial-gradient(circle, rgba(99,102,241,0.15) 1px, transparent 1px)`,
      },

      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'fade-in':    'fadeIn 0.3s ease-out forwards',
        'float':      'float 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'spin-slow':  'spin-slow 8s linear infinite',
        'shimmer':    'shimmer 1.6s infinite',
      },

      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(99, 102, 241, 0.20)' },
          '50%':      { boxShadow: '0 0 28px rgba(99, 102, 241, 0.55)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
