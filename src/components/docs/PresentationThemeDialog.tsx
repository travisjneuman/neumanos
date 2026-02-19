/**
 * PresentationThemeDialog Component
 *
 * Dialog for selecting and applying presentation themes.
 */

import { useState } from 'react';
import { X, Check, Layout } from 'lucide-react';
import type { SlideTheme } from '../../types';
import {
  THEME_PRESETS,
  SLIDE_LAYOUTS,
  getLayoutDisplayName,
  type SlideLayout,
} from './presentationTemplates';

interface PresentationThemeDialogProps {
  currentTheme: SlideTheme;
  onApplyTheme: (theme: SlideTheme, applyToAll: boolean) => void;
  onApplyLayout: (layout: SlideLayout) => void;
  onClose: () => void;
}

export function PresentationThemeDialog({
  currentTheme,
  onApplyTheme,
  onApplyLayout,
  onClose,
}: PresentationThemeDialogProps) {
  const [activeTab, setActiveTab] = useState<'themes' | 'layouts'>('themes');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(
    THEME_PRESETS.find(
      (t) =>
        t.theme.colors.primary === currentTheme.colors.primary &&
        t.theme.colors.background === currentTheme.colors.background
    )?.id || null
  );
  const [applyToAll, setApplyToAll] = useState(true);

  const handleApplyTheme = () => {
    const preset = THEME_PRESETS.find((t) => t.id === selectedThemeId);
    if (preset) {
      onApplyTheme(preset.theme, applyToAll);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark-elevated rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
            Themes & Layouts
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-light dark:border-border-dark">
          <button
            onClick={() => setActiveTab('themes')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'themes'
                ? 'text-accent-primary border-b-2 border-accent-primary'
                : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary'
            }`}
          >
            Themes
          </button>
          <button
            onClick={() => setActiveTab('layouts')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'layouts'
                ? 'text-accent-primary border-b-2 border-accent-primary'
                : 'text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary'
            }`}
          >
            Layouts
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'themes' ? (
            <div className="space-y-4">
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Select a theme to apply to your presentation
              </p>

              <div className="grid grid-cols-2 gap-4">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedThemeId(preset.id)}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      selectedThemeId === preset.id
                        ? 'border-accent-primary bg-accent-primary/5'
                        : 'border-border-light dark:border-border-dark hover:border-accent-primary/50'
                    }`}
                  >
                    {/* Selection indicator */}
                    {selectedThemeId === preset.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Theme preview */}
                    <div
                      className="h-16 rounded mb-2 flex items-center justify-center"
                      style={{ backgroundColor: preset.previewColors[2] }}
                    >
                      <div
                        className="text-lg font-bold"
                        style={{ color: preset.previewColors[0] }}
                      >
                        Aa
                      </div>
                    </div>

                    {/* Color swatches */}
                    <div className="flex gap-1 mb-2">
                      {preset.previewColors.map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded border border-border-light dark:border-border-dark"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    {/* Theme name */}
                    <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>

              {/* Apply options */}
              <div className="pt-4 border-t border-border-light dark:border-border-dark">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToAll}
                    onChange={(e) => setApplyToAll(e.target.checked)}
                    className="w-4 h-4 rounded border-border-light dark:border-border-dark"
                  />
                  <span className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Apply to all slides
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Apply a layout template to the current slide
              </p>

              <div className="grid grid-cols-2 gap-4">
                {SLIDE_LAYOUTS.map((layout) => (
                  <button
                    key={layout}
                    onClick={() => {
                      onApplyLayout(layout);
                      onClose();
                    }}
                    className="p-4 rounded-lg border-2 border-border-light dark:border-border-dark hover:border-accent-primary transition-all"
                  >
                    {/* Layout preview */}
                    <div className="h-20 bg-surface-light-alt dark:bg-surface-dark rounded mb-2 flex items-center justify-center">
                      <LayoutPreview layout={layout} />
                    </div>

                    {/* Layout name */}
                    <div className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {getLayoutDisplayName(layout)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'themes' && (
          <div className="flex justify-end gap-3 p-4 border-t border-border-light dark:border-border-dark">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyTheme}
              disabled={!selectedThemeId}
              className="px-4 py-2 text-sm font-medium bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Theme
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple layout preview component
 */
function LayoutPreview({ layout }: { layout: SlideLayout }) {
  const iconClass = 'w-8 h-8 text-text-light-tertiary dark:text-text-dark-tertiary';

  switch (layout) {
    case 'title':
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="w-16 h-3 bg-text-light-tertiary/30 dark:bg-text-dark-tertiary/30 rounded" />
          <div className="w-10 h-2 bg-text-light-tertiary/20 dark:bg-text-dark-tertiary/20 rounded" />
        </div>
      );
    case 'content':
      return (
        <div className="flex flex-col items-start gap-1 w-full px-2">
          <div className="w-12 h-2 bg-text-light-tertiary/30 dark:bg-text-dark-tertiary/30 rounded" />
          <div className="w-full h-1 bg-text-light-tertiary/20 dark:bg-text-dark-tertiary/20 rounded" />
          <div className="w-full h-1 bg-text-light-tertiary/20 dark:bg-text-dark-tertiary/20 rounded" />
          <div className="w-3/4 h-1 bg-text-light-tertiary/20 dark:bg-text-dark-tertiary/20 rounded" />
        </div>
      );
    case 'two-column':
      return (
        <div className="flex flex-col gap-1 w-full px-2">
          <div className="w-12 h-2 bg-text-light-tertiary/30 dark:bg-text-dark-tertiary/30 rounded" />
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <div className="w-full h-1 bg-text-light-tertiary/20 dark:bg-text-dark-tertiary/20 rounded" />
              <div className="w-full h-1 bg-text-light-tertiary/20 dark:bg-text-dark-tertiary/20 rounded" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="w-full h-1 bg-text-light-tertiary/20 dark:bg-text-dark-tertiary/20 rounded" />
              <div className="w-full h-1 bg-text-light-tertiary/20 dark:bg-text-dark-tertiary/20 rounded" />
            </div>
          </div>
        </div>
      );
    case 'section':
      return (
        <div className="flex items-center justify-center">
          <div className="w-16 h-4 bg-text-light-tertiary/30 dark:bg-text-dark-tertiary/30 rounded" />
        </div>
      );
    case 'blank':
    default:
      return <Layout className={iconClass} />;
  }
}
