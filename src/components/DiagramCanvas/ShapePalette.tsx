/**
 * Shape Palette Component
 * Collapsible panel with drag-and-drop shape library
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { shapeLibrary, searchShapes } from '../../data/shapes/shapesLibrary';
import type { ShapeDefinition, ShapeCategory } from '../../types/shapes';

interface ShapePaletteProps {
  onShapeDragStart: (shape: ShapeDefinition, startX: number, startY: number) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ShapePalette({ onShapeDragStart, isOpen = true, onToggle }: ShapePaletteProps) {
  const [selectedCategory, setSelectedCategory] = useState<ShapeCategory>('flowchart');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: Array<{ id: ShapeCategory; label: string }> = [
    { id: 'flowchart', label: 'Flowchart' },
    { id: 'basic', label: 'Basic' },
    { id: 'uml', label: 'UML' },
    { id: 'network', label: 'Network' },
    { id: 'cloud-computing', label: 'Cloud' }, // P2
    { id: 'people', label: 'People' }, // P2
    { id: 'data-flow', label: 'Data Flow' }, // P2
    { id: 'charts', label: 'Charts' }, // P2
  ];

  // Filter shapes by search query or selected category
  const shapes = searchQuery
    ? searchShapes(searchQuery)
    : shapeLibrary[selectedCategory];

  const handleShapeMouseDown = (shape: ShapeDefinition, e: React.MouseEvent) => {
    e.preventDefault();
    onShapeDragStart(shape, e.clientX, e.clientY);
  };

  if (!isOpen) {
    return (
      <div className="w-10 shrink-0 bg-surface-light-base dark:bg-surface-dark-base border-r border-border-light dark:border-border-dark flex flex-col items-center py-3">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
          aria-label="Open shape palette"
        >
          <ChevronRight className="w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-60 shrink-0 bg-surface-light-base dark:bg-surface-dark-base border-r border-border-light dark:border-border-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-light dark:border-border-dark">
        <h3 className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
          Shapes
        </h3>
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated transition-colors"
          aria-label="Close shape palette"
        >
          <ChevronLeft className="w-4 h-4 text-text-light-secondary dark:text-text-dark-secondary" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border-light dark:border-border-dark">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
          <input
            type="text"
            placeholder="Search shapes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-border-light dark:border-border-dark bg-surface-light-base dark:bg-surface-dark-base text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="flex flex-col gap-1 p-2 border-b border-border-light dark:border-border-dark">
          {categories.map((category) => {
            const count = shapeLibrary[category.id].length;
            const isDisabled = count === 0;
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => !isDisabled && setSelectedCategory(category.id)}
                disabled={isDisabled}
                className={`
                  flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors
                  ${isSelected
                    ? 'bg-accent-primary/10 dark:bg-accent-primary/20 text-accent-primary'
                    : isDisabled
                    ? 'text-text-light-tertiary dark:text-text-dark-tertiary cursor-not-allowed opacity-50'
                    : 'text-text-light-primary dark:text-text-dark-primary hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated'
                  }
                `}
              >
                <span>{category.label}</span>
                <span className="text-xs opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Shape Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {shapes.length === 0 ? (
          <div className="text-center py-8 text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
            {searchQuery ? 'No shapes found' : 'No shapes in this category'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {shapes.map((shape) => (
              <ShapeButton
                key={shape.id}
                shape={shape}
                onMouseDown={(e) => handleShapeMouseDown(shape, e)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Individual shape button
interface ShapeButtonProps {
  shape: ShapeDefinition;
  onMouseDown: (e: React.MouseEvent) => void;
}

function ShapeButton({ shape, onMouseDown }: ShapeButtonProps) {
  return (
    <button
      onMouseDown={onMouseDown}
      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border-light dark:border-border-dark hover:bg-surface-light-elevated dark:hover:bg-surface-dark-elevated hover:border-accent-primary transition-colors cursor-grab active:cursor-grabbing"
      title={shape.name}
    >
      {/* Shape Preview */}
      <div className="w-16 h-16 flex items-center justify-center">
        <ShapePreview shape={shape} />
      </div>

      {/* Shape Name */}
      <span className="text-xs text-text-light-secondary dark:text-text-dark-secondary text-center line-clamp-2">
        {shape.name}
      </span>
    </button>
  );
}

// Render shape preview (simplified SVG)
interface ShapePreviewProps {
  shape: ShapeDefinition;
}

function ShapePreview({ shape }: ShapePreviewProps) {
  const width = 60;
  const height = 60;

  // Scale path to fit preview
  const scaledPath = shape.pathData
    ? scalePathToFit(shape.pathData, shape.defaultProps.width || 100, shape.defaultProps.height || 100, width, height)
    : null;

  if (shape.primitiveType === 'rectangle') {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <rect
          x={5}
          y={5}
          width={width - 10}
          height={height - 10}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          rx={shape.defaultProps.cornerRadius ? 5 : 0}
        />
      </svg>
    );
  }

  if (shape.primitiveType === 'circle') {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <circle
          cx={width / 2}
          cy={height / 2}
          r={(width - 10) / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        />
      </svg>
    );
  }

  if (scaledPath) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <path d={scaledPath} fill="none" stroke="currentColor" strokeWidth={2} />
      </svg>
    );
  }

  // Fallback: simple box
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect
        x={5}
        y={5}
        width={width - 10}
        height={height - 10}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      />
    </svg>
  );
}

// Helper: Scale SVG path to fit preview dimensions
function scalePathToFit(
  path: string,
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number
): string {
  const padding = 5;
  const scaleX = (targetWidth - padding * 2) / originalWidth;
  const scaleY = (targetHeight - padding * 2) / originalHeight;

  // Use the smaller scale to maintain aspect ratio
  const scale = Math.min(scaleX, scaleY);

  // Center the shape
  const offsetX = (targetWidth - originalWidth * scale) / 2;
  const offsetY = (targetHeight - originalHeight * scale) / 2;

  // Simple regex-based scaling (not perfect but works for basic paths)
  return path
    .replace(/M\s*([\d.]+)\s+([\d.]+)/g, (_match, x, y) => {
      return `M ${parseFloat(x) * scale + offsetX} ${parseFloat(y) * scale + offsetY}`;
    })
    .replace(/L\s*([\d.]+)\s+([\d.]+)/g, (_match, x, y) => {
      return `L ${parseFloat(x) * scale + offsetX} ${parseFloat(y) * scale + offsetY}`;
    })
    .replace(/Q\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/g, (_match, x1, y1, x2, y2) => {
      return `Q ${parseFloat(x1) * scale + offsetX} ${parseFloat(y1) * scale + offsetY} ${parseFloat(x2) * scale + offsetX} ${parseFloat(y2) * scale + offsetY}`;
    });
}
