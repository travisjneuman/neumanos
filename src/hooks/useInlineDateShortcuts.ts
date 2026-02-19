/**
 * useInlineDateShortcuts Hook
 *
 * Detects and replaces inline date shortcuts in text input
 * Shortcuts:
 * - @today → "today"
 * - @tomorrow → "tomorrow"
 * - @nextweek → "next week"
 * - @nextmonth → "next month"
 * - +3d → "in 3 days"
 * - +2w → "in 2 weeks"
 * - +1m → "in 1 month"
 *
 * Features:
 * - Word boundary detection (prevents false positives in emails)
 * - Toast feedback when shortcut applied
 * - Settings toggle support (enableDateShortcuts)
 */

import { useRef, useEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { parseNaturalLanguageDate } from '../utils/naturalLanguageDates';
import { format } from 'date-fns';

interface ShortcutMatch {
  pattern: RegExp;
  replacement: string;
}

// Shortcut patterns (@ prefix and + prefix)
const SHORTCUTS: ShortcutMatch[] = [
  // @ shortcuts
  { pattern: /\b@today\b/i, replacement: 'today' },
  { pattern: /\b@tomorrow\b/i, replacement: 'tomorrow' },
  { pattern: /\b@nextweek\b/i, replacement: 'next week' },
  { pattern: /\b@nextmonth\b/i, replacement: 'next month' },

  // + shortcuts (offset patterns)
  { pattern: /\+(\d+)d\b/i, replacement: 'in $1 days' },
  { pattern: /\+(\d+)w\b/i, replacement: 'in $1 weeks' },
  { pattern: /\+(\d+)m\b/i, replacement: 'in $1 months' },
];

export function useInlineDateShortcuts(
  inputRef: React.RefObject<HTMLInputElement | null>,
  onDateSelect: (date: string | null) => void
): void {
  const { enableDateShortcuts } = useSettingsStore();
  const lastProcessedValue = useRef<string>('');

  useEffect(() => {
    if (!enableDateShortcuts || !inputRef.current) {
      return;
    }

    const handleInput = () => {
      const input = inputRef.current;
      if (!input) return;

      const value = input.value;

      // Skip if we already processed this value
      if (value === lastProcessedValue.current) {
        return;
      }

      // Check for shortcuts
      for (const shortcut of SHORTCUTS) {
        const match = shortcut.pattern.exec(value);
        if (match) {
          // Replace shortcut with NL equivalent
          const nlText = value.replace(shortcut.pattern, shortcut.replacement);

          // Parse the result
          const parsed = parseNaturalLanguageDate(nlText);
          if (parsed) {
            // Update input value
            input.value = nlText;
            lastProcessedValue.current = nlText;

            // Trigger onChange with parsed date
            const formattedDate = format(parsed, 'yyyy-MM-dd');
            onDateSelect(formattedDate);

            // Show toast feedback (subtle)
            showToast(`Shortcut applied: ${match[0]} → ${nlText}`);
          }

          break; // Process one shortcut at a time
        }
      }
    };

    const input = inputRef.current;
    input.addEventListener('input', handleInput);

    return () => {
      input.removeEventListener('input', handleInput);
    };
  }, [enableDateShortcuts, inputRef, onDateSelect]);
}

/**
 * Show subtle toast notification
 * (Simple implementation - can be replaced with toast library)
 */
function showToast(message: string): void {
  // Create toast element
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = 'fixed bottom-4 right-4 bg-accent-blue text-white px-4 py-2 rounded-lg shadow-lg text-xs font-medium z-[9999] animate-fade-in-up';
  toast.style.animation = 'fadeInUp 0.3s ease-out';

  // Add to DOM
  document.body.appendChild(toast);

  // Remove after 2 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 2000);
}
