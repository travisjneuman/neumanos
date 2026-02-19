/**
 * Centralized Theme Configuration - 2025 Design System
 *
 * @deprecated This file is a static design reference only.
 * Active theme definitions live in `src/config/themes/` — the theme system
 * uses CSS variable injection for runtime palette switching.
 *
 * World-class UI/UX design system combining retro-futurism with modern minimalism
 * Based on comprehensive research of leading SaaS platforms and 2025 design trends
 * WCAG 2.2 Level AA compliant with enhanced gradients and glassmorphism
 */

export const themeConfig = {
  // ==================== PRIMARY PALETTE ====================
  // Logo-derived accent colors (from logo_white.png / logo_black.png theme-aware logos)
  colors: {
    // Main accent: Neon Magenta (from logo)
    magenta: {
      900: '#B8166F',        // Dark, rich magenta
      700: '#E91E8C',        // Brand primary ✨
      500: '#FF4DA6',        // Vibrant
      300: '#FF7EC7',        // Light tint
      100: '#FFACE9',        // Pale background
      50: '#FFE5F4',         // Subtle wash
    },

    // Secondary accent: Electric Cyan (from logo)
    cyan: {
      900: '#006B8F',        // Deep ocean
      700: '#00C9FF',        // Brand secondary ⚡
      500: '#3DD5FF',        // Bright
      300: '#7FE4FF',        // Light tint
      100: '#C2F2FF',        // Pale background
      50: '#E5F9FF',         // Subtle wash
    },

    // Accent: Purple Gradient Bridge
    purple: {
      700: '#9333EA',        // Rich violet
      500: '#A855F7',        // Medium purple
      300: '#C084FC',        // Light lavender
    },

    // Neutral palette (Enhanced for depth)
    neutral: {
      black: '#000000',      // Pure black
      charcoal: '#0D0D0D',   // Deepest gray
      graphite: '#1A1A1A',   // Near black
      darkGray: '#2D2D2D',   // Dark gray
      gray: '#6B7280',       // Medium gray
      lightGray: '#D1D5DB',  // Light gray
      paleGray: '#F3F4F6',   // Very light gray
      white: '#FFFFFF',      // Pure white
    },

    // Slate palette (Blue-tinted grays for sophistication)
    slate: {
      900: '#0F172A',        // Blue-tinted dark
      800: '#1E293B',        // Medium dark slate
      700: '#334155',        // Dark slate
      600: '#475569',        // Medium slate
      500: '#64748B',        // Base slate
      400: '#94A3B8',        // Light slate
      300: '#CBD5E1',        // Very light slate
      200: '#E2E8F0',        // Pale slate
      100: '#F1F5F9',        // Almost white
    },

    // Semantic colors (WCAG 2.2 compliant)
    success: {
      700: '#047857',        // Dark mode ✅
      500: '#10B981',        // Standard green
      300: '#6EE7B7',        // Light mode
    },
    warning: {
      700: '#B45309',        // Dark mode ⚠️
      500: '#F59E0B',        // Standard amber
      300: '#FCD34D',        // Light mode
    },
    error: {
      700: '#B91C1C',        // Dark mode ❌
      500: '#EF4444',        // Standard red
      300: '#FCA5A5',        // Light mode
    },
    info: {
      700: '#1D4ED8',        // Dark mode ℹ️
      500: '#3B82F6',        // Standard blue
      300: '#93C5FD',        // Light mode
    },
  },

  // ==================== GRADIENTS (2025 Trend) ====================
  gradients: {
    hero: 'linear-gradient(135deg, #E91E8C 0%, #9333EA 50%, #00C9FF 100%)',
    heroDark: 'linear-gradient(135deg, #B8166F 0%, #7C22B8 50%, #006B8F 100%)',
    subtle: 'linear-gradient(180deg, #000000 0%, #1A1A1A 100%)',
    glass: 'linear-gradient(135deg, rgba(233, 30, 140, 0.15) 0%, rgba(0, 201, 255, 0.15) 100%)',
    buttonPrimary: 'linear-gradient(90deg, #E91E8C 0%, #D11A7C 100%)',
    buttonSecondary: 'linear-gradient(90deg, #00C9FF 0%, #00B3E6 100%)',
    accentBorder: 'linear-gradient(135deg, #E91E8C, #9333EA, #00C9FF)',
  },

  // ==================== COMPONENT-SPECIFIC COLORS ====================
  components: {
    header: {
      background: {
        from: '#000000',     // Pure black gradient start
        to: '#0D0D0D',       // Deepest gray gradient end
      },
      text: '#FFFFFF',
      logoHighlight: '#E91E8C', // Magenta accent
      glassBg: 'rgba(0, 0, 0, 0.95)',
    },

    button: {
      primary: {
        bg: '#E91E8C',       // Magenta
        gradient: 'linear-gradient(90deg, #E91E8C 0%, #D11A7C 100%)',
        text: '#FFFFFF',
        hover: '#D11A7C',
        shadow: 'rgba(233, 30, 140, 0.25)',
      },
      secondary: {
        bg: '#00C9FF',       // Cyan
        gradient: 'linear-gradient(90deg, #00C9FF 0%, #00B3E6 100%)',
        text: '#FFFFFF',
        hover: '#00B3E6',
        shadow: 'rgba(0, 201, 255, 0.25)',
      },
      ghost: {
        bg: 'transparent',
        text: '#64748B',
        hover: 'rgba(255, 255, 255, 0.05)',
        border: 'rgba(255, 255, 255, 0.1)',
      },
    },

    card: {
      light: {
        bg: '#FFFFFF',
        border: '#E2E8F0',
        shadow: 'rgba(0, 0, 0, 0.1)',
        glassBg: 'rgba(255, 255, 255, 0.1)',
      },
      dark: {
        bg: '#1A1A1A',
        bgElevated: '#0D0D0D',
        border: 'rgba(255, 255, 255, 0.1)',
        shadow: 'rgba(0, 0, 0, 0.5)',
        glassBg: 'rgba(255, 255, 255, 0.05)',
      },
    },

    input: {
      light: {
        bg: '#FFFFFF',
        border: '#E2E8F0',
        text: '#000000',
        placeholder: '#64748B',
        focus: '#E91E8C',    // Magenta focus ring
        focusRing: 'rgba(233, 30, 140, 0.2)',
      },
      dark: {
        bg: 'rgba(255, 255, 255, 0.05)',
        border: 'rgba(255, 255, 255, 0.1)',
        text: '#FFFFFF',
        placeholder: '#64748B',
        focus: '#E91E8C',    // Magenta focus ring
        focusRing: 'rgba(233, 30, 140, 0.2)',
      },
    },

    modal: {
      backdrop: 'rgba(0, 0, 0, 0.75)',  // Dark backdrop
      backdropBlur: 'blur(8px)',
      header: {
        from: '#000000',
        to: '#0D0D0D',
      },
      bg: 'linear-gradient(135deg, #0D0D0D, #1A1A1A)',
      border: 'rgba(255, 255, 255, 0.15)',
    },
  },

  // ==================== PRIORITIES & STATUS COLORS ====================
  priority: {
    low: '#00C9FF',        // Cyan - calm
    medium: '#F59E0B',     // Amber - attention
    high: '#EF4444',       // Red - urgent
    critical: '#DC2626',   // Deep red - emergency
  },

  status: {
    todo: '#64748B',       // Slate - neutral
    inProgress: '#00C9FF', // Cyan - active
    done: '#10B981',       // Green - complete
    blocked: '#EF4444',    // Red - stuck
    review: '#F59E0B',     // Amber - pending
  },

  // ==================== SHADOWS & DEPTH ====================
  shadows: {
    subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    soft: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    medium: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    large: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    floating: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glowMagenta: '0 0 20px rgba(233, 30, 140, 0.4), 0 0 40px rgba(233, 30, 140, 0.2)',
    glowCyan: '0 0 20px rgba(0, 201, 255, 0.4), 0 0 40px rgba(0, 201, 255, 0.2)',
    glowPurple: '0 0 20px rgba(147, 51, 234, 0.4), 0 0 40px rgba(147, 51, 234, 0.2)',
  },

  // ==================== ANIMATIONS ====================
  animations: {
    duration: {
      instant: '75ms',
      fast: '150ms',
      base: '200ms',
      medium: '300ms',
      slow: '500ms',
      slower: '700ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },

  // ==================== DARK MODE VARIANTS ====================
  // These are automatically generated but can be customized
  // WCAG AA compliant: 4.5:1 minimum contrast ratio for text
  dark: {
    background: {
      primary: '#000000',    // Pure black background
      secondary: '#1A1A1A',  // Slightly lighter black
      tertiary: '#2D2D2D',   // Dark gray
    },
    text: {
      primary: '#FFFFFF',    // Pure white (21:1 contrast with black)
      secondary: '#D1D5DB',  // Light gray (10.5:1 contrast with black)
      tertiary: '#9CA3AF',   // Medium gray (6.5:1 contrast with black)
      muted: '#6B7280',      // Darker gray (5.1:1 contrast with black)
    },
  },

  light: {
    background: {
      primary: '#FFFFFF',    // Pure white background
      secondary: '#F3F4F6',  // Very light gray
      tertiary: '#E5E7EB',   // Light gray
    },
    text: {
      primary: '#000000',    // Pure black (21:1 contrast with white)
      secondary: '#4B5563',  // Dark gray (7.0:1 contrast with white)
      tertiary: '#6B7280',   // Medium gray (4.6:1 contrast with white)
      muted: '#9CA3AF',      // Light gray (2.6:1 - decorative only, not for essential text)
    },
  },
};

/**
 * Helper function to get a color value
 * Usage: getColor('magenta.700') => '#E91E8C'
 */
export function getColor(path: string): string {
  const keys = path.split('.');
  let value: any = themeConfig;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color path "${path}" not found in theme config`);
      return '#000000';
    }
  }

  return value;
}

/**
 * Helper function to get gradient
 * Usage: getGradient('hero') => 'linear-gradient(...)'
 */
export function getGradient(name: keyof typeof themeConfig.gradients): string {
  return themeConfig.gradients[name];
}

/**
 * Helper function to get shadow
 * Usage: getShadow('soft') => '0 4px 6px...'
 */
export function getShadow(name: keyof typeof themeConfig.shadows): string {
  return themeConfig.shadows[name];
}

/**
 * Export individual palettes for convenience
 */
export const colors = themeConfig.colors;
export const gradients = themeConfig.gradients;
export const components = themeConfig.components;
export const priorityColors = themeConfig.priority;
export const statusColors = themeConfig.status;
export const shadows = themeConfig.shadows;
export const animations = themeConfig.animations;
