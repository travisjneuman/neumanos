/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Professional minimalist color system
      colors: {
        surface: {
          light: '#FFFFFF',
          'light-elevated': '#F7F8F9',
          dark: '#000000',
          'dark-elevated': '#1A1A1A',
        },
        text: {
          'light-primary': '#1A1A1A',
          'light-secondary': '#6B6B6B',
          'dark-primary': '#FFFFFF',
          'dark-secondary': '#A0A0A0',
        },
        border: {
          light: '#E5E5E5',
          dark: '#1F1F1F',
        },
        accent: {
          blue: '#0066FF',
          'blue-hover': '#0052CC',
          magenta: '#E91E63',
          'magenta-hover': '#C2185B',
          cyan: '#00BCD4',
          'cyan-hover': '#0097A7',
        },
        // Status colors (success, warning, error, info)
        status: {
          // Success (green)
          success: '#10B981',
          'success-bg': '#D1FAE5',
          'success-bg-dark': '#064E3B',
          'success-text': '#065F46',
          'success-text-dark': '#6EE7B7',
          'success-border': '#A7F3D0',
          'success-border-dark': '#065F46',

          // Warning (yellow)
          warning: '#F59E0B',
          'warning-bg': '#FEF3C7',
          'warning-bg-dark': '#78350F',
          'warning-text': '#92400E',
          'warning-text-dark': '#FCD34D',
          'warning-border': '#FDE68A',
          'warning-border-dark': '#92400E',

          // Error (red)
          error: '#EF4444',
          'error-bg': '#FEE2E2',
          'error-bg-dark': '#7F1D1D',
          'error-text': '#991B1B',
          'error-text-dark': '#FCA5A5',
          'error-border': '#FECACA',
          'error-border-dark': '#991B1B',

          // Info (blue)
          info: '#3B82F6',
          'info-bg': '#DBEAFE',
          'info-bg-dark': '#1E3A8A',
          'info-text': '#1E40AF',
          'info-text-dark': '#93C5FD',
          'info-border': '#BFDBFE',
          'info-border-dark': '#1E40AF',
        },
        // Neutral grays (for surfaces that need subtle backgrounds)
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      // Inter font family
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      // Base font size 14px
      fontSize: {
        xs: ['10px', { lineHeight: '14px' }],
        sm: ['12px', { lineHeight: '16px' }],
        base: ['14px', { lineHeight: '20px' }],
        md: ['16px', { lineHeight: '24px' }],
        lg: ['20px', { lineHeight: '28px' }],
        xl: ['24px', { lineHeight: '32px' }],
      },
      // Option B: Shadow system for elevation
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'modal': '0 8px 24px rgba(0, 0, 0, 0.16)',
      },
      // Option B: Gradient utilities (buttons only)
      backgroundImage: {
        'gradient-button-primary': 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
        'gradient-button-magenta': 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
        'gradient-button-cyan': 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
      },
      // Option B: 8pt spacing scale
      spacing: {
        '8pt': '8px',
        '16pt': '16px',
        '24pt': '24px',
        '32pt': '32px',
        '40pt': '40px',
        '48pt': '48px',
      },
      // Option B: Border radius adjustments
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'input': '8px',
      },
      // Option B: Transition utilities
      transitionDuration: {
        'standard': '200ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
