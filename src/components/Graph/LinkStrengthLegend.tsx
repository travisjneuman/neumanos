/**
 * Link Strength Legend Component
 * Visual legend explaining link thickness and styles
 */

interface LinkStrengthLegendProps {
  /** Whether link strength visualization is enabled */
  enabled: boolean;
}

export function LinkStrengthLegend({ enabled }: LinkStrengthLegendProps) {
  if (!enabled) {
    return null;
  }

  return (
    <div className="flex items-center gap-6 text-xs text-text-light-tertiary dark:text-text-dark-tertiary flex-wrap">
      <div className="font-medium text-text-light-secondary dark:text-text-dark-secondary">
        Link Strength:
      </div>

      {/* Strong - Bidirectional */}
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-3">
          <div className="absolute top-1/2 left-0 right-0 h-[3px] -translate-y-1/2 bg-accent-primary rounded-full" />
        </div>
        <span>Strong (bidirectional)</span>
      </div>

      {/* Medium - Single direction */}
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-3">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-accent-primary rounded-full opacity-60" />
        </div>
        <span>Medium (one-way)</span>
      </div>

      {/* Weak - Tag-based */}
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-3">
          <svg
            className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[1px]"
            viewBox="0 0 32 1"
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1="0.5"
              x2="32"
              y2="0.5"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2,2"
              className="text-border-light dark:text-border-dark opacity-60"
            />
          </svg>
        </div>
        <span>Weak (tag-based)</span>
      </div>
    </div>
  );
}
