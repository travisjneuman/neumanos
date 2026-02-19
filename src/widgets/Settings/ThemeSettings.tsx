/**
 * Theme Settings Component
 *
 * Two-layer theme configuration:
 * - Color Mode: Light / Dark / System
 * - Brand Theme: Named palettes organized by category
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../stores/useThemeStore';
import { getThemesByCategory, THEME_REGISTRY } from '../../config/themes/registry';
import type { ColorMode } from '../../config/themes/types';

const COLOR_MODES: { id: ColorMode; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

export const ThemeSettings: React.FC = () => {
  const colorMode = useThemeStore((s) => s.colorMode);
  const brandTheme = useThemeStore((s) => s.brandTheme);
  const setColorMode = useThemeStore((s) => s.setColorMode);
  const setBrandTheme = useThemeStore((s) => s.setBrandTheme);

  const categorizedThemes = getThemesByCategory();
  const defaultTheme = THEME_REGISTRY['default'];

  return (
    <div className="bento-card p-6">
      <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-1">
        Appearance
      </h2>
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-6">
        Choose your color mode and brand theme
      </p>

      {/* Color Mode Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3">
          Color Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          {COLOR_MODES.map(({ id, label, icon: Icon }) => {
            const isActive = colorMode === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setColorMode(id)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accent-primary text-white'
                    : 'bg-surface-light-elevated dark:bg-surface-dark-elevated text-text-light-secondary dark:text-text-dark-secondary hover:bg-border-light dark:hover:bg-border-dark'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Default Theme */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-3">
          Theme
        </label>
        <ThemeCard
          themeId="default"
          name={defaultTheme.name}
          description={defaultTheme.description}
          preview={defaultTheme.preview}
          isActive={brandTheme === 'default'}
          onSelect={() => setBrandTheme('default')}
        />
      </div>

      {/* Categorized Themes */}
      {categorizedThemes.map(({ category, themes }) => (
        <div key={category.id} className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-light-tertiary dark:text-text-dark-tertiary mb-2">
            {category.label}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                themeId={theme.id}
                name={theme.name}
                description={theme.description}
                preview={theme.preview}
                isActive={brandTheme === theme.id}
                onSelect={() => setBrandTheme(theme.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Theme Card
// ---------------------------------------------------------------------------

interface ThemeCardProps {
  themeId: string;
  name: string;
  description: string;
  preview: { primary: string; secondary: string; accent: string };
  isActive: boolean;
  onSelect: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  name,
  description,
  preview,
  isActive,
  onSelect,
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
        isActive
          ? 'ring-2 ring-accent-primary bg-accent-primary/5'
          : 'bg-surface-light-elevated dark:bg-surface-dark-elevated hover:bg-border-light dark:hover:bg-border-dark'
      }`}
    >
      {/* Color swatches */}
      <div className="flex gap-1 flex-shrink-0">
        <span
          className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10"
          style={{ backgroundColor: preview.primary }}
        />
        <span
          className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10"
          style={{ backgroundColor: preview.secondary }}
        />
        <span
          className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10"
          style={{ backgroundColor: preview.accent }}
        />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${
          isActive
            ? 'text-accent-primary'
            : 'text-text-light-primary dark:text-text-dark-primary'
        }`}>
          {name}
        </p>
        <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary truncate">
          {description}
        </p>
      </div>

      {/* Active indicator */}
      {isActive && (
        <span className="text-accent-primary flex-shrink-0 text-sm">
          &#10003;
        </span>
      )}
    </motion.button>
  );
};
