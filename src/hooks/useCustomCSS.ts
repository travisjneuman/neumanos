import { useEffect } from 'react';
import { useCustomCSSStore } from '../stores/useCustomCSSStore';

const STYLE_ID = 'custom-user-css';

/**
 * Sanitize CSS to prevent XSS and data exfiltration.
 * Strips @import, url(), javascript:, and expression().
 */
function sanitizeCSS(raw: string): string {
  let css = raw;

  // Strip @import rules (entire line)
  css = css.replace(/@import\s+[^;]*;?/gi, '/* @import removed */');

  // Strip url() references
  css = css.replace(/url\s*\([^)]*\)/gi, '/* url() removed */');

  // Strip javascript: protocol
  css = css.replace(/javascript\s*:/gi, '/* javascript: removed */');

  // Strip expression() (IE legacy XSS vector)
  css = css.replace(/expression\s*\([^)]*\)/gi, '/* expression() removed */');

  return css;
}

/**
 * Hook that injects user-provided custom CSS into the document head.
 * Call once in a top-level layout component.
 */
export function useCustomCSS(): void {
  const css = useCustomCSSStore((s) => s.css);
  const enabled = useCustomCSSStore((s) => s.enabled);

  useEffect(() => {
    if (!enabled || !css.trim()) {
      // Remove style tag if present
      const existing = document.getElementById(STYLE_ID);
      if (existing) {
        existing.remove();
      }
      return;
    }

    const sanitized = sanitizeCSS(css);

    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = sanitized;

    return () => {
      const el = document.getElementById(STYLE_ID);
      if (el) {
        el.remove();
      }
    };
  }, [css, enabled]);
}
