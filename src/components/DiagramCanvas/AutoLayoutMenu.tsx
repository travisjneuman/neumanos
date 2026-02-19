/**
 * Auto-Layout Menu Component
 * Dropdown menu for selecting layout algorithms
 */

import { GitBranch, Grid3x3, Network } from 'lucide-react';
import type { LayoutAlgorithm } from '../../types/diagrams';

interface AutoLayoutMenuProps {
  onApplyLayout: (algorithm: LayoutAlgorithm) => void;
  disabled?: boolean;
}

const layoutOptions: Array<{
  algorithm: LayoutAlgorithm;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    algorithm: 'tree',
    label: 'Tree Layout',
    description: 'Hierarchical top-down arrangement',
    icon: <GitBranch className="w-5 h-5" />,
  },
  {
    algorithm: 'force',
    label: 'Force-Directed',
    description: 'Organic, repulsion-based layout',
    icon: <Network className="w-5 h-5" />,
  },
  {
    algorithm: 'grid',
    label: 'Grid Layout',
    description: 'Uniform grid with even spacing',
    icon: <Grid3x3 className="w-5 h-5" />,
  },
];

export function AutoLayoutMenu({ onApplyLayout, disabled = false }: AutoLayoutMenuProps) {
  return (
    <div className="flex flex-col gap-1">
      {layoutOptions.map((option) => (
        <button
          key={option.algorithm}
          onClick={() => onApplyLayout(option.algorithm)}
          disabled={disabled}
          className={`
            flex items-start gap-3 p-3 rounded-lg text-left transition-colors
            ${
              disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark'
            }
          `}
          title={disabled ? 'Select elements to apply layout' : option.description}
        >
          <div className="text-primary-light dark:text-primary-dark shrink-0 mt-0.5">
            {option.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-text-light-primary dark:text-text-dark-primary">
              {option.label}
            </h4>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              {option.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
