/**
 * StyleSelector Component
 * UI for selecting diagram drawing style (normal, hand-drawn, cartoon)
 * and adjusting roughness/bowing parameters
 */

import { Sparkles, Pencil, Circle } from 'lucide-react';
import type { DrawingStyle } from '../../types/diagrams';

interface StyleSelectorProps {
  currentStyle: DrawingStyle;
  roughness: number;
  bowing: number;
  onStyleChange: (style: DrawingStyle) => void;
  onRoughnessChange: (roughness: number) => void;
  onBowingChange: (bowing: number) => void;
}

export function StyleSelector({
  currentStyle,
  roughness,
  bowing,
  onStyleChange,
  onRoughnessChange,
  onBowingChange,
}: StyleSelectorProps) {
  const styles: Array<{value: DrawingStyle; label: string; icon: typeof Circle}> = [
    { value: 'normal', label: 'Normal', icon: Circle },
    { value: 'hand-drawn', label: 'Hand-Drawn', icon: Pencil },
    { value: 'cartoon', label: 'Cartoon', icon: Sparkles },
  ];

  return (
    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-lg space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
          Drawing Style
        </label>
        <div className="flex gap-2">
          {styles.map((style) => {
            const Icon = style.icon;
            const isActive = currentStyle === style.value;

            return (
              <button
                key={style.value}
                onClick={() => onStyleChange(style.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-blue text-white'
                    : 'bg-surface-light-secondary dark:bg-surface-dark-secondary text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-tertiary dark:hover:bg-surface-dark-tertiary'
                }`}
                aria-label={`Set style to ${style.label}`}
                aria-pressed={isActive}
              >
                <Icon className="w-4 h-4" />
                {style.label}
              </button>
            );
          })}
        </div>
      </div>

      {currentStyle === 'hand-drawn' && (
        <div className="space-y-3 pt-2 border-t border-border-light dark:border-border-dark">
          <div>
            <label
              htmlFor="roughness-slider"
              className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1"
            >
              Roughness: {roughness.toFixed(1)}
            </label>
            <input
              id="roughness-slider"
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={roughness}
              onChange={(e) => onRoughnessChange(parseFloat(e.target.value))}
              className="w-full accent-accent-blue"
              aria-label="Adjust roughness (how sketchy the lines are)"
            />
            <div className="flex justify-between text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
              <span>Smooth</span>
              <span>Sketchy</span>
            </div>
          </div>

          <div>
            <label
              htmlFor="bowing-slider"
              className="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-1"
            >
              Bowing: {bowing.toFixed(1)}
            </label>
            <input
              id="bowing-slider"
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={bowing}
              onChange={(e) => onBowingChange(parseFloat(e.target.value))}
              className="w-full accent-accent-blue"
              aria-label="Adjust bowing (how much lines curve)"
            />
            <div className="flex justify-between text-xs text-text-light-tertiary dark:text-text-dark-tertiary mt-1">
              <span>Straight</span>
              <span>Curved</span>
            </div>
          </div>
        </div>
      )}

      {currentStyle === 'cartoon' && (
        <div className="p-3 bg-accent-blue/10 rounded-md">
          <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Cartoon style uses preset values for a playful, rounded appearance.
          </p>
        </div>
      )}

      <div className="pt-2 border-t border-border-light dark:border-border-dark">
        <h4 className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary mb-2">
          Style Preview
        </h4>
        <div className="bg-white dark:bg-surface-dark-secondary p-4 rounded-md border border-border-light dark:border-border-dark">
          <svg width="100%" height="60" viewBox="0 0 200 60" className="overflow-visible">
            {currentStyle === 'normal' && (
              <>
                <rect
                  x="10"
                  y="10"
                  width="40"
                  height="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-accent-blue"
                />
                <circle
                  cx="90"
                  cy="30"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-accent-green"
                />
                <line
                  x1="130"
                  y1="30"
                  x2="190"
                  y2="30"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-accent-purple"
                />
              </>
            )}
            {currentStyle !== 'normal' && (
              <text
                x="100"
                y="35"
                textAnchor="middle"
                className="text-sm fill-text-light-tertiary dark:fill-text-dark-tertiary"
              >
                Preview shapes with {currentStyle} style
              </text>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
