/**
 * PresentationPropertiesPanel Component
 *
 * Properties panel for editing selected slide elements.
 * Provides controls for position, size, rotation, and styling.
 */

import { useState, useEffect } from 'react';
import {
  X,
  Type,
  Square,
  Circle,
  Image,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import type { SlideElement } from '../../types';

interface PresentationPropertiesPanelProps {
  element: SlideElement | null;
  onUpdate: (updates: Partial<SlideElement>) => void;
  onClose: () => void;
}

// Preset colors
const COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#FFFFFF',
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
];

// Font families
const FONTS = [
  'Inter',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
];

export function PresentationPropertiesPanel({
  element,
  onUpdate,
  onClose,
}: PresentationPropertiesPanelProps) {
  const [localElement, setLocalElement] = useState<SlideElement | null>(element);

  // Sync with external element
  useEffect(() => {
    setLocalElement(element);
  }, [element]);

  if (!localElement) {
    return (
      <div className="w-64 flex-shrink-0 bg-surface-light dark:bg-surface-dark border-l border-border-light dark:border-border-dark p-4">
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary text-center">
          Select an element to edit its properties
        </p>
      </div>
    );
  }

  const handleChange = (field: string, value: unknown) => {
    const updates: Partial<SlideElement> = {};

    // Handle nested fields
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'text' && localElement.text) {
        updates.text = { ...localElement.text, [child]: value };
      } else if (parent === 'shape' && localElement.shape) {
        updates.shape = { ...localElement.shape, [child]: value };
      }
    } else {
      (updates as Record<string, unknown>)[field] = value;
    }

    setLocalElement((prev) => (prev ? { ...prev, ...updates } : null));
    onUpdate(updates);
  };

  const getElementIcon = () => {
    switch (localElement.type) {
      case 'text':
        return <Type className="w-4 h-4" />;
      case 'shape':
        return localElement.shape?.type === 'ellipse' ? (
          <Circle className="w-4 h-4" />
        ) : (
          <Square className="w-4 h-4" />
        );
      case 'image':
        return <Image className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-64 flex-shrink-0 bg-surface-light dark:bg-surface-dark border-l border-border-light dark:border-border-dark overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-2">
          {getElementIcon()}
          <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary capitalize">
            {localElement.type}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-text-light-tertiary dark:text-text-dark-tertiary hover:text-text-light-primary dark:hover:text-text-dark-primary"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Position & Size */}
      <div className="p-3 border-b border-border-light dark:border-border-dark">
        <h4 className="text-xs font-medium text-text-light-tertiary dark:text-text-dark-tertiary uppercase mb-2">
          Transform
        </h4>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              X
            </label>
            <input
              type="number"
              value={Math.round(localElement.x)}
              onChange={(e) => handleChange('x', Number(e.target.value))}
              className="w-full px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light-alt dark:bg-surface-dark-elevated"
            />
          </div>
          <div>
            <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Y
            </label>
            <input
              type="number"
              value={Math.round(localElement.y)}
              onChange={(e) => handleChange('y', Number(e.target.value))}
              className="w-full px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light-alt dark:bg-surface-dark-elevated"
            />
          </div>
          <div>
            <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Width
            </label>
            <input
              type="number"
              value={Math.round(localElement.width)}
              onChange={(e) => handleChange('width', Math.max(10, Number(e.target.value)))}
              className="w-full px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light-alt dark:bg-surface-dark-elevated"
            />
          </div>
          <div>
            <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              Height
            </label>
            <input
              type="number"
              value={Math.round(localElement.height)}
              onChange={(e) => handleChange('height', Math.max(10, Number(e.target.value)))}
              className="w-full px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light-alt dark:bg-surface-dark-elevated"
            />
          </div>
        </div>

        <div className="mt-2">
          <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            Rotation (°)
          </label>
          <input
            type="number"
            value={Math.round(localElement.rotation || 0)}
            onChange={(e) => handleChange('rotation', Number(e.target.value))}
            className="w-full px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light-alt dark:bg-surface-dark-elevated"
          />
        </div>

        <div className="mt-2">
          <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            Opacity
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={localElement.opacity || 1}
            onChange={(e) => handleChange('opacity', Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Text Properties */}
      {localElement.type === 'text' && localElement.text && (
        <div className="p-3 border-b border-border-light dark:border-border-dark">
          <h4 className="text-xs font-medium text-text-light-tertiary dark:text-text-dark-tertiary uppercase mb-2">
            Text
          </h4>

          <div className="space-y-2">
            <textarea
              value={localElement.text.content}
              onChange={(e) => handleChange('text.content', e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light-alt dark:bg-surface-dark-elevated resize-none"
              rows={3}
              placeholder="Enter text..."
            />

            <div>
              <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Font
              </label>
              <select
                value={localElement.text.fontFamily}
                onChange={(e) => handleChange('text.fontFamily', e.target.value)}
                className="w-full px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light-alt dark:bg-surface-dark-elevated"
              >
                {FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Size
              </label>
              <input
                type="number"
                value={localElement.text.fontSize}
                onChange={(e) => handleChange('text.fontSize', Math.max(8, Number(e.target.value)))}
                className="w-full px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light-alt dark:bg-surface-dark-elevated"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  handleChange(
                    'text.fontWeight',
                    localElement.text?.fontWeight === 'bold' ? 'normal' : 'bold'
                  )
                }
                className={`p-1.5 rounded ${
                  localElement.text.fontWeight === 'bold'
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
                }`}
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  handleChange(
                    'text.fontStyle',
                    localElement.text?.fontStyle === 'italic' ? 'normal' : 'italic'
                  )
                }
                className={`p-1.5 rounded ${
                  localElement.text.fontStyle === 'italic'
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
                }`}
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-border-light dark:bg-border-dark mx-1" />

              <button
                onClick={() => handleChange('text.textAlign', 'left')}
                className={`p-1.5 rounded ${
                  localElement.text.textAlign === 'left'
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
                }`}
                title="Align Left"
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleChange('text.textAlign', 'center')}
                className={`p-1.5 rounded ${
                  localElement.text.textAlign === 'center'
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
                }`}
                title="Align Center"
              >
                <AlignCenter className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleChange('text.textAlign', 'right')}
                className={`p-1.5 rounded ${
                  localElement.text.textAlign === 'right'
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-light-secondary dark:text-text-dark-secondary hover:bg-surface-light-alt dark:hover:bg-surface-dark-elevated'
                }`}
                title="Align Right"
              >
                <AlignRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Color
              </label>
              <div className="grid grid-cols-8 gap-1 mt-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleChange('text.color', color)}
                    className={`w-5 h-5 rounded border ${
                      localElement.text?.color === color
                        ? 'border-accent-primary ring-1 ring-accent-primary'
                        : 'border-border-light dark:border-border-dark'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shape Properties */}
      {localElement.type === 'shape' && localElement.shape && (
        <div className="p-3 border-b border-border-light dark:border-border-dark">
          <h4 className="text-xs font-medium text-text-light-tertiary dark:text-text-dark-tertiary uppercase mb-2">
            Shape
          </h4>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Fill Color
              </label>
              <div className="grid grid-cols-8 gap-1 mt-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleChange('shape.fill', color)}
                    className={`w-5 h-5 rounded border ${
                      localElement.shape?.fill === color
                        ? 'border-accent-primary ring-1 ring-accent-primary'
                        : 'border-border-light dark:border-border-dark'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Stroke Color
              </label>
              <div className="grid grid-cols-8 gap-1 mt-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleChange('shape.stroke', color)}
                    className={`w-5 h-5 rounded border ${
                      localElement.shape?.stroke === color
                        ? 'border-accent-primary ring-1 ring-accent-primary'
                        : 'border-border-light dark:border-border-dark'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                Stroke Width
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={localElement.shape.strokeWidth}
                onChange={(e) => handleChange('shape.strokeWidth', Math.max(0, Number(e.target.value)))}
                className="w-full px-2 py-1 text-sm rounded border border-border-light dark:border-border-dark bg-surface-light-alt dark:bg-surface-dark-elevated"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
